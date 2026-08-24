import * as XLSX from "xlsx";
import { z } from "zod";

import {
  ProdutoRepository,
  type ProdutoImportCreateData,
} from "./produto.repository";
import { CategoriaRepository } from "@/modules/categoria/categoria.repository";
import {
  alterarStatusProdutoSchema,
  editarProdutoSchema,
  produtoSchema,
  type EditarProdutoInput,
  type ProdutoInput,
} from "./produto.schema";
import type {
  CondicaoProduto,
  ProdutoImagem,
  ProdutoAdminItem,
  ProdutoDetalhePublico,
  ProdutoImportAdjustment,
  ProdutoImportPreview,
  ProdutoImportPreviewRow,
  ProdutoListFilters,
  ProdutoStatus,
  ProdutoVitrineResumo,
} from "./produto.types";

const TAMANHO_MINIMO_BUSCA = 2;
const TAMANHO_MAXIMO_REFERENCIA = 15;

type ProdutoImportavel = ProdutoImportCreateData & {
  linha: number;
};

const requiredImportColumns = [
  "referencia",
  "preco",
] as const;

const columnAliases: Record<string, string[]> = {
  referencia: ["referencia", "ref", "codigo", "codigo da peca"],
  descricao: [
    "descricao da peca",
    "descricao",
    "produto",
  ],
  descricaoTag: ["descricao tag"],
  descricaoInstagram: ["descricao instagram"],
  peca: ["peca"],
  composicao: [
    "composicao tecido",
    "composicao",
    "tecido",
  ],
  avarias: [
    "avarias sinais de uso",
    "avarias",
    "sinais de uso",
  ],
  modelo: ["modelo"],
  cor: ["cor"],
  tamanho: ["tamanho", "tam"],
  preco: [
    "preco final sfruttare",
    "preco final",
    "preco para venda",
    "preco venda",
    "preco",
    "valor",
  ],
  status: [
    "status da peca",
    "status",
    "situacao",
  ],
  quantidade: ["quantidade", "qtd", "estoque"],
  estado: [
    "estado",
    "estado da peca",
    "condicao",
    "condicao da peca",
  ],
};

const produtoImportAdjustmentSchema =
  z.object({
    linha: z.coerce.number().int().min(2),
    referencia: z
      .string()
      .trim()
      .max(TAMANHO_MAXIMO_REFERENCIA),
    descricao: z.string().trim(),
    modelo: z.string().trim(),
    cor: z.string().trim(),
    tamanho: z.string().trim(),
    categoriaId: z.string().cuid(),
    preco: z
      .number()
      .finite()
      .positive("Preco deve ser maior que zero."),
    status: z.enum([
      "DISPONIVEL",
      "RESERVADO",
      "VENDIDO",
    ]),
    quantidade: z
      .number()
      .finite()
      .int()
      .min(0, "Quantidade deve ser um inteiro maior ou igual a zero."),
  });

