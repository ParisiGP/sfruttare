"use client";

import {
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import Link from "next/link";

import {
  confirmarImportacaoProdutos,
  preVisualizarImportacaoProdutos,
  type ProdutoImportActionState,
} from "@/modules/produto/actions";
import type {
  ProdutoImportPreviewRow,
  ProdutoStatus,
} from "@/modules/produto/produto.types";

import styles from "./ProdutoImportacao.module.css";

type Categoria = {
  id: string;
  nome: string;
};

type ProdutoImportacaoProps = {
  categorias: Categoria[];
};

type EditableRow = ProdutoImportPreviewRow;

const initialState: ProdutoImportActionState = {
  ok: false,
  message: "",
};

const statusLabels = {
  VALIDO: "Valido",
  INVALIDO: "Invalido",
  DUPLICADO: "Duplicado",
  IGNORADO: "Ignorado",
};

const produtoStatusLabels: Record<ProdutoStatus, string> = {
  DISPONIVEL: "Disponivel",
  RESERVADO: "Reservado",
  VENDIDO: "Vendido",
};

function isProdutoStatus(
  value: string
): value is ProdutoStatus {
  return (
    value === "DISPONIVEL" ||
    value === "RESERVADO" ||
    value === "VENDIDO"
  );
}

function normalizeReferenciaInput(value: string) {
  const normalized =
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "");

  if (normalized.length <= 3) {
    return normalized;
  }

  return `${normalized.slice(0, 3)}-${normalized.slice(3, 7)}`;
}

function isReferenceValid(value: string) {
  return /^[A-Z]{3}-\d{4}$/.test(value);
}

function getRowIssues(
  row: EditableRow,
  duplicateReferences: Set<string>,
  existingReferences: Set<string>
) {
  const issues: string[] = [];

  if (!isReferenceValid(row.referencia)) {
    issues.push("Referencia invalida.");
  }

  if (
    row.referencia &&
    duplicateReferences.has(row.referencia)
  ) {
    issues.push("Referencia duplicada na revisao.");
  }

  if (
    row.referencia &&
    existingReferences.has(row.referencia)
  ) {
    issues.push("Referencia ja cadastrada no banco.");
  }

  if (!row.descricao && !row.modelo) {
    issues.push("Informe descricao ou modelo.");
  }

  if (!row.categoriaId) {
    issues.push("Categoria obrigatoria.");
  }

  if (row.preco === null || row.preco <= 0) {
    issues.push("Preco invalido.");
  }

  if (
    row.quantidade === null ||
    !Number.isInteger(row.quantidade) ||
    row.quantidade < 0
  ) {
    issues.push("Quantidade invalida.");
  }

  if (!isProdutoStatus(row.produtoStatus)) {
    issues.push("Status invalido.");
  }

  return issues;
}

function getVisualStatus(
  row: EditableRow,
  duplicateReferences: Set<string>,
  existingReferences: Set<string>
) {
  const issues =
    getRowIssues(
      row,
      duplicateReferences,
      existingReferences
    );

  return issues.length > 0
    ? "INVALIDO"
    : "VALIDO";
}

