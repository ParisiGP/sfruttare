import { prisma } from "@/lib/prisma";

export type VitrineAbaWriteData = {
  nome: string;
  slug: string;
  ativo: boolean;
};

export class VitrineAbaRepository {
  async findAll() {
    return prisma.vitrineAba.findMany({
      orderBy: {
        ordem: "asc",
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

  async findAllAtivasComProdutos() {
    return prisma.vitrineAba.findMany({
      where: {
        ativo: true,
      },
      orderBy: {
        ordem: "asc",
      },
      include: {
        produtos: {
          where: {
            produto: {
              status: "DISPONIVEL",
            },
          },
          orderBy: {
            ordem: "asc",
          },
          include: {
            produto: {
              include: {
                categoria: true,
                imagens: {
                  orderBy: {
                    ordem: "asc",
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  async findById(id: string) {
    return prisma.vitrineAba.findUnique({
      where: {
        id,
      },
    });
  }

  async findByName(nome: string) {
    return prisma.vitrineAba.findFirst({
      where: {
        nome,
      },
    });
  }

  async findBySlug(slug: string) {
    return prisma.vitrineAba.findUnique({
      where: {
        slug,
      },
    });
  }

  async create(data: VitrineAbaWriteData) {
    const ultimaOrdem =
      await prisma.vitrineAba.count();

    return prisma.vitrineAba.create({
      data: {
        ...data,
        ordem: ultimaOrdem,
      },
    });
  }

  async update(
    id: string,
    data: VitrineAbaWriteData
  ) {
    return prisma.vitrineAba.update({
      where: {
        id,
      },
      data,
    });
  }

  async delete(id: string) {
    return prisma.vitrineAba.delete({
      where: {
        id,
      },
    });
  }

  async updateOrder(
    abas: {
      id: string;
      ordem: number;
    }[]
  ) {
    await prisma.$transaction(
      abas.map((aba) =>
        prisma.vitrineAba.update({
          where: {
            id: aba.id,
          },
          data: {
            ordem: aba.ordem,
          },
        })
      )
    );
  }

  async findProdutoIdsDaAba(abaId: string) {
    const registros =
      await prisma.vitrineAbaProduto.findMany({
        where: {
          abaId,
        },
        orderBy: {
          ordem: "asc",
        },
        select: {
          produtoId: true,
        },
      });

    return registros.map(
      (registro) => registro.produtoId
    );
  }

  async setProdutos(
    abaId: string,
    produtoIds: string[]
  ) {
    await prisma.$transaction(async (tx) => {
      await tx.vitrineAbaProduto.deleteMany({
        where: {
          abaId,
        },
      });

      if (produtoIds.length === 0) {
        return;
      }

      await tx.vitrineAbaProduto.createMany({
        data: produtoIds.map(
          (produtoId, index) => ({
            abaId,
            produtoId,
            ordem: index,
          })
        ),
      });
    });
  }
}
