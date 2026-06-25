"use client";

import { usePathname } from "next/navigation";

import Link from "next/link";

import styles from "./ClientHeader.module.css";

import {
  BaseHeader,
} from "../BaseHeader/BaseHeader";

const navItems = [
  {
    id: "inicio",
    href: "/",
    label: "Inicio",
  },
  {
    id: "sobre",
    href: "/sobre",
    label: "Sobre",
  },
  {
    id: "pecas",
    href: "/admin/produtos",
    label: "Pecas",
  },
  {
    id: "contato",
    href: "/contato",
    label: "Contato",
  },
];

export function ClientHeader() {

  const pathname = usePathname();
  if (pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <BaseHeader
      navLabel="Navegação principal"
      topBar="Brecho com estilo, historia e autenticidade"
      logo={
        <>
          <span
            className={styles.brandMark}
          >
            sfruttare
          </span>

          <span
            className={styles.brandSubline}
          >
            brecho
          </span>
        </>
      }
      navContent={
        <>
          {navItems.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className={styles.navLink}
            >
              {item.label}
            </Link>
          ))}
        </>
      }
      actions={
        <>
          <Link href="/perfil">
            Perfil
          </Link>

          <Link href="/carrinho">
            Carrinho
          </Link>
        </>
      }

      mobileTitle="Minha Conta"
      mobileExtra={
        <>
          <Link href="/perfil">
            Perfil
          </Link>

          <Link href="/carrinho">
            Carrinho
          </Link>
        </>
      }
    />
  );
}