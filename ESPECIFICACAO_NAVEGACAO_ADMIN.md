# Especificação: Navegação global do admin (combo)

Hoje navegar entre as telas do admin está espalhado e não cabe no celular. Esta spec troca isso por **um único combo global**, presente no cabeçalho de todas as telas do admin.

**Sem mudança de banco e sem mudança de regra de negócio.** É só navegação e layout.

## O que existe hoje (levantado no código)

- O `AdminHeader` já é global, mas só lista **6 telas** em linha: Produtos, Balcão, Vitrine, Categorias, Usuários, Desempenho. No celular vira o hambúrguer com a mesma lista (`HeaderSidebar`).
- As outras telas só são alcançáveis por **botões soltos dentro de cada página**, o que explica o excesso numa tela só:
  - `ProdutosAdmin`: "Ordenar produtos", **"Importar produtos"**, **"Ver reservas"**, **"Consignados"**, "Novo produto". No celular os 5 viram botões de largura total empilhados.
  - Balcão: **"Ver histórico de vendas"** e **"Ver reservas"**.
  - Histórico do Balcão: "← Voltar pro balcão". Consignados: "Ver produtos". Importação: "Listar produtos".
- Resultado: para ir de Consignados a Reservas é preciso passar por Produtos. E uma lista em linha com 11 itens não caberia nem no desktop.

## Decisões que estou assumindo (avisa se algo não for isso)

1. **O combo vale para todo o admin**, não só para as telas de produto, e substitui a lista de links em linha **também no desktop** (um componente, um comportamento; 11 itens não cabem em linha).
2. **Links que são só de navegação saem das páginas.** Botões que são **ações** da tela ficam.
3. **Pedidos e Inspirações ficam fora do combo**: as duas páginas existentes ainda são só um `<h1>` vazio. Entram quando forem construídas (a lista de navegação é um arquivo só; é uma linha para adicionar).

## 1. Lista de navegação única

Um arquivo de configuração (ex.: `AdminHeader/adminNavigation.ts`) é a **única** fonte das telas, usada pelo combo e pela detecção da tela atual:

```
Catálogo
  Produtos              /admin/produtos
  Importar produtos     /admin/produtos/importar
  Categorias            /admin/categorias
  Vitrine               /admin/vitrine
Vendas
  Balcão                /admin/balcao
  Histórico de vendas   /admin/balcao/historico
  Reservas              /admin/reservas
  Consignados           /admin/consignados
Gestão
  Desempenho            /admin/desempenho
  Usuários              /admin/usuarios
```

(O agrupamento é só organização visual; mover um item de grupo é mudar uma linha.)

**Tela atual:** o item cujo `href` é o **prefixo mais longo** do `pathname`. Assim `/admin/balcao/historico` marca "Histórico de vendas" (e não "Balcão"), e `/admin/produtos/importar` marca "Importar produtos" (e não "Produtos"). Rota fora da lista: o botão mostra "Menu".

## 2. O combo (`AdminNavMenu`)

### Botão

- Mostra o **nome da tela atual** + seta (ex.: "Reservas ▾"), então já responde "onde estou". Altura ≥44 px.
- `aria-expanded` e `aria-controls`.

### Painel

- Abre logo abaixo do botão com os grupos (rótulo pequeno em maiúsculas, mesma tipografia dos links atuais) e os itens. O item da tela atual fica destacado (cor primária) e com `aria-current="page"`.
- **Padrão de disclosure** (botão + `<nav>` com lista de links), não `role="menu"`: é navegação entre páginas. Tab percorre os links; Esc fecha e devolve o foco ao botão.
- **Fecha** ao: clicar num item, clicar fora, apertar Esc e **ao trocar de rota**. Esse último é importante: o `AdminHeader` está no `layout` e **não é remontado** na navegação do Next, então um estado "aberto" ficaria preso sem um efeito em `usePathname()`.
- Visual: o mesmo padrão do `ContaMenu` (fundo `--color-surface`, borda e sombra suaves), coerente com o resto do cabeçalho.
- Entrada/saída suave, no mesmo estilo do `Modal` e do overlay do menu atual.

### Desktop

Painel ancorado no botão, ~280 px de largura, itens com ≥40 px de altura. Se a tela for baixa, o painel rola por dentro (`max-height` com o espaço restante da viewport).

### Mobile (≤768 px)

