import { prisma } from "@/lib/prisma";

export class ProdutoRepository {
  async create(data: {
    nome: string;
    descricao?: string;
    marca?: string;
    tamanho?: string;
    preco: number;
    estoque?: number;
    categoriaId: string;
    tipo: "BRECHO" | "NA_ETIQUETA";
    slug: string;
  }) {
    return prisma.produto.create({
      data,
    });
  }

async findAll() {
  return prisma.produto.findMany({
    include: {
      categoria: true,
    },

    orderBy: {
      createdAt: "desc",
    },
  });
}

async delete(id: string) {
    return prisma.produto.delete({
      where: {
        id,
      },
    });
}


}

