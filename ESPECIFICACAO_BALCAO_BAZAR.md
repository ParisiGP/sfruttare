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

---

# Parte 2 — Refinamentos pós-Bazar

**O Bazar já aconteceu e já existe venda real gravada no banco (`VendaBalcao`/`VendaBalcaoItem`).** Tudo abaixo precisa ser **aditivo** — novas colunas opcionais, novos models — nunca renomear, remover ou migrar dado que já existe. Nenhuma linha já gravada pode ser alterada ou apagada por esta tarefa.

## 7. Descontos no carrinho do caixa

Dois campos novos na coluna do carrinho (`/admin/balcao`), acima da tabela de parcelas: **"Desconto em R$"** e **"Desconto em %"** — **mutuamente exclusivos**: preencher um desabilita/limpa o outro (não podem ser somados na mesma venda).

- O desconto se aplica sobre o `subtotal`, antes de calcular `totalComJuros` (os juros da maquininha incidem sobre o valor que será de fato cobrado, já com desconto).
- Validação: o desconto não pode deixar o total menor que zero (percentual não pode passar de 100%; valor em R$ não pode passar do subtotal).
- Mostrar no resumo, de forma clara: Subtotal → Desconto aplicado (−R$) → Total.

**Schema — adicionar em `VendaBalcao`** (campos novos, opcionais, não afeta as vendas já gravadas, que ficam com esses campos `null`):
```prisma
model VendaBalcao {
  // ...campos existentes...
  descontoTipo     String?  // "VALOR" | "PERCENTUAL"
  descontoEntrada  Decimal? @db.Decimal(10,2) // o número digitado (R$ se tipo VALOR, ex.: 10 se tipo PERCENTUAL = 10%)
  descontoAplicado Decimal? @db.Decimal(10,2) // valor final em R$ do desconto, já calculado — evita recalcular percentual toda hora num relatório
}
```
`total` continua sendo o valor final (subtotal − descontoAplicado), igual já é hoje — só passa a poder ser menor que o subtotal.

## 8. Trocas e devoluções

**Novo model** (não mexe em `VendaBalcao`/`VendaBalcaoItem` existentes, só referencia):
```prisma
model DevolucaoBalcao {
  id                String   @id @default(cuid())
  vendaBalcaoItemId String
  vendaBalcaoItem   VendaBalcaoItem @relation(fields: [vendaBalcaoItemId], references: [id])
  tipo              String   // "DEVOLUCAO" | "TROCA"
  valorDevolvido    Decimal  @db.Decimal(10,2) // snapshot do precoUnitario do item devolvido
  novoProdutoId     String?  // só preenchido se tipo = "TROCA"
  novoProduto       Produto? @relation("DevolucaoNovoProduto", fields: [novoProdutoId], references: [id])
  diferencaValor    Decimal? @db.Decimal(10,2) // preco do novo produto − valorDevolvido (só em TROCA; positivo = cliente pagou mais, negativo = loja devolveu diferença)
  motivo            String?
  createdAt         DateTime @default(now())
}
```
Adicionar relação reversa `devolucoes DevolucaoBalcao[]` em `VendaBalcaoItem`, e a relação nomeada `"DevolucaoNovoProduto"` em `Produto`.

**Regras de negócio:**
- Um `VendaBalcaoItem` só pode ter **uma** `DevolucaoBalcao` associada — validar antes de permitir (não devolver a mesma peça duas vezes).
- **Devolução simples**: cria o registro (`tipo: "DEVOLUCAO"`) e o `Produto` original volta automaticamente para `status: "DISPONIVEL"` — sem perguntar estado da peça (decisão já alinhada).
- **Troca**: mesma coisa, mais: o novo produto escolhido precisa estar `DISPONIVEL` no momento (revalidar, mesma proteção de corrida já usada em `VendaBalcaoRepository.create` com `updateMany`/`where: status`), passa para `VENDIDO`, e `diferencaValor` é calculado e gravado — **não processa nenhum pagamento**, só registra a diferença pra bater conta depois (o ajuste real acontece na maquininha, fora do sistema, igual o resto do fluxo do balcão).
- Tudo dentro de uma transação: reverter produto antigo, atualizar novo produto (se troca), criar o registro.

**UI**: na tela de histórico (`/admin/balcao/historico`), cada item de cada venda ganha um botão **"Devolver"** e **"Trocar"** — some depois que o item já tiver uma devolução registrada. Abre um modal: campo de motivo (opcional); se for troca, um campo de busca pra escolher a peça nova (reaproveitar a mesma busca de `buscarProdutosDisponiveis` já usada no balcão).

## 9. Refino do histórico — "batimento"

Ajustes em `/admin/balcao/historico`:
- **Agrupar por dia**: as vendas passam a ser exibidas em seções por data (mais recente primeiro), cada seção com um subtotal do dia.
- **Filtro por período**: campos de data inicial/final (GET, mesmo padrão já usado em `ProdutosAdmin`). Também um filtro simples por nome do cliente, já que é barato de reaproveitar.
- **Total geral em destaque**, refletindo o filtro aplicado, calculado como **líquido**: soma de `VendaBalcao.total` do período **menos** o valor das devoluções simples **mais** o `diferencaValor` das trocas do período (o efeito líquido de uma troca na receita já é exatamente a diferença entre o produto novo e o devolvido — não precisa subtrair os dois separadamente).
- Cada venda no histórico deve mostrar visualmente se algum item dela foi devolvido/trocado (ex.: item riscado ou badge "Devolvido"/"Trocado"), pra bater com o total líquido.

