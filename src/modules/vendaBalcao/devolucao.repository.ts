import { prisma } from "@/lib/prisma";

export type DevolucaoBalcaoWriteData = {
  vendaBalcaoItemId: string;
  produtoOriginalId: string;
  tipo: "DEVOLUCAO" | "TROCA";
  valorDevolvido: number;
  vendaTrocaId?: string;
  diferencaValor?: number;
  motivo?: string;
};

export class DevolucaoBalcaoRepository {
  async findByItemId(vendaBalcaoItemId: string) {
    return prisma.devolucaoBalcao.findUnique({
      where: { vendaBalcaoItemId },
    });
  }

  async findByVendaTrocaId(vendaTrocaId: string) {
    return prisma.devolucaoBalcao.findUnique({
      where: { vendaTrocaId },
    });
  }

  /**
   * A "peça nova" de uma troca não é mais um produto avulso — é uma
   * venda inteira já registrada (normalmente a próxima compra do
   * mesmo cliente). Os itens dessa venda já foram marcados VENDIDO
   * quando ela foi confirmada pelo fluxo normal, então essa transação
   * só precisa devolver a peça original pra DISPONIVEL e gravar o
   * vínculo — nenhuma revalidação de estoque é necessária aqui.
   * A checagem de devolução duplicada roda de novo dentro da
   * transação (além da checagem no service, que é só pra mensagem de
   * erro mais rápida) e as constraints únicas em `vendaBalcaoItemId`
   * e `vendaTrocaId` garantem isso mesmo sob concorrência real.
   */
  async create(data: DevolucaoBalcaoWriteData) {
    return prisma.$transaction(async (tx) => {
      const existente = await tx.devolucaoBalcao.findUnique({
        where: {
          vendaBalcaoItemId: data.vendaBalcaoItemId,
        },
      });

      if (existente) {
        throw new Error(
          "Esta peça já teve uma devolução ou troca registrada."
        );
      }

      if (data.vendaTrocaId) {
        const vendaJaUsada =
          await tx.devolucaoBalcao.findUnique({
            where: {
              vendaTrocaId: data.vendaTrocaId,
            },
          });

        if (vendaJaUsada) {
          throw new Error(
            "Essa venda já foi usada como troca de outra peça."
          );
        }
      }

      await tx.produto.update({
        where: { id: data.produtoOriginalId },
        data: { status: "DISPONIVEL" },
      });

      return tx.devolucaoBalcao.create({
        data: {
          vendaBalcaoItemId: data.vendaBalcaoItemId,
          tipo: data.tipo,
          valorDevolvido: data.valorDevolvido,
          vendaTrocaId: data.vendaTrocaId,
          diferencaValor: data.diferencaValor,
          motivo: data.motivo,
        },
        include: {
          vendaTroca: {
            select: {
              nomeCliente: true,
              total: true,
              createdAt: true,
            },
          },
        },
      });
    });
  }
}
