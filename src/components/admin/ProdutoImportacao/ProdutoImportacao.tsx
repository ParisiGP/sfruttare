"use client";

import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";

import {
  confirmarImportacaoProdutos,
  preVisualizarImportacaoProdutos,
  type ProdutoImportActionState,
} from "@/modules/produto/actions";
import { obterConsignante } from "@/modules/consignacao/consignacao";
import {
  obterProblemasDaLinha,
  obterStatusVisualDaLinha,
} from "@/modules/produto/importacao.validacao";
import type {
  ProdutoImportAdjustment,
  ProdutoImportPreviewRow,
} from "@/modules/produto/produto.types";

import { Modal } from "@/components/ui/Modal/Modal";
import { Button } from "@/components/ui/Button/Button";
import { ProdutoImportacaoLinha } from "@/components/admin/ProdutoImportacaoLinha/ProdutoImportacaoLinha";

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

const MENSAGEM_TODAS_IGNORADAS =
  "Todas as linhas foram ignoradas. Restaure ao menos uma para importar.";

function comNomeAtualizado(
  row: EditableRow
): EditableRow {
  return {
    ...row,
    nome:
      row.peca ||
      [row.descricao, row.modelo]
        .filter(Boolean)
        .join(" - "),
    // Mexeu na referência: o consignante acompanha (o servidor
    // recalcula de qualquer forma).
    consignante: obterConsignante(row.referencia),
  };
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

  // Números das linhas descartadas na revisão. A linha continua na
  // tela (dá para restaurar); só sai das contas e da importação.
  const [ignoradas, setIgnoradas] =
    useState<Set<number>>(new Set());

  const [existingReferences, setExistingReferences] =
    useState<Set<string>>(new Set());

  const [loading, setLoading] =
    useState<"preview" | "confirm" | null>(null);

  const [fileName, setFileName] =
    useState("");

  const [bulkCategoriaId, setBulkCategoriaId] =
    useState("");

  const [confirmandoImportacao, setConfirmandoImportacao] =
    useState(false);

  const hasModelo =
    useMemo(
      () => rows.some((row) => row.modelo),
      [rows]
    );

  const linhasAtivas =
    useMemo(
      () =>
        rows.filter(
          (row) => !ignoradas.has(row.linha)
        ),
      [rows, ignoradas]
    );

  // Só linhas não ignoradas contam para o aviso de referência repetida.
  const duplicateReferences =
    useMemo(() => {
      const counts =
        linhasAtivas.reduce<Record<string, number>>(
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
    }, [linhasAtivas]);

  const resumo =
    useMemo(() => {
      const statuses =
        linhasAtivas.map((row) =>
          obterStatusVisualDaLinha(row, false)
        );

      return {
        total: rows.length,
        validos: statuses.filter(
          (status) => status === "VALIDO"
        ).length,
        ignorados: rows.length - linhasAtivas.length,
        duplicados: linhasAtivas.filter(
          (row) =>
            duplicateReferences.has(row.referencia) ||
            existingReferences.has(row.referencia)
        ).length,
        invalidos: statuses.filter(
          (status) => status === "INVALIDO"
        ).length,
      };
    }, [
      rows,
      linhasAtivas,
      duplicateReferences,
      existingReferences,
    ]);

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
    setIgnoradas(new Set());
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

  const atualizarLinha = useCallback(
    (
      linha: number,
      values: Partial<EditableRow>
    ) => {
      setRows((current) =>
        current.map((row) =>
          row.linha === linha
            ? comNomeAtualizado({
                ...row,
                ...values,
              })
            : row
        )
      );
    },
    []
  );

  const alternarIgnorada = useCallback(
    (linha: number) => {
      setIgnoradas((atual) => {
        const proxima = new Set(atual);

        if (proxima.has(linha)) {
          proxima.delete(linha);
        } else {
          proxima.add(linha);
        }

        return proxima;
      });

      // O aviso de "todas ignoradas" (ou de linhas com problema) perde o
      // sentido assim que o conjunto muda.
      setState((atual) =>
        atual.ok ? atual : initialState
      );
    },
    []
  );

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
      current.map((row) =>
        ignoradas.has(row.linha)
          ? row
          : {
              ...row,
              categoriaId: bulkCategoriaId,
            }
      )
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

    if (linhasAtivas.length === 0) {
      setState({
        ok: false,
        message: MENSAGEM_TODAS_IGNORADAS,
      });
      return;
    }

    const rowsWithIssues =
      linhasAtivas.filter(
        (row) =>
          obterProblemasDaLinha(row).length > 0
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

    setConfirmandoImportacao(true);
  }

  async function executarImportacao() {
    if (!formRef.current) {
      return;
    }

    setConfirmandoImportacao(false);

    const formData =
      new FormData(formRef.current);

    // A linha ignorada vai só como { linha, ignorada: true }: mandar os
    // outros campos de uma linha inválida (ex.: preço vazio) travaria a
    // importação por causa de uma peça que já foi descartada.
    const ajustes: ProdutoImportAdjustment[] =
      rows.map((row) =>
        ignoradas.has(row.linha)
          ? { linha: row.linha, ignorada: true }
          : {
              linha: row.linha,
              referencia: row.referencia,
              descricao: row.descricao,
              modelo: row.modelo,
              cor: row.cor,
              tamanho: row.tamanho,
              categoriaId: row.categoriaId,
              preco: row.preco as number,
              status:
                row.produtoStatus as Exclude<
                  EditableRow["produtoStatus"],
                  ""
                >,
              quantidade: row.quantidade as number,
              percentualRepasse: row.consignante
                ? row.percentualRepasse
                : null,
            }
      );

    formData.set(
      "ajustes",
      JSON.stringify(ajustes)
    );

    setLoading("confirm");

    const result =
      await confirmarImportacaoProdutos(formData);

    setState(result);

    // O relatório devolve as ignoradas como IGNORADO; refaz o conjunto a
    // partir dele para a tela não mostrar peça descartada como importada.
    const linhasRetornadas =
      result.preview?.linhas;

    if (linhasRetornadas) {
      setRows(linhasRetornadas);
      setIgnoradas(
        new Set(
          linhasRetornadas
            .filter(
              (linha) => linha.status === "IGNORADO"
            )
            .map((linha) => linha.linha)
        )
      );
    }

    setLoading(null);
  }

  return (
    <div
      className={styles.wrapper}
      data-sticky-na-janela
    >
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
              setIgnoradas(new Set());
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
              <h2>Pré-visualização</h2>
              <span>
                {resumo.validos} produto(s) prontos
              </span>
            </div>

            <div className={styles.tableWrap}>
              <table
                className={
                  hasModelo
                    ? `${styles.table} ${styles.tableComModelo}`
                    : styles.table
                }
              >
                <thead>
                  <tr>
                    <th>Linha</th>
                    <th>Referência</th>
                    <th>Descrição</th>
                    {hasModelo && <th>Modelo</th>}
                    <th>Cor</th>
                    <th>Tam.</th>
                    <th>Categoria</th>
                    <th>Preço</th>
                    <th>Status</th>
                    <th>Qtd.</th>
                    <th>Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <ProdutoImportacaoLinha
                      key={row.linha}
                      row={row}
                      categorias={categorias}
                      mostrarModelo={hasModelo}
                      ignorada={ignoradas.has(row.linha)}
                      referenciaRepetida={duplicateReferences.has(
                        row.referencia
                      )}
                      referenciaJaCadastrada={existingReferences.has(
                        row.referencia
                      )}
                      desabilitado={loading !== null}
                      onAtualizar={atualizarLinha}
                      onAlternarIgnorada={alternarIgnorada}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      <Modal
        aberto={confirmandoImportacao}
        onClose={() =>
          setConfirmandoImportacao(false)
        }
      >
        <div className={styles.confirmModal}>
          <h2 className={styles.confirmTitle}>
            Confirmar importação
          </h2>

          <p className={styles.confirmMessage}>
            Confirmar importação de {resumo.validos}{" "}
            produto(s)?
            {resumo.ignorados > 0 &&
              ` ${resumo.ignorados} linha(s) ignorada(s) ficará(ão) de fora.`}
          </p>

          <div className={styles.confirmActions}>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setConfirmandoImportacao(false)
              }
            >
              Cancelar
            </Button>

            <Button
              type="button"
              onClick={executarImportacao}
            >
              Confirmar importação
            </Button>
          </div>
        </div>
      </Modal>
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
