import { prisma } from "@/lib/prisma";
import type {
  ProdutoImagem,
  ProdutoImagemInput,
  ProdutoListFilters,
  ProdutoStatus,
  ProdutoTipo,
} from "./produto.types";

export type ProdutoWriteData = {
  nome: string;
  slug: string;
  descricao?: string;
  marca?: string;
  cor?: string;
  referencia?: string;
  tamanho?: string;
  preco: number;
  estoque: number;
  categoriaId: string;
  tipo: ProdutoTipo;
  status: ProdutoStatus;
  imagens?: ProdutoImagemInput[];
};

export type ProdutoImportCreateData = Omit<
  ProdutoWriteData,
  "imagens"
>;

function buildWhere(filters: ProdutoListFilters = {}) {
  const where: Record<string, unknown> = {};

  if (filters.busca) {
    where.OR = [
      {
        nome: {
          contains: filters.busca,
          mode: "insensitive",
        },
      },
      {
        marca: {
          contains: filters.busca,
          mode: "insensitive",
        },
      },
      {
        descricao: {
          contains: filters.busca,
          mode: "insensitive",
        },
      },
      {
        referencia: {
          contains: filters.busca,
          mode: "insensitive",
        },
      },
    ];
  }

  if (filters.categoriaId) {
    where.categoriaId = filters.categoriaId;
  }

  if (filters.referencia) {
    where.referencia = {
      contains: filters.referencia,
      mode: "insensitive",
    };
  }

  if (filters.status && filters.status !== "TODOS") {
    where.status = filters.status;
  }

  if (filters.tipo && filters.tipo !== "TODOS") {
    where.tipo = filters.tipo;
  }

  if (filters.estoque === "COM_ESTOQUE") {
    where.estoque = {
      gt: 0,
    };
  }

  if (filters.estoque === "SEM_ESTOQUE") {
    where.estoque = 0;
  }

  return where;
}

function buildOrderBy(
  ordem: ProdutoListFilters["ordem"] = "vitrine"
) {

  if (ordem === "vitrine") {
    return [
      {
        ordem: "asc" as const,
      },
      {
        createdAt: "desc" as const,
      },
    ];
  }

  if (ordem === "nome") {
    return {
      nome: "asc" as const,
    };
  }

  if (ordem === "preco") {
    return {
      preco: "desc" as const,
    };
  }

  if (ordem === "estoque") {
    return {
      estoque: "asc" as const,
    };
  }

  return {
    createdAt: "desc" as const,
  };
}

export class ProdutoRepository {
  async create(data: ProdutoWriteData) {
    const { imagens = [], ...produto } = data;

    const ultimaOrdem = await prisma.produto.count();

    return prisma.produto.create({
      data: {
        ...produto,
        ordem: ultimaOrdem,

        imagens: {
          create: imagens.map((imagem) => ({
            url: imagem.url,
            publicId: imagem.publicId,
            ordem: imagem.ordem,
          })),
        },
      },
      include: this.includeRelations(),
    });
  }

  async update(
    id: string,
    data: ProdutoWriteData
  ) {
    const { imagens = [], ...produto } = data;

    return prisma.$transaction(async (tx) => {
      await tx.produto.update({
        where: {
          id,
        },
        data: produto,
      });

      await tx.produtoImagem.deleteMany({
        where: {
          produtoId: id,
        },
      });

      if (imagens.length > 0) {
        await tx.produtoImagem.createMany({
          data: imagens.map((imagem) => ({
            produtoId: id,
            url: imagem.url,
            publicId: imagem.publicId,
            ordem: imagem.ordem,
          })),
        });
      }

      return tx.produto.findUniqueOrThrow({
        where: {
          id,
        },
        include: this.includeRelations(),
      });
    });
  }

  async findById(id: string) {
    return prisma.produto.findUnique({
      where: {
        id,
      },
      include: this.includeRelations(),
    });
  }

  async findBySlug(slug: string) {
    return prisma.produto.findUnique({
      where: {
        slug,
      },
    });
  }

  async findExistingReferences(
    referencias: string[]
  ) {
    if (referencias.length === 0) {
      return [];
    }

    const produtos =
      await prisma.produto.findMany({
        where: {
          referencia: {
            in: referencias,
          },
        },
        select: {
          referencia: true,
        },
      });

    return produtos
      .map((produto) => produto.referencia)
      .filter(
        (referencia): referencia is string =>
          Boolean(referencia)
      );
  }

  async findAll() {
    return prisma.produto.findMany({
      include: this.includeRelations(),
      orderBy: [
        {
          ordem: "asc",
        },
        {
          createdAt: "desc",
        },
      ],
    });
  }

