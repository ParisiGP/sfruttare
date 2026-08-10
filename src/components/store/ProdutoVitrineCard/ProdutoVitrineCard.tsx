"use client";

import { useEffect, useRef, useState } from "react";

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

  const [imagemAtual, setImagemAtual] =
    useState(0);

  const touchStart =
    useRef<number | null>(null);

  const touchEnd =
    useRef<number | null>(null);

  const minSwipeDistance = 50;

  const imagemPrincipal =
    produto.imagens[imagemAtual];

  const possuiVariasImagens =
    produto.imagens.length > 1;

  function proximaImagem() {
    setImagemAtual((current) =>
      current + 1 >= produto.imagens.length
        ? 0
        : current + 1
    );
  }

  function imagemAnterior() {
    setImagemAtual((current) =>
      current === 0
        ? produto.imagens.length - 1
        : current - 1
    );
  }

  function handleSwipe() {
    if (
      touchStart.current === null ||
      touchEnd.current === null
    ) {
      return;
    }

    const distance =
      touchStart.current - touchEnd.current;

    if (distance > minSwipeDistance) {
      proximaImagem();
    }

    if (distance < -minSwipeDistance) {
      imagemAnterior();
    }

    touchStart.current = null;
    touchEnd.current = null;
  }

  useEffect(() => {
    if (produto.imagens.length <= 1) {
      return;
    }

    const interval = setInterval(() => {
      proximaImagem();
    }, 30000);

    return () => clearInterval(interval);
  }, [produto.imagens.length]);

  return (
    <article className={styles.card}>
      {imagemPrincipal ? (
        <div
          className={styles.imageWrapper}
          onTouchStart={(event) => {
            touchStart.current =
              event.targetTouches[0].clientX;
          }}
          onTouchMove={(event) => {
            touchEnd.current =
              event.targetTouches[0].clientX;
          }}
          onTouchEnd={handleSwipe}
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
                onClick={imagemAnterior}
                aria-label="Imagem anterior"
              >
                ‹
              </button>

              <button
                type="button"
                className={`${styles.arrow} ${styles.arrowRight}`}
                onClick={proximaImagem}
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
                      onClick={() =>
                        setImagemAtual(index)
                      }
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
  );
}
