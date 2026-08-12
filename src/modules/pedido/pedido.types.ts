export type PedidoStatus =
  | "PIX_PENDENTE"
  | "PAGO"
  | "ENVIADO"
  | "ENTREGUE"
  | "CANCELADO";

export type PedidoItemResumo = {
  produtoNome: string;
  quantidade: number;
  precoUnitario: number;
};

export type PedidoResumo = {
  id: string;
  status: PedidoStatus;
  frete: number;
  total: number;
  createdAt: Date;
  itens: PedidoItemResumo[];
};
