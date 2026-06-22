"use client"

import {useState, useEffect} from "react";

import { alterarStatusProdutoForm } from "@/modules/produto/actions";
import type {
  ProdutoAdminItem,
  ProdutoStatus,
} from "@/modules/produto/produto.types";

import styles from "./ProdutoCard.module.css";

type ProdutoCardProps = {
  produto: ProdutoAdminItem;
  onEditar: (produto: ProdutoAdminItem) => void;
  onExcluir: (produto: ProdutoAdminItem) => void;
};

const statusLabel: Record<ProdutoStatus, string> = {
  DISPONIVEL: "Disponivel",
  RESERVADO: "Reservado",
  VENDIDO: "Vendido",
};

export function ProdutoCard({
  produto,
  onEditar,
  onExcluir,
}: ProdutoCardProps) {
  const precoFormatado =
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(produto.preco);

  const [imagemAtual, setImagemAtual] = useState(0);

  const imagemPrincipal =
    produto.imagens[imagemAtual]?.url;

  const possuiVariasImagens = produto.imagens.length > 1;

  useEffect(() => {
  if (
    produto.imagens.length <= 1
  ) {
    return;
  }

  const interval =
    setInterval(() => {
      setImagemAtual(
        (current) =>
          current + 1 >=
          produto.imagens.length
            ? 0
            : current + 1
      );
    }, 10000);

  return () =>
    clearInterval(interval);
}, [produto.imagens.length]);
 
  return (
    <article className={styles.card}>
      {imagemPrincipal ? (
  <div
    className={styles.imageWrapper}
  >
    <img
      className={styles.image}
      src={imagemPrincipal}
      alt={produto.nome}
    />

    {possuiVariasImagens && (
      <>
        <button
          type="button"
          className={`${styles.arrow} ${styles.arrowLeft}`}
          onClick={() =>
            setImagemAtual(
              (current) =>
                current === 0
                  ? produto.imagens.length - 1
                  : current - 1
            )
          }
        >
          ‹
        </button>

        <button
          type="button"
          className={`${styles.arrow} ${styles.arrowRight}`}
          onClick={() =>
            setImagemAtual(
              (current) =>
                current + 1 >=
                produto.imagens.length
                  ? 0
                  : current + 1
            )
          }
        >
          ›
        </button>

        <div
          className={
            styles.indicators
          }
        >
          {produto.imagens.map(
            (_, index) => (
              <button
                key={index}
                type="button"
                className={`${styles.indicator} ${
                  index ===
                  imagemAtual
                    ? styles.active
                    : ""
                }`}
                onClick={() =>
                  setImagemAtual(
                    index
                  )
                }
              />
            )
          )}
        </div>
      </>
    )}
  </div>
) : (
  <div
    className={
      styles.imagePlaceholder
    }
  >
    <span>Sem imagem</span>
  </div>
)}

      <div className={styles.content}>
        <div className={styles.header}>
          <div>
            <h2 className={styles.name}>
              {produto.nome}
            </h2>

             {produto.marca && (
              <p className={styles.brand}>
                <span className={styles.brandLabel}>
                  Marca:
                </span>{" "}
                {produto.marca}
              </p>
            )}

            {produto.descricao && (
              <p className={styles.description}>
                <span className={styles.descriptionLabel}>
                  Descrição:
                </span>{" "}
                {produto.descricao}
              </p>
            )}

          </div>

          <span
            className={`${styles.status} ${styles[produto.status.toLowerCase()]
              }`}
          >
            {statusLabel[produto.status]}
          </span>
        </div>

        <dl className={styles.details}>
          <div>
            <dt>Categoria</dt>
            <dd>{produto.categoria.nome}</dd>
          </div>

          <div>
            <dt>Preço</dt>
            <dd>{precoFormatado}</dd>
          </div>

          <div>
            <dt>Estoque</dt>
            <dd>{produto.estoque}</dd>
          </div>
        </dl>

        <form
          action={alterarStatusProdutoForm}
          className={styles.statusForm}
        >
          <input
            type="hidden"
            name="id"
            value={produto.id}
          />

          <select
            name="status"
            defaultValue={produto.status}
            aria-label="Status do produto"
          >
            <option value="DISPONIVEL">
              Disponivel
            </option>
            <option value="RESERVADO">
              Reservado
            </option>
            <option value="VENDIDO">
              Vendido
            </option>
          </select>

          <button type="submit">
            Atualizar
          </button>
        </form>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.editButton}
            onClick={() =>
              onEditar(produto)
            }
          >
            Editar
          </button>

          <button
            type="button"
            className={styles.deleteButton}
            onClick={() =>
              onExcluir(produto)
            }
          >
            Excluir
          </button>
        </div>
      </div>
    </article>
  );
}
