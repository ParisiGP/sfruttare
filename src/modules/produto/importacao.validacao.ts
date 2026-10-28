import { percentualValido } from "@/modules/consignacao/consignacao";

import type {
  ProdutoImportPreviewRow,
  ProdutoStatus,
} from "./produto.types";

/**
 * Regras de conferência de uma linha na tela de revisão da
 * importação — funções puras, seguras para o client. O servidor
 * revalida tudo ao confirmar (`importarProdutosPorPlanilha`); aqui é
 * só o espelho que dá o retorno imediato enquanto o admin edita.
 */

export const TAMANHO_MAXIMO_REFERENCIA = 15;

export function isProdutoStatus(
  value: string
): value is ProdutoStatus {
  return (
    value === "DISPONIVEL" ||
    value === "RESERVADO" ||
    value === "VENDIDO"
  );
}

export function normalizarReferenciaDigitada(
  value: string
) {
  return value
    .trim()
    .slice(0, TAMANHO_MAXIMO_REFERENCIA);
}

export function referenciaValida(value: string) {
  return value.length <= TAMANHO_MAXIMO_REFERENCIA;
}

export function precoValido(preco: number | null) {
  return preco !== null && preco > 0;
}

export function quantidadeValida(
  quantidade: number | null
) {
  return (
    quantidade !== null &&
    Number.isInteger(quantidade) &&
    quantidade >= 0
  );
}

export function obterProblemasDaLinha(
  row: ProdutoImportPreviewRow
) {
  const problemas: string[] = [];

  if (!referenciaValida(row.referencia)) {
    problemas.push(
      `Referência muito longa (máx. ${TAMANHO_MAXIMO_REFERENCIA} caracteres).`
    );
  }

  if (!row.descricao && !row.modelo) {
    problemas.push("Informe descrição ou modelo.");
  }

  if (!row.categoriaId) {
    problemas.push("Categoria obrigatória.");
  }

  if (!precoValido(row.preco)) {
    problemas.push("Preço inválido.");
  }

  if (!quantidadeValida(row.quantidade)) {
    problemas.push("Quantidade inválida.");
  }

  if (!isProdutoStatus(row.produtoStatus)) {
    problemas.push("Status inválido.");
  }

  // % de repasse vazio é permitido (aviso); preenchido, tem que ser válido.
  if (
    row.consignante &&
    row.percentualRepasse !== null &&
    !percentualValido(row.percentualRepasse)
  ) {
    problemas.push(
      "% de repasse deve ser maior que 0 e até 100."
    );
  }

  return problemas;
}

export type StatusVisualLinha =
  | "VALIDO"
  | "INVALIDO"
  | "IGNORADO";

/**
 * Linha ignorada sai de todas as contas: não vale como válida nem
 * como inválida, então uma linha ruim descartada não bloqueia a
 * importação.
 */
export function obterStatusVisualDaLinha(
  row: ProdutoImportPreviewRow,
  ignorada: boolean
): StatusVisualLinha {
  if (ignorada) {
    return "IGNORADO";
  }

  return obterProblemasDaLinha(row).length > 0
    ? "INVALIDO"
    : "VALIDO";
}

export function obterAvisosDaLinha(
  row: ProdutoImportPreviewRow,
  referencia: {
    repetidaNaPlanilha: boolean;
    jaCadastrada: boolean;
  }
) {
  const avisos: string[] = [];

  if (row.referencia && referencia.repetidaNaPlanilha) {
    avisos.push("Referência já usada nesta planilha.");
  }

  if (row.referencia && referencia.jaCadastrada) {
    avisos.push("Referência já cadastrada no banco.");
  }

  if (row.consignante && row.percentualRepasse === null) {
    avisos.push(
      "Consignado sem % de repasse — defina depois."
    );
  }

  if (row.categoriaSugerida) {
    avisos.push(
      `Sugestão de categoria: "${row.categoriaSugerida}" (não cadastrada).`
    );
  }

  return avisos;
}
