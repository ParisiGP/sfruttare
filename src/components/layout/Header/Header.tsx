import Link from "next/link";

import styles from "./Header.module.css";

const navItems = [
  {
    href: "/",
    label: "Inicio",
  },
  {
    href: "/sobre",
    label: "Sobre",
  },
  {
    href: "/admin/produtos",
    label: "Pecas",
  },
  {
    href: "/contato",
    label: "Contato",
  },
];

export function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.topBar}>
        Brecho com estilo, historia e autenticidade
      </div>

      <div className={styles.inner}>
        <nav
          className={styles.nav}
          aria-label="Navegacao principal"
        >
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <Link
          href="/"
          className={styles.brand}
          aria-label="Sfruttare Brecho"
        >
          <span className={styles.brandMark}>
            sfruttare
          </span>
          <span className={styles.brandSubline}>
            brecho
          </span>
        </Link>

        <nav
          className={styles.actions}
          aria-label="Acoes da conta"
        >
          <Link href="/perfil">Perfil</Link>
          <Link href="/carrinho">Carrinho</Link>
        </nav>
      </div>
    </header>
  );
}
