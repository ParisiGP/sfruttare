"use client";

import Link from "next/link";

import styles from "./Header.module.css";
import { usePathname } from "next/navigation";
import { useEffect, useState, } from "react";

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

  const pathname = usePathname();

    const [visible, setVisible] =
    useState(true);

  useEffect(() => {
    let lastScrollY =
      window.scrollY;

    const handleScroll = () => {
      const currentScrollY =
        window.scrollY;

      if (
        currentScrollY >
          lastScrollY &&
        currentScrollY > 150
      ) {
        setVisible(false);
      } else {
        setVisible(true);
      }

      lastScrollY =
        currentScrollY;
    };

    window.addEventListener(
      "scroll",
      handleScroll
    );

    return () => {
      window.removeEventListener(
        "scroll",
        handleScroll
      );
    };
  }, []);

  if (pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <header
  className={`${styles.header} ${
    visible
      ? styles.visible
      : styles.hidden
  }`}
>
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
