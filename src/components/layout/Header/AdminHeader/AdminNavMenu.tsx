"use client";

import { useEffect, useId, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";

import styles from "./AdminNavMenu.module.css";

import {
  adminNavGroups,
  obterItemAtual,
} from "./adminNavigation";

type AdminNavMenuProps = {
  /** Rótulo do grupo com o painel aberto; `null` com todos fechados. */
  grupoAberto: string | null;
  onGrupoAbertoChange: (grupo: string | null) => void;
};

/**
 * Navegação do admin no desktop: um combo por grupo (Catálogo, Vendas,
 * Gestão), cada um um botão com o painel de telas do grupo. Padrão de
 * disclosure (botão + lista de links), não `role="menu"`: é navegação
 * entre páginas. No celular quem navega é o menu lateral
 * (`AdminNavSidebar`).
 *
 * Controlado: quem o usa decide o estado, porque o cabeçalho precisa
 * saber se há painel aberto (para não esconder ao rolar) e fechá-lo ao
 * trocar de rota.
 */
export function AdminNavMenu({
  grupoAberto,
  onGrupoAbertoChange,
}: AdminNavMenuProps) {
  const pathname = usePathname();
  const baseId = useId();
  const menuRef = useRef<HTMLDivElement>(null);
  const botoesRef = useRef<
    Record<string, HTMLButtonElement | null>
  >({});

  const itemAtual = obterItemAtual(pathname);

  useEffect(() => {
    if (grupoAberto === null) {
      return;
    }

    function handleClickFora(event: PointerEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(
          event.target as Node
        )
      ) {
        onGrupoAbertoChange(null);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        const grupo = grupoAberto;

        onGrupoAbertoChange(null);

        if (grupo !== null) {
          botoesRef.current[grupo]?.focus();
        }
      }
    }

    document.addEventListener(
      "pointerdown",
      handleClickFora
    );
    document.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      document.removeEventListener(
        "pointerdown",
        handleClickFora
      );
      document.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, [grupoAberto, onGrupoAbertoChange]);

  return (
    <div className={styles.menu} ref={menuRef}>
      {adminNavGroups.map((grupo, indice) => {
        const aberto = grupo.label === grupoAberto;
        const painelId = `${baseId}-painel-${indice}`;
        const contemAtual = grupo.items.some(
          (item) => item.href === itemAtual?.href
        );

        return (
          <div key={grupo.label} className={styles.combo}>
            <button
              ref={(botao) => {
                botoesRef.current[grupo.label] = botao;
              }}
              type="button"
              className={`${styles.botao} ${aberto ? styles.botaoAberto : ""} ${contemAtual ? styles.botaoAtual : ""}`}
              onClick={() =>
                onGrupoAbertoChange(
                  aberto ? null : grupo.label
                )
              }
              aria-expanded={aberto}
              aria-controls={painelId}
              aria-current={contemAtual ? "true" : undefined}
            >
              <span>{grupo.label}</span>

              <ChevronDown
                className={styles.seta}
                size={16}
                strokeWidth={2}
                aria-hidden="true"
              />
            </button>

            {/* Sempre montado: o painel escondido (visibility) sai da
                ordem de Tab e permite a animação de saída. */}
            <div
              id={painelId}
              className={`${styles.painel} ${aberto ? styles.painelAberto : ""}`}
            >
              <ul className={styles.lista}>
                {grupo.items.map((item) => {
                  const atual = item.href === itemAtual?.href;

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={`${styles.item} ${atual ? styles.itemAtual : ""}`}
                        aria-current={atual ? "page" : undefined}
                        onClick={() => onGrupoAbertoChange(null)}
                      >
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        );
      })}
    </div>
  );
}
