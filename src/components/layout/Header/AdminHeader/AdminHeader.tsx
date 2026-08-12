"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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
    id: "vitrine",
    href: "/admin/vitrine",
    label: "Vitrine",
  },
  {
    id: "categorias",
    href: "/admin/categorias",
    label: "Categorias",
  },
  {
    id: "usuarios",
    href: "/admin/usuarios",
    label: "Usuários",
  },
];

export function AdminHeader() {
  const pathname =
    usePathname();

  if (pathname === "/admin/login") {
    return null;
  }

  return (
    <BaseHeader
      navLabel="Menu de administracao"
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
                className={styles.navLink}
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
