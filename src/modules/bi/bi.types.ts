export type FiltroPeriodoBI = {
  dataInicial?: string;
  dataFinal?: string;
};

export type MetricasCanal = {
  faturamento: number;
  numeroVendas: number;
  ticketMedio: number;
};

export type RankingTipoPeca = {
  tipo: string;
  quantidade: number;
  faturamento: number;
};

export type ComparativoGrupo = {
  quantidade: number;
  faturamento: number;
  ticketMedio: number;
};

export type ResultadoBI = {
  geral: MetricasCanal;
  balcao: MetricasCanal;
  site: MetricasCanal;
  rankingTipos: RankingTipoPeca[];
  consignado: ComparativoGrupo;
  proprio: ComparativoGrupo;
};