- O combo fica **sempre visível na barra** (não escondido atrás do hambúrguer). Some o hambúrguer do admin e, com ele, o passo extra de abrir a sidebar.
- O painel ocupa a largura da tela (com a margem lateral padrão de 16 px), itens com **≥48 px** de toque, rolagem interna com `overscroll-behavior: contain`, e overlay escurecido atrás, como o menu atual. Tocar no overlay fecha.
- O cabeçalho precisa **caber em 320 px**: logo compacto (só "sfruttare", sem o subtítulo "admin" abaixo de 480 px), combo e o "Ver Loja" como **ícone** com `aria-label`, alvo ≥44 px.

### Comportamento do cabeçalho

O cabeçalho esconde ao rolar para baixo e volta ao rolar para cima (`useHeader`). **Com o painel aberto ele precisa ficar visível** (o mesmo que a classe `menuOpen` já faz para a sidebar). Isso pesa em `/admin/produtos`, que fica comprida depois que a paginação sair.

## 3. Integração com o `BaseHeader` (sem quebrar o site público)

O `BaseHeader` é compartilhado com o `ClientHeader` (loja pública), que **continua com hambúrguer + sidebar exatamente como hoje**. A extensão é opcional e retrocompatível: um modo em que o `navContent` fica **sempre visível, inclusive no celular**, sem o hambúrguer nem a sidebar (ex.: prop `mobileNav="inline"`, padrão `"sidebar"`). O `AdminHeader` usa esse modo e passa o `AdminNavMenu` como `navContent`. Não duplicar o cabeçalho.

## 4. Limpar as páginas (só links de navegação)

| Tela | Remover | Manter |
|---|---|---|
| `/admin/produtos` | "Importar produtos", "Ver reservas", "Consignados" | "Ordenar produtos" / "Salvar ordem" / "Cancelar", "Novo produto" |
| `/admin/balcao` | "Ver histórico de vendas", "Ver reservas" | título |
| `/admin/balcao/historico` | "← Voltar pro balcão" | filtros, "Limpar filtros" |
| `/admin/consignados` | "Ver produtos" | filtros, ações |
| `/admin/produtos/importar` | "Listar produtos" | tudo da importação |
| `/admin/desempenho` | nada: "Reservas ativas: N" é um dado que também é link | — |

Conferir as demais telas por links que só levam a outra tela do admin e tratar do mesmo jeito. Links com função de dado ou de contexto continuam.

**Efeito esperado em `/admin/produtos` no celular:** de 5 botões empilhados em largura total para 2 ações ("Ordenar produtos" e "Novo produto") lado a lado, ou empilhadas só se não couberem. O espaço ganho vem na primeira dobra da tela.

## 5. Achado extra (opcional, mesma região)

`app/admin/layout.tsx` já envolve tudo em `<main>`, e as páginas (`produtos`, `balcao`, `consignados`, `pedidos`…) devolvem **outro `<main>`** por dentro. HTML inválido com dois landmarks `main`, que atrapalha leitores de tela. Trocar o `<main>` das páginas por `<div>`/fragment. É mecânico e sem risco visual; só fazer se couber nesta tarefa.

## Estados de UI e mobile

- **Vazio/carregando/erro:** não se aplicam (lista estática, sem dados remotos).
- **Sucesso:** navegar fecha o painel e o botão passa a mostrar a nova tela.
- **Mobile:** descrito na seção 2; o resto das telas ganha espaço vertical pela limpeza da seção 4.
- **Acessibilidade:** foco visível no botão e nos links, `aria-current` no item atual, Esc fecha e devolve o foco.

## Ao concluir

Registrar no CLAUDE.md o que foi implementado (inclusive que a lista de telas do admin vive em `adminNavigation.ts`, e que novas telas entram ali). Só marcar como concluído depois de testar de verdade:

1. **Larguras:** 320, 390, 768, 1024 e 1440 px, sem rolagem horizontal da página e com o cabeçalho cabendo. Abrir o combo em cada uma.
2. **Todas as telas** da lista abrem pelo combo, e o item atual é o certo em cada uma, em especial `/admin/balcao/historico` e `/admin/produtos/importar`.
3. **Fechamento:** clicar num item, clicar fora, Esc e **trocar de rota** (ir de Produtos a Reservas e ver o painel fechado). Foco volta ao botão no Esc.
4. **Cabeçalho com painel aberto** continua visível em página longa (rolar `/admin/produtos` antes de abrir).
5. **Teclado:** Tab percorre os links, Enter navega.
6. **Site público intacto:** o `ClientHeader` segue com hambúrguer e sidebar iguais.
7. **Limpeza:** os links removidos da seção 4 sumiram, as ações continuam funcionando, e `/admin/produtos` no celular mostra só as 2 ações.

Essa é a única alteração permitida no CLAUDE.md. Não editar mais nada nele.
