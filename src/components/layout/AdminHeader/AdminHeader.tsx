"use client";

import Link from "next/link";

import styles from "./AdminHeader.module.css";

import { useEffect, useState } from "react";

export function AdminHeader() {
  const [visible, setVisible] =
    useState(true);

  const [menuAberto, setMenuAberto] =
    useState(false);

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

  return (
    <header
      className={`${styles.header} ${visible
          ? styles.visible
          : styles.hidden
        }`}
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
          onClick={() =>
            setMenuAberto(
              (aberto) => !aberto
            )
          }
          aria-label="Abrir menu"
        >
          {menuAberto ? "✕" : "☰"}
        </button>

        <nav
          className={`${styles.nav} ${menuAberto
              ? styles.navOpen
              : ""
            }`}
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

        <div className={styles.actions}>
          <Link
            href="/"
            className={styles.storeLink}
          >
            Ver Loja
          </Link>
        </div>
      </div>
    </header>
  );
}