export type ProdutoBalcaoResumo = {
  id: string;
  nome: string;
  referencia: string;
  preco: number;
  cor: string;
  tamanho: string;
  imagemUrl: string | null;
};

export type DescontoTipo = "VALOR" | "PERCENTUAL";

export type ConfirmarVendaBalcaoInput = {
  nomeCliente: string;
  emailCliente?: string;
  telefoneCliente?: string;
  descontoTipo?: DescontoTipo;
  descontoEntrada?: number;
  parcelas: number;
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
