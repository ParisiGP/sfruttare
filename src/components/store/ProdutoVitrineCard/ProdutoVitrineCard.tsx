"use client";

import Link from "next/link";

import type { ProdutoVitrineResumo } from "@/modules/produto/produto.types";
import { useImageCarousel } from "@/hooks/useImageCarousel";
import { formatarPreco } from "@/lib/formatarPreco";

import styles from "./ProdutoVitrineCard.module.css";

type ProdutoVitrineCardProps = {
  produto: ProdutoVitrineResumo;
  onClick?: () => void;
};

export function ProdutoVitrineCard({
  produto,
  onClick,
}: ProdutoVitrineCardProps) {
  const precoFormatado =
    formatarPreco(produto.preco);

  const {
    imagemAtual,
    setImagemAtual,
    proximaImagem,
    imagemAnterior,
    touchHandlers,
  } = useImageCarousel(produto.imagens.length, {
    autoPlayMs: 30000,
  });

  const imagemPrincipal =
    produto.imagens[imagemAtual];

  const possuiVariasImagens =
    produto.imagens.length > 1;

  function pararPropagacao(
    event: React.MouseEvent
  ) {
    event.preventDefault();
    event.stopPropagation();
  }

  return (
    <Link
      href={`/produto/${produto.slug}`}
      className={styles.card}
      onClick={onClick}
    >
      <article>
        {imagemPrincipal ? (
          <div
            className={styles.imageWrapper}
            {...touchHandlers}
          >
            <img
              className={styles.image}
              src={imagemPrincipal.url}
              alt={produto.nome}
              style={{
                transform: `
      translate(${imagemPrincipal.offsetX}px, ${imagemPrincipal.offsetY}px)
      scale(${imagemPrincipal.zoom})
    `,
              }}
            />

            {possuiVariasImagens && (
              <>
                <button
                  type="button"
                  className={`${styles.arrow} ${styles.arrowLeft}`}
                  onClick={(event) => {
                    pararPropagacao(event);
                    imagemAnterior();
                  }}
                  aria-label="Imagem anterior"
                >
                  ‹
                </button>

                <button
                  type="button"
                  className={`${styles.arrow} ${styles.arrowRight}`}
                  onClick={(event) => {
                    pararPropagacao(event);
                    proximaImagem();
                  }}
                  aria-label="Próxima imagem"
                >
                  ›
                </button>

                <div className={styles.indicators}>
                  {produto.imagens.map(
                    (imagem, index) => (
                      <button
                        key={imagem.id}
                        type="button"
                        className={`${styles.indicator} ${
                          index === imagemAtual
                            ? styles.active
                            : ""
                        }`}
                        aria-label={`Ver imagem ${index + 1}`}
                        onClick={(event) => {
                          pararPropagacao(event);
                          setImagemAtual(index);
                        }}
                      />
                    )
                  )}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className={styles.imagePlaceholder}>
            <span>Sem imagem</span>
          </div>
        )}

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
    </Link>
  );
}
