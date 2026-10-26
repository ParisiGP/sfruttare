# Especificação: Ajustes na importação de produtos e na listagem do admin

Primeiro lote da varredura geral do site. Três pedidos (itens 1 a 3) e um achado extra que encontrei lendo o código (item 4).

**Nenhuma mudança de banco.** Não há migration, e nenhum produto, venda ou pedido já gravado é tocado por nada aqui.

## 1. Ignorar uma linha na revisão da importação (sem reenviar a planilha)

### Como é hoje

Na tela de revisão (`ProdutoImportacao.tsx`) não dá pra descartar uma linha. Quem quer deixar uma peça de fora precisa editar a planilha e reenviar tudo. O card "Ignorados" e o status `IGNORADO` já existem (badge, cor de linha, `statusLabels`), mas estão sem uso: `ignorados: 0` fixo no `resumo`.

**Cuidado com o servidor.** Só não mandar a linha no `ajustes` não funciona: `importarProdutosPorPlanilha` (`produto.service.ts`) relê a planilha e recusa a importação com "Linha N: item ausente na revisao" para toda linha do arquivo que não voltou nos ajustes. As duas pontas precisam mudar.

### Comportamento

- Cada linha ganha o botão **"Ignorar"**. Ao clicar, a linha **não some**: fica esmaecida, campos desabilitados, badge "Ignorado", mensagem "Linha ignorada — não será importada." O botão vira **"Restaurar"**, que desfaz sem reenviar nada. Nada é apagado, então o clique errado é reversível.
- Linha ignorada **sai de todas as contas**:
  - não bloqueia "Confirmar importação" mesmo se estiver inválida (descartar uma linha ruim é um uso esperado);
  - não conta em "Válidos" nem "Inválidos" e entra em "Ignorados" (agora com o número real);
  - não gera aviso de "Referência já usada nesta planilha" nas outras linhas (`duplicateReferences` considera só linhas não ignoradas);
  - não recebe "Categoria para todos";
  - não entra na contagem do modal "Confirmar importação de N produto(s)?".
- Se **todas** as linhas estiverem ignoradas: bloquear com "Todas as linhas foram ignoradas. Restaure ao menos uma para importar."
- `getVisualStatus` passa a poder devolver `"IGNORADO"`. O estado fica num `Set` de números de linha dentro de `ProdutoImportacao`.

### Contrato com o servidor

- No `ajustes`, a linha ignorada vai só como `{ linha, ignorada: true }`. **Não** mandar os outros campos: uma linha inválida (ex.: `preco: null`) quebraria o parse do `produtoImportAdjustmentSchema` e travaria a importação por causa de uma linha que o usuário já descartou.
- `ProdutoImportAdjustment` e o schema viram uma união: linha normal (como hoje) ou `{ linha, ignorada: true }`.
- Em `importarProdutosPorPlanilha`:
  - a linha ignorada **continua contando como "presente na revisão"**, para manter a checagem de segurança de que toda linha do arquivo foi tratada. Ela só precisa existir no arquivo ("linha nao encontrada na planilha" vale pra ela também);
  - as validações de campo (referência, categoria, preço, etc.) rodam só nas linhas não ignoradas;
  - o `if (ajustesValidados.length === 0)` passa a contar só as não ignoradas ("Nenhum produto valido para importar.");
  - o loop que monta `importaveis` pula as ignoradas;
  - no `preview` devolvido, hoje **toda** linha volta como `VALIDO` / "Produto importado com sucesso." As ignoradas devem voltar `status: "IGNORADO"` e mensagem "Linha ignorada na revisão.", e o `resumo.ignorados` deve sair certo (conferir se `buildResumo` já conta `IGNORADO`).
- Depois da importação o cliente faz `setRows(result.preview.linhas)`. Refazer o `Set` de ignoradas a partir das linhas que voltaram `IGNORADO`, para a tela não mostrar peça descartada como "importada com sucesso".

### Estados de UI

- **Carregando:** "Ignorar/Restaurar" desabilitados enquanto `loading !== null`.
- **Erro:** só o bloqueio de "todas ignoradas" (acima) e os erros que já existem.
- **Sucesso:** linhas ignoradas continuam visíveis como "Ignorado" no relatório final.
- **Mobile:** o botão é ≥44px de altura; no layout em cartão (item 2) fica no topo do cartão, ao lado do número da linha.

## 2. Tabela da revisão sem rolagem horizontal

