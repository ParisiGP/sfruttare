# Especificação: Consignados — consignante, % de repasse e status de repasse

Hoje "consignado" é só uma convenção na referência (prefixo `CS`), usada apenas pelo BI. O sistema não sabe de quem é a peça, quanto o consignante recebe nem se ele já foi pago. Esta spec transforma isso em dado do produto.

## O que existe hoje (levantado no código, na planilha e no banco)

- **Banco:** 298 produtos com referência `CS…` (271 disponíveis, 23 vendidos, 4 reservados). **Os 23 vendidos foram todos no Balcão**, então já existe repasse a pagar sem nenhum controle. Três prefixos: `CSGEO` (51), `CSL&S` (152), `CSRI` (95). As referências têm caixa e formato irregulares (`CSGeo20 - 14`, `CSGEO010/30`, `CSGEO07 - 64`).
- **Planilha de importação** (`Teste de Importação Sfruttare`): tem a coluna **"Repasse consignado (40%)"**, com o valor **em R$** (ex.: preço final R$ 49,90 → repasse R$ 19,96) e a **"Parcela Sfruttare (60%)"**. Não existe coluna de percentual por linha: o 40% só aparece no título da coluna. Hoje a importação **ignora as duas**.
- `BiService` tem uma função `ehConsignado` própria (`startsWith("CS")`), duplicando a regra.
- O cabeçalho é casado por **igualdade exata** depois de normalizado. "Repasse consignado (40%)" vira `repasse consignado 40`, então um alias fixo quebraria se o título virasse "(35%)".

## Decisões já validadas com você

1. **Base do cálculo = preço de tabela da peça.** `repasse = preço × %`, como na planilha. Desconto dado no Balcão sai só da parte da loja.
2. **Consignante identificado pelo prefixo da referência**, **e** guardado num **campo novo `consignante`** no produto, para filtrar com facilidade. O campo é preenchido automaticamente, e a lista de valores do filtro se atualiza sozinha quando surgir um prefixo novo.
3. **% das 298 peças existentes preenchido em lote por consignante**, sem sobrescrever nada.
4. **Peça já repassada que é devolvida:** o sistema avisa e **zera o registro de repasse**.

## Regras de segurança dos dados

Já existe venda real. Tudo é **aditivo**: só colunas novas e opcionais em `Produto`. Nenhum valor existente é alterado, e nenhuma linha é apagada. Há **um único** preenchimento retroativo, descrito em 1.3, e ele só escreve na coluna nova `consignante`. **Antes de aplicar a migration, fazer um snapshot/branch do Neon.**

## 1. Regra de consignado e campo `consignante`

### 1.1 Regra única

Criar o módulo `src/modules/consignacao/` (mesmo padrão dos outros módulos) com a regra num único lugar:

```ts
// consignacao.ts
export function obterConsignante(referencia?: string | null): string | null {
  const ref = (referencia ?? "").trim().toUpperCase();
  const match = ref.match(/^CS[A-Z&]*/);
  return match ? match[0] : null;
}
export const ehConsignado = (r?: string | null) => obterConsignante(r) !== null;
```

Resultado nos casos reais: `CSGeo20 - 14` → `CSGEO` · `CSGEO010/30` → `CSGEO` · `CSL&S302` → `CSL&S` · `CSRI12` → `CSRI`. Substituir a `ehConsignado` local do `BiService` por esta, para não existirem duas regras.

### 1.2 Campo novo em `Produto`

```prisma
model Produto {
  // ...campos existentes...
  consignante String? // "CSGEO", "CSL&S"... derivado da referência; null = peça própria
}
```

Sempre recalculado pelo servidor a partir da referência final, em **criar**, **editar** e **importar** (nunca digitado). Alterou a referência no cadastro, o consignante acompanha. Referência sem `CS` → `null`.

### 1.3 Preenchimento das peças existentes (único backfill)

Na própria migration, idempotente, escrevendo só na coluna nova:

```sql
UPDATE "Produto"
SET "consignante" = (regexp_match(upper("referencia"), '^CS[A-Z&]*'))[1]
WHERE "referencia" ILIKE 'CS%' AND "consignante" IS NULL;
```

Conferir depois: `SELECT consignante, count(*) FROM "Produto" GROUP BY 1` deve dar `CSGEO` 51 · `CSL&S` 152 · `CSRI` 95 · `null` o resto.

### 1.4 Filtro em `/admin/produtos`

Novo filtro **"Consignante"**: `Todos` · `Próprios (sem consignante)` · e uma opção por valor distinto existente em `Produto.consignante`. As opções vêm de uma consulta `DISTINCT` no banco, então um prefixo novo aparece sozinho assim que o primeiro produto dele é criado. Entra em `ProdutoListFilters`, no `buildWhere` do repository e na querystring (padrão dos demais filtros).

