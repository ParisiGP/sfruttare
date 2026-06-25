"use client";

import Link from "next/link";

import styles from "./AdminHeader.module.css";

import {
  BaseHeader,
} from "../BaseHeader/BaseHeader";

const navItems = [
  {
    id: "produtos",
    href: "/admin/produtos",
    label: "Produtos",
  },
  {
    id: "categorias",
    href: "/admin/categorias",
    label: "Categorias",
  },
  {
    id: "pecas",
    href: "/admin/pecas",
    label: "Peças",
  },
  {
    id: "pedidos",
    href: "/admin/pedidos",
    label: "Pedidos",
  },
  {
    id: "inspiracao",
    href: "/admin/inspiracoes",
    label: "Inspiração",
  },
];

export function AdminHeader() {
  return (
    <BaseHeader
      navLabel="Menu de administração"
      logo={
        <>
          <span
            className={
              styles.brandTitle
            }
          >
            sfruttare
          </span>

          <span
            className={
              styles.brandSubtitle
            }
          >
            admin
          </span>
        </>
      }
      navContent={
        <>
          {navItems.map(
            (item) => (
              <Link
                key={item.id}
                href={
                  item.href
                }
              >
                {item.label}
              </Link>
            )
          )}
        </>
      }
      actions={
        <Link
          href="/"
          className={
            styles.storeLink
          }
        >
          Ver Loja
        </Link>
      }
      mobileTitle="Loja"
      mobileExtra={
        <Link href="/">
          Ver Loja
        </Link>
      }
    />
  );
}