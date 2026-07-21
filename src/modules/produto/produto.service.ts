import * as XLSX from "xlsx";
import { z } from "zod";

import {
  ProdutoRepository,
  type ProdutoImportCreateData,
} from "./produto.repository";
import {
  alterarStatusProdutoSchema,
  editarProdutoSchema,
  produtoSchema,
  type EditarProdutoInput,
  type ProdutoInput,
} from "./produto.schema";
import type {
  ProdutoImagem,
  ProdutoAdminItem,
  ProdutoImportAdjustment,
  ProdutoImportPreview,
  ProdutoImportPreviewRow,
  ProdutoListFilters,
  ProdutoStatus,
} from "./produto.types";

type ProdutoImportavel = ProdutoImportCreateData & {
  linha: number;
};

const requiredImportColumns = [
  "referencia",
  "descricao",
  "modelo",
  "cor",
  "tamanho",
  "preco",
  "status",
  "quantidade",
] as const;

const columnAliases: Record<string, string[]> = {
  referencia: ["referencia", "ref", "codigo", "codigo da peca"],
  descricao: [
    "descricao da peca",
    "descricao",
    "peca",
    "produto",
  ],
  modelo: ["modelo"],
  cor: ["cor"],
  tamanho: ["tamanho", "tam"],
  preco: [
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
    referencia: z.string().trim(),
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
  const normalized =
    normalizeText(value)
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "");

  if (!/^[A-Z]{3}\d{4}$/.test(normalized)) {
    return "";
  }

  return `${normalized.slice(0, 3)}-${normalized.slice(3)}`;
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
      new ProdutoRepository()
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

    const referenciasEditadas =
      Array.from(ajustesPorLinha.values())
        .map((ajuste) => ajuste.referenciaNormalizada)
        .filter(Boolean);

    const referenciasExistentes =
      new Set(
        await this.produtoRepository.findExistingReferences(
          referenciasEditadas
        )
      );

    const totalPorReferencia =
      referenciasEditadas.reduce<Record<string, number>>(
        (acc, referencia) => {
          acc[referencia] =
            (acc[referencia] ?? 0) + 1;

          return acc;
        },
        {}
      );

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
            mensagens.push("referencia invalida");
          }

          if (
            ajuste?.referenciaNormalizada &&
            referenciasExistentes.has(
              ajuste.referenciaNormalizada
            )
          ) {
            mensagens.push("referencia ja cadastrada no banco");
          }

          if (
            ajuste?.referenciaNormalizada &&
            totalPorReferencia[
              ajuste.referenciaNormalizada
            ] > 1
          ) {
            mensagens.push("referencia duplicada na revisao");
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

      const descricaoBase =
        normalizeText(getCell(row, indexes, "descricao"));

      const modelo =
        normalizeText(getCell(row, indexes, "modelo"));

      const nome =
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
        parseQuantidade(
          getCell(row, indexes, "quantidade")
        );

      const produtoStatus =
        parseStatus(getCell(row, indexes, "status"));

      const estado =
        normalizeText(getCell(row, indexes, "estado"));

      const erros: string[] = [];

      if (!referencia) {
        erros.push("Referencia invalida.");
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
        erros.push("Status da peca invalido.");
      }

      const descricao =
        estado
          ? `${descricaoBase}\n\nEstado da peca:\n${estado}`
          : descricaoBase;

      candidatos.push({
        linha,
        referencia,
        nome,
        descricao,
        modelo,
        cor,
        tamanho,
        preco: Number.isFinite(preco)
          ? preco
          : null,
        produtoStatus: produtoStatus ?? "",
        quantidade: Number.isFinite(quantidade)
          ? quantidade
          : null,
        categoriaId: "",
        status:
          erros.length > 0 ? "INVALIDO" : "VALIDO",
        mensagem:
          erros.length > 0
            ? erros.join(" ")
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
      if (referenciasExistentes.has(candidato.referencia)) {
        linhas.push({
          ...candidato,
          status: "DUPLICADO",
          mensagem:
            "Produto duplicado: referencia ja cadastrada.",
        });
        continue;
      }

      if (
        candidato.referencia &&
        referenciasVistas.has(candidato.referencia)
      ) {
        linhas.push({
          ...candidato,
          status: "DUPLICADO",
          mensagem:
            "Produto ignorado: referencia duplicada na planilha.",
        });
        continue;
      }

      if (candidato.referencia) {
        referenciasVistas.add(candidato.referencia);
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
