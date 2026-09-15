# Especificação: Tela de BI (Desempenho do negócio)

## Contexto

Hoje não existe nenhuma visão consolidada de desempenho — só listagens (produtos, histórico do balcão). Esta tela reúne três métricas pedidas: ticket médio, tipo de peça que mais vende, e a distinção entre peça consignada e peça própria do brechó.

## Escopo dos dados (já validado com você)

- **Balcão + Site juntos** — a tela combina `VendaBalcao` (presencial) e `Pedido` (online, Mercado Pago), com os dois canais também mostrados separados nos cards, já que um tem desconto/devolução/troca e o outro (ainda) não.
- **Pedido**: só entram pedidos com status `PAGO`, `ENVIADO` ou `ENTREGUE` — `PIX_PENDENTE` (não pago) e `CANCELADO` ficam de fora de qualquer métrica.
- **`Pedido.total` inclui o frete** (`subtotal + frete`, confirmado em `pedido.service.ts`). Pra comparar com `VendaBalcao.total` (que é só mercadoria, sem frete) de forma justa, as métricas de faturamento/ticket médio usam `Pedido.total - Pedido.frete` — frete é repasse pra transportadora, não receita de mercadoria. **Essa é uma decisão que estou assumindo agora; avisa se você quer contar diferente.**
- **`VendaBalcao`**: usa o mesmo cálculo "líquido" que já existe no histórico do balcão (desconta devolução simples, soma a diferença de trocas) — não inventa uma lógica nova.
- **Peças devolvidas** (`DevolucaoBalcao` tipo `DEVOLUCAO` ou `TROCA`) ficam de fora do ranking de "tipo de peça mais vendida" e da divisão consignado/próprio — se a peça voltou pro estoque, ela não foi efetivamente vendida no fim das contas. Numa troca, a peça nova já aparece contada normalmente (é uma `VendaBalcao` própria, com seus próprios itens).

## 1. Nova rota admin: `/admin/desempenho`

(Nome sugerido — pode ser `/admin/bi` ou `/admin/relatorios` se preferir, é só o texto do link no menu que muda.)

## 2. Filtro de período

Mesmo padrão já usado em `/admin/balcao/historico`: campos de data inicial/data final via querystring (`GET`), recarregando a página. Sem seleção, mostra tudo desde o início. Atalhos de conveniência acima do filtro: "Mês atual", "Mês passado", "Últimos 30 dias" — preenchem as datas automaticamente ao clicar (só ajuda visual, não é lógica nova no backend).

## 3. Métricas

### 3.1 Faturamento e ticket médio

Três números em destaque no topo:
- **Faturamento total** (líquido, Balcão + Site somados, no período filtrado).
- **Número de vendas** (cada `VendaBalcao` conta 1, cada `Pedido` conta 1).
- **Ticket médio** = faturamento total ÷ número de vendas.

Logo abaixo, o mesmo trio repetido **separado por canal** (Balcão / Site), pra não esconder se um canal está puxando a média pro alto ou pro baixo.

### 3.2 Tipos de peça mais vendidos

Como a categoria está tudo como "Feminina" (upload feito com pressa), o tipo é extraído do **nome do produto** por palavra-chave — não existe campo estruturado pra isso hoje.

Levantei os nomes reais já cadastrados (amostra de ~400 produtos) pra propor uma lista com boa cobertura. Regra: percorrer a lista abaixo **nessa ordem**, primeiro item cuja palavra-chave aparecer no nome (case-insensitive, em qualquer parte) define o tipo; nada bateu → `"Outros"`. É uma lista simples e isolada (mesmo espírito do `TAXA_JUROS_PARCELA` do balcão) — dá pra editar/estender sem mexer em mais nada:

```
1.  vestido                        → Vestido
2.  macaquinho                     → Macaquinho
3.  macacao, macacão                → Macacão
4.  jardineira                     → Jardineira
5.  jaqueta                        → Jaqueta
6.  blazer                         → Blazer
7.  casaco, casaqueto, parka       → Casaco
8.  colete                         → Colete
9.  moletom                        → Moletom
10. chemise                        → Chemise
11. cropped                        → Cropped
12. body                           → Body
13. regata                         → Regata
14. camiseta                       → Camiseta
15. camisa                         → Camisa
16. blusa                          → Blusa
17. bata, tunica, túnica           → Túnica
18. calca, calça                   → Calça
19. short, bermuda                 → Short/Bermuda
20. saia                           → Saia
21. biquini                        → Biquini
(nenhuma bateu)                    → Outros
```

