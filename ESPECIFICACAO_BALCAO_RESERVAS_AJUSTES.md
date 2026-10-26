# Especificação: Ajustes no Balcão e nas Reservas

Quatro pedidos: criar produto pelo Balcão, cliente nas reservas, pagamento sem a tabela de parcelas, e conversão + resumo na tela de Reservas.

**Nenhuma mudança de banco.** Não há migration, e nada do que já está gravado (vendas, pagamentos, reservas, produtos) é alterado. É tudo tela e leitura de dados que já existem.

## Decisões já validadas com você

- **Peça criada no Balcão** usa o **mesmo botão e o mesmo modal** da aba Produtos (é a mesma funcionalidade em outra tela). Se não for vendida, fica como produto `DISPONIVEL` normal, visível na loja até você completar o cadastro.
- **Parcelas:** a tabela 1x–12x sai, e o comparativo sem/com juros passa para dentro do combo de cada cartão.
- **Converter reserva:** abre o Balcão já preenchido, sem modal próprio na tela de Reservas.
- **Resumo da reserva:** totais no topo, coluna de valor em cada reserva e agrupamento por cliente com subtotal.

## 1. Criar produto pela tela de Balcão

- Botão **"Novo produto"** na tela `/admin/balcao`, ao lado do campo de busca de peças. Abre o mesmo `Modal` com o mesmo `ProdutoForm` que `ProdutosAdmin` usa hoje. **Não criar formulário novo.** Mesmo visual de botão (`newButton`).
- O Balcão não conhece as categorias hoje. `app/admin/balcao/page.tsx` passa a buscar `categorias` (como `app/admin/produtos/page.tsx` faz) e repassa para o `BalcaoView`.
- Reaproveitamento: extrair para um componente pequeno (ex.: `NovoProdutoModal`: estado aberto/fechado + `Modal` + `ProdutoForm`) em vez de copiar o JSX do `ProdutosAdmin`. O `ProdutosAdmin` pode passar a usá-lo também para criar, **desde que o fluxo de editar continue exatamente igual** (se mexer na edição for arriscar, deixar o `ProdutosAdmin` como está).
- **Ao salvar:** o modal fecha e a **busca do Balcão é preenchida com a referência da peça nova** (ou o nome, se não tiver referência), para ela aparecer no topo dos resultados com os botões "Adicionar" e "Reservar". Para isso, o `onSaved` do `ProdutoForm` passa a receber `{ nome, referencia }` do que foi salvo (parâmetro novo; quem já chama sem argumentos continua funcionando). Não auto-adicionar ao carrinho: você pode criar a peça só para cadastrar.
- Estados: carregando/erro/sucesso são os do próprio `ProdutoForm` (nada novo). Mobile: o botão tem toque ≥44 px; o modal já é o mesmo usado no celular em Produtos.

## 2. Cliente nas reservas (igual à compra)

Hoje o campo de nome da reserva é um input solto; só o campo da venda tem o autocomplete. Passa a ter nos **três** lugares onde se digita cliente:

1. Venda no Balcão (já existe).
2. Reserva inline nos resultados da busca do Balcão (`reservandoProdutoId`).
3. Reserva em `/admin/produtos` (`ProdutoCard`, canal `SITE`).

**Comportamento (igual ao da venda):** a partir de 2 caracteres, sugere clientes por nome. Escolher uma sugestão preenche nome e celular. Navegação por setas, Enter e Esc. Campos continuam editáveis. Sem resultado: não mostra nada (é cliente novo, não é erro). Falha na consulta: silenciosa.

**Extrair, não copiar.** A lógica está embutida no `BalcaoView.tsx` (debounce, sugestões, destaque por teclado, fechar ao clicar fora, `suprimirBuscaClienteRef`). Extrair para um componente/hook compartilhado (ex.: `ClienteAutocomplete`) usado nos três lugares. A reserva só preenche nome e celular (`Reserva` não tem e-mail, e não vamos criar coluna para isso).

**A fonte dos clientes passa a incluir reservas.** Hoje `findClientesPorNome` lê só `VendaBalcao`: quem só reservou e nunca comprou não aparece. Passar a ler também `Reserva` (nome e celular), juntando tudo por nome normalizado (`trim().toLowerCase()`). Para cada campo (celular, e-mail), valer o **valor não vazio mais recente** entre todas as origens. Isso mantém a regra de "dado mais recente vence" e não perde um e-mail só porque a reserva mais nova não tem e-mail.

