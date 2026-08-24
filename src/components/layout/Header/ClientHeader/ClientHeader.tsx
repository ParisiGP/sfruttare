"use client";

import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

import Image from "next/image";
import Link from "next/link";
import {
  User,
  ShoppingBag,
} from "lucide-react";

import styles from "./ClientHeader.module.css";

import {
  BaseHeader,
} from "../BaseHeader/BaseHeader";
import { ContaMenu } from "./ContaMenu";
import { BuscaOverlay } from "@/components/store/Busca/BuscaOverlay";

const navItems = [
  {
    id: "inicio",
    href: "/",
    label: "Início",
  },
  {
    id: "sobre",
    href: "/sobre",
    label: "Sobre",
  },
  {
    id: "pecas",
    href: "/pecas",
    label: "Peças",
  },
  {
    id: "contato",
    href: "/contato",
    label: "Contato",
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
      topBar={
        <span className={styles.topBarText}>
          <span
            className={styles.topBarOrnament}
            aria-hidden="true"
          >
            ✛
          </span>
          Brechó com estilo, história e autenticidade
          <span
            className={styles.topBarOrnament}
            aria-hidden="true"
          >
            ✛
          </span>
        </span>
      }
      logo={
        <Link
          href="/"
          className={styles.brandLink}
          aria-label="Sfruttare"
        >
          <Image
            src="/logo-sfruttare-completo.png"
            alt="Sfruttare"
            width={1619}
            height={971}
            priority
            className={styles.brandFull}
          />

          <Image
            src="/logo-sfruttare-medalhao.png"
            alt="Sfruttare"
            width={1536}
            height={1024}
            priority
            className={styles.brandCompact}
          />
        </Link>
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
            <Link
              href="/admin/produtos"
              className={styles.adminLink}
            >
              Admin
            </Link>
          )}

          <BuscaOverlay />

          {session?.user ? (
            <ContaMenu nome={session.user.name} />
          ) : (
            <Link
              href="/login"
              className={styles.iconButton}
              aria-label="Entrar"
            >
              <User size={20} strokeWidth={1.6} />
            </Link>
          )}

          <Link
            href="/carrinho"
            className={styles.iconButton}
            aria-label="Carrinho"
          >
            <ShoppingBag size={20} strokeWidth={1.6} />
            {quantidadeCarrinho > 0 && (
              <span className={styles.cartBadge}>
                {quantidadeCarrinho}
              </span>
            )}
          </Link>
        </>
      }

      mobileTitle={
        isAdmin ? "Administração" : undefined
      }
      mobileExtra={
        isAdmin ? (
          <Link href="/admin/produtos">
            Admin
          </Link>
        ) : undefined
      }
    />
  );
}