## 2. Dados do repasse no produto

```prisma
model Produto {
  // ...
  percentualRepasse Decimal? @db.Decimal(5,2)  // 40.00 = 40%
  repassadoEm       DateTime?                  // null = ainda não repassado
  valorRepassado    Decimal? @db.Decimal(10,2) // quanto foi pago, congelado na hora de marcar
}
```

**Status secundário (derivado, não guardado):**

| Situação | Condição |
|---|---|
| **Em estoque** | consignado e `status` ≠ `VENDIDO` |
| **A repassar** | consignado, `status = VENDIDO`, `repassadoEm = null` |
| **Repassado** | `repassadoEm` preenchido |

**Valor do repasse** = `base × percentualRepasse ÷ 100`, arredondado em centavos. A `base` é o **preço de tabela no momento da venda**: o `precoUnitario` do item da venda mais recente da peça (Balcão sem devolução, ou pedido pago do site). Se a peça foi marcada como vendida na mão e não tem venda registrada, usa o `Produto.preco` atual. Sem `percentualRepasse`, o valor é "indefinido" (não é zero). `valorRepassado` congela o valor pago, então mudar o preço depois não altera o que já foi pago.

**Os campos de repasse nunca vão para a loja pública.** Garantir que os serializers públicos (vitrine, busca, `/api/busca`, página do produto) não incluem `percentualRepasse`, `repassadoEm`, `valorRepassado` nem `consignante`. Conferir na resposta real (aba Network).

## 3. Importação

- **Novas colunas reconhecidas:**
  - `repasse`: **cabeçalho que começa com "repasse"** (casamento por prefixo, não igualdade), para sobreviver a "(40%)" virar "(35%)"; valor em R$ (o `parsePreco` já entende "R$ 19,96").
  - `percentualRepasse`: alias para coluna de percentual direto (`percentual repasse`, `% repasse`, `porcentagem repasse`), se aparecer em planilhas futuras. Quando existe, **vale mais que a derivação**.
- **Derivação do %** (linha consignada que tem repasse em R$ e preço): `repasse ÷ preço × 100`, com 2 casas. Se ficar a menos de 0,1 de um número inteiro (ruído de centavos, ex.: 40,01), usar o inteiro. Exemplo: R$ 19,96 ÷ R$ 49,90 → **40**.
- Linha consignada (`CS…`) sem repasse na planilha → `percentualRepasse = null` (aviso, não erro). Linha **não** consignada com repasse preenchido → ignorar o repasse.
- A coluna "Parcela Sfruttare (60%)" continua ignorada. A planilha antiga da Geovana (sem coluna de repasse) não é coberta: o lote da seção 7 resolve.
- **Tela de revisão:** em linha consignada, mostrar sob a Referência uma etiqueta "Consignado · CSL&S" e um campo pequeno **"% repasse"** editável (0 < % ≤ 100; vazio permitido, com destaque âmbar "sem % — defina depois", sem bloquear a importação). Entra no payload `ajustes` como `percentualRepasse?: number | null` (no schema `produtoImportAjusteLinhaSchema`). O servidor recalcula `consignante` da referência final e ignora o % em linha não consignada. Layout compatível com a tabela/cartões da spec de ajustes de importação.
- `createManyImported` passa a gravar `consignante` e `percentualRepasse`.

## 4. Edição

- **`ProdutoForm`:** quando a referência começa com `CS` (reage enquanto digita), aparece a seção **"Consignação"**: *Consignante* (texto automático, somente leitura), **% de repasse** (editável, 0–100, até 2 casas) e uma linha de prévia: "Repasse: R$ 19,96 (40% de R$ 49,90)". Mostra também o status de repasse (somente leitura). Se a peça já foi **repassada**, o campo de % fica desabilitado com a dica "Desfaça o repasse na tela Consignados para editar". Trocar a referência para uma sem `CS` zera o `consignante`, mas **não apaga** o % já gravado.
- **`ProdutoCard`:** em peça consignada, uma etiqueta com o consignante e o status ("Em estoque", "A repassar · R$ 19,96", "Repassado em 12/10"). Sem % definido e vendida: "A repassar · sem %".
- Para saída de `VENDIDO` (próxima seção), a confirmação do select de status segue o padrão do `confirmandoLiberar`.

## 5. Tela de repasses — `/admin/consignados`

Nova tela (link "Consignados" no cabeçalho de `/admin/produtos`, ao lado de "Ver reservas"), no padrão visual do histórico do Balcão.