  async findManyPaginated(
    filters: ProdutoListFilters
  ) {
    const pagina =
      filters.pagina ?? 1;

    const limite =
      filters.limite ?? 12;

    const where =
      buildWhere(filters);

    const [produtos, total] =
      await prisma.$transaction([
        prisma.produto.findMany({
          where,
          include: this.includeRelations(),
          orderBy: buildOrderBy(filters.ordem),
          skip: (pagina - 1) * limite,
          take: limite,
        }),
        prisma.produto.count({
          where,
        }),
      ]);

    return {
      produtos,
      total,
      pagina,
      limite,
      totalPaginas: Math.max(
        1,
        Math.ceil(total / limite)
      ),
    };
  }

  async count(filters: ProdutoListFilters = {}) {
    return prisma.produto.count({
      where: buildWhere(filters),
    });
  }

  async metrics() {
    const [
      total,
      disponiveis,
      reservados,
      vendidos,
      semEstoque,
    ] = await prisma.$transaction([
      prisma.produto.count(),
      prisma.produto.count({
        where: {
          status: "DISPONIVEL",
        },
      }),
      prisma.produto.count({
        where: {
          status: "RESERVADO",
        },
      }),
      prisma.produto.count({
        where: {
          status: "VENDIDO",
        },
      }),
      prisma.produto.count({
        where: {
          estoque: 0,
        },
      }),
    ]);

    return {
      total,
      disponiveis,
      reservados,
      vendidos,
      semEstoque,
    };
  }

  async createImages(
    produtoId: string,
    imagens: ProdutoImagemInput[]
  ) {
    if (imagens.length === 0) {
      return;
    }

    await prisma.produtoImagem.createMany({
      data: imagens.map((imagem) => ({
        produtoId,
        url: imagem.url,
        publicId: imagem.publicId,
        ordem: imagem.ordem,
      })),
    });
  }

  async createManyImported(
    produtos: ProdutoImportCreateData[]
  ) {
    if (produtos.length === 0) {
      return 0;
    }

    return prisma.$transaction(async (tx) => {
      const totalProdutos =
        await tx.produto.count();

      await tx.produto.createMany({
        data: produtos.map((produto, index) => ({
          ...produto,
          ordem: totalProdutos + index,
        })),
      });

      return produtos.length;
    });
  }

  async replaceImages(
    produtoId: string,
    imagens: ProdutoImagemInput[]
  ) {
    await prisma.$transaction(async (tx) => {
      await tx.produtoImagem.deleteMany({
        where: {
          produtoId,
        },
      });

      if (imagens.length === 0) {
        return;
      }

      await tx.produtoImagem.createMany({
        data: imagens.map((imagem) => ({
          produtoId,
          url: imagem.url,
          publicId: imagem.publicId,
          ordem: imagem.ordem,
        })),
      });
    });
  }

  async updateImageCrop(
    imagemId: string,
    crop: {
      zoom: number;
      offsetX: number;
      offsetY: number;
    }
  ) {
    return prisma.produtoImagem.update({
      where: {
        id: imagemId,
      },
      data: {
        zoom: crop.zoom,
        offsetX: crop.offsetX,
        offsetY: crop.offsetY,
      },
    });
  }

  async updateStatus(
    id: string,
    status: ProdutoStatus
  ) {
    return prisma.produto.update({
      where: {
        id,
      },
      data: {
        status,
      },
      include: this.includeRelations(),
    });
  }

  async hasPedidoItens(id: string) {
    const total =
      await prisma.pedidoItem.count({
        where: {
          produtoId: id,
        },
      });

    return total > 0;
  }

  async delete(id: string) {
    return prisma.produto.delete({
      where: {
        id,
      },
    });
  }

  async updateOrder(
    produtos: {
      id: string;
      ordem: number;
    }[]
  ) {
    await prisma.$transaction(
      produtos.map((produto) =>
        prisma.produto.update({
          where: {
            id: produto.id,
          },
          data: {
            ordem: produto.ordem,
          },
        })
      )
    );
  }

  async salvarEnquadramentoFotos(
    imagens: ProdutoImagem[]
  ) {
    await prisma.$transaction(
      imagens.map((imagem) =>
        prisma.produtoImagem.update({
          where: {
            id: imagem.id,
          },
          data: {
            zoom: imagem.zoom,
            offsetX: imagem.offsetX,
            offsetY: imagem.offsetY,
          },
        })
      )
    );
  }

  private includeRelations() {
    return {
      categoria: true,
      imagens: {
        orderBy: {
          ordem: "asc" as const,
        },
      },
    };
  }
}
