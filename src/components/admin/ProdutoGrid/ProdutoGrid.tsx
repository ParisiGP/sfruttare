import {
  ProdutoCard,
} from "@/components/admin/ProdutoCard/ProdutoCard";
import type { ProdutoAdminItem } from "@/modules/produto/produto.types";

import styles from "./ProdutoGrid.module.css";

type ProdutoGridProps = {
  produtos: ProdutoAdminItem[];
  onEditar: (produto: ProdutoAdminItem) => void;
  onExcluir: (produto: ProdutoAdminItem) => void;
};

export function ProdutoGrid({
  produtos,
  onEditar,
  onExcluir,
}: ProdutoGridProps) {
  if (produtos.length === 0) {
    return (
      <section className={styles.empty}>
        <strong>Nenhum produto encontrado</strong>
        <span>
          Ajuste os filtros ou cadastre um novo item
          para o catalogo.
        </span>
      </section>
    );
  }

  return (
    <section className={styles.grid}>
      {produtos.map((produto) => (
        <ProdutoCard
          key={produto.id}
          produto={produto}
          onEditar={onEditar}
          onExcluir={onExcluir}
        />
      ))}
    </section>
  );
}
