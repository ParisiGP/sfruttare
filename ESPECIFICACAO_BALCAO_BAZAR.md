# Especificação: Tela de Venda Presencial ("Balcão") para o Bazar

**Prioridade máxima — o Bazar abre amanhã.** Esta é uma tela nova, separada da loja online, pra usar a estrutura de estoque do site (model `Produto`) como controle de venda presencial num evento físico.

## Contexto / por que essa tela existe

O site já tem catálogo, cadastro de produtos e importação por planilha — mas o fluxo de compra online (carrinho → checkout → Mercado Pago) não serve pra isso: no Bazar, **o admin é o caixa**, o cliente não loga em nada, e a cobrança acontece na maquininha física, fora do site. Esta tela é um painel de venda presencial que:

1. Deixa achar qualquer peça rapidamente (busca em qualquer campo).
2. Monta um "carrinho do caixa" com as peças que o cliente físico está levando.
3. Mostra o total na tela pro caixa/cliente conferirem, com opção de ver o valor parcelado.
4. Ao confirmar, marca as peças como vendidas e salva os dados da venda — sem processar nenhum pagamento pelo site.

## 0. Pré-requisito (ação do usuário, não é código)

Cadastrar todas as peças do Bazar **ainda hoje** com status `DISPONIVEL` (já é o padrão) — usando a importação por planilha já existente (`/admin/produtos/importar`) ou cadastro manual em `/admin/produtos`.

## 1. Nova rota admin: `/admin/balcao`

Layout dividido em duas colunas:

**Coluna de busca (esquerda):**
- Campo de busca com foco automático ao abrir a tela.
- Busca em qualquer campo relevante — reaproveitar o filtro `OR` que já existe em `ProdutoRepository` (nome/marca/descricao/referencia), **estendendo pra incluir também `cor` e `tamanho`** (útil pra achar rápido num balcão físico: "azul", "M" etc.).
- Mostrar só produtos com `status: "DISPONIVEL"` — uma peça já vendida ou reservada não pode aparecer aqui.
- Cada resultado: foto pequena, nome, referência, preço, botão "Adicionar ao carrinho".

**Coluna do carrinho do caixa (direita):**
- Lista dos itens já adicionados (nome, preço, botão remover).
- Campo **Nome do cliente** (obrigatório).
- Campo **E-mail do cliente** (opcional).
- **Tabela de parcelas** (substitui o `<select>` simples usado na primeira versão) — mostrar todas as opções de 1x a 12x de uma vez, cada linha com: número de parcelas, valor de cada parcela **sem juros** (`subtotal / parcelas`) e valor de cada parcela **com juros** (aplicando `TAXA_JUROS_PARCELA[parcelas]` da seção 4, depois dividindo por `parcelas`). Exemplo com subtotal de R$ 300: linha "2x" mostra "R$ 150,00 (sem juros) / R$ 164,46 (com juros)", linha "3x" mostra "R$ 100,00 / R$ 111,23", etc.
  - Clicar numa linha **seleciona** aquela quantidade de parcelas (substitui a ação do dropdown antigo) — a linha selecionada fica destacada com a cor primária do projeto (`var(--color-primary)`), mesmo padrão visual já usado em outros estados "ativo" do site (ex.: aba selecionada em `VitrineTabs`).
  - Como há bastante espaço vertical nessa coluna, a tabela pode ficar sempre visível (não precisa de accordion/scroll escondido) — 12 linhas compactas cabem bem.
  - Quando o PCJ não estiver ativo na conta (ver aviso da seção 4), as colunas "sem juros" e "com juros" mostram o mesmo valor em todas as linhas — comportamento esperado, não é bug.
- Total geral em destaque acima ou abaixo da tabela, refletindo a parcela atualmente selecionada.
- Botão **"Confirmar venda"** — desabilitado se não houver nome preenchido ou o carrinho estiver vazio.

**Carrinho fica só em memória do navegador** (estado local do componente) — se a página recarregar no meio de um atendimento, esse carrinho específico se perde e precisa recomeçar (decisão tomada considerando o prazo até amanhã). Vendas já confirmadas não são afetadas por isso.

## 2. Nova tela: `/admin/balcao/historico`

Necessária já para amanhã (não pode esperar). Lista simples, mais recente primeiro:
- Data/hora, nome do cliente, e-mail (se houver), itens vendidos, total, parcelas escolhidas.
- Sem filtro/busca chique por enquanto — só a listagem em ordem cronológica reversa já resolve pra amanhã. Filtro/busca nesse histórico pode vir depois do Bazar.

## 3. Backend — novo módulo `src/modules/vendaBalcao/`

Módulo **separado** do `Pedido`/checkout online — são fluxos diferentes (aqui não há usuário logado, não há Mercado Pago, não haverá conflito nenhum com a Sprint 3 recém-implementada).

### Novo model no Prisma:

```prisma
model VendaBalcao {
  id            String   @id @default(cuid())
  nomeCliente   String
  emailCliente  String?
  parcelas      Int      @default(1)
  subtotal      Decimal  @db.Decimal(10,2)
  total         Decimal  @db.Decimal(10,2)
  totalComJuros Decimal? @db.Decimal(10,2)
  itens         VendaBalcaoItem[]
  createdAt     DateTime @default(now())
}

model VendaBalcaoItem {
  id            String   @id @default(cuid())
  vendaBalcaoId String
  vendaBalcao   VendaBalcao @relation(fields: [vendaBalcaoId], references: [id])
  produtoId     String
  produto       Produto  @relation(fields: [produtoId], references: [id])
  nomeProduto   String
  precoUnitario Decimal  @db.Decimal(10,2)
  createdAt     DateTime @default(now())
}
```