function normalizeText(value: unknown) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function normalizeLookup(value: unknown) {
  return normalizeText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function normalizeReferencia(value: unknown) {
  return normalizeText(value).slice(
    0,
    TAMANHO_MAXIMO_REFERENCIA
  );
}

function parsePreco(value: unknown) {
  const raw =
    String(value ?? "")
      .replace(/[^\d,.-]/g, "")
      .trim();

  if (!raw) {
    return Number.NaN;
  }

  const hasComma =
    raw.includes(",");

  const hasDot =
    raw.includes(".");

  const decimal =
    hasComma && hasDot
      ? raw.replace(/\./g, "").replace(",", ".")
      : raw.replace(",", ".");

  return Number(decimal);
}

function parseQuantidade(value: unknown) {
  const quantidade =
    Number(String(value ?? "").replace(",", "."));

  if (
    !Number.isInteger(quantidade) ||
    quantidade < 0
  ) {
    return Number.NaN;
  }

  return quantidade;
}

function parseStatus(value: unknown): ProdutoStatus | null {
  const status =
    normalizeLookup(value);

  if (
    status === "disponivel" ||
    status === "disponivel para venda" ||
    status === "a venda"
  ) {
    return "DISPONIVEL";
  }

  if (status === "reservado") {
    return "RESERVADO";
  }

  if (status === "vendido") {
    return "VENDIDO";
  }

  return null;
}

function parseCondicao(
  value: unknown
): CondicaoProduto | null {
  const texto =
    normalizeLookup(value);

  if (!texto) {
    return null;
  }

  if (
    texto.includes("c def") ||
    texto.includes("com defeito") ||
    texto.includes("defeito")
  ) {
    return "USADO";
  }

  if (
    texto.includes("seminovo") ||
    texto.includes("seminova") ||
    texto.includes("semi novo") ||
    texto.includes("semi nova")
  ) {
    return "SEMINOVO";
  }

  if (
    texto.includes("novo") ||
    texto.includes("nova")
  ) {
    return "NOVO";
  }

  if (
    texto.includes("usado") ||
    texto.includes("usada")
  ) {
    return "USADO";
  }

  return null;
}

function buildColumnIndexes(headers: unknown[]) {
  const normalizedHeaders =
    headers.map((header) => normalizeLookup(header));

  const indexes: Partial<Record<string, number>> = {};

  Object.entries(columnAliases).forEach(
    ([column, aliases]) => {
      const index =
        normalizedHeaders.findIndex((header) =>
          aliases.includes(header)
        );

      if (index >= 0) {
        indexes[column] = index;
      }
    }
  );

  return indexes;
}

function getCell(
  row: unknown[],
  indexes: Partial<Record<string, number>>,
  key: string
) {
  const index =
    indexes[key];

  if (index === undefined) {
    return "";
  }

  return row[index];
}

function buildResumo(
  linhas: ProdutoImportPreviewRow[]
) {
  return {
    total: linhas.length,
    validos: linhas.filter(
      (linha) => linha.status === "VALIDO"
    ).length,
    ignorados: linhas.filter(
      (linha) => linha.status === "IGNORADO"
    ).length,
    duplicados: linhas.filter(
      (linha) => linha.status === "DUPLICADO"
    ).length,
    invalidos: linhas.filter(
      (linha) => linha.status === "INVALIDO"
    ).length,
  };
}

export class ProdutoService {
  constructor(
    private produtoRepository =
      new ProdutoRepository(),
    private categoriaRepository =
      new CategoriaRepository()
  ) { }

  async criarProduto(data: ProdutoInput) {
    const dadosValidados =
      produtoSchema.parse(data);

    const slug =
      await this.generateUniqueSlug(
        dadosValidados.nome
      );

    return this.produtoRepository.create({
      ...dadosValidados,
      slug,
    });
  }

  async editarProduto(data: EditarProdutoInput) {
    const dadosValidados =
      editarProdutoSchema.parse(data);

    const produtoExistente =
      await this.produtoRepository.findById(
        dadosValidados.id
      );

    if (!produtoExistente) {
      throw new Error("Produto nao encontrado.");
    }

    const slug =
      await this.generateUniqueSlug(
        dadosValidados.nome,
        dadosValidados.id
      );

    const { id, ...produto } =
      dadosValidados;

    return this.produtoRepository.update(id, {
      ...produto,
      slug,
    });
  }

  async listarProdutos(
    filters: ProdutoListFilters = {}
  ) {
    return this.produtoRepository.findManyPaginated(
      filters
    );
  }

  async listarTodosProdutos() {
    return this.produtoRepository.findAll();
  }

  async buscarPublico(
    query: string,
    limite?: number
  ): Promise<ProdutoVitrineResumo[]> {
    const busca = query.trim();

    if (busca.length < TAMANHO_MINIMO_BUSCA) {
      return [];
    }

    const produtos =
      await this.produtoRepository.findPublicoPorBusca(
        busca,
        limite
      );

    return produtos.map((produto) => ({
      id: produto.id,
      nome: produto.nome,
      slug: produto.slug,
      referencia: produto.referencia ?? "",
      preco: Number(produto.preco),
      categoria: {
        nome: produto.categoria.nome,
      },
      imagens: produto.imagens.map((imagem) => ({
        id: imagem.id,
        url: imagem.url,
        zoom: imagem.zoom,
        offsetX: imagem.offsetX,
        offsetY: imagem.offsetY,
      })),
    }));
  }

  async obterDetalhePublico(
    slug: string
  ): Promise<ProdutoDetalhePublico | null> {
    const produto =
      await this.produtoRepository.findBySlugPublico(
        slug
      );

    if (!produto) {
      return null;
    }

    return {
      id: produto.id,
      nome: produto.nome,
      slug: produto.slug,
      descricao: produto.descricao ?? "",
      marca: produto.marca ?? "",
      cor: produto.cor ?? "",
      tamanho: produto.tamanho ?? "",
      referencia: produto.referencia ?? "",
      preco: Number(produto.preco),
      estoque: produto.estoque,
      status: produto.status,
      condicao: produto.condicao,
      avarias: produto.avarias ?? "",
      categoria: {
        nome: produto.categoria.nome,
      },
      imagens: produto.imagens.map((imagem) => ({
        id: imagem.id,
        url: imagem.url,
        zoom: imagem.zoom,
        offsetX: imagem.offsetX,
        offsetY: imagem.offsetY,
      })),
    };
  }

  async salvarEnquadramentoFotos(
  imagens: ProdutoImagem[]
) {
  return this.produtoRepository.salvarEnquadramentoFotos(
    imagens
  );
}

  async obterMetricas() {
    return this.produtoRepository.metrics();
  }

  async listarReferenciasDuplicadas() {
    return this.produtoRepository.findReferenciasDuplicadas();
  }

  async preVisualizarImportacao(
    file: File
  ): Promise<ProdutoImportPreview> {
    const resultado =
      await this.processarPlanilhaImportacao(
        file
      );

    return {
      resumo: buildResumo(resultado.linhas),
      linhas: resultado.linhas,
    };
  }

  async importarProdutosPorPlanilha(
    file: File,
    ajustes: ProdutoImportAdjustment[]
  ) {
    const resultado =
      await this.processarPlanilhaImportacao(
        file
      );

    const ajustesValidados =
      ajustes.map((ajuste) =>
        produtoImportAdjustmentSchema.parse(ajuste)
      );

    const linhasOriginais =
      new Set(
        resultado.linhas.map((linha) => linha.linha)
      );

    const ajustesPorLinha = new Map<
      number,
      (typeof ajustesValidados)[number] & {
        referenciaNormalizada: string;
        nome: string;
      }
    >();

    ajustesValidados.forEach((ajuste) => {
      const referenciaNormalizada =
        normalizeReferencia(ajuste.referencia);

      const descricao =
        normalizeText(ajuste.descricao);

      const modelo =
        normalizeText(ajuste.modelo);

      ajustesPorLinha.set(ajuste.linha, {
        ...ajuste,
        referenciaNormalizada,
        descricao,
        modelo,
        cor: normalizeText(ajuste.cor),
        tamanho: normalizeText(ajuste.tamanho),
        nome: [descricao, modelo]
          .filter(Boolean)
          .join(" - "),
      });
    });

    const erros =
      ajustesValidados
        .map((ajusteOriginal) => {
          const ajuste =
            ajustesPorLinha.get(ajusteOriginal.linha);

          const mensagens: string[] = [];

          if (!linhasOriginais.has(ajusteOriginal.linha)) {
            mensagens.push("linha nao encontrada na planilha");
          }

          if (!ajuste?.referenciaNormalizada) {
            mensagens.push("referencia obrigatoria");
          }

          if (!ajuste?.nome) {
            mensagens.push("descricao/modelo invalidos");
          }

          if (!ajuste?.categoriaId) {
            mensagens.push("categoria obrigatoria");
          }

          if (
            !ajuste ||
            !Number.isFinite(ajuste.preco) ||
            ajuste.preco <= 0
          ) {
            mensagens.push("preco invalido");
          }

          if (
            !ajuste ||
            !Number.isInteger(ajuste.quantidade) ||
            ajuste.quantidade < 0
          ) {
            mensagens.push("quantidade invalida");
          }

          if (
            !ajuste ||
            ![
              "DISPONIVEL",
              "RESERVADO",
              "VENDIDO",
            ].includes(ajuste.status)
          ) {
            mensagens.push("status invalido");
          }

          if (mensagens.length === 0) {
            return "";
          }

          return `Linha ${ajusteOriginal.linha}: ${mensagens.join(", ")}.`;
        })
        .filter(Boolean);

    resultado.linhas.forEach((linha) => {
      if (!ajustesPorLinha.has(linha.linha)) {
        erros.push(
          `Linha ${linha.linha}: item ausente na revisao.`
        );
      }
    });

    if (erros.length > 0) {
      throw new Error(
        `Corrija os itens antes de importar. ${erros.join(" ")}`
      );
    }

    if (ajustesValidados.length === 0) {
      throw new Error(
        "Nenhum produto valido para importar."
      );
    }

    const slugsReservados =
      new Set<string>();

    const importaveis: ProdutoImportavel[] = [];

    for (const linha of resultado.linhas) {
      const ajuste =
        ajustesPorLinha.get(linha.linha);

      if (!ajuste) {
        continue;
      }

      const slug =
        await this.generateUniqueSlug(
          ajuste.nome,
          undefined,
          slugsReservados
        );

      importaveis.push({
        linha: linha.linha,
        nome: ajuste.nome,
        slug,
        descricao: ajuste.descricao,
        marca: "",
        cor: ajuste.cor,
        referencia: ajuste.referenciaNormalizada,
        tamanho: ajuste.tamanho,
        preco: ajuste.preco,
        estoque: ajuste.quantidade,
        condicao: linha.condicao ?? undefined,
        avarias: linha.avarias || undefined,
        composicao: linha.composicao || undefined,
        categoriaId: ajuste.categoriaId,
        tipo: "BRECHO",
        status: ajuste.status,
      });
    }

    const importados =
      await this.produtoRepository.createManyImported(
        importaveis.map((produto) => ({
          nome: produto.nome,
          slug: produto.slug,
          descricao: produto.descricao,
          marca: produto.marca,
          cor: produto.cor,
          referencia: produto.referencia,
          tamanho: produto.tamanho,
          preco: produto.preco,
          estoque: produto.estoque,
          condicao: produto.condicao,
          avarias: produto.avarias,
          composicao: produto.composicao,
          categoriaId: produto.categoriaId,
          tipo: produto.tipo,
          status: produto.status,
        }))
      );

    return {
      importados,
      preview: {
        resumo: buildResumo(
          resultado.linhas.map((linha) => ({
            ...linha,
            referencia:
              ajustesPorLinha.get(linha.linha)?.referenciaNormalizada ??
              linha.referencia,
            descricao:
              ajustesPorLinha.get(linha.linha)?.descricao ??
              linha.descricao,
            modelo:
              ajustesPorLinha.get(linha.linha)?.modelo ??
              linha.modelo,
            nome:
              ajustesPorLinha.get(linha.linha)?.nome ??
              linha.nome,
            cor:
              ajustesPorLinha.get(linha.linha)?.cor ??
              linha.cor,
            tamanho:
              ajustesPorLinha.get(linha.linha)?.tamanho ??
              linha.tamanho,
            categoriaId:
              ajustesPorLinha.get(linha.linha)?.categoriaId ?? "",
            preco:
              ajustesPorLinha.get(linha.linha)?.preco ??
              linha.preco,
            produtoStatus:
              ajustesPorLinha.get(linha.linha)?.status ??
              linha.produtoStatus,
            quantidade:
              ajustesPorLinha.get(linha.linha)?.quantidade ??
              linha.quantidade,
            status: "VALIDO" as const,
            mensagem: "Produto importado com sucesso.",
          }))
        ),
        linhas: resultado.linhas.map((linha) => ({
          ...linha,
          referencia:
            ajustesPorLinha.get(linha.linha)?.referenciaNormalizada ??
            linha.referencia,
          descricao:
            ajustesPorLinha.get(linha.linha)?.descricao ??
            linha.descricao,
          modelo:
            ajustesPorLinha.get(linha.linha)?.modelo ??
            linha.modelo,
          nome:
            ajustesPorLinha.get(linha.linha)?.nome ??
            linha.nome,
          cor:
            ajustesPorLinha.get(linha.linha)?.cor ??
            linha.cor,
          tamanho:
            ajustesPorLinha.get(linha.linha)?.tamanho ??
            linha.tamanho,
          categoriaId:
            ajustesPorLinha.get(linha.linha)?.categoriaId ?? "",
          preco:
            ajustesPorLinha.get(linha.linha)?.preco ??
            linha.preco,
          produtoStatus:
            ajustesPorLinha.get(linha.linha)?.status ??
            linha.produtoStatus,
          quantidade:
            ajustesPorLinha.get(linha.linha)?.quantidade ??
            linha.quantidade,
          status: "VALIDO" as const,
          mensagem: "Produto importado com sucesso.",
        })),
      },
    };
  }

  async alterarStatusProduto(
    id: string,
    status: ProdutoStatus
  ) {
    const dadosValidados =
      alterarStatusProdutoSchema.parse({
        id,
        status,
      });

    return this.produtoRepository.updateStatus(
      dadosValidados.id,
      dadosValidados.status
    );
  }

  async atualizarEnquadramentoImagem(
    imagemId: string,
    crop: {
      zoom: number;
      offsetX: number;
      offsetY: number;
    }
  ) {
    return this.produtoRepository.updateImageCrop(
      imagemId,
      crop
    );
  }

  async excluirProduto(id: string) {
    const temPedidos =
      await this.produtoRepository.hasPedidoItens(id);

    if (temPedidos) {
      throw new Error(
        "Este produto possui pedidos vinculados. Altere o status para vendido em vez de excluir."
      );
    }

    return this.produtoRepository.delete(id);
  }

  async atualizarOrdemProdutos(
    produtos: {
      id: string;
      ordem: number;
    }[]
  ) {
    await this.produtoRepository.updateOrder(
      produtos
    );
  }

  serializeProduto(produto: {
    id: string;
    nome: string;
    slug: string;
    descricao?: string | null;
    marca?: string | null;
    cor?: string | null;
    referencia?: string | null;
    tamanho?: string | null;
    preco: unknown;
    estoque: number;
    condicao?: CondicaoProduto | null;
    avarias?: string | null;
    composicao?: string | null;
    pesoGramas?: number | null;
    alturaCm?: number | null;
    larguraCm?: number | null;
    comprimentoCm?: number | null;
    categoriaId: string;
    categoria: {
      nome: string;
    };
    tipo: "BRECHO" | "NA_ETIQUETA";
    status: "DISPONIVEL" | "RESERVADO" | "VENDIDO";
    imagens: {
      id: string;
      publicId: string;
      url: string;
      ordem: number;
      zoom: number;
      offsetX: number;
      offsetY: number;
    }[];
    createdAt: Date;
    updatedAt: Date;
  }): ProdutoAdminItem {
    return {
      id: produto.id,
      nome: produto.nome,
      slug: produto.slug,
      descricao: produto.descricao ?? "",
      marca: produto.marca ?? "",
      cor: produto.cor ?? "",
      referencia: produto.referencia ?? "",
      tamanho: produto.tamanho ?? "",
      preco: Number(produto.preco),
      estoque: produto.estoque,
      condicao: produto.condicao ?? null,
      avarias: produto.avarias ?? "",
      composicao: produto.composicao ?? "",
      pesoGramas: produto.pesoGramas ?? null,
      alturaCm: produto.alturaCm ?? null,
      larguraCm: produto.larguraCm ?? null,
      comprimentoCm: produto.comprimentoCm ?? null,
      categoriaId: produto.categoriaId,
      categoria: {
        nome: produto.categoria.nome,
      },
      tipo: produto.tipo,
      status: produto.status,
      imagens: produto.imagens.map((imagem) => ({
        id: imagem.id,
        publicId: imagem.publicId,
        url: imagem.url,
        ordem: imagem.ordem,
        zoom: imagem.zoom,
        offsetX: imagem.offsetX,
        offsetY: imagem.offsetY,
      })),
      createdAt: produto.createdAt.toISOString(),
      updatedAt: produto.updatedAt.toISOString(),
    };
  }

  private async generateUniqueSlug(
    nome: string,
    ignoreId?: string,
    reservedSlugs: Set<string> = new Set()
  ) {
    const baseSlug =
      this.slugify(nome) || "produto";

    let slug =
      baseSlug;

    let suffix =
      2;

    while (true) {
      const existing =
        await this.produtoRepository.findBySlug(slug);

      if (
        !reservedSlugs.has(slug) &&
        (!existing || existing.id === ignoreId)
      ) {
        reservedSlugs.add(slug);
        return slug;
      }

      slug = `${baseSlug}-${suffix}`;
      suffix += 1;
    }
  }

  private slugify(value: string) {
    return value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  private async processarPlanilhaImportacao(
    file: File
  ) {
    if (!file || file.size === 0) {
      throw new Error("Selecione uma planilha para importar.");
    }

    if (
      !file.name.toLowerCase().endsWith(".xlsx")
    ) {
      throw new Error("Envie uma planilha no formato .xlsx.");
    }

    const workbook =
      XLSX.read(await file.arrayBuffer(), {
        type: "array",
      });

    const sheetName =
      workbook.SheetNames[0];

    if (!sheetName) {
      throw new Error("A planilha esta vazia.");
    }

    const worksheet =
      workbook.Sheets[sheetName];

    const rows =
      XLSX.utils.sheet_to_json<unknown[]>(
        worksheet,
        {
          header: 1,
          defval: "",
          raw: false,
        }
      );

    const [headers, ...dataRows] =
      rows;

    if (!headers || headers.length === 0) {
      throw new Error(
        "A planilha precisa ter uma linha de cabecalho."
      );
    }

    const indexes =
      buildColumnIndexes(headers);

    const missingColumns =
      requiredImportColumns.filter(
        (column) => indexes[column] === undefined
      );

    if (missingColumns.length > 0) {
      throw new Error(
        `Colunas obrigatorias ausentes: ${missingColumns.join(", ")}.`
      );
    }

    const linhas: ProdutoImportPreviewRow[] = [];
    const candidatos: ProdutoImportPreviewRow[] = [];

    const categoriasExistentes =
      await this.categoriaRepository.findAll();

    const quantidadeColunaPresente =
      indexes.quantidade !== undefined;

    const statusColunaPresente =
      indexes.status !== undefined;

    dataRows.forEach((row, index) => {
      const hasContent =
        row.some((cell) => normalizeText(cell));

      if (!hasContent) {
        return;
      }

      const linha =
        index + 2;

      const referencia =
        normalizeReferencia(
          getCell(row, indexes, "referencia")
        );

      const pecaValor =
        normalizeText(
          getCell(row, indexes, "peca")
        );

      const descricaoTag =
        normalizeText(
          getCell(row, indexes, "descricaoTag")
        );

      const descricaoInstagram =
        normalizeText(
          getCell(row, indexes, "descricaoInstagram")
        );

      const descricaoAntiga =
        normalizeText(getCell(row, indexes, "descricao"));

      const descricaoBase =
        descricaoTag ||
        descricaoInstagram ||
        descricaoAntiga ||
        pecaValor;

      const modelo =
        normalizeText(getCell(row, indexes, "modelo"));

      const nome =
        pecaValor ||
        [descricaoBase, modelo]
          .filter(Boolean)
          .join(" - ");

      const cor =
        normalizeText(getCell(row, indexes, "cor"));

      const tamanho =
        normalizeText(getCell(row, indexes, "tamanho"));

      const preco =
        parsePreco(getCell(row, indexes, "preco"));

      const quantidade =
        quantidadeColunaPresente
          ? parseQuantidade(
              getCell(row, indexes, "quantidade")
            )
          : 1;

      const produtoStatus =
        statusColunaPresente
          ? parseStatus(
              getCell(row, indexes, "status")
            )
          : "DISPONIVEL";

      const condicao =
        parseCondicao(
          getCell(row, indexes, "estado")
        );

      const composicao =
        normalizeText(
          getCell(row, indexes, "composicao")
        );

      const avarias =
        normalizeText(
          getCell(row, indexes, "avarias")
        );

      const primeiraPalavraPeca =
        pecaValor.split(/\s+/)[0] ?? "";

      const categoriaCorrespondente =
        primeiraPalavraPeca
          ? categoriasExistentes.find(
              (categoria) =>
                categoria.nome.toLowerCase() ===
                primeiraPalavraPeca.toLowerCase()
            )
          : undefined;

      const erros: string[] = [];

      if (!referencia) {
        erros.push("Referência obrigatória.");
      }

      if (nome.length < 2) {
        erros.push("Descricao/modelo insuficientes para formar o nome.");
      }

      if (!Number.isFinite(preco) || preco <= 0) {
        erros.push("Preco deve ser maior que zero.");
      }

      if (!Number.isFinite(quantidade)) {
        erros.push("Quantidade deve ser um inteiro maior ou igual a zero.");
      }

      if (!produtoStatus) {
        erros.push("Status da peça inválido.");
      }

      candidatos.push({
        linha,
        referencia,
        nome,
        descricao: descricaoBase,
        modelo,
        peca: pecaValor,
        cor,
        tamanho,
        preco: Number.isFinite(preco)
          ? preco
          : null,
        produtoStatus: produtoStatus ?? "",
        quantidade: Number.isFinite(quantidade)
          ? quantidade
          : null,
        categoriaId: categoriaCorrespondente?.id ?? "",
        categoriaSugerida:
          !categoriaCorrespondente && primeiraPalavraPeca
            ? primeiraPalavraPeca
            : "",
        condicao,
        avarias,
        composicao,
        status:
          erros.length > 0 ? "INVALIDO" : "VALIDO",
        mensagem:
          erros.length > 0
            ? erros.join(" ")
            : categoriaCorrespondente
              ? "Produto pronto para importação."
              : "Preencha a categoria antes de importar.",
      });
    });

    const referencias =
      candidatos
        .map((produto) => produto.referencia)
        .filter(Boolean);

    const referenciasExistentes =
      new Set(
        await this.produtoRepository.findExistingReferences(
          referencias
        )
      );

    const referenciasVistas =
      new Set<string>();

    for (const candidato of candidatos) {
      const referenciaJaCadastrada =
        referenciasExistentes.has(
          candidato.referencia
        );

      const referenciaDuplicadaNaPlanilha =
        candidato.referencia &&
        referenciasVistas.has(candidato.referencia);

      if (candidato.referencia) {
        referenciasVistas.add(candidato.referencia);
      }

      if (referenciaJaCadastrada) {
        linhas.push({
          ...candidato,
          status: "DUPLICADO",
          mensagem:
            "Referência já cadastrada no banco. Pode ser outro tamanho da mesma peça em consignação — o produto será importado normalmente.",
        });
        continue;
      }

      if (referenciaDuplicadaNaPlanilha) {
        linhas.push({
          ...candidato,
          status: "DUPLICADO",
          mensagem:
            "Referência repetida nesta planilha. Pode ser outro tamanho da mesma peça em consignação — o produto será importado normalmente.",
        });
        continue;
      }

      linhas.push({
        ...candidato,
      });
    }

    linhas.sort((a, b) => a.linha - b.linha);

    return {
      linhas,
    };
  }
}
