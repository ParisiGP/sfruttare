export type CarrinhoItemResumo = {
  id: string;
  produto: {
    id: string;
    nome: string;
    slug: string;
    referencia: string;
    imagemPrincipal: {
      url: string;
      zoom: number;
      offsetX: number;
      offsetY: number;
    } | null;
    categoria: {
      nome: string;
    };
    pesoGramas: number | null;
    alturaCm: number | null;
    larguraCm: number | null;
    comprimentoCm: number | null;
  };
  precoUnitario: number;
  quantidade: number;
  subtotal: number;
  disponivel: boolean;
};

export type CarrinhoResumo = {
  itens: CarrinhoItemResumo[];
  quantidadeTotal: number;
  subtotal: number;
  frete: number | null;
  total: number;
};
