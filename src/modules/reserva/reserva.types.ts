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
