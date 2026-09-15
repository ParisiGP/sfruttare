export type FiltroPeriodo = {
  dataInicial?: string;
  dataFinal?: string;
};

export type PeriodoConvertido = {
  dataInicial?: Date;
  dataFinal?: Date;
};

/**
 * Converte datas em string (yyyy-mm-dd, vindas de um `<input type="date">`)
 * em limites de dia inteiro — início às 00:00:00, fim às 23:59:59.999 —
 * pra usar em filtros `createdAt: { gte, lte }`.
 */
export function converterPeriodo(
  filtro: FiltroPeriodo
): PeriodoConvertido {
  const resultado: PeriodoConvertido = {};

  if (filtro.dataInicial) {
    resultado.dataInicial = new Date(
      `${filtro.dataInicial}T00:00:00`
    );
  }

  if (filtro.dataFinal) {
    resultado.dataFinal = new Date(
      `${filtro.dataFinal}T23:59:59.999`
    );
  }

  return resultado;
}
