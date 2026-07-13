"use client";

import { useState } from "react";
import Link from "next/link";

import { ProdutoForm } from "@/components/forms/ProdutoForm/ProdutoForm";
import { Modal } from "@/components/ui/Modal/Modal";
import { ProdutoDeleteModal } from "@/components/admin/ProdutoDeleteModal/ProdutoDeleteModal";
import { ProdutoGrid } from "@/components/admin/ProdutoGrid/ProdutoGrid";
import { ProdutoTable } from "@/components/admin/ProdutoTable/ProdutoTable"
import { reordenarProdutos, } from "@/modules/produto/actions"
import type {
  ProdutoAdminItem,
  ProdutoListFilters,
  ProdutoMetrics,
} from "@/modules/produto/produto.types";

import styles from "./ProdutosAdmin.module.css";
import { useRouter } from "next/navigation";

type Categoria = {
  id: string;
  nome: string;
};

type ProdutosAdminProps = {
  produtos: ProdutoAdminItem[];
  categorias: Categoria[];
  metricas: ProdutoMetrics;
  filtros: Required<
    Pick<
      ProdutoListFilters,
      | "busca"
      | "categoriaId"
      | "referencia"
      | "status"
      | "tipo"
      | "estoque"
      | "ordem"
    >
  >;
  paginacao: {
    pagina: number;
    limite: number;
    total: number;
    totalPaginas: number;
  };
};

function buildPageHref(
  page: number,
  filtros: ProdutosAdminProps["filtros"]
) {
  const params =
    new URLSearchParams();

  Object.entries(filtros).forEach(([key, value]) => {
    if (
      value &&
      value !== "TODOS" &&
      value !== "vitrine"
    ) {
      params.set(key, String(value));
    }
  });

  params.set("pagina", String(page));

  return `/admin/produtos?${params.toString()}`;
}

