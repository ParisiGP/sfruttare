"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import type { CarrinhoResumo } from "@/modules/carrinho/carrinho.types";
import {
  atualizarQuantidadeCarrinho,
  removerDoCarrinho,
} from "@/modules/carrinho/actions";
import { formatarPreco } from "@/lib/formatarPreco";

import styles from "./Carrinho.module.css";

type CarrinhoProps = {
  resumo: CarrinhoResumo;
};

export function Carrinho({
  resumo,
}: CarrinhoProps) {
  const router = useRouter();

  const [itemEmAtualizacao, setItemEmAtualizacao] =
    useState<string | null>(null);

  const [erros, setErros] = useState<
    Record<string, string>
  >({});

  async function alterarQuantidade(
    itemId: string,
    quantidade: number
  ) {
    if (quantidade < 1) {
      return;
    }

    setItemEmAtualizacao(itemId);
    setErros((atual) => ({
      ...atual,
      [itemId]: "",
    }));

    const resultado =
      await atualizarQuantidadeCarrinho(
        itemId,
        quantidade
      );

    setItemEmAtualizacao(null);

    if (!resultado.ok) {
      setErros((atual) => ({
        ...atual,
        [itemId]: resultado.message,
      }));
      return;
    }

    router.refresh();
  }

  async function remover(itemId: string) {
    setItemEmAtualizacao(itemId);

    const resultado = await removerDoCarrinho(
      itemId
    );

    setItemEmAtualizacao(null);

    if (!resultado.ok) {
      setErros((atual) => ({
        ...atual,
        [itemId]: resultado.message,
      }));
      return;
    }

    router.refresh();
  }

  if (resumo.itens.length === 0) {
    return (
      <div className={styles.empty}>
        <h1>Seu carrinho está vazio</h1>

        <p>
          Explore a vitrine e encontre a
          próxima peça.
        </p>

        <Link
          href="/"
          className={styles.emptyCta}
        >
          Voltar à vitrine
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>
          Minha conta
        </p>

        <h1>Carrinho</h1>
      </header>

      <div className={styles.layout}>
        <ul className={styles.lista}>
          {resumo.itens.map((item) => (
            <li
              key={item.id}
              className={styles.item}
            >
              <div className={styles.itemImagem}>
                {item.produto.imagemPrincipal ? (
                  <img
                    src={
                      item.produto
                        .imagemPrincipal.url
                    }
                    alt={item.produto.nome}
                    style={{
                      transform: `
      translate(${item.produto.imagemPrincipal.offsetX}px, ${item.produto.imagemPrincipal.offsetY}px)
      scale(${item.produto.imagemPrincipal.zoom})
    `,
                    }}
                  />
                ) : (
                  <div
                    className={
                      styles.itemImagemPlaceholder
                    }
                  >
                    <span>Sem imagem</span>
                  </div>
                )}
              </div>

              <div className={styles.itemInfo}>
                <span
                  className={
                    styles.itemCategoria
                  }
                >
                  {item.produto.categoria.nome}
                </span>

                <Link
                  href={`/produto/${item.produto.slug}`}
                  className={styles.itemNome}
                >
                  {item.produto.nome}
                </Link>

                {item.produto.referencia && (
                  <span
                    className={
                      styles.itemReferencia
                    }
                  >
                    {item.produto.referencia}
                  </span>
                )}

                <strong
                  className={styles.itemPreco}
                >
                  {formatarPreco(
                    item.precoUnitario
                  )}
                </strong>

                {!item.disponivel && (
                  <p
                    className={
                      styles.itemAviso
                    }
                  >
                    Esse item não está mais
                    disponível na quantidade
                    selecionada.
                  </p>
                )}

                {erros[item.id] && (
                  <p
                    className={
                      styles.itemErro
                    }
                  >
                    {erros[item.id]}
                  </p>
                )}
              </div>

              <div className={styles.itemAcoes}>
                <div
                  className={
                    styles.quantidade
                  }
                >
                  <button
                    type="button"
                    onClick={() =>
                      alterarQuantidade(
                        item.id,
                        item.quantidade - 1
                      )
                    }
                    disabled={
                      itemEmAtualizacao ===
                        item.id ||
                      item.quantidade <= 1
                    }
                    aria-label="Diminuir quantidade"
                  >
                    −
                  </button>

                  <span>{item.quantidade}</span>

                  <button
                    type="button"
                    onClick={() =>
                      alterarQuantidade(
                        item.id,
                        item.quantidade + 1
                      )
                    }
                    disabled={
                      itemEmAtualizacao ===
                      item.id
                    }
                    aria-label="Aumentar quantidade"
                  >
                    +
                  </button>
                </div>

                <strong
                  className={
                    styles.itemSubtotal
                  }
                >
                  {formatarPreco(item.subtotal)}
                </strong>

                <button
                  type="button"
                  className={
                    styles.removerButton
                  }
                  onClick={() =>
                    remover(item.id)
                  }
                  disabled={
                    itemEmAtualizacao ===
                    item.id
                  }
                >
                  Remover
                </button>
              </div>
            </li>
          ))}
        </ul>

        <aside className={styles.resumo}>
          <h2>Resumo</h2>

          <div className={styles.resumoLinha}>
            <span>
              {resumo.quantidadeTotal} item(ns)
            </span>

            <span>
              {formatarPreco(resumo.subtotal)}
            </span>
          </div>

          <div className={styles.resumoLinha}>
            <span>Frete</span>
            <span>A calcular no checkout</span>
          </div>

          <div className={styles.resumoTotal}>
            <span>Total</span>

            <strong>
              {formatarPreco(resumo.total)}
            </strong>
          </div>

          <Link
            href="/checkout"
            className={
              styles.finalizarButton
            }
          >
            Finalizar compra
          </Link>
        </aside>
      </div>
    </div>
  );
}
