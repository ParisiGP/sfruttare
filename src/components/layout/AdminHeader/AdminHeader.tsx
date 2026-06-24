"use client";

import Link from "next/link";

import styles from "./AdminHeader.module.css";

import { useEffect, useState } from "react";

export function AdminHeader() {
  const [visible, setVisible] = useState(true);
  const [menuAberto, setMenuAberto] = useState(false);

  const navItems = [
    {
      href: "/admin/produtos",
      label: "Produtos",
    },
    {
      href: "/admin/categorias",
      label: "Categorias",
    },
    {
      href: "/admin/produtos",
      label: "Pecas",
    },
    {
      href: "/admin/pedidos",
      label: "Pedidos",
    },
    {
      href: "/admin/inspiracoes",
      label: "Inspiração",
    }
  ];


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

  return (
    <>
      <header
        className={`${styles.header} ${visible ? styles.visible : styles.hidden}`}
      >
      <div className={styles.inner}>
        <div className={styles.brand}>
          <span className={styles.brandTitle}>
            sfruttare
          </span>

          <span
            className={styles.brandSubtitle}
          >
            admin
          </span>
        </div>

        <button
          type="button"
          className={styles.menuButton}
          onClick={toggleMenu}
          aria-label={menuAberto ? "Fechar menu" : "Abrir menu"}
          aria-expanded={menuAberto}
          aria-controls="admin-nav"
        >
          {menuAberto ? "" : "☰"}
        </button>

        <nav
          id="admin-nav"
          className={`${styles.nav} ${menuAberto ? styles.navOpen : ""}`}
          aria-label="Menu de administração"
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
            <Link key={item.href} href={item.href} onClick={closeMenu}>
              {item.label}
            </Link>
          ))}

          <Link href="/" className={`${styles.storeLink} ${styles.mobileStoreLink}`} onClick={closeMenu}>
            Ver Loja
          </Link>
        </nav>

        <div className={styles.actions}>
          <Link href="/" className={styles.storeLink}>
            Ver Loja
          </Link>
        </div>
      </div>
      </header>
    </>
  );
}