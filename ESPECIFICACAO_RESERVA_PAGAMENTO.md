# Especificação: Reserva de peça + Forma de pagamento

**Mesma regra de sempre: já existe venda real gravada (`VendaBalcao`/`Pedido`/etc). Tudo abaixo é aditivo — campos novos opcionais, model novo — nada do que já existe pode ser alterado, renomeado ou removido.**

## Decisões já validadas com você

- **Reserva feita "pelo site" é sempre fechada manualmente** — o cliente não finaliza sozinho pelo checkout do Mercado Pago enquanto a peça está reservada. Isso significa: **toda venda de uma peça reservada, não importa se a reserva nasceu no Balcão ou nos Produtos (site), se fecha pela tela do Balcão** — é o único ponto do sistema que já sabe registrar uma venda manual com forma de pagamento e parcelas. Não precisa mexer em carrinho/checkout/Mercado Pago pra nada disso.
- **Formas de pagamento do Balcão**: Dinheiro, Pix, Débito, Crédito. Parcelado (2x a 12x) já lança automaticamente como Crédito, sem perguntar — só pede escolha manual quando for 1x (à vista).

## Contexto — o que já existe hoje (achei ao ler o código antes de especificar)

- `Produto.status` já tem o valor `RESERVADO` no enum, e o admin **já consegue** marcar uma peça como reservada manualmente em `/admin/produtos` (um `<select>` de status em cada card, ação `alterarStatusProduto`). O que falta é só isso: **saber pra quem foi reservado, desde quando, e ver isso reunido num relatório** — hoje é só uma cor no card, sem nenhum rastro.
- As buscas públicas (`ProdutoRepository`, vitrine/busca/categoria) já filtram só `status: "DISPONIVEL"` — uma peça `RESERVADO` **já some da loja pública automaticamente**, do mesmo jeito que uma `VENDIDO` some. Nenhuma mudança necessária aqui.
- O Balcão hoje só busca peças `DISPONIVEL` (`buscarProdutosDisponiveis`) — perde de vista uma peça assim que ela vira `RESERVADO`, o que precisa mudar pra dar pra fechar a venda dela depois.

## 1. Novo model: `Reserva`

```prisma
model Reserva {
  id            String   @id @default(cuid())
  produtoId     String
  produto       Produto  @relation(fields: [produtoId], references: [id])
  nomeCliente   String
  telefoneCliente String?
  canal         String   // "BALCAO" | "SITE"
  status        String   @default("ATIVA") // "ATIVA" | "CONVERTIDA" | "CANCELADA"
  vendaBalcaoId String?
  vendaBalcao   VendaBalcao? @relation(fields: [vendaBalcaoId], references: [id])
  createdAt     DateTime @default(now())
  atualizadoEm  DateTime @updatedAt
}
```

Adicionar relação reversa `reservas Reserva[]` em `Produto` e `reservasConvertidas Reserva[]` em `VendaBalcao`.

**Ciclo de vida:**
- **ATIVA**: criada ao reservar — `Produto.status` vira `RESERVADO` na hora.
- **CONVERTIDA**: quando a peça reservada é finalmente vendida pelo Balcão (ver seção 3) — grava `vendaBalcaoId`.
- **CANCELADA**: quando o admin libera a reserva manualmente (cliente desistiu) — `Produto.status` volta pra `DISPONIVEL`.

Sem prazo de expiração automática por enquanto — fica reservada até alguém converter ou cancelar manualmente (mais simples; dá pra adicionar expiração depois se fizer falta na prática).

## 2. Dois lugares pra criar uma reserva

### 2.1 No Balcão (`/admin/balcao`)

Cada resultado da busca (hoje só tem o botão "Adicionar ao carrinho") ganha um segundo botão **"Reservar"**, só em peças `DISPONIVEL`. Clicar abre um campo inline pequeno pedindo **nome do cliente** (obrigatório) e **telefone** (opcional) — pode reaproveitar o mesmo autocomplete de cliente já especificado na Parte 3 do balcão, já que a fonte de clientes recorrentes é a mesma. Confirmar cria a `Reserva` com `canal: "BALCAO"`.

A busca do Balcão passa a trazer também peças `RESERVADO` (hoje só traz `DISPONIVEL`) — cada uma exibe um selo "Reservado para {nomeCliente}" no lugar do botão "Reservar", mas mantém o botão **"Adicionar ao carrinho"** ativo (é assim que a venda da peça reservada se fecha depois — ver seção 3).

### 2.2 Nos Produtos (`/admin/produtos`) — reservas de peça vista no site

O `<select>` de status que já existe em cada `ProdutoCard` ganha um comportamento novo: escolher **"Reservado"** abre o mesmo campo inline de nome do cliente (obrigatório) antes de confirmar — sem nome, não salva. Cria a `Reserva` com `canal: "SITE"`. Escolher **"Disponível"** num produto que estava `RESERVADO` cancela a reserva ativa dele automaticamente (`status: "CANCELADA"`), mantendo o comportamento de troca rápida que já existe hoje.

## 3. Fechar a venda de uma peça reservada

Sempre pelo Balcão (decisão já validada). Como a busca do Balcão agora traz peças `RESERVADO` também, o fluxo é o mesmo de uma venda normal: busca, adiciona ao carrinho, confirma. A única mudança de backend:

