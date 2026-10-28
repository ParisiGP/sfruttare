export type ProdutoTipo =
  | "BRECHO"
  | "NA_ETIQUETA";

export type ProdutoStatus =
  | "DISPONIVEL"
  | "RESERVADO"
  | "VENDIDO";

export type CondicaoProduto =
  | "NOVO"
  | "SEMINOVO"
  | "USADO";

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
  condicao: CondicaoProduto | null;
  avarias: string;
  composicao: string;
  pesoGramas: number | null;
  alturaCm: number | null;
  larguraCm: number | null;
  comprimentoCm: number | null;
  categoriaId: string;
  categoria: {
    nome: string;
  };
  tipo: ProdutoTipo;
  status: ProdutoStatus;
  /** Consignação (só admin — nunca vai para a loja pública). */
  consignante: string | null;
  percentualRepasse: number | null;
  repassadoEm: string | null;
  valorRepassado: number | null;
  /** Quanto falta repassar (base da venda × %); `null` = sem % ou não se aplica. Preenchido pela página. */
  repasseAPagar?: number | null;
  imagens: ProdutoImagem[];
  createdAt: string;
  updatedAt: string;
};

export type ProdutoImagemPublica = {
  id: string;
  url: string;
  zoom: number;
  offsetX: number;
  offsetY: number;
};

export type ProdutoDetalhePublico = {
  id: string;
  nome: string;
  slug: string;
  descricao: string;
  marca: string;
  cor: string;
  tamanho: string;
  referencia: string;
  preco: number;
  estoque: number;
  status: ProdutoStatus;
  condicao: CondicaoProduto | null;
  avarias: string;
  categoria: {
    nome: string;
  };
  imagens: ProdutoImagemPublica[];
};

export type ProdutoVitrineImagem = {
  id: string;
  url: string;
  zoom: number;
  offsetX: number;
  offsetY: number;
};

export type ProdutoVitrineResumo = {
  id: string;
  nome: string;
  slug: string;
  referencia: string;
  preco: number;
  categoria: {
    nome: string;
  };
  imagens: ProdutoVitrineImagem[];
};

export type ProdutoMetrics = {
  total: number;
  disponiveis: number;
  reservados: number;
  vendidos: number;
  semEstoque: number;
  referenciasDuplicadas: number;
};

export type ProdutoReferenciaDuplicada = {
  referencia: string;
  total: number;
};

export type ProdutoListFilters = {
  busca?: string;
  categoriaId?: string;
  referencia?: string;
  status?: ProdutoStatus | "TODOS";
  tipo?: ProdutoTipo | "TODOS";
  estoque?: "TODOS" | "COM_ESTOQUE" | "SEM_ESTOQUE";
  ordem?: "vitrine" | "recentes" | "nome" | "preco" | "estoque";
  apenasReferenciasDuplicadas?: boolean;
  /** `"PROPRIOS"` = peças sem consignante; senão o valor de `Produto.consignante`. */
  consignante?: string;
};

export type ProdutoImportRowStatus =
  | "VALIDO"
  | "INVALIDO"
  | "DUPLICADO"
  | "IGNORADO";

export type ProdutoImportPreviewRow = {
  linha: number;
  referencia: string;
  descricao: string;
  modelo: string;
  peca: string;
  nome: string;
  cor: string;
  tamanho: string;
  preco: number | null;
  produtoStatus: ProdutoStatus | "";
  quantidade: number | null;
  /** Derivado da referência (`CSL&S`...); `null` = peça própria. Recalculado quando a referência é editada. */
  consignante: string | null;
  /** % de repasse da linha consignada: da coluna de % ou derivado do repasse em R$; `null` = sem %. */
  percentualRepasse: number | null;
  categoriaId: string;
  categoriaSugerida: string;
  condicao: CondicaoProduto | null;
  avarias: string;
  composicao: string;
  status: ProdutoImportRowStatus;
  mensagem: string;
};

export type ProdutoImportAdjustmentLinha = {
  linha: number;
  referencia: string;
  descricao: string;
  modelo: string;
  cor: string;
  tamanho: string;
  categoriaId: string;
  preco: number;
  status: ProdutoStatus;
  quantidade: number;
  /** Só vale em linha consignada (o servidor ignora nas demais); `null`/ausente = sem %. */
  percentualRepasse?: number | null;
};

/**
 * Linha descartada na revisão. Vai só com o número da linha, de
 * propósito: os demais campos de uma linha ruim (ex.: `preco: null`)
 * não passariam na validação e travariam a importação por causa de
 * uma peça que o admin já deixou de fora.
 */
export type ProdutoImportAdjustmentIgnorada = {
  linha: number;
  ignorada: true;
};

export type ProdutoImportAdjustment =
  | ProdutoImportAdjustmentLinha
  | ProdutoImportAdjustmentIgnorada;

export type ProdutoImportSummary = {
  total: number;
  validos: number;
  ignorados: number;
  duplicados: number;
  invalidos: number;
};

export type ProdutoImportPreview = {
  resumo: ProdutoImportSummary;
  linhas: ProdutoImportPreviewRow[];
};
