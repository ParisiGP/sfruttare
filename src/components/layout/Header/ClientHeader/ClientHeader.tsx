"use client";

import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

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
];

type ClientHeaderProps = {
  quantidadeCarrinho?: number;
};

export function ClientHeader({
  quantidadeCarrinho = 0,
}: ClientHeaderProps) {

  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";

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
          {isAdmin && (
            <Link href="/admin/produtos">
              Admin
            </Link>
          )}

          <Link href="/perfil">
            Perfil
          </Link>

          <Link
            href="/carrinho"
            className={styles.cartLink}
          >
            Carrinho
            {quantidadeCarrinho > 0 && (
              <span className={styles.cartBadge}>
                {quantidadeCarrinho}
              </span>
            )}
          </Link>
        </>
      }

      mobileTitle="Minha Conta"
      mobileExtra={
        <>
          {isAdmin && (
            <Link href="/admin/produtos">
              Admin
            </Link>
          )}

          <Link href="/perfil">
            Perfil
          </Link>

          <Link
            href="/carrinho"
            className={styles.cartLink}
          >
            Carrinho
            {quantidadeCarrinho > 0 && (
              <span className={styles.cartBadge}>
                {quantidadeCarrinho}
              </span>
            )}
          </Link>
        </>
      }
    />
  );
}