- `VendaBalcaoRepository.create`: o `updateMany` que hoje só aceita `where: { status: "DISPONIVEL" }` passa a aceitar `where: { status: { in: ["DISPONIVEL", "RESERVADO"] } }` — continua com a mesma proteção de corrida (se `count === 0`, desfaz tudo).
- Dentro da mesma transação: para cada item vendido cujo produto tinha uma `Reserva` `ATIVA`, marcar essa reserva como `CONVERTIDA` e gravar o `vendaBalcaoId`.

**Simplificação assumida**: qualquer venda no Balcão pode fechar uma peça reservada, não só uma venda pro mesmo cliente que reservou — o sistema não bloqueia por nome. Faz sentido pro tamanho da operação hoje; avisa se quiser um bloqueio mais rígido no futuro.

## 4. Relatório de reservas — `/admin/reservas`

Nova tela, mesmo padrão visual/filtros do histórico do Balcão:
- Lista: peça (nome + referência), cliente, telefone, canal (Balcão/Site), data da reserva, status (Ativa/Convertida/Cancelada).
- Filtros: status e canal (`<select>`), período (data inicial/final).
- Ação **"Cancelar reserva"** em cada linha `ATIVA` — libera a peça de volta pra `DISPONIVEL`.
- Sem ação de "marcar como vendida" aqui — isso só acontece pelo Balcão (seção 3), pra não duplicar a lógica de venda em dois lugares.

Link pra essa tela a partir do cabeçalho de `/admin/balcao` e `/admin/produtos` (mesmo padrão do link "Ver histórico de vendas" que já existe no Balcão).

Card resumido **"Reservas ativas: N"** no topo de `/admin/desempenho` (a tela de BI já especificada), linkando pra `/admin/reservas` — sem precisar duplicar a tabela inteira lá.

## 5. Forma de pagamento

### 5.1 Balcão (`VendaBalcao`)

Campo novo:
```prisma
model VendaBalcao {
  // ...campos existentes...
  formaPagamento String? // "DINHEIRO" | "PIX" | "DEBITO" | "CREDITO"
}
```

UI (`BalcaoView.tsx`), perto da tabela de parcelas:
- **Parcelas = 1**: mostra os 4 botões/opções (Dinheiro, Pix, Débito, Crédito) — escolha obrigatória, mesmo peso do nome do cliente pra liberar o botão "Confirmar venda".
- **Parcelas de 2 a 12**: a forma de pagamento já fica travada em "Crédito" automaticamente (parcelamento só existe na maquininha via crédito) — mostra isso como informação fixa, não como escolha.

### 5.2 Site (`Pedido`)

Campo novo:
```prisma
model Pedido {
  // ...campos existentes...
  formaPagamento String? // "PIX" | "DEBITO" | "CREDITO" | "OUTRO"
}
```

Preenchido **automaticamente**, sem nenhuma ação do admin — o webhook do Mercado Pago (`/api/webhooks/mercadopago`) já recebe o objeto de pagamento completo (`buscarPagamento`) antes de criar o `Pedido`; hoje só usa `status` e `external_reference` dele. Passa a também ler `payment_method_id`/`payment_type_id` e mapear:

```ts
// src/modules/pagamento/mapearFormaPagamento.ts
function mapearFormaPagamento(paymentMethodId?: string, paymentTypeId?: string) {
  if (paymentMethodId === "pix") return "PIX";
  if (paymentTypeId === "credit_card") return "CREDITO";
  if (paymentTypeId === "debit_card") return "DEBITO";
  return "OUTRO";
}
```

Passado pra `PedidoService.criarPedidoAPartirDoCarrinho` como mais um parâmetro, gravado direto na criação do `Pedido` — mesmo espírito de config isolada já usado em `tabelaJurosMaquininha.ts`.

## 6. Estados de UI

- **Reservar** (Balcão e Produtos): campo de nome vazio bloqueia confirmação, com aviso claro. Sucesso fecha o campo inline e atualiza o selo/lista na hora.
- **Cancelar reserva**: confirmação simples antes de liberar (ação que tira a peça da reserva de alguém — não pode ser um clique só acidental, mesmo padrão de cautela já usado em ações sensíveis do projeto).
- **Forma de pagamento no Balcão**: erro claro se tentar confirmar a venda em 1x sem escolher uma forma.
- **Vazio** em `/admin/reservas`: "Nenhuma reserva encontrada" quando filtro não bate com nada.

## 7. Mobile

Botão "Reservar" e o selo "Reservado para {nome}" no Balcão seguem o mesmo padrão de toque ≥44px já usado nos outros botões da tela. As 4 opções de forma de pagamento em botões grandes o bastante pra tocar com o dedo, empilhando em 2 colunas no mobile se não couberem numa linha só. Lista de `/admin/reservas` empilha em cards no mobile, mesmo padrão já usado no histórico do Balcão.

## Ao concluir

Registrar no CLAUDE.md o que foi implementado — só marcar como concluído depois de testar de verdade: reservar uma peça pelo Balcão e pelos Produtos, confirmar que ela some da loja pública mas aparece na busca do Balcão com o selo correto, fechar a venda dela pelo Balcão e confirmar que a `Reserva` virou `CONVERTIDA`, cancelar uma reserva e confirmar que a peça volta a aparecer na loja, testar uma venda 1x escolhendo cada forma de pagamento e uma venda parcelada confirmando que trava em Crédito sozinha. Essa é a única alteração permitida nesse arquivo — não editar mais nada nele.
