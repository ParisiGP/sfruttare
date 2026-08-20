"use client";

import { useState } from "react";

import type { VitrineAbaPublica } from "@/modules/vitrineAba/vitrineAba.types";
import { ProdutoVitrineCard } from "@/components/store/ProdutoVitrineCard/ProdutoVitrineCard";
import { Ornamento } from "@/components/store/Ornamento/Ornamento";

import styles from "./VitrineTabs.module.css";

type VitrineTabsProps = {
  abas: VitrineAbaPublica[];
};

export function VitrineTabs({
  abas,
}: VitrineTabsProps) {
  const [abaAtivaId, setAbaAtivaId] = useState(
    abas[0]?.id ?? ""
  );

  if (abas.length === 0) {
    return (
      <div className={styles.empty}>
        <p className={styles.eyebrow}>Sfruttare</p>
        <h1>Novidades a caminho</h1>
        <Ornamento className={styles.divider} />
        <p className={styles.emptyMessage}>
          Estamos preparando as próximas peças da
          vitrine. Volte em breve.
        </p>
      </div>
    );
  }

  const abaAtiva =
    abas.find((aba) => aba.id === abaAtivaId) ?? abas[0];

  return (
    <div className={styles.wrapper}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Sfruttare</p>
        <h1>Vitrine</h1>
        <Ornamento className={styles.divider} />
        <p className={styles.description}>
          Peças únicas, selecionadas com carinho para
          contar novas histórias.
        </p>
      </header>

      <nav
        className={styles.tabs}
        aria-label="Abas da vitrine"
      >
        {abas.map((aba) => (
          <button
            key={aba.id}
            type="button"
            className={`${styles.tab} ${
              aba.id === abaAtiva.id ? styles.tabAtiva : ""
            }`}
            aria-current={
              aba.id === abaAtiva.id ? "true" : undefined
            }
            onClick={() => setAbaAtivaId(aba.id)}
          >
            {aba.nome}
          </button>
        ))}
      </nav>

      <div className={styles.grid}>
        {abaAtiva.produtos.map((produto) => (
          <ProdutoVitrineCard
            key={produto.id}
            produto={produto}
          />
        ))}
      </div>
    </div>
  );
}
