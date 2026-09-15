import { prisma } from "@/lib/prisma";
import type { PedidoStatus } from "./pedido.types";

export type PedidoItemWriteData = {
  produtoId: string;
  quantidade: number;
  precoUnitario: number;
};

export type PedidoWriteData = {
  usuarioId: string;
  enderecoId: string | null;
  status: PedidoStatus;
  frete: number;
  total: number;
  itens: PedidoItemWriteData[];
};

export class PedidoRepository {
  async create(data: PedidoWriteData) {
    return prisma.$transaction(async (tx) => {
      const pedido = await tx.pedido.create({
        data: {
          usuarioId: data.usuarioId,
          enderecoId: data.enderecoId,
          status: data.status,
          frete: data.frete,
          total: data.total,
          itens: {
            create: data.itens.map((item) => ({
              produtoId: item.produtoId,
              quantidade: item.quantidade,
              precoUnitario: item.precoUnitario,
            })),
          },
        },
        include: this.includeRelations(),
      });

      for (const item of data.itens) {
        await tx.produto.update({
          where: {
            id: item.produtoId,
          },
          data: {
            estoque: {
              decrement: item.quantidade,
            },
          },
        });
      }

      return pedido;
    });
  }

  async findById(id: string) {
    return prisma.pedido.findUnique({
      where: {
        id,
      },
      include: this.includeRelations(),
    });
  }

  async findManyByUsuarioId(
    usuarioId: string
  ) {
    return prisma.pedido.findMany({
      where: {
        usuarioId,
      },
      include: this.includeRelations(),
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  /**
   * Só pedidos efetivamente pagos — `PIX_PENDENTE` (ainda não pago) e
   * `CANCELADO` ficam de fora de qualquer métrica de faturamento.
   */
  async findPagosNoPeriodo(
    dataInicial?: Date,
    dataFinal?: Date
  ) {
    const where: Record<string, unknown> = {
      status: {
        in: ["PAGO", "ENVIADO", "ENTREGUE"],
      },
    };

    if (dataInicial || dataFinal) {
      const createdAt: Record<string, Date> = {};

      if (dataInicial) {
        createdAt.gte = dataInicial;
      }

      if (dataFinal) {
        createdAt.lte = dataFinal;
      }

      where.createdAt = createdAt;
    }

    return prisma.pedido.findMany({
      where,
      include: this.includeRelations(),
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  private includeRelations() {
    return {
      endereco: true,
      itens: {
        include: {
          produto: true,
        },
      },
    };
  }
}
