"use client";

import type { ComponentProps } from "react";

import { CategoriaCard } from "../CategoriaCard/CategoriaCard";
import styles from "./CategoriaGrid.module.css";

type Categoria =
  ComponentProps<typeof CategoriaCard>["categoria"];

type CategoriaGridProps = {
  categorias: Categoria[];
};

export function CategoriaGrid({
  categorias,
}: CategoriaGridProps) {
  if (categorias.length === 0) {
    return (
      <div className={styles.empty}>
        <strong>Nenhuma categoria cadastrada</strong>
        <span>
          Crie a primeira categoria para organizar o
          catálogo.
        </span>
      </div>
    );
  }

  return (
    <div className={styles.grid}>
      {categorias.map(
        (categoria) => (
          <CategoriaCard
            key={categoria.id}
            categoria={categoria}
          />
        )
      )}
    </div>
  );
}