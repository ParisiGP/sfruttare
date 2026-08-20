import type { ReactNode } from "react";

import { Ornamento } from "@/components/store/Ornamento/Ornamento";

import styles from "./PaginaInstitucional.module.css";

type PaginaInstitucionalProps = {
  titulo: string;
  children: ReactNode;
};

export function PaginaInstitucional({
  titulo,
  children,
}: PaginaInstitucionalProps) {
  return (
    <main className={styles.wrapper}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Sfruttare</p>
        <h1>{titulo}</h1>
        <Ornamento className={styles.divider} />
      </header>

      <div className={styles.conteudo}>
        {children}
      </div>
    </main>
  );
}
