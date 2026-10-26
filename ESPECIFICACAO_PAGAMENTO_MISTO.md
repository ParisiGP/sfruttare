# Especificação: Pagamento dividido em mais de uma forma (só Balcão)

**Mesma regra de sempre: já existe venda real gravada em `VendaBalcao` (inclusive com `formaPagamento` único, da especificação anterior). Tudo aqui é aditivo — model novo, nada do que já existe é alterado, renomeado, removido ou migrado. Vendas antigas continuam exatamente como estão.**

Vale **só para o Balcão**. O site (`Pedido` / Mercado Pago) não muda nada.

## Contexto — como é hoje

- `VendaBalcao` guarda **uma** `formaPagamento` e **um** `parcelas` para a venda inteira; `totalComJuros` aplica a taxa da maquininha sobre o total todo.
- Em `BalcaoView.tsx` a seção "Parcelas" (tabela 1x–12x) + o bloco "Forma de pagamento" (Dinheiro/Pix/Débito/Crédito, travando em Crédito quando parcelas > 1) assumem uma forma só.
- Exemplo que não dá pra lançar hoje: total R$ 250 → R$ 100 no Pix + R$ 150 no crédito em 3x.

## Decisões que estou assumindo (avisa se algo não bate com a prática)

1. **Juros da maquininha incidem só na parte paga no crédito parcelado** — nunca sobre a parte paga em Pix/Dinheiro/Débito. Cada linha de crédito aplica a taxa de `TAXA_JUROS_PARCELA` sobre o próprio valor.
2. **Até 4 linhas de pagamento por venda**, e a mesma forma pode repetir (ex.: dois cartões de crédito, ou Pix + Pix de duas pessoas).
3. **A última linha é sempre "o resto"**: o caixa digita o valor das linhas anteriores e a última se calcula sozinha (`total − soma das anteriores`) e fica somente leitura. Assim a soma nunca fica diferente do total — o sistema não precisa de um estado de "falta pagar / sobrou". Com uma linha só (caso mais comum), ela já nasce com o total inteiro, igual hoje.
4. **Troco em dinheiro não é tratado** (continua fora do sistema, como o resto do fluxo de maquininha/caixa).
5. **Devolução/troca não registra por qual forma o dinheiro volta** — só continua abatendo o valor do item do líquido, como já funciona. Ficou fora do escopo desta tarefa.

## 1. Novo model: `PagamentoBalcao`

```prisma
model PagamentoBalcao {
  id            String      @id @default(cuid())
  vendaBalcaoId String
  vendaBalcao   VendaBalcao @relation(fields: [vendaBalcaoId], references: [id])
  forma         String      // "DINHEIRO" | "PIX" | "DEBITO" | "CREDITO"
  valor         Decimal     @db.Decimal(10,2) // parte do total (já com desconto, sem juros) paga nesta forma
  parcelas      Int         @default(1)       // > 1 só quando forma = "CREDITO"
  valorComJuros Decimal?    @db.Decimal(10,2) // só em CREDITO parcelado: valor * (1 + taxa)
  createdAt     DateTime    @default(now())
}
```

Adicionar `pagamentos PagamentoBalcao[]` em `VendaBalcao`.

### Vendas antigas (já gravadas) — sem backfill

Vendas feitas antes desta mudança **não têm linhas** em `PagamentoBalcao` e **não devem ganhar** (nada de migração de dados). A leitura trata "sem linhas" como um pagamento único implícito montado a partir dos campos que já existem na venda (`formaPagamento`, `parcelas`, `total`, `totalComJuros`). Centralizar isso num único helper (ex.: `obterPagamentosDaVenda(venda)` no módulo `vendaBalcao`) que toda tela/relatório usa — nenhuma tela monta essa regra por conta própria.

### Vendas novas

Sempre gravam **pelo menos uma** linha em `PagamentoBalcao` (mesmo quando é uma forma só). Além disso, continuam preenchendo os campos que já existem em `VendaBalcao`, pra histórico e relatórios atuais não quebrarem:

- `formaPagamento`: a forma da única linha, ou `"MISTO"` quando houver mais de uma forma diferente (é `String`, não precisa de migration; só incluir `"MISTO"` no tipo de leitura `FormaPagamentoBalcao` e no label do histórico).
- `parcelas`: maior número de parcelas entre as linhas de crédito (ou 1 se não houver crédito parcelado).
- `totalComJuros`: soma de `valorComJuros ?? valor` de todas as linhas (ou seja, o que o cliente de fato desembolsa somando tudo).
- `total`: igual hoje (`subtotal − desconto`), sem juros.

## 2. Mudanças de backend (`src/modules/vendaBalcao/`)

