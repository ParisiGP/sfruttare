"use client";

import { useId } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import styles from "./AdminNavSidebar.module.css";

import {
  adminNavGroups,
  obterItemAtual,
} from "./adminNavigation";

/**
 * Navegação do admin no celular: o conteúdo do menu lateral do
 * hambúrguer, com as mesmas três seções do desktop. O `HeaderSidebar`
 * fecha o menu ao clicar em qualquer link.
 */
export function AdminNavSidebar() {
  const pathname = usePathname();
  const baseId = useId();

  const itemAtual = obterItemAtual(pathname);

  return (
    <>
      {adminNavGroups.map((grupo, indice) => {
        const rotuloId = `${baseId}-secao-${indice}`;

        return (
          <section
            key={grupo.label}
            className={styles.secao}
            aria-labelledby={rotuloId}
          >
            <p id={rotuloId} className={styles.rotulo}>
              {grupo.label}
            </p>

            <ul className={styles.lista}>
              {grupo.items.map((item) => {
                const atual = item.href === itemAtual?.href;

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`${styles.link} ${atual ? styles.linkAtual : ""}`}
                      aria-current={atual ? "page" : undefined}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </>
  );
}