- **Totais no topo:** *A repassar* (nº de peças + R$), *Já repassado* (R$), *Sem % informado* (nº de peças, clicável: aplica o filtro de status "Sem %").
- **Filtros** (querystring): *Consignante* (opções automáticas), *Status* (`A repassar` (padrão) · `Repassado` · `Em estoque` · `Sem %` · `Todos`).
- **Agrupado por consignante:** cabeçalho com nome, "N a repassar · R$ X" e o botão **"Marcar todas como repassadas"** (só as com % definido; abre confirmação com a quantidade e o total). Linhas: referência, peça, data da venda, preço de tabela, %, repasse (R$), status e ação.
- **Ações por linha:** **"Marcar repassado"** (grava `repassadoEm = agora` e `valorRepassado`), **"Desfazer"** (zera os dois) e, em linha sem %, um campo inline **"Informar %"** que salva ao sair do campo/Enter.
- **Regras no servidor:** só marca peça `VENDIDO`, com `percentualRepasse` definido e `repassadoEm` nulo; marcar e desfazer usam `updateMany` com a condição de estado, para dois cliques ou duas abas não gravarem duas vezes. Data da venda = venda mais recente da peça (Balcão ou pedido pago); sem venda registrada, "—".

## 6. Devolução de peça já repassada

Quando uma peça consignada com `repassadoEm` preenchido volta para `DISPONIVEL`:

- **Devolução/troca no Balcão** (`DevolucaoBalcaoService`): dentro da mesma transação que reverte o produto, zera `repassadoEm` e `valorRepassado`. O item no histórico (`VendaBalcaoItemResumo`) passa a trazer `repasseRealizado: boolean` (vem do `repassadoEm` do produto, que o `includeRelations` já alcança junto da referência), e o modal de devolver/trocar mostra antes de confirmar: "Esta peça já foi repassada ao consignante. Ao devolver, o registro de repasse será zerado; acerte o valor com o consignante por fora."
- **Mudança manual de status** (`ProdutoCard` / `alterarStatusProduto`) de `VENDIDO` para qualquer outro: mesma regra e mesmo aviso.
- Um único método do repository (ex.: `zerarRepasse`) usado pelos dois caminhos, para a regra não ficar duplicada.

## 7. Preenchimento das peças existentes

- **As 23 consignadas já vendidas** passam a aparecer como **"A repassar"** (é o estado derivado: vendida e sem `repassadoEm`). Você marca como repassadas as que já pagou.
- **% em lote:** na tela `/admin/consignados`, ação **"Definir % em lote"**: escolher o consignante, digitar o % e confirmar num modal que mostra quantas peças serão afetadas ("Aplicar 40% em 152 peças CSL&S que estão sem %?"). **Só preenche onde `percentualRepasse` é nulo; nunca sobrescreve.**

## 8. Estados de UI e mobile

- **Vazio:** "Nenhuma peça consignada neste filtro." / "Nada a repassar."
- **Carregando:** Server Component, a navegação do Next cobre; botões de marcar/desfazer/lote desabilitados durante a ação.
- **Erro:** mensagem específica (peça não vendida, sem %, já repassada por outra aba).
- **Sucesso:** a linha muda de status na hora (revalidar `/admin/consignados` e `/admin/produtos`).
- **Mobile:** grupos viram cartões, linhas empilhadas, botões ≥44 px, sem rolagem lateral. O campo "% repasse" na revisão da importação segue o layout em cartão.

## Ao concluir

Registrar no CLAUDE.md o que foi implementado. Só marcar como concluído depois de testar de verdade:

1. **Migration e backfill:** conferir a contagem por consignante (1.3) e que nenhum outro campo de produto mudou. Comparar uma amostra de produtos antes/depois.
2. **Regra:** `obterConsignante` nos casos reais (`CSGeo20 - 14`, `CSL&S302`, referência sem `CS`). Criar uma peça `CSXYZ1` e ver o filtro "Consignante" ganhar `CSXYZ` sozinho.
3. **Importação:** importar linhas consignadas da planilha real; conferir `percentualRepasse = 40` e `consignante` gravados; editar o % na revisão; linha consignada sem repasse importa com aviso; linha não consignada ignora repasse.
4. **Edição:** editar o % no `ProdutoForm`; campo some em referência não consignada; desabilitado após repassar.
5. **Repasses:** lote de % (não sobrescreve quem já tem); marcar uma, desfazer, marcar em grupo; as 23 vendidas aparecem como "A repassar"; valor = preço da venda × %.
6. **Devolução:** devolver uma peça já repassada e ver o aviso, o repasse zerado e a peça voltando como "Em estoque".
7. **Privacidade:** nenhuma resposta pública (`/api/busca`, páginas da loja) traz os campos de repasse.

Essa é a única alteração permitida no CLAUDE.md. Não editar mais nada nele.