- **`vendaBalcao.types.ts` / `vendaBalcao.schema.ts`**: em `ConfirmarVendaBalcaoInput`, os campos soltos `parcelas` e `formaPagamento` dão lugar a `pagamentos: { forma, valor, parcelas }[]` (1 a 4 itens). Substituir de uma vez — o único chamador é o `BalcaoView`, não precisa deixar os dois formatos convivendo. Regras de validação (zod): `forma` dentro das 4; `valor > 0`; `parcelas` de 1 a 12 e **`> 1` só se `forma = "CREDITO"`**; no máximo 4 itens.
- **`vendaBalcao.service.ts` (`confirmarVenda`)**: o service **recalcula o total no servidor** (como já faz) e confere que `soma(pagamentos[].valor) === total` em centavos — se não bater, recusa com "A soma dos pagamentos não bate com o total da venda." (nunca confiar no valor que veio do cliente). Para cada linha de crédito com `parcelas > 1`, calcula `valorComJuros = calcularTotalComJuros(valor, parcelas)`. Monta o resumo de `formaPagamento`/`parcelas`/`totalComJuros` da venda conforme descrito acima.
- **`vendaBalcao.repository.ts` (`create`)**: grava as linhas de `PagamentoBalcao` dentro da mesma transação que já cria a venda e marca as peças como vendidas (nada de gravação parcial).
- **`includeRelations()`**: incluir `pagamentos` pra o histórico conseguir exibir.
- **`serializeVenda`**: expor `pagamentos` já resolvido pelo helper de vendas antigas (assim a UI nunca precisa saber se a venda é antiga ou nova).

## 3. Tela do Balcão (`BalcaoView.tsx`)

A seção da coluna esquerda hoje chamada "Parcelas" + "Forma de pagamento" vira uma seção **"Pagamento"**:

**Linhas de pagamento** (cada uma um cartão compacto):
- Os 4 botões de forma (Dinheiro / Pix / Débito / Crédito), mesmo visual atual.
- Campo **Valor (R$)**: editável em todas as linhas **exceto a última**, que é somente leitura e mostra o resto calculado.
- Quando a forma é **Crédito**: aparece o seletor de parcelas daquela linha, mostrando já o valor da parcela ("3x de R$ 111,23", com juros).
- Botão remover (×) em cada linha quando houver mais de uma.
- Botão **"+ Dividir em outra forma"** abaixo das linhas (some ao chegar em 4 linhas). Ao adicionar, a linha nova vira a última ("o resto") e a anterior passa a ser editável, já com o valor que tinha (o total inteiro, que o caixa então reduz).

**Tabela de parcelas 1x–12x (comparação sem/com juros, que o caixa usa pra mostrar ao cliente):** continua existindo, mas calculada sobre o **valor da linha de crédito em foco** (a última que o caixa tocou; por padrão, a primeira de crédito), não sobre o total da venda. Clicar numa linha da tabela define as parcelas daquela linha de crédito. Para manter o atalho de hoje: se houver **uma linha só** e ela não for Crédito, clicar numa parcela > 1 troca essa linha para Crédito já com aquelas parcelas. Sem nenhuma linha de crédito (e mais de uma linha), a tabela fica esmaecida com o aviso "Escolha Crédito em uma das formas para parcelar", sem linhas clicáveis.

**Resumo de totais (coluna do carrinho):** Subtotal → Desconto → Total continua igual. A linha "Com juros (Nx)" vira **"Total cobrado com juros"** (soma de tudo, só aparece se alguma linha tiver juros).

**Botão "Confirmar venda"** só habilita com: nome do cliente, carrinho com itens, e as linhas válidas (a última linha, o resto, precisa ser `> 0` — se as linhas anteriores já somarem o total ou mais, avisar "Os valores informados já cobrem o total; remova ou reduza uma linha" e bloquear).

### Estados de UI

- **Uma linha só (padrão)**: indistinguível do fluxo de hoje — escolhe a forma, (se Crédito) escolhe parcelas, confirma. Dividir é opcional.
- **Erro**: valor das linhas anteriores ≥ total (aviso acima); linha sem forma escolhida ("Escolha a forma de cada pagamento"); falha de validação do servidor mostrada como as demais mensagens da tela.
- **Sucesso**: igual hoje (mensagem + limpa o carrinho); o formulário de pagamento volta a uma linha só, sem forma selecionada.

### Mobile

Mesmo padrão da tela: linhas empilham em coluna única, botões de forma em 2 colunas, campos e botões com toque ≥44px. O botão "+ Dividir em outra forma" ocupa a largura toda.

## 4. Histórico (`/admin/balcao/historico`)

Cada venda passa a mostrar a(s) forma(s) de pagamento — hoje o histórico **não exibe** `formaPagamento` em lugar nenhum. Formato compacto numa linha: `Pix R$ 100,00 + Crédito 3x R$ 150,00` (venda com forma única: `Crédito 3x R$ 250,00`; venda antiga cai no helper e mostra do mesmo jeito). Substituir a coluna "parcelas" atual por essa informação, já que o número de parcelas agora vive dentro de cada linha de pagamento.

## 5. Relatórios

Qualquer relatório que passe a agrupar faturamento por forma de pagamento (hoje a tela `/admin/desempenho` não tem isso) deve somar por linha de `PagamentoBalcao.valor` — **nunca por `VendaBalcao.formaPagamento`**, que vira `"MISTO"` em venda dividida e esconderia a divisão. Nada a fazer agora além de não quebrar nada existente.

## Ao concluir

Registrar no CLAUDE.md o que foi implementado — só marcar como concluído depois de testar de verdade: (1) venda com forma única (Pix) e confirmar que se comporta como antes; (2) venda dividida Pix + Crédito 3x, conferindo que o juros incide só na parte do crédito e que `totalComJuros` da venda bate com a soma; (3) venda com 3 linhas; (4) tentar confirmar com valores que estouram o total e ver o bloqueio; (5) conferir no banco que as vendas **antigas** continuam intactas (sem linhas novas, mesmos valores) e que o histórico mostra a forma delas pelo helper; (6) conferir que o histórico exibe as formas das vendas novas. Essa é a única alteração permitida no CLAUDE.md — não editar mais nada nele.
