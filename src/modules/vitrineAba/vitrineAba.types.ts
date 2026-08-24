import type { ProdutoVitrineResumo } from "@/modules/produto/produto.types";

export type VitrineAbaAdminItem = {
  id: string;
  nome: string;
  slug: string;
  ordem: number;
  ativo: boolean;
  totalProdutos: number;
};

export type VitrineAbaPublica = {
  id: string;
  nome: string;
  slug: string;
  produtos: ProdutoVitrineResumo[];
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
