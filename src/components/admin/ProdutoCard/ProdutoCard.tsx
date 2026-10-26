"use client";

import { useRef, useState, useEffect } from "react";

import { Crop } from "lucide-react";

import { alterarStatusProdutoForm } from "@/modules/produto/actions";
import type {
  ProdutoAdminItem,
  ProdutoStatus,
} from "@/modules/produto/produto.types";
import {
  cancelarReservaDoProduto,
  criarReserva,
} from "@/modules/reserva/actions";

import { Modal } from "@/components/ui/Modal/Modal";
import { ClienteAutocomplete } from "@/components/admin/ClienteAutocomplete/ClienteAutocomplete";

import { PhotoEditor } from "@/components/admin/PhotoEditor/PhotoEditor"

import { formatarPreco } from "@/lib/formatarPreco";
import { formatarCelular } from "@/lib/telefone";

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
    formatarPreco(produto.preco);

  const [imagemAtual, setImagemAtual] =
    useState(0);

  const [editorAberto, setEditorAberto] =
    useState(false);

  const [
    statusSelecionado,
    setStatusSelecionado,
  ] = useState<ProdutoStatus>(produto.status);
  const [nomeReserva, setNomeReserva] =
    useState("");
  const [telefoneReserva, setTelefoneReserva] =
    useState("");
  const [
    confirmandoLiberar,
    setConfirmandoLiberar,
  ] = useState(false);
  const [salvandoStatus, setSalvandoStatus] =
    useState(false);
  const [erroStatus, setErroStatus] =
    useState("");

  useEffect(() => {
    setStatusSelecionado(produto.status);
  }, [produto.status]);

  const precisaConfirmarLiberacao =
    produto.status === "RESERVADO" &&
    statusSelecionado === "DISPONIVEL";

  const precisaNomeReserva =
    statusSelecionado === "RESERVADO" &&
    produto.status !== "RESERVADO";

  async function handleAtualizarStatus() {
    setErroStatus("");

    if (precisaNomeReserva) {
      if (!nomeReserva.trim()) {
        setErroStatus(
          "Informe o nome do cliente pra reservar."
        );
        return;
      }

      setSalvandoStatus(true);

      const resultado = await criarReserva({
        produtoId: produto.id,
        nomeCliente: nomeReserva.trim(),
        telefoneCliente:
          telefoneReserva.trim() || undefined,
        canal: "SITE",
      });

      setSalvandoStatus(false);

      if (!resultado.ok) {
        setErroStatus(resultado.message);
        return;
      }

      setNomeReserva("");
      setTelefoneReserva("");
      return;
    }

    if (precisaConfirmarLiberacao) {
      if (!confirmandoLiberar) {
        setConfirmandoLiberar(true);
        return;
      }

      setSalvandoStatus(true);

      const resultado =
        await cancelarReservaDoProduto(
          produto.id
        );

      setSalvandoStatus(false);
      setConfirmandoLiberar(false);

      if (!resultado.ok) {
        setErroStatus(resultado.message);
        return;
      }

      return;
    }

    setSalvandoStatus(true);

    const formData = new FormData();
    formData.append("id", produto.id);
    formData.append(
      "status",
      statusSelecionado
    );
    await alterarStatusProdutoForm(formData);

    setSalvandoStatus(false);
  }

  function handleCancelarReservaInline() {
    setStatusSelecionado(produto.status);
    setNomeReserva("");
    setTelefoneReserva("");
    setErroStatus("");
  }

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
      current + 1 >=
        produto.imagens.length
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
      touchStart.current -
      touchEnd.current;

    if (
      distance >
      minSwipeDistance
    ) {
      proximaImagem();
    }

    if (
      distance <
      -minSwipeDistance
    ) {
      imagemAnterior();
    }

    touchStart.current = null;
    touchEnd.current = null;
  }

  // A listagem do admin mostra todos os produtos de uma vez; sem isso
  // seriam centenas de timers atualizando estado de cards fora da tela.
  // O avanço automático só roda enquanto o card está visível.
  const cardRef =
    useRef<HTMLElement>(null);

  const [cardVisivel, setCardVisivel] =
    useState(false);

  const totalImagens =
    produto.imagens.length;

  useEffect(() => {
    const card = cardRef.current;

    if (!card || totalImagens <= 1) {
      return;
    }

    const observer =
      new IntersectionObserver(([entrada]) => {
        setCardVisivel(entrada.isIntersecting);
      });

    observer.observe(card);

    return () => observer.disconnect();
  }, [totalImagens]);

  useEffect(() => {
    if (!cardVisivel || totalImagens <= 1) {
      return;
    }

    const interval =
      setInterval(() => {
        setImagemAtual((current) =>
          current + 1 >= totalImagens
            ? 0
            : current + 1
        );
      }, 30000);

    return () =>
      clearInterval(interval);
  }, [cardVisivel, totalImagens]);

  return (

    <>
      <article
        ref={cardRef}
        className={styles.card}
      >
        {imagemPrincipal ? (
          <div
            className={
              styles.imageWrapper
            }
            onTouchStart={(event) => {
              touchStart.current =
                event.targetTouches[0]
                  .clientX;
            }}
            onTouchMove={(event) => {
              touchEnd.current =
                event.targetTouches[0]
                  .clientX;
            }}
            onTouchEnd={
              handleSwipe
            }
          >
            <img
              className={styles.image}
              src={imagemPrincipal.url}
              alt={produto.nome}
              loading="lazy"
              decoding="async"
              style={{
                transform: `
      translate(${imagemPrincipal.offsetX}px, ${imagemPrincipal.offsetY}px)
      scale(${imagemPrincipal.zoom})
    `,
              }}
            />
            <button
              type="button"
              className={styles.editImageButton}
              onClick={() =>
                setEditorAberto(true)
              }
            >
              <Crop size={18} />
            </button>

            {possuiVariasImagens && (
              <>
                <button
                  type="button"
                  className={`${styles.arrow} ${styles.arrowLeft}`}
                  onClick={
                    imagemAnterior
                  }
                >
                  ‹
                </button>

                <button
                  type="button"
                  className={`${styles.arrow} ${styles.arrowRight}`}
                  onClick={
                    proximaImagem
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
                    (
                      _,
                      index
                    ) => (
                      <button
                        key={
                          index
                        }
                        type="button"
                        className={`${styles.indicator} ${index ===
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
            <span>
              Sem imagem
            </span>
          </div>
        )}

        <div className={styles.content}>
          <div className={styles.header}>
            <div>
              <h2 className={styles.name}>
                {produto.nome}
              </h2>

              {produto.referencia && (
                <p className={styles.brand}>
                  <span className={styles.brandLabel}>
                    Referência:
                  </span>{" "}
                  {produto.referencia}
                </p>
              )}

              {produto.marca && (
                <p className={styles.brand}>
                  <span className={styles.brandLabel}>
                    Marca:
                  </span>{" "}
                  {produto.marca}
                </p>
              )}

              {produto.cor && (
                <p className={styles.brand}>
                  <span className={styles.brandLabel}>
                    Cor:
                  </span>{" "}
                  {produto.cor}
                </p>
              )}

              {produto.tamanho && (
                <p className={styles.brand}>
                  <span className={styles.brandLabel}>
                    Tamanho:
                  </span>{" "}
                  {produto.tamanho}
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

          <div className={styles.statusForm}>
            <select
              value={statusSelecionado}
              onChange={(event) => {
                setStatusSelecionado(
                  event.target
                    .value as ProdutoStatus
                );
                setErroStatus("");
                setConfirmandoLiberar(false);
              }}
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

            <button
              type="button"
              disabled={salvandoStatus}
              onClick={
                handleAtualizarStatus
              }
            >
              {salvandoStatus
                ? "Salvando..."
                : precisaConfirmarLiberacao &&
                  confirmandoLiberar
                ? "Confirmar"
                : "Atualizar"}
            </button>
          </div>

          {precisaNomeReserva && (
            <div
              className={
                styles.reservaInline
              }
            >
              <ClienteAutocomplete
                rotulo="Nome do cliente *"
                variante="embutida"
                value={nomeReserva}
                onChange={setNomeReserva}
                onSelecionar={(cliente) => {
                  setNomeReserva(
                    cliente.nomeCliente
                  );
                  setTelefoneReserva(
                    formatarCelular(
                      cliente.telefoneCliente
                    )
                  );
                }}
              />

              <label>
                <span>
                  Celular (opcional)
                </span>
                <input
                  type="tel"
                  placeholder="(11) 91234-5678"
                  value={telefoneReserva}
                  onChange={(event) =>
                    setTelefoneReserva(
                      formatarCelular(
                        event.target.value
                      )
                    )
                  }
                />
              </label>

              <button
                type="button"
                className={
                  styles.cancelarReservaInline
                }
                onClick={
                  handleCancelarReservaInline
                }
              >
                Cancelar
              </button>
            </div>
          )}

          {precisaConfirmarLiberacao &&
            confirmandoLiberar && (
              <p
                className={
                  styles.avisoConfirmar
                }
              >
                Clique em &ldquo;Confirmar&rdquo;
                pra liberar essa peça — a
                reserva será cancelada.
              </p>
            )}

          {erroStatus && (
            <p className={styles.erroStatus}>
              {erroStatus}
            </p>
          )}

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

      <Modal
        aberto={editorAberto}
        onClose={() =>
          setEditorAberto(false)
        }
      >
        <PhotoEditor
          imagens={produto.imagens}
          produtoNome={produto.nome}
          produtoPreco={produto.preco}
          categoriaNome={produto.categoria.nome}
          onClose={() =>
            setEditorAberto(false)
          }
          onSave={() => {
            setEditorAberto(false);
          }}
        />
      </Modal>
    </>
  );
}
