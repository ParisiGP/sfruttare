import { prisma } from "@/lib/prisma";

export type ReservaWriteData = {
  produtoId: string;
  nomeCliente: string;
  telefoneCliente?: string;
  canal: string;
};

export type ReservaListFilters = {
  status?: string;
  canal?: string;
  dataInicial?: Date;
  dataFinal?: Date;
};

export class ReservaRepository {
  /**
   * `updateMany` com `where: { status: "DISPONIVEL" }` dentro da mesma
   * transação — mesma proteção de corrida já usada em
   * `VendaBalcaoRepository.create`: se a peça deixou de estar
   * disponível entre a tela carregar e o admin confirmar a reserva,
   * `count` vem 0 e a transação inteira é desfeita.
   */
  async create(data: ReservaWriteData) {
    return prisma.$transaction(async (tx) => {
      const resultado = await tx.produto.updateMany({
        where: {
          id: data.produtoId,
          status: "DISPONIVEL",
        },
        data: { status: "RESERVADO" },
      });

      if (resultado.count === 0) {
        throw new Error(
          "Essa peça não está mais disponível pra reservar."
        );
      }

      return tx.reserva.create({
        data: {
          produtoId: data.produtoId,
          nomeCliente: data.nomeCliente,
          telefoneCliente: data.telefoneCliente,
          canal: data.canal,
        },
        include: this.includeRelations(),
      });
    });
  }

  async findAtivaPorProdutoId(
    produtoId: string
  ) {
    return prisma.reserva.findFirst({
      where: { produtoId, status: "ATIVA" },
    });
  }

  /**
   * Libera a peça de volta pra `DISPONIVEL` — só quando a reserva
   * ainda está `ATIVA` (se já foi convertida ou cancelada antes, isso
   * é um erro de uso, não uma ação válida).
   */
  async cancelar(id: string) {
    return prisma.$transaction(async (tx) => {
      const reserva = await tx.reserva.findUnique(
        { where: { id } }
      );

      if (!reserva) {
        throw new Error(
          "Reserva não encontrada."
        );
      }

      if (reserva.status !== "ATIVA") {
        throw new Error(
          "Essa reserva já foi convertida ou cancelada."
        );
      }

      await tx.produto.update({
        where: { id: reserva.produtoId },
        data: { status: "DISPONIVEL" },
      });

      return tx.reserva.update({
        where: { id },
        data: { status: "CANCELADA" },
        include: this.includeRelations(),
      });
    });
  }

  async findAll(
    filtros: ReservaListFilters = {}
  ) {
    const where: Record<string, unknown> = {};

    if (filtros.status) {
      where.status = filtros.status;
    }

    if (filtros.canal) {
      where.canal = filtros.canal;
    }

    if (filtros.dataInicial || filtros.dataFinal) {
      const createdAt: Record<string, Date> = {};

      if (filtros.dataInicial) {
        createdAt.gte = filtros.dataInicial;
      }

      if (filtros.dataFinal) {
        createdAt.lte = filtros.dataFinal;
      }

      where.createdAt = createdAt;
    }

    return prisma.reserva.findMany({
      where,
      include: this.includeRelations(),
      orderBy: { createdAt: "desc" },
    });
  }

  async contarAtivas() {
    return prisma.reserva.count({
      where: { status: "ATIVA" },
    });
  }

  private includeRelations() {
    return {
      produto: {
        select: { nome: true, referencia: true },
      },
    };
  }
}
