"use client";

import { CategoriaCard } from "../CategoriaCard/CategoriaCard";
import styles from "./CategoriaGrid.module.css";

type CategoriaGridProps = {
  categorias: any[];
};

export function CategoriaGrid({
  categorias,
}: CategoriaGridProps) {
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