/**
 * Única fonte das telas do admin: o combo do cabeçalho e a detecção da
 * tela atual leem daqui. Tela nova do admin entra aqui (uma linha).
 * O agrupamento é só organização visual do painel.
 */

export type AdminNavItem = {
  href: string;
  label: string;
};

export type AdminNavGroup = {
  label: string;
  items: AdminNavItem[];
};

export const adminNavGroups: AdminNavGroup[] = [
  {
    label: "Catálogo",
    items: [
      { href: "/admin/produtos", label: "Produtos" },
      {
        href: "/admin/produtos/importar",
        label: "Importar produtos",
      },
      { href: "/admin/categorias", label: "Categorias" },
      { href: "/admin/vitrine", label: "Vitrine" },
    ],
  },
  {
    label: "Vendas",
    items: [
      { href: "/admin/balcao", label: "Balcão" },
      {
        href: "/admin/balcao/historico",
        label: "Histórico de vendas",
      },
      { href: "/admin/reservas", label: "Reservas" },
      { href: "/admin/consignados", label: "Consignados" },
    ],
  },
  {
    label: "Gestão",
    items: [
      { href: "/admin/desempenho", label: "Desempenho" },
      { href: "/admin/usuarios", label: "Usuários" },
    ],
  },
];

const adminNavItems = adminNavGroups.flatMap(
  (group) => group.items
);

function semBarraFinal(pathname: string) {
  return pathname.length > 1 && pathname.endsWith("/")
    ? pathname.slice(0, -1)
    : pathname;
}

/**
 * Tela atual: o item cujo `href` é o prefixo mais longo do `pathname`
 * (por segmento). Assim `/admin/balcao/historico` marca "Histórico de
 * vendas" e não "Balcão". Rota fora da lista devolve `null`.
 */
export function obterItemAtual(
  pathname: string | null
): AdminNavItem | null {
  if (!pathname) {
    return null;
  }

  const caminho = semBarraFinal(pathname);
  let atual: AdminNavItem | null = null;

  for (const item of adminNavItems) {
    const corresponde =
      caminho === item.href ||
      caminho.startsWith(`${item.href}/`);

    if (
      corresponde &&
      (!atual || item.href.length > atual.href.length)
    ) {
      atual = item;
    }
  }

  return atual;
}
