import { memo } from "react";

import { percentualValido } from "@/modules/consignacao/consignacao";
import {
  isProdutoStatus,
  normalizarReferenciaDigitada,
  obterAvisosDaLinha,
  obterProblemasDaLinha,
  obterStatusVisualDaLinha,
  precoValido,
  quantidadeValida,
  referenciaValida,
  TAMANHO_MAXIMO_REFERENCIA,
  type StatusVisualLinha,
} from "@/modules/produto/importacao.validacao";
import type {
  ProdutoImportPreviewRow,
  ProdutoStatus,
} from "@/modules/produto/produto.types";

import styles from "./ProdutoImportacaoLinha.module.css";

type Categoria = {
  id: string;
  nome: string;
};

type ProdutoImportacaoLinhaProps = {
  row: ProdutoImportPreviewRow;
  categorias: Categoria[];
  mostrarModelo: boolean;
  ignorada: boolean;
  referenciaRepetida: boolean;
  referenciaJaCadastrada: boolean;
  /** Enquanto uma pré-visualização/importação roda, nada é editável. */
  desabilitado: boolean;
  onAtualizar: (
    linha: number,
    valores: Partial<ProdutoImportPreviewRow>
  ) => void;
  onAlternarIgnorada: (linha: number) => void;
};

const statusLabels: Record<StatusVisualLinha, string> = {
  VALIDO: "Válido",
  INVALIDO: "Inválido",
  IGNORADO: "Ignorado",
};

const produtoStatusLabels: Record<ProdutoStatus, string> =
  {
    DISPONIVEL: "Disponível",
    RESERVADO: "Reservado",
    VENDIDO: "Vendido",
  };

const classeDoStatus: Record<StatusVisualLinha, string> =
  {
    VALIDO: styles.valido,
    INVALIDO: styles.invalido,
    IGNORADO: styles.ignorado,
  };

const classeDaLinha: Record<StatusVisualLinha, string> =
  {
    VALIDO: styles.linhaValido,
    INVALIDO: styles.linhaInvalido,
    IGNORADO: styles.linhaIgnorado,
  };

/**
 * Uma linha da revisão da importação. É sempre um `<tr>`: o layout de
 * tabela e o de cartão (telas estreitas) são alternados só por CSS,
 * por container query, em `ProdutoImportacao.module.css` — por isso as
 * células carregam `data-col` (posição no cartão) e `data-label`
 * (rótulo mostrado no cartão). Os campos e as regras são os mesmos nas
 * duas apresentações.
 */
