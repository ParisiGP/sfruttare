export type ProdutoBalcaoResumo = {
  id: string;
  nome: string;
  referencia: string;
  preco: number;
  cor: string;
  tamanho: string;
  imagemUrl: string | null;
};

export type ConfirmarVendaBalcaoInput = {
  nomeCliente: string;
  emailCliente?: string;
  telefoneCliente?: string;
  parcelas: number;
  produtoIds: string[];
};

export type VendaBalcaoItemResumo = {
  id: string;
  nomeProduto: string;
  precoUnitario: number;
};

export type VendaBalcaoResumo = {
  id: string;
  nomeCliente: string;
  emailCliente: string;
  telefoneCliente: string;
  parcelas: number;
  subtotal: number;
  total: number;
  totalComJuros: number | null;
  itens: VendaBalcaoItemResumo[];
  createdAt: Date;
};
