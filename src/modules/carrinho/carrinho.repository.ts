import { prisma } from "@/lib/prisma";

export class CarrinhoRepository {
  async findOrCreateByUsuarioId(usuarioId: string) {
    const existente =
      await prisma.carrinho.findUnique({
        where: {
          usuarioId,
        },
      });

    if (existente) {
      return existente;
    }

    return prisma.carrinho.create({
      data: {
        usuarioId,
      },
    });
  }

  async findComItensByUsuarioId(
    usuarioId: string
  ) {
    return prisma.carrinho.findUnique({
      where: {
        usuarioId,
      },
      include: {
        itens: {
          orderBy: {
            createdAt: "asc",
          },
          include: {
            produto: {
              include: {
                categoria: true,
                imagens: {
                  orderBy: {
                    ordem: "asc",
                  },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });
  }

  async findItemById(itemId: string) {
    return prisma.carrinhoItem.findUnique({
      where: {
        id: itemId,
      },
      include: {
        carrinho: true,
      },
    });
  }

  async upsertItem(
    carrinhoId: string,
    produtoId: string,
    quantidade: number
  ) {
    return prisma.carrinhoItem.upsert({
      where: {
        carrinhoId_produtoId: {
          carrinhoId,
          produtoId,
        },
      },
      create: {
        carrinhoId,
        produtoId,
        quantidade,
      },
      update: {
        quantidade: {
          increment: quantidade,
        },
      },
    });
  }

  async updateQuantidade(
    itemId: string,
    quantidade: number
  ) {
    return prisma.carrinhoItem.update({
      where: {
        id: itemId,
      },
      data: {
        quantidade,
      },
    });
  }

  async removeItem(itemId: string) {
    return prisma.carrinhoItem.delete({
      where: {
        id: itemId,
      },
    });
  }

  async clear(carrinhoId: string) {
    await prisma.carrinhoItem.deleteMany({
      where: {
        carrinhoId,
      },
    });
  }
}