## 3. Pagamento: tirar a tabela de parcelas

### Remover

A seção **"Parcelas"** (tabela 1x–12x clicável) abaixo das linhas de pagamento. Ela é a segunda forma de escolher parcelas e, com o pagamento dividido, fica ambígua: só acompanha **uma** linha de crédito (`linhaTabela`). Sai junto o que só existia para ela: `linhaFocoId`/`linhaCreditoFoco`/`linhaTabela`, `escolherParcelaNaTabela` e os estilos `.tabelaParcelas`, `.tabelaParcelasEsmaecida`, `.parcelasTable` e as classes das linhas da tabela. Também some o atalho "clicar numa parcela troca a linha para Crédito": para parcelar, escolhe-se Crédito e depois o combo.

### Combo de cada cartão (único lugar de escolher parcelas)

Cada linha de **Crédito** mantém o seu combo "Parcelas". Cada opção passa a mostrar **os dois valores**, para você continuar tendo o comparativo na hora de falar com o cliente. Exemplo para uma linha de R$ 300,00:

```
1x de R$ 300,00
2x de R$ 150,00  (com juros: 2x de R$ 164,46)
3x de R$ 100,00  (com juros: 3x de R$ 111,23)
```

Sem juros = `valor ÷ n`. Com juros = `calcularTotalComJuros(valor, n) ÷ n`. Abaixo do combo, uma linha pequena com o **total com juros** da opção selecionada (ex.: "Total no cartão: R$ 333,69"). Em 1x só aparece o valor cheio. Em tela estreita o texto do combo pode ficar longo: nesse caso priorizar o valor da parcela com juros e deixar o comparativo completo na linha de resumo abaixo do combo.

### Dois cartões diferentes

**Já é possível hoje, e a spec manda manter e testar.** Nada no front nem no servidor impede duas linhas de Crédito: `+ Dividir em outra forma` aceita a mesma forma mais de uma vez (até `MAXIMO_LINHAS_PAGAMENTO = 4`), e cada linha de crédito tem as próprias parcelas e os próprios juros. O que atrapalhava era justamente a tabela, que só mostrava uma das linhas. Com ela fora, o fluxo fica: Pagamento 1 = Crédito (digita o valor, escolhe as parcelas) e Pagamento 2 = Crédito (o resto, escolhe as parcelas dele).

Ajuste de clareza: quando houver 2 ou mais linhas de Crédito, o título de cada uma passa de "Pagamento N" para "Pagamento N — Cartão de crédito" (ou equivalente), para ficar óbvio que são dois cartões. **Não** registrar qual cartão/bandeira foi usado: não foi pedido e não tem campo para isso.

### Estados e mobile

Sem estados novos. Em mobile cada linha de pagamento já empilha em coluna única; o combo tem toque ≥44 px.

## 4. Tela de Reservas (`/admin/reservas`)

### 4.1 Botão "Converter em venda"

- Em cada reserva **ATIVA**, ao lado de "Cancelar reserva": **"Converter em venda"**.
- Leva para `/admin/balcao?reservas=<id>` (vários ids separados por vírgula). O Balcão, ao abrir com esse parâmetro:
  - busca as reservas pelos ids e **aceita só as que ainda estão ATIVAS**;
  - coloca as peças **no carrinho**;
  - preenche **nome e celular do cliente** com os da reserva. O e-mail vem da mesma consulta de clientes da seção 2, quando existir um cliente com aquele nome;
  - mostra um aviso no topo: "Convertendo reserva de {cliente}".