### Causa

`ProdutoImportacao.module.css` define `.table { min-width: 1500px }`, mas a página tem `.wrapper { width: min(1180px, 100% - 40px) }`. A tabela é sempre mais larga que o container, **em qualquer tela**, então `.tableWrap { overflow-x: auto }` sempre rola. Os inputs ainda têm `min-width` próprio (textarea 220, select 130, input 92) que impedem a tabela de encolher, e são 12 colunas.

### Regra

**Rolagem horizontal só como último recurso.** A página nunca deve precisar dela em larguras de uso normal. O `overflow-x: auto` fica só como rede de segurança, e não deve aparecer em 390, 768, 1366, 1440 e 1920 px.

### Como resolver

1. **Mais largura nesta tela:** `.wrapper` de `min(1180px, …)` para `min(1680px, 100% - 40px)`. Em monitor grande a tabela usa o espaço que existe.
2. **Remover o `min-width: 1500px`** e os `min-width` de input/select/textarea (`min-width: 0`, `width: 100%`). Usar `table-layout: fixed` com larguras por coluna.
3. **Menos colunas** (de 12 para 10, ou 11 com Modelo):
   - **Situação + Mensagem** saem como colunas. O **badge** passa para a célula da **Linha** (número em cima, badge embaixo, badge compacto, sem `min-width: 92px`). A **mensagem** passa para **baixo do campo Descrição**, em letra pequena, **só quando houver problema ou aviso**. Hoje toda linha válida imprime "Produto pronto para importacao.", o que é ruído que só gasta largura.
   - Colunas no modo tabela (larguras sugeridas): Linha+badge ≈96 · Referência ≈120 · **Descrição+mensagem (flexível, mínimo ≈260)** · Modelo ≈120 (só se existir) · Cor ≈100 · Tam. ≈70 · Categoria ≈170 · Preço ≈100 · Status ≈120 · Qtd. ≈70 · Ação ≈100. Soma fixa ≈950 px, então a Descrição ainda tem ≈290 px num container de 1240 e bastante folga acima disso.
4. **Abaixo da largura em que a Descrição ficaria menor que ≈260 px, a tabela vira cartões**, sem rolagem lateral em nenhuma largura. Cada linha vira um cartão: topo com "Linha N" + badge + botão Ignorar; campos num grid que se reorganiza sozinho (`repeat(auto-fit, minmax(150px, 1fr))`); Descrição e mensagem em largura total; rótulos visíveis em cada campo (sem `<thead>` o usuário precisa saber qual é o quê).
   - Decidir o ponto de troca por **container query** no `.tablePanel` (`container-type: inline-size`), não por largura de tela. Assim ele acompanha o espaço que a tabela realmente tem, inclusive quando a coluna Modelo aparece.
5. **Cabeçalho fixo (sticky) no modo tabela**, porque são ~155 linhas e o usuário rola a página inteira. Usar o offset do header do admin, se houver um fixo.
6. **Extrair a linha para um componente próprio** (ex.: `ProdutoImportacaoLinha`). O arquivo já passa de 880 linhas, e as duas apresentações (linha de tabela e cartão) devem compartilhar a mesma lógica de campos, sem duplicar nada. Nenhuma regra de validação muda.

### Estados e mobile

O comportamento dos campos (âmbar para categoria não escolhida, vermelho para erro real, amarelo para aviso) não muda. Em mobile (≤720 px) é sempre o layout em cartão, com campos e botões de toque ≥44 px.

## 3. Tirar a paginação de `/admin/produtos`

### Pedido

A lista mostra **todos** os produtos que batem com os filtros, numa página só.

### Mudanças

- `app/admin/produtos/page.tsx`: remover `pagina` e `limite: 12` do `buildFilters`; deixar de repassar `paginacao`.
- `ProdutoRepository.findManyPaginated`: virar uma busca sem `skip`/`take` (ex.: `findManyFiltered`), devolvendo `{ produtos, total }`. É usado só pelo admin (`ProdutoService.listarProdutos`), então a remoção é segura. A busca pública e a ordenação (`listarProdutosParaOrdenacao`, que já carrega tudo) têm caminhos próprios e não mudam.
- `ProdutoListFilters`: remover `pagina` e `limite`.
- `ProdutosAdmin.tsx`: remover o `<footer>` de paginação, `buildPageHref`, o `<input type="hidden" name="pagina">`, a prop `paginacao`; remover `.pagination` e `.pageActions` do CSS. **Manter** o texto "N produtos encontrados": como o rodapé some, ele passa a ficar logo acima da lista (abaixo dos filtros), já que o número é útil com filtro aplicado.
- Estado vazio: se os filtros não acharem nada, mostrar "Nenhum produto encontrado para esses filtros." (conferir se `ProdutoGrid` já trata).

