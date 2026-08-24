"use client";

import { useEffect, useRef, useState } from "react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { User } from "lucide-react";

import styles from "./ContaMenu.module.css";

type ContaMenuProps = {
  nome?: string | null;
};

export function ContaMenu({
  nome,
}: ContaMenuProps) {
  const [aberto, setAberto] = useState(false);
  const [saindo, setSaindo] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!aberto) {
      return;
    }

    function handleClickFora(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(
          event.target as Node
        )
      ) {
        setAberto(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setAberto(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleClickFora
    );
    document.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickFora
      );
      document.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, [aberto]);

  async function handleSair() {
    setSaindo(true);
    await signOut({ callbackUrl: "/" });
  }

  const inicial = nome
    ?.trim()
    .charAt(0)
    .toUpperCase();

  return (
    <div
      className={styles.wrapper}
      ref={wrapperRef}
    >
      <button
        type="button"
        className={styles.avatarButton}
        onClick={() => setAberto((v) => !v)}
        aria-label="Minha conta"
        aria-expanded={aberto}
        aria-haspopup="menu"
      >
        {inicial ? (
          <span className={styles.avatar}>
            {inicial}
          </span>
        ) : (
          <User size={20} strokeWidth={1.6} />
        )}
      </button>

      {aberto && (
        <div
          className={styles.menu}
          role="menu"
        >
          <Link
            href="/perfil"
            role="menuitem"
            className={styles.menuItem}
            onClick={() => setAberto(false)}
          >
            Perfil
          </Link>

          <button
            type="button"
            role="menuitem"
            className={styles.menuItem}
            onClick={handleSair}
            disabled={saindo}
          >
            {saindo ? "Saindo..." : "Sair"}
          </button>
        </div>
      )}
    </div>
  );
}
