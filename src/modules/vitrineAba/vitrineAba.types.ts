export type VitrineAbaAdminItem = {
  id: string;
  nome: string;
  slug: string;
  ordem: number;
  ativo: boolean;
  totalProdutos: number;
};

export type VitrineAbaProdutoResumo = {
  id: string;
  nome: string;
  slug: string;
  referencia: string;
  preco: number;
  categoria: {
    nome: string;
  };
  imagemUrl: string | null;
};

export type VitrineAbaPublica = {
  id: string;
  nome: string;
  slug: string;
  produtos: VitrineAbaProdutoResumo[];
};

export type VitrineAbaProdutoSelecionavel = {
  id: string;
  nome: string;
  referencia: string;
  categoria: {
    nome: string;
  };
  selecionado: boolean;
};