### Atenção ao desempenho

Hoje são 715 produtos e o número só cresce a cada importação. Sem paginação a página renderiza 715 `ProdutoCard`s, e o card atual não foi feito pra isso:

- **Imagens:** o `<img>` do card (`ProdutoCard.tsx`, ~linha 258) não tem `loading="lazy"`. Todas as imagens seriam baixadas de uma vez. Adicionar `loading="lazy"` e `decoding="async"`.
- **Carrossel automático:** cada card com mais de uma imagem cria um `setInterval` de 30 s (`ProdutoCard.tsx`, ~linha 226). Com centenas de cards são centenas de timers atualizando estado fora da tela. Fazer o avanço automático rodar **só enquanto o card está visível** (`IntersectionObserver`). Setas e swipe continuam iguais.
- **Renderização:** `content-visibility: auto` com `contain-intrinsic-size` no `.card` (`ProdutoCard.module.css`), para o navegador não montar o que está fora da tela.
- **Não** trocar a URL das imagens por versão reduzida do Cloudinary agora: o enquadramento (`zoom`/`offsetX`/`offsetY`) é calculado em cima da imagem original, e uma versão recortada poderia desalinhar tudo. Fica fora desta tarefa de propósito.

### Estados

Carregando: a página é Server Component (como hoje), a navegação do Next cobre o carregamento. Erro e sucesso: sem mudança. Mobile: a grade já é em 2 colunas e não muda.

## 4. Achado extra: o nome salvo na importação ignora a coluna "Peça"

Não foi pedido, mas está na mesma função que vai ser mexida e afeta os dados das próximas importações, então registro aqui.

- **Na pré-visualização**, o nome do produto é `Peça || descrição - modelo` (`produto.service.ts` ~linha 1017, e `updateRow` no cliente). Você definiu antes que a coluna Peça é literalmente o título.
- **Na confirmação** (`importarProdutosPorPlanilha`, ~linha 509) o nome é recalculado só como `[descricao, modelo].join(" - ")`. O cliente não manda a `peca` e o `ProdutoImportAdjustment` nem tem esse campo.

Resultado: numa planilha que tem **Peça e Descrição TAG**, a revisão mostra o título curto da Peça, mas o produto é salvo com a descrição inteira como nome. Dá pra ver sinais disso no banco: parte dos produtos tem nomes do tipo "Blusa Debrum • Tam. M • 100% viscose • Sem uso".

**Correção sugerida:** na confirmação, usar a `peca` da linha original da planilha (que o servidor já relê) quando houver: `nome = linhaOriginal.peca || [descricao, modelo].join(" - ")`. Vale só para importações futuras. **Produtos já gravados não são alterados.** Isso também melhora o BI de "tipo de peça mais vendida", que identifica o tipo por palavras no nome.

## Ao concluir

Registrar no CLAUDE.md o que foi implementado. Só marcar como concluído depois de testar de verdade, com a planilha real de ~155 linhas:

1. **Ignorar:** ignorar 3 linhas (uma delas inválida), conferir os contadores e o texto do modal, importar, e confirmar no banco que as 3 **não** entraram e que as demais sim. Conferir que as 3 aparecem como "Ignorado" depois. Restaurar uma antes de importar e ver que ela entra. Ignorar todas e ver o bloqueio.
2. **Tabela:** sem barra de rolagem horizontal em 1920, 1440, 1366, 768 e 390 px, com e sem a coluna Modelo. Cabeçalho fixo no modo tabela. Conferir que os cartões mantêm todas as validações.
3. **Paginação:** `/admin/produtos` lista tudo, com filtros funcionando e o contador de resultados. Rolar a lista inteira e olhar a aba Network: imagens carregando sob demanda, sem travar. Conferir que o modo "Ordenar produtos" continua igual.
4. **Nome (item 4):** importar uma linha de teste com Peça e Descrição preenchidas e conferir que o nome salvo é a Peça.

Essa é a única alteração permitida no CLAUDE.md. Não editar mais nada nele.
