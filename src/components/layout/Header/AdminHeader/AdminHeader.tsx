"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Store } from "lucide-react";

import styles from "./AdminHeader.module.css";

import {
  BaseHeader,
} from "../BaseHeader/BaseHeader";
import { AdminNavMenu } from "./AdminNavMenu";
import { AdminNavSidebar } from "./AdminNavSidebar";

export function AdminHeader() {
  const pathname =
    usePathname();

  const [grupoAberto, setGrupoAberto] =
    useState<string | null>(null);
  const [pathnameDoNav, setPathnameDoNav] =
    useState(pathname);

  // O header está no layout e não remonta na navegação do Next: sem isso
  // o painel continuaria aberto depois de trocar de rota.
  if (pathname !== pathnameDoNav) {
    setPathnameDoNav(pathname);
    setGrupoAberto(null);
  }

  if (pathname === "/admin/login") {
    return null;
  }

  return (
    <BaseHeader
      navLabel="Menu de administração"
      keepVisible={grupoAberto !== null}
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
        <AdminNavMenu
          grupoAberto={grupoAberto}
          onGrupoAbertoChange={setGrupoAberto}
        />
      }
      mobileNavContent={<AdminNavSidebar />}
      actions={
        <Link
          href="/"
          className={
            styles.storeLink
          }
          aria-label="Ver loja"
        >
          <Store
            className={styles.storeIcon}
            size={20}
            strokeWidth={1.6}
            aria-hidden="true"
          />

          <span
            className={
              styles.storeText
            }
          >
            Ver Loja
          </span>
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
