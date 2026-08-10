import type { VitrineAbaPublica } from "@/modules/vitrineAba/vitrineAba.types";

import styles from "./ProdutoVitrineCard.module.css";

type ProdutoVitrineCardProps = {
  produto: VitrineAbaPublica["produtos"][number];
};

export function ProdutoVitrineCard({
  produto,
}: ProdutoVitrineCardProps) {
  const precoFormatado =
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(produto.preco);

  return (
    <article className={styles.card}>
      <div className={styles.imageWrapper}>
        {produto.imagemUrl ? (
          <img
            className={styles.image}
            src={produto.imagemUrl}
            alt={produto.nome}
          />
        ) : (
          <div className={styles.imagePlaceholder}>
            <span>Sem imagem</span>
          </div>
        )}
      </div>

      <div className={styles.content}>
        <span className={styles.categoria}>
          {produto.categoria.nome}
        </span>

        <h3 className={styles.nome}>{produto.nome}</h3>

        <strong className={styles.preco}>
          {precoFormatado}
        </strong>
      </div>
    </article>
  );
}
