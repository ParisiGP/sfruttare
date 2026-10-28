/**
 * Regra de consignação num só lugar (pura, segura para o client).
 * Quem precisa saber se uma peça é consignada, ou de quem, passa por aqui:
 * BI, cadastro, importação e a tela de repasses.
 */

/**
 * "CSGeo20 - 14" → "CSGEO" · "CSGEO010/30" → "CSGEO" · "CSL&S302" → "CSL&S"
 * · "CSRI12" → "CSRI". Referência sem `CS` no começo → `null` (peça própria).
 */
export function obterConsignante(
  referencia?: string | null
): string | null {
  const ref = (referencia ?? "").trim().toUpperCase();
  const match = ref.match(/^CS[A-Z&]*/);

  return match ? match[0] : null;
}

export const ehConsignado = (
  referencia?: string | null
) => obterConsignante(referencia) !== null;

export type StatusRepasse =
  | "EM_ESTOQUE"
  | "A_REPASSAR"
  | "REPASSADO";

/**
 * Status derivado (não é guardado): vale só pra peça consignada.
 * `repassadoEm` preenchido manda; senão vendida = a repassar.
 */
export function obterStatusRepasse(produto: {
  status: string;
  repassadoEm: Date | string | null;
}): StatusRepasse {
  if (produto.repassadoEm) {
    return "REPASSADO";
  }

  return produto.status === "VENDIDO"
    ? "A_REPASSAR"
    : "EM_ESTOQUE";
}

/** 0 < % ≤ 100, com no máximo 2 casas. */
export function percentualValido(
  percentual: unknown
): percentual is number {
  if (
    typeof percentual !== "number" ||
    !Number.isFinite(percentual)
  ) {
    return false;
  }

  if (percentual <= 0 || percentual > 100) {
    return false;
  }

  return (
    Math.abs(
      percentual * 100 - Math.round(percentual * 100)
    ) < 1e-6
  );
}

/**
 * `base × % ÷ 100`, arredondado em centavos (meio centavo sobe).
 * Faz a conta sobre os centavos inteiros da base: 49,90 × 45% =
 * 22,455 vira 22,46 sem depender do ponto flutuante de 49.9 × 45.
 */
export function calcularRepasse(
  base: number,
  percentual: number
) {
  return (
    Math.round((Math.round(base * 100) * percentual) / 100) /
    100
  );
}

/**
 * % a partir do repasse em R$ e do preço (planilha de importação):
 * `repasse ÷ preço × 100` com 2 casas; a menos de 0,1 de um inteiro
 * (ruído de centavos, ex.: 40,01) vira o inteiro.
 * R$ 19,96 ÷ R$ 49,90 → 40. Inválido → `null`.
 */
export function derivarPercentual(
  repasse: number,
  preco: number
): number | null {
  if (
    !Number.isFinite(repasse) ||
    !Number.isFinite(preco) ||
    repasse <= 0 ||
    preco <= 0
  ) {
    return null;
  }

  const bruto =
    Math.round((repasse / preco) * 100 * 100) / 100;

  const inteiro = Math.round(bruto);

  const percentual =
    Math.abs(bruto - inteiro) < 0.1 ? inteiro : bruto;

  return percentualValido(percentual)
    ? percentual
    : null;
}
