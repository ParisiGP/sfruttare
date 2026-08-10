"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import type { ProdutoDetalhePublico } from "@/modules/produto/produto.types";
import { adicionarAoCarrinho } from "@/modules/carrinho/actions";
import { useImageCarousel } from "@/hooks/useImageCarousel";
import { formatarPreco } from "@/lib/formatarPreco";
import { Button } from "@/components/ui/Button/Button";

import styles from "./ProdutoDetalhe.module.css";

type ProdutoDetalheProps = {
  produto: ProdutoDetalhePublico;
};

const statusLabel: Partial<
  Record<ProdutoDetalhePublico["status"], string>
> = {
  RESERVADO: "Reservado",
  VENDIDO: "Vendido",
};

export function ProdutoDetalhe({
  produto,
}: ProdutoDetalheProps) {
  const router = useRouter();

  const precoFormatado =
    formatarPreco(produto.preco);

  const {
    imagemAtual,
    setImagemAtual,
    proximaImagem,
    imagemAnterior,
    touchHandlers,
  } = useImageCarousel(produto.imagens.length);

  const imagemPrincipal =
    produto.imagens[imagemAtual];

  const possuiVariasImagens =
    produto.imagens.length > 1;

  const [quantidade, setQuantidade] =
    useState(1);

  const [enviando, setEnviando] =
    useState(false);

  const [mensagem, setMensagem] = useState<{
    tipo: "erro" | "sucesso";
    texto: string;
  } | null>(null);

  const disponivel =
    produto.status === "DISPONIVEL" &&
    produto.estoque > 0;

  function diminuirQuantidade() {
    setQuantidade((atual) =>
      Math.max(1, atual - 1)
    );
  }

  function aumentarQuantidade() {
    setQuantidade((atual) =>
      Math.min(produto.estoque, atual + 1)
    );
  }

  async function handleAdicionar() {
    setEnviando(true);
    setMensagem(null);

    const resultado = await adicionarAoCarrinho(
      produto.id,
      quantidade
    );

    setEnviando(false);

    if (!resultado.ok) {
      setMensagem({
        tipo: "erro",
        texto: resultado.message,
      });
      return;
    }

    setMensagem({
      tipo: "sucesso",
      texto: resultado.message,
    });

    router.refresh();
  }

  const precisaLogar =
    mensagem?.tipo === "erro" &&
    mensagem.texto
      .toLowerCase()
      .includes("logado");

  return (
    <div className={styles.wrapper}>
      <section className={styles.gallery}>
        <div
          className={styles.mainImageWrapper}
          {...touchHandlers}
        >
          {imagemPrincipal ? (
            <img
              className={styles.mainImage}
              src={imagemPrincipal.url}
              alt={produto.nome}
              style={{
                transform: `
      translate(${imagemPrincipal.offsetX}px, ${imagemPrincipal.offsetY}px)
      scale(${imagemPrincipal.zoom})
    `,
              }}
            />
          ) : (
            <div className={styles.imagePlaceholder}>
              <span>Sem imagem</span>
            </div>
          )}

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
            </>
          )}
        </div>

        {possuiVariasImagens && (
          <div className={styles.thumbnails}>
            {produto.imagens.map(
              (imagem, index) => (
                <button
                  key={imagem.id}
                  type="button"
                  className={`${styles.thumbnail} ${
                    index === imagemAtual
                      ? styles.thumbnailActive
                      : ""
                  }`}
                  onClick={() =>
                    setImagemAtual(index)
                  }
                  aria-label={`Ver imagem ${index + 1}`}
                >
                  <img
                    src={imagem.url}
                    alt=""
                    style={{
                      transform: `
      translate(${imagem.offsetX}px, ${imagem.offsetY}px)
      scale(${imagem.zoom})
    `,
                    }}
                  />
                </button>
              )
            )}
          </div>
        )}
      </section>

      <section className={styles.info}>
        <span className={styles.categoria}>
          {produto.categoria.nome}
        </span>

        <h1 className={styles.nome}>
          {produto.nome}
        </h1>

        {statusLabel[produto.status] && (
          <span className={styles.statusBadge}>
            {statusLabel[produto.status]}
          </span>
        )}

        <strong className={styles.preco}>
          {precoFormatado}
        </strong>

        {produto.descricao && (
          <p className={styles.descricao}>
            {produto.descricao}
          </p>
        )}

        <dl className={styles.detalhes}>
          {produto.marca && (
            <div>
              <dt>Marca</dt>
              <dd>{produto.marca}</dd>
            </div>
          )}

          {produto.cor && (
            <div>
              <dt>Cor</dt>
              <dd>{produto.cor}</dd>
            </div>
          )}

          {produto.tamanho && (
            <div>
              <dt>Tamanho</dt>
              <dd>{produto.tamanho}</dd>
            </div>
          )}

          {produto.referencia && (
            <div>
              <dt>Referência</dt>
              <dd>{produto.referencia}</dd>
            </div>
          )}
        </dl>

        {disponivel && (
          <div className={styles.quantidade}>
            <button
              type="button"
              onClick={diminuirQuantidade}
              disabled={quantidade <= 1}
              aria-label="Diminuir quantidade"
            >
              −
            </button>

            <span>{quantidade}</span>

            <button
              type="button"
              onClick={aumentarQuantidade}
              disabled={
                quantidade >= produto.estoque
              }
              aria-label="Aumentar quantidade"
            >
              +
            </button>
          </div>
        )}

        {mensagem && (
          <p
            className={
              mensagem.tipo === "erro"
                ? styles.error
                : styles.success
            }
          >
            {mensagem.texto}
            {precisaLogar && (
              <>
                {" "}
                <Link href="/login">Entrar</Link>
              </>
            )}
          </p>
        )}

        <Button
          type="button"
          disabled={!disponivel || enviando}
          onClick={handleAdicionar}
        >
          {!disponivel
            ? "Indisponível"
            : enviando
            ? "Adicionando..."
            : "Adicionar ao carrinho"}
        </Button>
      </section>
    </div>
  );
}
