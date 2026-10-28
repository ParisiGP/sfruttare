import type { StatusRepasse } from "./consignacao";

export type FiltroStatusConsignados =
  | "A_REPASSAR"
  | "REPASSADO"
  | "EM_ESTOQUE"
  | "SEM_PERCENTUAL"
  | "TODOS";

export type FiltroConsignados = {
  consignante?: string;
  status?: FiltroStatusConsignados;
};

export type ConsignadoLinha = {
  id: string;
  referencia: string;
  nome: string;
  consignante: string;
  statusRepasse: StatusRepasse;
  /** Preço de tabela na venda mais recente; sem venda registrada (ou peça em estoque), o preço atual. */
  precoTabela: number;
  /** Venda mais recente da peça (Balcão sem devolução ou pedido pago); `null` = sem venda registrada. */
  dataVenda: string | null;
  percentual: number | null;
  /** A repassar/previsto (base × %) ou, se já repassado, o valor congelado pago. `null` = indefinido (sem %). */
  repasse: number | null;
  repassadoEm: string | null;
};

export type GrupoConsignante = {
  consignante: string;
  linhas: ConsignadoLinha[];
  /** Cabeçalho do grupo — contam todas as peças do consignante, não só as do filtro de status. */
  aRepassarQtd: number;
  aRepassarValor: number;
  /** A repassar e com % definido: as que "Marcar todas" alcança. */
  repassaveisQtd: number;
  repassaveisValor: number;
  repassaveisIds: string[];
};

export type TotaisConsignados = {
  aRepassarQtd: number;
  /** Só soma quem tem %: sem % o valor é indefinido, não zero. */
  aRepassarValor: number;
  repassadoQtd: number;
  repassadoValor: number;
  semPercentualQtd: number;
};

export type ResumoConsignante = {
  nome: string;
  total: number;
  semPercentual: number;
};

export type PainelConsignados = {
  totais: TotaisConsignados;
  grupos: GrupoConsignante[];
  consignantes: ResumoConsignante[];
};

export type AcaoConsignacaoResultado = {
  ok: boolean;
  message: string;
};