- O resto é o fluxo normal de venda: você escolhe o pagamento e confirma. A reserva vira `CONVERTIDA` sozinha ao confirmar (já é assim hoje, via `VendaBalcaoRepository.create`). **Nada novo a fazer nessa parte, só conferir no teste.**
- Você pode remover uma peça do carrinho antes de confirmar (cliente levou só algumas): as que ficaram de fora continuam reservadas.
- **Reserva que deixou de ser ativa** (cancelada ou convertida enquanto a tela estava aberta): ignorar e avisar no Balcão, "N reserva(s) não puderam ser carregadas (já convertidas ou canceladas)". Se nenhuma sobrar, abrir o Balcão normal, vazio, com esse aviso.
- **Mesmo cliente:** ao carregar mais de uma reserva, só carregar as do mesmo cliente (nome normalizado) da primeira; as outras seguem a regra do aviso acima. Pela interface isso não acontece, mas protege contra URL editada na mão.
- Busca dos dados: método novo no `ReservaService` (ex.: `obterAtivasParaConversao(ids)`), que devolve a peça no mesmo formato `ProdutoBalcaoResumo` usado na busca do Balcão. Extrair esse mapeamento de `VendaBalcaoService.buscarProdutosDisponiveis` para não duplicar. `BalcaoView` recebe o resultado como estado inicial (props), sem efeito ao carregar.
- Mobile: botão ≥44 px, com a mesma largura do "Cancelar reserva".

### 4.2 Resumo do valor

**Totais no topo**, acima da lista:
- **Reservas ativas:** quantidade.
- **Valor reservado:** soma do preço das peças das reservas ativas.
- Linha menor: "Convertidas: N · Canceladas: N" (só contagens, sem valor).

Esses totais respeitam os filtros de **canal e período**, mas **ignoram o filtro de status**. Se você filtrar por "Canceladas", o card "Reservas ativas" continua mostrando as ativas, e não zero. Implementação simples: o service busca por canal/período, calcula os totais em memória (o volume é pequeno) e só então aplica o filtro de status à lista.

**Coluna "Valor"** em cada linha: preço atual da peça (`produto.preco`). `ReservaResumo` ganha `valorProduto: number`, e o `include` do produto no `ReservaRepository` passa a trazer `preco`.

**Agrupado por cliente**, com subtotal:
- As reservas do mesmo cliente (nome normalizado) ficam juntas sob um cabeçalho com nome, celular, "N reservas ativas · R$ subtotal".
- O subtotal soma **só as ativas** do cliente; convertidas e canceladas aparecem na lista, mas não entram no valor.
- Cliente com 2 ou mais reservas ativas ganha o botão **"Converter todas (N)"**, que abre o Balcão com os ids de todas elas.
- Grupos ordenados pela reserva mais recente.

### Estados de UI

- **Vazio:** "Nenhuma reserva encontrada." (já existe). Totais zerados quando não houver nada.
- **Carregando:** a página é Server Component, a navegação do Next cobre.
- **Erro:** falha ao converter vira o aviso do Balcão descrito acima.
- **Sucesso:** depois de confirmar a venda no Balcão, voltar para `/admin/reservas` mostra a reserva como Convertida (as rotas já são revalidadas).
- **Mobile:** o grupo vira um cartão (cabeçalho do cliente + linhas empilhadas). Sem rolagem lateral na lista.

## Ao concluir

Registrar no CLAUDE.md o que foi implementado. Só marcar como concluído depois de testar de verdade:

1. **Novo produto no Balcão:** criar uma peça pelo botão, ver o modal igual ao de Produtos, e ver a peça aparecer na busca depois de salvar. Conferir que o `ProdutoForm` em Produtos (criar e editar) continua igual.
2. **Cliente na reserva:** nos três lugares, digitar parte do nome de um cliente que já comprou e escolher a sugestão. Conferir também um cliente que **só reservou** (nunca comprou) aparecendo na sugestão.
3. **Pagamento:** a tabela 1x–12x sumiu; o combo mostra valor sem e com juros; venda com **dois cartões de crédito** em parcelas diferentes (ex.: 2x e 5x), confirmar e ver no histórico `Crédito 2x R$ … + Crédito 5x R$ …`, com `totalComJuros` batendo com a soma dos dois.
4. **Reservas:** converter uma reserva (peça e cliente chegam preenchidos), confirmar a venda e ver a reserva como Convertida. Converter com "Converter todas" num cliente com 2 reservas. Remover uma peça do carrinho e conferir que a reserva dela segue ativa. Cancelar uma reserva em outra aba e tentar converter a que ficou obsoleta. Conferir totais, coluna Valor e subtotal por cliente.
5. **Dados antigos:** vendas, pagamentos e reservas já gravados continuam idênticos no banco.

Essa é a única alteração permitida no CLAUDE.md. Não editar mais nada nele.
