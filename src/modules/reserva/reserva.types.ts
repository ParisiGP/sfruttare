import type { ProdutoBalcaoResumo } from "@/modules/vendaBalcao/vendaBalcao.types";

export type CanalReserva = "BALCAO" | "SITE";

export type StatusReserva =
  | "ATIVA"
  | "CONVERTIDA"
  | "CANCELADA";

export type CriarReservaInput = {
  produtoId: string;
  nomeCliente: string;
  telefoneCliente?: string;
  canal: CanalReserva;
};

export type ReservaResumo = {
  id: string;
  produtoId: string;
  nomeProduto: string;
  referenciaProduto: string;
  /** Preço atual da peça (não é um valor congelado na reserva). */
  valorProduto: number;
  nomeCliente: string;
  telefoneCliente: string;
  canal: CanalReserva;
  status: StatusReserva;
  createdAt: Date;
};

export type FiltroReservas = {
  status?: StatusReserva;
  canal?: CanalReserva;
  dataInicial?: string;
  dataFinal?: string;
};

export type TotaisReservas = {
  ativas: number;
  /** Soma do preço das peças das reservas ativas. */
  valorReservado: number;
  convertidas: number;
  canceladas: number;
};

export type GrupoReservasCliente = {
  /** Nome normalizado — identifica o cliente. */
  chave: string;
  nomeCliente: string;
  telefoneCliente: string;
  reservas: ReservaResumo[];
  ativas: number;
  /** Só as ativas entram no valor; convertida e cancelada ficam na lista sem somar. */
  subtotalAtivas: number;
  idsAtivas: string[];
};

export type PainelReservas = {
  totais: TotaisReservas;
  grupos: GrupoReservasCliente[];
};

/**
 * O que o Balcão recebe ao abrir com `?reservas=<ids>`: só reservas
 * que ainda estavam ativas e do mesmo cliente da primeira.
 */
export type ConversaoReservas = {
  cliente: {
    nomeCliente: string;
    telefoneCliente: string;
    emailCliente: string;
  } | null;
  produtos: ProdutoBalcaoResumo[];
  /** Pedidas e que não vieram (já convertidas/canceladas, id inválido ou de outro cliente). */
  naoCarregadas: number;
};
