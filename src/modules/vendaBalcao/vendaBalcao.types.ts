export type ProdutoBalcaoResumo = {
  id: string;
  nome: string;
  referencia: string;
  preco: number;
  cor: string;
  tamanho: string;
  imagemUrl: string | null;
  status: "DISPONIVEL" | "RESERVADO";
  reservadoPara: string | null;
};

export type DescontoTipo = "VALOR" | "PERCENTUAL";

/** As 4 formas que uma linha de pagamento pode ter. */
export type FormaPagamentoLinha =
  | "DINHEIRO"
  | "PIX"
  | "DEBITO"
  | "CREDITO";

/**
 * Tipo de leitura de `VendaBalcao.formaPagamento`: as 4 formas, ou
 * `"MISTO"` quando a venda foi dividida em mais de uma forma diferente.
 */
export type FormaPagamentoBalcao =
  | FormaPagamentoLinha
  | "MISTO";

export type PagamentoInput = {
  forma: FormaPagamentoLinha;
  valor: number;
  parcelas: number;
};

export type PagamentoBalcaoResumo = {
  /** `null` só em venda antiga sem forma registrada e sem parcelamento. */
  forma: FormaPagamentoLinha | null;
  valor: number;
  parcelas: number;
  valorComJuros: number | null;
};

export type ConfirmarVendaBalcaoInput = {
  nomeCliente: string;
  emailCliente?: string;
  telefoneCliente?: string;
  descontoTipo?: DescontoTipo;
  descontoEntrada?: number;
  pagamentos: PagamentoInput[];
  produtoIds: string[];
};

export type VendaTrocaResumo = {
  nomeCliente: string;
  total: number;
  createdAt: Date;
};

export type DevolucaoResumo = {
  id: string;
  tipo: "DEVOLUCAO" | "TROCA";
  valorDevolvido: number;
  vendaTrocaId: string | null;
  vendaTrocaResumo: VendaTrocaResumo | null;
  diferencaValor: number | null;
  motivo: string | null;
  createdAt: Date;
};

export type VendaBalcaoItemResumo = {
  id: string;
  nomeProduto: string;
  referencia: string;
  precoUnitario: number;
  devolucao: DevolucaoResumo | null;
};

export type VendaBalcaoResumo = {
  id: string;
  nomeCliente: string;
  emailCliente: string;
  telefoneCliente: string;
  parcelas: number;
  subtotal: number;
  descontoTipo: DescontoTipo | null;
  descontoEntrada: number | null;
  descontoAplicado: number | null;
  total: number;
  totalComJuros: number | null;
  formaPagamento: FormaPagamentoBalcao | null;
  /** Sempre resolvido por `obterPagamentosDaVenda` — a UI não distingue venda antiga de nova. */
  pagamentos: PagamentoBalcaoResumo[];
  itens: VendaBalcaoItemResumo[];
  createdAt: Date;
};

export type RegistrarDevolucaoInput = {
  vendaBalcaoItemId: string;
  tipo: "DEVOLUCAO" | "TROCA";
  motivo?: string;
  vendaTrocaId?: string;
};

export type VendaBalcaoCandidataResumo = {
  id: string;
  nomeCliente: string;
  total: number;
  itens: string[];
  createdAt: Date;
};

export type ClienteBalcaoResumo = {
  nomeCliente: string;
  emailCliente: string;
  telefoneCliente: string;
};

export type FiltroHistoricoBalcao = {
  dataInicial?: string;
  dataFinal?: string;
  nomeCliente?: string;
};

export type HistoricoBalcaoResultado = {
  vendas: VendaBalcaoResumo[];
  totalLiquido: number;
};