export function ProdutoImportacao({
  categorias,
}: ProdutoImportacaoProps) {
  const formRef =
    useRef<HTMLFormElement>(null);

  const [state, setState] =
    useState<ProdutoImportActionState>(initialState);

  const [rows, setRows] =
    useState<EditableRow[]>([]);

  const [existingReferences, setExistingReferences] =
    useState<Set<string>>(new Set());

  const [loading, setLoading] =
    useState<"preview" | "confirm" | null>(null);

  const [fileName, setFileName] =
    useState("");

  const [bulkCategoriaId, setBulkCategoriaId] =
    useState("");

  const duplicateReferences =
    useMemo(() => {
      const counts =
        rows.reduce<Record<string, number>>(
          (acc, row) => {
            if (!row.referencia) {
              return acc;
            }

            acc[row.referencia] =
              (acc[row.referencia] ?? 0) + 1;

            return acc;
          },
          {}
        );

      return new Set(
        Object.entries(counts)
          .filter(([, total]) => total > 1)
          .map(([referencia]) => referencia)
      );
    }, [rows]);

  const resumo =
    useMemo(() => {
      const statuses =
        rows.map((row) =>
          getVisualStatus(
            row,
            duplicateReferences,
            existingReferences
          )
        );

      return {
        total: rows.length,
        validos: statuses.filter(
          (status) => status === "VALIDO"
        ).length,
        ignorados: 0,
        duplicados: rows.filter((row) =>
          duplicateReferences.has(row.referencia)
        ).length,
        invalidos: statuses.filter(
          (status) => status === "INVALIDO"
        ).length,
      };
    }, [rows, duplicateReferences, existingReferences]);

  async function handlePreview(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!formRef.current) {
      return;
    }

    setLoading("preview");
    setState(initialState);
    setRows([]);
    setExistingReferences(new Set());

    const result =
      await preVisualizarImportacaoProdutos(
        new FormData(formRef.current)
      );

    setState(result);
    const previewRows =
      result.preview?.linhas ?? [];

    setRows(previewRows);
    setExistingReferences(
      new Set(
        previewRows
          .filter(
            (row) =>
              row.status === "DUPLICADO" &&
              row.mensagem.includes("cadastrada")
          )
          .map((row) => row.referencia)
      )
    );
    setLoading(null);
  }

  function updateRow(
    linha: number,
    values: Partial<EditableRow>
  ) {
    setRows((current) =>
      current.map((row) =>
        row.linha === linha
          ? (() => {
              const updated = {
                ...row,
                ...values,
              };

              return {
                ...updated,
                nome: [
                  updated.descricao,
                  updated.modelo,
                ]
                  .filter(Boolean)
                  .join(" - "),
              };
            })()
          : row
      )
    );
  }

  function applyCategoriaToAll() {
    if (!bulkCategoriaId) {
      setState({
        ok: false,
        message:
          "Selecione uma categoria antes de aplicar para todos.",
      });
      return;
    }

    setRows((current) =>
      current.map((row) => ({
        ...row,
        categoriaId: bulkCategoriaId,
      }))
    );

    setState({
      ok: true,
      message: "Categoria aplicada aos produtos da pre-visualizacao.",
    });
  }

  async function handleConfirm() {
    if (!formRef.current || rows.length === 0) {
      return;
    }

    const rowsWithIssues =
      rows.filter(
        (row) =>
          getRowIssues(
            row,
            duplicateReferences,
            existingReferences
          ).length > 0
      );

    if (rowsWithIssues.length > 0) {
      setState({
        ok: false,
        message: `Corrija as linhas ${rowsWithIssues
          .map((row) => row.linha)
          .join(", ")} antes de importar.`,
      });
      return;
    }

    const confirmed =
      window.confirm(
        `Confirmar importacao de ${resumo.validos} produto(s)?`
      );

    if (!confirmed) {
      return;
    }

    const formData =
      new FormData(formRef.current);

    formData.set(
      "ajustes",
      JSON.stringify(
        rows.map((row) => ({
          linha: row.linha,
          referencia: row.referencia,
          descricao: row.descricao,
          modelo: row.modelo,
          cor: row.cor,
          tamanho: row.tamanho,
          categoriaId: row.categoriaId,
          preco: row.preco,
          status: row.produtoStatus,
          quantidade: row.quantidade,
        }))
      )
    );

    setLoading("confirm");

    const result =
      await confirmarImportacaoProdutos(formData);

    setState(result);
    setRows(result.preview?.linhas ?? rows);
    setLoading(null);
  }

  return (
    <div className={styles.wrapper}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>
            Catalogo
          </p>

          <h1>Importar produtos</h1>

          <p className={styles.description}>
            Envie a planilha, confira os produtos e ajuste categoria,
            preco, status e quantidade antes da importacao.
          </p>
        </div>

        <Link
          href="/admin/produtos"
          className={styles.secondaryButton}
        >
          Listar produtos
        </Link>
      </header>

      <form
        ref={formRef}
        className={styles.panel}
        onSubmit={handlePreview}
      >
        <label className={styles.uploadBox}>
          <span>Planilha .xlsx *</span>
          <input
            name="planilha"
            type="file"
            accept=".xlsx"
            required
            onChange={(event) => {
              setFileName(
                event.target.files?.[0]?.name ?? ""
              );
              setRows([]);
              setExistingReferences(new Set());
              setState(initialState);
            }}
          />
          <strong>
            {fileName || "Escolha a planilha de produtos"}
          </strong>
          <small>
            O primeiro worksheet e a primeira linha de cabecalho
            serao utilizados.
          </small>
        </label>

        <div className={styles.actions}>
          <button
            type="submit"
            disabled={loading !== null}
          >
            {loading === "preview"
              ? "Validando..."
              : "Validar planilha"}
          </button>

          <button
            type="button"
            className={styles.confirmButton}
            disabled={
              loading !== null ||
              rows.length === 0
            }
            onClick={handleConfirm}
          >
            {loading === "confirm"
              ? "Importando..."
              : "Confirmar importacao"}
          </button>
        </div>
      </form>

      {state.message && (
        <p
          className={
            state.ok ? styles.success : styles.error
          }
        >
          {state.message}
        </p>
      )}

      {rows.length === 0 && (
        <section className={styles.emptyState}>
          <strong>Nenhuma planilha validada ainda.</strong>
          <span>
            Envie o arquivo para abrir a etapa de conferencia e
            edicao rapida.
          </span>
        </section>
      )}

      {rows.length > 0 && (
        <>
          <section className={styles.metrics}>
            <Metric
              label="Linhas"
              value={resumo.total}
            />
            <Metric
              label="Validos"
              value={resumo.validos}
            />
            <Metric
              label="Ignorados"
              value={resumo.ignorados}
            />
            <Metric
              label="Duplicados"
              value={resumo.duplicados}
            />
            <Metric
              label="Invalidos"
              value={resumo.invalidos}
            />
          </section>

          <section className={styles.bulkPanel}>
            <label className={styles.field}>
              <span>Categoria para todos</span>
              <select
                value={bulkCategoriaId}
                onChange={(event) =>
                  setBulkCategoriaId(event.target.value)
                }
              >
                <option value="">
                  Selecione uma categoria
                </option>
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

            <button
              type="button"
              className={styles.secondaryButton}
              onClick={applyCategoriaToAll}
            >
              Aplicar para todos
            </button>
          </section>

          <section className={styles.tablePanel}>
            <div className={styles.tableHeader}>
              <h2>Pre-visualizacao</h2>
              <span>
                {resumo.validos} produto(s) prontos
              </span>
            </div>

            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Linha</th>
                    <th>Referencia</th>
                    <th>Descricao</th>
                    <th>Modelo</th>
                    <th>Cor</th>
                    <th>Tamanho</th>
                    <th>Categoria</th>
                    <th>Preco</th>
                    <th>Status</th>
                    <th>Qtd.</th>
                    <th>Situacao</th>
                    <th>Mensagem</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const visualStatus =
                      getVisualStatus(
                        row,
                        duplicateReferences,
                        existingReferences
                      );

                    const issues =
                      getRowIssues(
                        row,
                        duplicateReferences,
                        existingReferences
                      );

                    return (
                      <tr
                        key={row.linha}
                        className={
                          styles[
                            `row${visualStatus}`
                          ]
                        }
                        >
                        <td>{row.linha}</td>
                        <td>
                          <input
                            className={
                              !isReferenceValid(
                                row.referencia
                              ) ||
                              duplicateReferences.has(
                                row.referencia
                              ) ||
                              existingReferences.has(
                                row.referencia
                              )
                                ? styles.invalidField
                                : ""
                            }
                            type="text"
                            value={row.referencia}
                            maxLength={8}
                            onChange={(event) =>
                              updateRow(row.linha, {
                                referencia:
                                  normalizeReferenciaInput(
                                    event.target.value
                                  ),
                              })
                            }
                          />
                        </td>
                        <td>
                          <textarea
                            className={
                              !row.descricao &&
                              !row.modelo
                                ? styles.invalidField
                                : ""
                            }
                            value={row.descricao}
                            onChange={(event) =>
                              updateRow(row.linha, {
                                descricao:
                                  event.target.value,
                              })
                            }
                          />
                        </td>
                        <td>
                          <input
                            className={
                              !row.descricao &&
                              !row.modelo
                                ? styles.invalidField
                                : ""
                            }
                            type="text"
                            value={row.modelo}
                            onChange={(event) =>
                              updateRow(row.linha, {
                                modelo:
                                  event.target.value,
                              })
                            }
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={row.cor}
                            onChange={(event) =>
                              updateRow(row.linha, {
                                cor: event.target.value,
                              })
                            }
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={row.tamanho}
                            onChange={(event) =>
                              updateRow(row.linha, {
                                tamanho:
                                  event.target.value,
                              })
                            }
                          />
                        </td>
                        <td>
                          <select
                            className={
                              !row.categoriaId
                                ? styles.invalidField
                                : ""
                            }
                            value={row.categoriaId}
                            onChange={(event) =>
                              updateRow(row.linha, {
                                categoriaId:
                                  event.target.value,
                              })
                            }
                          >
                            <option value="">
                              Selecione
                            </option>
                            {categorias.map((categoria) => (
                              <option
                                key={categoria.id}
                                value={categoria.id}
                              >
                                {categoria.nome}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <input
                            className={
                              row.preco === null ||
                              row.preco <= 0
                                ? styles.invalidField
                                : ""
                            }
                            type="number"
                            min="0"
                            step="0.01"
                            value={row.preco ?? ""}
                            onChange={(event) =>
                              updateRow(row.linha, {
                                preco:
                                  event.target.value === ""
                                    ? null
                                    : Number(
                                        event.target.value
                                      ),
                              })
                            }
                          />
                        </td>
                        <td>
                          <select
                            className={
                              !isProdutoStatus(
                                row.produtoStatus
                              )
                                ? styles.invalidField
                                : ""
                            }
                            value={row.produtoStatus}
                            onChange={(event) =>
                              updateRow(row.linha, {
                                produtoStatus:
                                  event.target.value as ProdutoStatus,
                              })
                            }
                          >
                            <option value="">
                              Selecione
                            </option>
                            {Object.entries(
                              produtoStatusLabels
                            ).map(([value, label]) => (
                              <option
                                key={value}
                                value={value}
                              >
                                {label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <input
                            className={
                              row.quantidade === null ||
                              row.quantidade < 0 ||
                              !Number.isInteger(
                                row.quantidade
                              )
                                ? styles.invalidField
                                : ""
                            }
                            type="number"
                            min="0"
                            step="1"
                            value={row.quantidade ?? ""}
                            onChange={(event) =>
                              updateRow(row.linha, {
                                quantidade:
                                  event.target.value === ""
                                    ? null
                                    : Number(
                                        event.target.value
                                      ),
                              })
                            }
                          />
                        </td>
                        <td>
                          <span
                            className={`${styles.badge} ${
                              styles[
                                visualStatus.toLowerCase()
                              ]
                            }`}
                          >
                            {statusLabels[visualStatus]}
                          </span>
                        </td>
                        <td>
                          {issues.length > 0
                            ? issues.join(" ")
                            : "Produto pronto para importacao."}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function Metric({
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