A ordem importa: `vestido` vem primeiro pra "Vestido Chemise com botões" cair em Vestido (o tipo de base), não em Chemise.

Mostrar como lista ranqueada (maior pra menor): tipo, quantidade de peças vendidas, e faturamento daquele tipo — ranqueado por **quantidade**, que é o sentido direto de "o que está vendendo mais".

### 3.3 Consignado × Próprio

Regra confirmada: **referência começando com "CS"** (não importa o resto — `CSGE`, `CSLE`, `CSSE` etc.) = peça consignada; qualquer outra referência (ou sem referência) = peça própria do brechó. Validei contra os dados reais: hoje 202 dos 715 produtos cadastrados têm referência começando com `CS`.

Mostrar comparando os dois grupos, no período filtrado: quantidade vendida, faturamento e ticket médio de cada um — dá pra ver se consignado e próprio vendem em ritmos ou valores diferentes.

## 4. Backend — novo módulo `src/modules/bi/`

Módulo só de leitura/agregação — não cria nem altera nenhuma venda, produto ou pedido. Reaproveita os repositories que já existem em vez de duplicar lógica:

- **`PedidoRepository`**: novo método `findPagosNoPeriodo(dataInicial?, dataFinal?)` — `findMany` com `status: { in: ["PAGO", "ENVIADO", "ENTREGUE"] }`, filtro de `createdAt` igual ao já usado em `VendaBalcaoRepository.findAll`, `include` os itens com o produto (pra pegar `nome` e `referencia`).
- **`VendaBalcaoRepository.findAll`**: já existe e já serve (mesmo filtro de data já usado no histórico) — só precisa garantir que o `include` traga `produto.referencia` em cada item (o `includeRelations()` já busca `produto: { select: { referencia: true } }`, então já está disponível — só falta ela ser exposta no tipo/serialização se ainda não estiver).
- **`bi.service.ts`** (novo): busca as duas listas (vendas do balcão + pedidos pagos) no período, e calcula em memória (mesmo padrão já usado em `VendaBalcaoService.listarVendas` pro total líquido — o volume de dados é pequeno, não precisa de agregação SQL):
  - Faturamento/nº de vendas/ticket médio, geral e por canal.
  - Ranking de tipos (aplica a lista de palavras-chave da seção 3.2 sobre o nome de cada item vendido, ignorando itens devolvidos).
  - Consignado × Próprio (aplica a regra do prefixo `CS` sobre a referência de cada item vendido, ignorando itens devolvidos).
- **`bi.types.ts`**: tipos do resultado agregado.
- Não precisa de `actions.ts`/mutação — a página é só leitura, o `Service` é chamado direto pelo Server Component da página (mesmo padrão de `/admin/balcao/historico`).

## 5. Estados de UI

- **Vazio**: nenhuma venda no período filtrado (ex.: filtrou um mês sem movimento) — mensagem clara ("Nenhuma venda encontrada nesse período"), sem quebrar os cards (mostrar zerado é pior que avisar).
- **Carregando**: como é Server Component (mesmo padrão do histórico do balcão), o carregamento é o próprio carregamento de navegação do Next ao trocar o filtro — não precisa de spinner cliente separado.
- **Erro**: falha ao calcular (ex.: banco fora do ar) — mensagem amigável, não estourar a tela em branco.
- **Sucesso**: cards e listas preenchidos normalmente.

## 6. Mobile

Cards de métrica empilham em 1 coluna no mobile (hoje devem ficar lado a lado no desktop). As listas de ranking (tipos, consignado×próprio) viram listas verticais compactas em vez de tabela larga — sem scroll horizontal. Atalhos de período (mês atual etc.) quebram linha ou viram um `<select>` no mobile se não couberem numa linha só.

## Ao concluir

Registrar no CLAUDE.md o que foi implementado — só marcar como concluído depois de testar com dados reais já existentes: conferir que o ticket médio bate com uma conta manual simples (faturamento líquido ÷ número de vendas) num período pequeno e conhecido, que o ranking de tipos faz sentido olhando os nomes reais, e que a contagem de "202 consignados" bate com o filtro por referência `CS`. Essa é a única alteração permitida nesse arquivo — não editar mais nada nele.
