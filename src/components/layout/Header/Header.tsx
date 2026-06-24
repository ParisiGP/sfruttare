"use client";

import Link from "next/link";

import styles from "./Header.module.css";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

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
  const [visible, setVisible] = useState(true);
  const [menuAberto, setMenuAberto] = useState(false);

  useEffect(() => {
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > lastScrollY && currentScrollY > 150) {
        setVisible(false);
      } else {
        setVisible(true);
      }

      lastScrollY = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    if (menuAberto) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [menuAberto]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && menuAberto) {
        setMenuAberto(false);
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [menuAberto]);

  const closeMenu = () => {
    setMenuAberto(false);
  };

  const toggleMenu = () => {
    setMenuAberto((aberto) => !aberto);
  };

  if (pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <header
      className={`${styles.header} ${visible ? styles.visible : styles.hidden}`}
    >
      <div className={styles.topBar}>
        Brecho com estilo, historia e autenticidade
      </div>

      <div className={styles.inner}>
        <button
          type="button"
          className={styles.menuButton}
          onClick={toggleMenu}
          aria-label={menuAberto ? "Fechar menu" : "Abrir menu"}
          aria-expanded={menuAberto}
          aria-controls="mobile-nav"
        >
          {menuAberto ? "" : "☰"}
        </button>

        <nav
          id="mobile-nav"
          className={`${styles.nav} ${menuAberto ? styles.navOpen : ""}`}
          aria-label="Navegação principal"
        >
          <button
            type="button"
            className={styles.closeMenuButton}
            onClick={closeMenu}
            aria-label="Fechar menu"
          >
            ✕
          </button>

          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={closeMenu}
              aria-current={pathname === item.href ? "page" : undefined}
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
          aria-label="Ações da conta"
        >
          <Link href="/perfil">Perfil</Link>
          <Link href="/carrinho">Carrinho</Link>
        </nav>
      </div>
    </header>
  );
}