export function ProdutosAdmin({
  produtos,
  categorias,
  metricas,
  filtros,
  paginacao,
}: ProdutosAdminProps) {
  const [modalProdutoAberto, setModalProdutoAberto] =
    useState(false);

  const [produtoEmEdicao, setProdutoEmEdicao] =
    useState<ProdutoAdminItem | null>(null);

  const [produtoParaExcluir, setProdutoParaExcluir] =
    useState<ProdutoAdminItem | null>(null);

  const [modoOrdenacao, setModoOrdenacao] = useState(false);

  const [produtosOrdenados,
    setProdutosOrdenados] =
    useState(produtos);

  const router = useRouter();

  function abrirNovoProduto() {
    setProdutoEmEdicao(null);
    setModalProdutoAberto(true);
  }

  function abrirEdicao(produto: ProdutoAdminItem) {
    setProdutoEmEdicao(produto);
    setModalProdutoAberto(true);
  }

  function fecharModalProduto() {
    setModalProdutoAberto(false);
    setProdutoEmEdicao(null);
  }

  function abrirOrdenacao() {
    setProdutosOrdenados(produtos);
    setModoOrdenacao(true);
  }

  async function salvarOrdenacao() {
    const payload =
      produtosOrdenados.map(
        (produto, index) => ({
          id: produto.id,
          ordem: index,
        })
      );

    const resultado =
      await reordenarProdutos(
        payload
      );

    if (!resultado.ok) {
      alert(
        resultado.message
      );
      return;
    }

    setModoOrdenacao(false);

    router.refresh();
  }

  return (
    <div className={styles.wrapper}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>
            Catalogo
          </p>

          <h1>Produtos</h1>

          <p className={styles.description}>
            Gerencie cadastro, imagens, estoque,
            status comercial e publicacao do
            catalogo.
          </p>
        </div>

        <div className={styles.actions}>
          {modoOrdenacao ? (
            <>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() =>
                  setModoOrdenacao(false)
                }
              >
                Cancelar
              </button>

              <button
                type="button"
                className={styles.newButton}
                onClick={
                  salvarOrdenacao
                }
              >
                Salvar ordem
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={
                  abrirOrdenacao
                }
              >
                Ordenar produtos
              </button>

              <button
                type="button"
                className={styles.newButton}
                onClick={
                  abrirNovoProduto
                }
              >
                Novo produto
              </button>
            </>
          )}
        </div>
      </header>
      {!modoOrdenacao && (
        <>
          <section className={styles.metrics}>
            <MetricCard
              label="Produtos"
              value={metricas.total}
            />
            <MetricCard
              label="Disponiveis"
              value={metricas.disponiveis}
            />
            <MetricCard
              label="Reservado"
              value={metricas.reservados}
            />
            <MetricCard
              label="Vendido"
              value={metricas.vendidos}
            />
            <MetricCard
              label="Sem estoque"
              value={metricas.semEstoque}
            />
          </section>

          <form
            className={styles.filters}
            method="GET"
          >
            <label className={styles.search}>
              <span>Busca</span>
              <input
                name="busca"
                type="search"
                placeholder="Nome, marca ou descricao"
                defaultValue={filtros.busca}
              />
            </label>

            <label>
              <span>Categoria</span>
              <select
                name="categoriaId"
                defaultValue={filtros.categoriaId}
              >
                <option value="">Todas</option>
                {categorias.map((categoria) => (
                  <option
                    key={categoria.id}
                    value={categoria.id}
                  >
                    {categoria.nome}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Referência</span>

              <input
                type="text"
                name="referencia"
                defaultValue={filtros.referencia}
                placeholder="Código da peça"
              />
            </label>

            <label>
              <span>Status</span>
              <select
                name="status"
                defaultValue={filtros.status}
              >
                <option value="TODOS">Todos</option>
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
            </label>

            <label>
              <span>Tipo</span>
              <select
                name="tipo"
                defaultValue={filtros.tipo}
              >
                <option value="TODOS">Todos</option>
                <option value="BRECHO">Brecho</option>
                <option value="NA_ETIQUETA">
                  Na etiqueta
                </option>
              </select>
            </label>

            <label>
              <span>Estoque</span>
              <select
                name="estoque"
                defaultValue={filtros.estoque}
              >
                <option value="TODOS">Todos</option>
                <option value="COM_ESTOQUE">
                  Com estoque
                </option>
                <option value="SEM_ESTOQUE">
                  Sem estoque
                </option>
              </select>
            </label>

            <label>
              <span>Ordenar</span>
              <select
                name="ordem"
                defaultValue={filtros.ordem}
              >
                <option value="vitrine">
                  Ordem da vitrine
                </option>

                <option value="recentes">
                  Mais recentes
                </option>

                <option value="nome">
                  Nome
                </option>

                <option value="preco">
                  Preço
                </option>

                <option value="estoque">
                  Estoque
                </option>
              </select>
            </label>

            <input
              type="hidden"
              name="pagina"
              value="1"
            />

            <button type="submit">
              Filtrar
            </button>
          </form>
        </>
      )}
      {modoOrdenacao ? (
        <ProdutoTable
          produtos={produtosOrdenados}
          modoOrdenacao
          onOrderChange={
            setProdutosOrdenados
          }
        />
      ) : (
        <ProdutoGrid
          produtos={produtos}
          onEditar={abrirEdicao}
          onExcluir={setProdutoParaExcluir}
        />
      )}
      <footer className={styles.pagination}>
        <span>
          {paginacao.total} produtos encontrados
        </span>

        <div className={styles.pageActions}>
          {paginacao.pagina > 1 && (
            <Link
              href={buildPageHref(
                paginacao.pagina - 1,
                filtros
              )}
            >
              Anterior
            </Link>
          )}

          <strong>
            Pagina {paginacao.pagina} de{" "}
            {paginacao.totalPaginas}
          </strong>

          {paginacao.pagina <
            paginacao.totalPaginas && (
              <Link
                href={buildPageHref(
                  paginacao.pagina + 1,
                  filtros
                )}
              >
                Proxima
              </Link>
            )}
        </div>
      </footer>

      <Modal
        aberto={modalProdutoAberto}
        onClose={fecharModalProduto}
      >
        <ProdutoForm
          key={produtoEmEdicao?.id ?? "novo-produto"}
          categorias={categorias}
          produto={produtoEmEdicao ?? undefined}
          onSaved={fecharModalProduto}
        />
      </Modal>

      <ProdutoDeleteModal
        aberto={produtoParaExcluir !== null}
        produto={produtoParaExcluir}
        onClose={() =>
          setProdutoParaExcluir(null)
        }
      />
    </div>
  );
}

function MetricCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <article className={styles.metric}>
      <strong>{value}</strong>
      <span>{label}</span>
    </article>
  );
}
