import { prisma } from "@/lib/prisma";

export type VendaBalcaoItemWriteData = {
  produtoId: string;
  nomeProduto: string;
  precoUnitario: number;
};

export type VendaBalcaoWriteData = {
  nomeCliente: string;
  emailCliente?: string;
  telefoneCliente?: string;
  parcelas: number;
  subtotal: number;
  total: number;
  totalComJuros: number | null;
  itens: VendaBalcaoItemWriteData[];
};

export class VendaBalcaoRepository {
  /**
   * `updateMany` com `where: { status: "DISPONIVEL" }` dentro da mesma
   * transação é o que de fato fecha a corrida entre dois atendimentos
   * simultâneos: se outra venda já tiver marcado a peça como VENDIDO
   * entre a revalidação do service e este ponto, `count` vem 0 e a
   * transação inteira é desfeita — nenhuma venda parcial fica registrada.
   */
  async create(data: VendaBalcaoWriteData) {
    return prisma.$transaction(async (tx) => {
      for (const item of data.itens) {
        const resultado = await tx.produto.updateMany({
          where: {
            id: item.produtoId,
            status: "DISPONIVEL",
          },
          data: {
            status: "VENDIDO",
          },
        });

        if (resultado.count === 0) {
          throw new Error(
            `A peça "${item.nomeProduto}" já não está mais disponível.`
          );
        }
      }

      return tx.vendaBalcao.create({
        data: {
          nomeCliente: data.nomeCliente,
          emailCliente: data.emailCliente,
          telefoneCliente: data.telefoneCliente,
          parcelas: data.parcelas,
          subtotal: data.subtotal,
          total: data.total,
          totalComJuros: data.totalComJuros,
          itens: {
            create: data.itens.map((item) => ({
              produtoId: item.produtoId,
              nomeProduto: item.nomeProduto,
              precoUnitario: item.precoUnitario,
            })),
          },
        },
        include: this.includeRelations(),
      });
    });
  }

  async findAll() {
    return prisma.vendaBalcao.findMany({
      include: this.includeRelations(),
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  private includeRelations() {
    return {
      itens: true,
    };
  }
}
