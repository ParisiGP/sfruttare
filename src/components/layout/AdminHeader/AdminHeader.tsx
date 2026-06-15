"use client";

import Link from "next/link";

import styles from "./AdminHeader.module.css";

import { useEffect, useState } from "react";

export function AdminHeader() {
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

  return (
    <header
  className={`${styles.header} ${
    visible
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

        <nav className={styles.nav}>
          <Link href="/admin/produtos">
            Produtos
          </Link>

          <Link href="/admin/categorias">
            Categorias
          </Link>

          <Link href="/admin/pedidos">
            Pedidos
          </Link>

          <Link href="/admin/inspiracoes">
            Inspiração
          </Link>
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