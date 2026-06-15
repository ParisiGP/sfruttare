import { prisma } from "@/lib/prisma";

export class CategoriaRepository {
  async findAll() {
  return prisma.categoria.findMany({
    include: {
      _count: {
        select: {
          produtos: true,
        },
      },

      produtos: {
        select: {
          id: true,
          nome: true,
        },

        orderBy: {
          nome: "asc",
        },

        take: 3,
      },
    },

    orderBy: {
      nome: "asc",
    },
  });
}

  async findByName(nome: string) {
    return prisma.categoria.findFirst({
      where: {
        nome,
      },
    });
  }

  async findByIdWithCount(id: string) {
  return prisma.categoria.findUnique({
    where: {
      id,
    },

    include: {
      _count: {
        select: {
          produtos: true,
        },
      },
    },
  });
}

async findProdutosByCategoriaId(
  categoriaId: string
) {
  return prisma.produto.findMany({
    where: {
      categoriaId,
    },

    select: {
      id: true,
      nome: true,
    },

    orderBy: {
      nome: "asc",
    },
  });
}





  async create(nome: string) {
    return prisma.categoria.create({
      data: {
        nome,
      },
    });
  }

async delete(id: string) {
    return prisma.categoria.delete({
      where: {
        id,
      },
    });
}

async edit(id: string, nome: string) {
    return prisma.categoria.update({
      where: {
        id,
      },
      data: {
        nome,
      },
    });
  }

}