`nomeProduto`/`precoUnitario` são um **snapshot** no momento da venda (mesma cautela já usada em `PedidoItem`) — a venda registrada não deve mudar se o produto for editado depois.

Adicionar a relação reversa `vendasBalcaoItens VendaBalcaoItem[]` em `Produto`.

### Arquivos do módulo (mesmo padrão dos outros módulos do projeto):

- **`vendaBalcao.repository.ts`**:
  - `create(data)` — transação: cria `VendaBalcao` + `VendaBalcaoItem[]`, e atualiza `status: "VENDIDO"` em cada `Produto` envolvido.
  - `findAll()` — todas as vendas, `orderBy: createdAt desc`, com itens inclusos, para a tela de histórico.
- **`vendaBalcao.service.ts`**:
  - `buscarProdutosDisponiveis(busca)` — reaproveita a lógica de busca já existente em `ProdutoRepository` (estendida com cor/tamanho), filtrando só `DISPONIVEL`.
  - `confirmarVenda({ nomeCliente, emailCliente, parcelas, produtoIds })`:
    - Valida `nomeCliente` preenchido e pelo menos 1 item.
    - **Revalida no servidor que todos os produtos ainda estão `DISPONIVEL`** antes de confirmar — proteção importante contra dois atendimentos simultâneos tentando vender a mesma peça física ao mesmo tempo (cenário real num Bazar corrido). Se algum item não estiver mais disponível, recusar com mensagem clara dizendo qual peça já foi vendida.
    - Calcula `subtotal` (soma dos preços), `total` (igual ao subtotal — "sem juros" nunca muda por parcela), `totalComJuros` (aplica a tabela da seção 4 sobre o `parcelas` escolhido).
    - Chama o repository.
  - `listarVendas()` — para a tela de histórico.
- **`vendaBalcao.schema.ts`**: validação zod da entrada (nome não vazio, parcelas entre 1 e 12, lista de produtoIds não vazia).
- **`vendaBalcao.types.ts`**: tipos compartilhados.
- **`actions.ts`**: `buscarProdutosParaBalcao(busca)`, `confirmarVendaBalcao(dados)` — ambas chamando `requireAdmin()` no topo, mesmo padrão `{ok, message}` das outras actions do projeto.

## 4. Tabela de acréscimo por parcela (Mercado Pago Point)

Guardar como configuração isolada, não espalhada pelo código — essas taxas podem mudar:

```ts
// src/modules/vendaBalcao/tabelaJurosMaquininha.ts
export const TAXA_JUROS_PARCELA: Record<number, number> = {
  1: 0,
  2: 0.0964,
  3: 0.1123,
  4: 0.1136,
  5: 0.1431,
  6: 0.1432,
  7: 0.1672,
  8: 0.1673,
  9: 0.1969,
  10: 0.2065,
  11: 0.2066,
  12: 0.2211,
};
```

Valores da tabela oficial "Parcelado Com Acréscimos" (modo **PCJ**) da maquininha Mercado Pago Point, vigente desde 03/11/2025 (fonte: tabela de taxas e tarifas pública do Mercado Pago). `totalComJuros = subtotal * (1 + TAXA_JUROS_PARCELA[parcelas])`.

**Aviso importante, repassar pro usuário entender antes de usar a tela amanhã:** essa tabela de acréscimo só reflete a realidade se a conta Mercado Pago tiver o modo **"Parcelamento Com Juros" (PCJ)** ativado na maquininha — isso **não é o padrão** da maioria das contas Point (o padrão é o vendedor absorver o custo do parcelamento, e o cliente pagar o mesmo valor em 1x ou 12x). Se o PCJ não estiver ativo na conta, os valores "sem juros" e "com juros" vão aparecer **iguais** na tela — isso é o comportamento correto nesse caso, não um bug. Confirme com o Mercado Pago (ou no painel da conta) se esse modo está ativo antes do Bazar, pra saber qual dos dois valores mostrar pro cliente com confiança.

## 5. Estados de UI a cobrir

- Busca sem resultado ("Nenhuma peça encontrada para '{busca}'").
- Carrinho vazio (mensagem simples, botão de confirmar desabilitado).
- Confirmando a venda (loading no botão).
- Sucesso: mostrar confirmação clara e **limpar o carrinho automaticamente** para o próximo atendimento (o caixa vai repetir esse fluxo várias vezes seguidas durante o Bazar).
- Erro: nome vazio, carrinho vazio, ou peça que deixou de estar disponível entre a busca e a confirmação (ver seção 3) — mensagem específica dizendo qual peça teve problema.

## 6. Notas de design

Essa tela vai ser usada num ambiente físico corrido (balcão de evento), não é uma vitrine — priorizar velocidade e clareza sobre estética:
- Fonte do total grande o suficiente pra ler de relance.
- Layout simples, poucos cliques entre "achar peça" e "adicionar ao carrinho".
- Pode (e deve) ser mais funcional/direta que o padrão visual da loja pública — não precisa aplicar floreios/identidade visual aqui, é uma ferramenta interna de operação, não uma vitrine.

## Ao concluir

Registrar no CLAUDE.md que essa tela foi implementada — **só marcar como concluído depois de testar de verdade** (cadastrar uma peça de teste, buscar, adicionar ao carrinho, confirmar, e conferir que o status virou `VENDIDO` e a venda aparece no histórico). Essa é a única alteração permitida nesse arquivo — não editar mais nada nele.