function ProdutoImportacaoLinhaBase({
  row,
  categorias,
  mostrarModelo,
  ignorada,
  referenciaRepetida,
  referenciaJaCadastrada,
  desabilitado,
  onAtualizar,
  onAlternarIgnorada,
}: ProdutoImportacaoLinhaProps) {
  const status = obterStatusVisualDaLinha(
    row,
    ignorada
  );

  const problemas = ignorada
    ? []
    : obterProblemasDaLinha(row);

  const avisos = ignorada
    ? []
    : obterAvisosDaLinha(row, {
        repetidaNaPlanilha: referenciaRepetida,
        jaCadastrada: referenciaJaCadastrada,
      });

  const mensagem = ignorada
    ? {
        texto: "Linha ignorada — não será importada.",
        classe: styles.mensagemNeutra,
      }
    : problemas.length > 0
      ? {
          texto: problemas.join(" "),
          classe: styles.mensagemErro,
        }
      : avisos.length > 0
        ? {
            texto: avisos.join(" "),
            classe: styles.mensagemAviso,
          }
        : null;

  const semDescricaoNemModelo =
    !row.descricao && !row.modelo;

  return (
    <tr
      className={`${styles.linha} ${classeDaLinha[status]}`}
    >
      <td data-col="linha" data-label="Linha">
        <div className={styles.linhaTopo}>
          <span className={styles.numero}>
            <span data-somente="cartao">Linha </span>
            {row.linha}
          </span>

          <span
            className={`${styles.badge} ${classeDoStatus[status]}`}
          >
            {statusLabels[status]}
          </span>

          <BotaoIgnorar
            linha={row.linha}
            ignorada={ignorada}
            desabilitado={desabilitado}
            onAlternar={onAlternarIgnorada}
            somente="cartao"
          />
        </div>
      </td>

      <td data-col="referencia" data-label="Referência">
        <input
          className={
            !referenciaValida(row.referencia)
              ? styles.campoInvalido
              : referenciaRepetida ||
                  referenciaJaCadastrada
                ? styles.campoAviso
                : ""
          }
          type="text"
          value={row.referencia}
          maxLength={TAMANHO_MAXIMO_REFERENCIA}
          disabled={ignorada}
          onChange={(event) =>
            onAtualizar(row.linha, {
              referencia: normalizarReferenciaDigitada(
                event.target.value
              ),
            })
          }
        />

        {row.consignante && (
          <div className={styles.consignacao}>
            <span className={styles.etiquetaConsignado}>
              Consignado · {row.consignante}
            </span>

            <label className={styles.percentualRepasse}>
              <span>% repasse</span>
              <input
                className={
                  row.percentualRepasse === null
                    ? styles.campoAviso
                    : !percentualValido(
                          row.percentualRepasse
                        )
                      ? styles.campoInvalido
                      : ""
                }
                type="number"
                min="0"
                max="100"
                step="0.01"
                inputMode="decimal"
                placeholder="Ex.: 40"
                value={row.percentualRepasse ?? ""}
                disabled={ignorada}
                onChange={(event) =>
                  onAtualizar(row.linha, {
                    percentualRepasse:
                      event.target.value === ""
                        ? null
                        : Number(event.target.value),
                  })
                }
              />
            </label>

            {row.percentualRepasse === null &&
              !ignorada && (
                <small
                  className={styles.categoriaSugerida}
                >
                  sem % — defina depois
                </small>
              )}
          </div>
        )}
      </td>

      <td data-col="descricao" data-label="Descrição">
        <textarea
          className={
            semDescricaoNemModelo
              ? styles.campoInvalido
              : ""
          }
          value={row.descricao}
          disabled={ignorada}
          onChange={(event) =>
            onAtualizar(row.linha, {
              descricao: event.target.value,
            })
          }
        />

        {mensagem && (
          <small
            className={`${styles.mensagem} ${mensagem.classe}`}
          >
            {mensagem.texto}
          </small>
        )}
      </td>

      {mostrarModelo && (
        <td data-col="modelo" data-label="Modelo">
          <input
            className={
              semDescricaoNemModelo
                ? styles.campoInvalido
                : ""
            }
            type="text"
            value={row.modelo}
            disabled={ignorada}
            onChange={(event) =>
              onAtualizar(row.linha, {
                modelo: event.target.value,
              })
            }
          />
        </td>
      )}

      <td data-col="cor" data-label="Cor">
        <input
          type="text"
          value={row.cor}
          disabled={ignorada}
          onChange={(event) =>
            onAtualizar(row.linha, {
              cor: event.target.value,
            })
          }
        />
      </td>

      <td data-col="tamanho" data-label="Tam.">
        <input
          type="text"
          value={row.tamanho}
          disabled={ignorada}
          onChange={(event) =>
            onAtualizar(row.linha, {
              tamanho: event.target.value,
            })
          }
        />
      </td>

      <td data-col="categoria" data-label="Categoria">
        <select
          className={
            !row.categoriaId ? styles.campoAviso : ""
          }
          value={row.categoriaId}
          disabled={ignorada}
          onChange={(event) =>
            onAtualizar(row.linha, {
              categoriaId: event.target.value,
            })
          }
        >
          <option value="">Selecione</option>
          {categorias.map((categoria) => (
            <option
              key={categoria.id}
              value={categoria.id}
            >
              {categoria.nome}
            </option>
          ))}
        </select>

        {row.categoriaSugerida &&
          !row.categoriaId &&
          !ignorada && (
            <small className={styles.categoriaSugerida}>
              Sugestão: &ldquo;{row.categoriaSugerida}
              &rdquo; (nova categoria)
            </small>
          )}
      </td>

      <td data-col="preco" data-label="Preço">
        <input
          className={
            !precoValido(row.preco)
              ? styles.campoInvalido
              : ""
          }
          type="number"
          min="0"
          step="0.01"
          inputMode="decimal"
          value={row.preco ?? ""}
          disabled={ignorada}
          onChange={(event) =>
            onAtualizar(row.linha, {
              preco:
                event.target.value === ""
                  ? null
                  : Number(event.target.value),
            })
          }
        />
      </td>

      <td data-col="status" data-label="Status">
        <select
          className={
            !isProdutoStatus(row.produtoStatus)
              ? styles.campoInvalido
              : ""
          }
          value={row.produtoStatus}
          disabled={ignorada}
          onChange={(event) =>
            onAtualizar(row.linha, {
              produtoStatus: event.target
                .value as ProdutoStatus,
            })
          }
        >
          <option value="">Selecione</option>
          {Object.entries(produtoStatusLabels).map(
            ([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            )
          )}
        </select>
      </td>

      <td data-col="quantidade" data-label="Qtd.">
        <input
          className={
            !quantidadeValida(row.quantidade)
              ? styles.campoInvalido
              : ""
          }
          type="number"
          min="0"
          step="1"
          inputMode="numeric"
          value={row.quantidade ?? ""}
          disabled={ignorada}
          onChange={(event) =>
            onAtualizar(row.linha, {
              quantidade:
                event.target.value === ""
                  ? null
                  : Number(event.target.value),
            })
          }
        />
      </td>

      <td data-col="acao" data-label="Ação">
        <BotaoIgnorar
          linha={row.linha}
          ignorada={ignorada}
          desabilitado={desabilitado}
          onAlternar={onAlternarIgnorada}
          somente="tabela"
        />
      </td>
    </tr>
  );
}

/**
 * O botão aparece uma vez em cada apresentação — no topo do cartão ou
 * na coluna "Ação" da tabela. Qual das duas fica visível é decidido
 * pelo CSS (`data-somente`), não por JS.
 */
function BotaoIgnorar({
  linha,
  ignorada,
  desabilitado,
  onAlternar,
  somente,
}: {
  linha: number;
  ignorada: boolean;
  desabilitado: boolean;
  onAlternar: (linha: number) => void;
  somente: "cartao" | "tabela";
}) {
  return (
    <button
      type="button"
      data-somente={somente}
      className={styles.botaoIgnorar}
      disabled={desabilitado}
      aria-label={`${
        ignorada ? "Restaurar" : "Ignorar"
      } linha ${linha}`}
      onClick={() => onAlternar(linha)}
    >
      {ignorada ? "Restaurar" : "Ignorar"}
    </button>
  );
}

// A tabela tem ~155 linhas e cada tecla redesenharia todas; com memo só
// a linha editada é renderizada de novo (o pai passa `row` estável e
// só booleanos, nunca os Sets inteiros).
export const ProdutoImportacaoLinha = memo(
  ProdutoImportacaoLinhaBase
);
