export type ProdutoTipo =
  | "BRECHO"
  | "NA_ETIQUETA";

export type ProdutoStatus =
  | "DISPONIVEL"
  | "RESERVADO"
  | "VENDIDO";

export type ProdutoImagemInput = {
  url: string;
  publicId: string;
  ordem: number;
};

export type ProdutoImagem = {
  id: string;
  url: string;
  publicId: string;
  ordem: number;

  zoom: number;
  offsetX: number;
  offsetY: number;
};

export type ProdutoAdminItem = {
  id: string;
  nome: string;
  slug: string;
  descricao: string;
  marca: string;
  cor: string;
  referencia: string;
  tamanho: string;
  preco: number;
  estoque: number;
  categoriaId: string;
  categoria: {
    nome: string;
  };
  tipo: ProdutoTipo;
  status: ProdutoStatus;
  imagens: ProdutoImagem[];
  createdAt: string;
  updatedAt: string;
};

export type ProdutoMetrics = {
  total: number;
  disponiveis: number;
  reservados: number;
  vendidos: number;
  semEstoque: number;
};

export type ProdutoListFilters = {
  busca?: string;
  categoriaId?: string;
  status?: ProdutoStatus | "TODOS";
  tipo?: ProdutoTipo | "TODOS";
  estoque?: "TODOS" | "COM_ESTOQUE" | "SEM_ESTOQUE";
  ordem?: "vitrine" | "recentes" | "nome" | "preco" | "estoque";
  pagina?: number;
  limite?: number;
};