**Simplificação assumida, documentando pra você validar**: se uma venda teve desconto e depois um dos itens dela é devolvido, o valor devolvido registrado é o `precoUnitario` original do item (sem tentar ratear o desconto proporcionalmente entre os itens da venda). Se isso não bater com o jeito que você faz a conta na prática, me avisa que ajusto.

## Ao concluir (Parte 2)

Registrar no CLAUDE.md o que foi implementado (Parte 1 e/ou Parte 2, dependendo do que for feito primeiro) — **só marcar como concluído depois de testar de verdade**, incluindo: uma venda de teste com desconto aplicado, uma devolução simples (confere se o produto volta pra `DISPONIVEL`), uma troca (confere se o produto novo vai pra `VENDIDO` e a diferença é gravada), e o total do relatório batendo com o valor líquido esperado. Essa é a única alteração permitida nesse arquivo — não editar mais nada nele.

---

# Parte 3 — Autocomplete de cliente no balcão

**Mesma regra da Parte 2 continua valendo: já existe venda real gravada (`VendaBalcao`/`VendaBalcaoItem`/`DevolucaoBalcao`). Tudo abaixo é só leitura desses dados + um campo novo opcional — nada do que já existe pode ser alterado, renomeado ou removido.**

## Motivação

O mesmo cliente pode comprar mais de uma vez (cliente recorrente do brechó) e hoje precisa redigitar nome, e-mail e telefone do zero toda vez no balcão. Não existe (e não é o momento de criar) um model `Cliente` dedicado — isso seria uma mudança maior de arquitetura, fora de escopo aqui. A solução reaproveita o próprio histórico de `VendaBalcao`, que já guarda `nomeCliente`/`emailCliente`/`telefoneCliente` de cada venda.

## 10. Busca de cliente enquanto digita, com preenchimento automático

No campo **"Nome do cliente"** da tela `/admin/balcao` (coluna do carrinho), mesmo padrão de busca com debounce já usado na busca de peças ao lado:

- A partir de 2 caracteres digitados, consulta clientes cujo nome já apareceu em alguma venda anterior e contenha o termo digitado (case-insensitive — mesma lógica do filtro de nome já usado em `/admin/balcao/historico`).
- Mostra um dropdown abaixo do campo com até 6 sugestões, cada uma exibindo nome + telefone (quando houver) para diferenciar homônimos — ex.: "Maria Silva — (11) 91234-5678".
- Se o mesmo nome aparecer em mais de uma venda (com dados diferentes, ex.: telefone atualizado), usar os dados da venda **mais recente** daquele cliente.
- Selecionar uma sugestão (clique, ou Enter/setas do teclado) preenche automaticamente os campos **Nome**, **E-mail** e **Celular** com os dados daquela venda, e fecha o dropdown.
- Depois de preenchidos, os campos continuam 100% editáveis — selecionar da lista é um atalho, não trava nada (ex.: cliente mudou de telefone, o caixa pode corrigir na hora).
- Nome novo, sem venda anterior: não mostra nenhum dropdown nem mensagem — é o caminho normal de primeira compra, não é um estado de erro.
- Se a consulta falhar (erro de rede/banco): falha silenciosa, dropdown simplesmente não aparece — mesma decisão já usada na busca de peças, para não travar o atendimento por causa de uma funcionalidade de conveniência.
- Dropdown fecha ao clicar fora, selecionar um item, ou apertar Esc.

**Mobile:** a tela de balcão já é usada em tablet/celular durante o atendimento — itens do dropdown precisam ter altura de toque ≥44px (padrão já usado no resto do projeto).

### Backend

- **`VendaBalcaoRepository`**: novo método `findClientesPorNome(termo: string)` — `findMany` em `VendaBalcao` com `where: { nomeCliente: { contains: termo, mode: "insensitive" } }`, `select` só `nomeCliente`/`emailCliente`/`telefoneCliente`/`createdAt`, `orderBy: { createdAt: "desc" }`, `take` um teto (ex.: 30) só pra não trazer histórico inteiro antes de deduplicar.
- **`VendaBalcaoService`**: novo método `buscarClientes(termo)` — exige mínimo de 2 caracteres (abaixo disso retorna lista vazia sem consultar o banco, mesmo padrão da busca global do site). Deduplica os resultados do repository por nome normalizado (`trim().toLowerCase()`), mantendo a primeira ocorrência de cada nome (a mais recente, já que a query veio ordenada por `createdAt desc`). Retorna no máximo 6 sugestões.
- **`actions.ts`**: nova action `buscarClientesParaBalcao(termo)`, mesmo padrão `{ok, message, clientes}` de `buscarProdutosParaBalcao`, chamando `requireAdmin()` no topo.

### Frontend (`BalcaoView.tsx`)

Mesmo padrão já usado no campo de busca de peças (debounce de 300ms, estado local, cancelamento de busca desatualizada). Nenhum campo novo no banco é necessário para isso — é só leitura do que já existe.

## Ao concluir (Parte 3)

Registrar no CLAUDE.md o que foi implementado — só marcar como concluído depois de testar de verdade: cadastrar duas vendas de teste pro mesmo nome de cliente com telefones diferentes, confirmar que a sugestão traz o dado da venda mais recente, e confirmar que um nome nunca usado antes não mostra dropdown nenhum. Essa é a única alteração permitida no CLAUDE.md — não editar mais nada nele.
