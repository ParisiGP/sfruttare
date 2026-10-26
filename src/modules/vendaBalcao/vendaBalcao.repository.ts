import { prisma } from "@/lib/prisma";

export type VendaBalcaoItemWriteData = {
  produtoId: string;
  nomeProduto: string;
  precoUnitario: number;
};

export type PagamentoBalcaoWriteData = {
  forma: string;
  valor: number;
  parcelas: number;
  valorComJuros: number | null;
};

export type VendaBalcaoWriteData = {
  nomeCliente: string;
  emailCliente?: string;
  telefoneCliente?: string;
  /** Resumo (maior nº de parcelas entre as linhas) — mantém histórico/relatórios atuais. */
  parcelas: number;
  subtotal: number;
  descontoTipo?: "VALOR" | "PERCENTUAL";
  descontoEntrada?: number;
  descontoAplicado?: number;
  total: number;
  /** Resumo (soma de `valorComJuros ?? valor` das linhas). */
  totalComJuros: number | null;
  /** Resumo: a forma da única linha, ou "MISTO". */
  formaPagamento: string;
  pagamentos: PagamentoBalcaoWriteData[];
  itens: VendaBalcaoItemWriteData[];
};

export type VendaBalcaoListFilters = {
  dataInicial?: Date;
  dataFinal?: Date;
  nomeCliente?: string;
};

export class VendaBalcaoRepository {
  /**
   * `updateMany` com `where: { status: { in: [DISPONIVEL, RESERVADO] } }`
   * dentro da mesma transação é o que de fato fecha a corrida entre dois
   * atendimentos simultâneos: se outra venda já tiver marcado a peça como
   * VENDIDO entre a revalidação do service e este ponto, `count` vem 0 e
   * a transação inteira é desfeita — nenhuma venda parcial fica
   * registrada. Aceita RESERVADO também porque é assim que se fecha a
   * venda de uma peça reservada (Balcão ou Produtos/site) — sempre pelo
   * Balcão.
   */
  async create(data: VendaBalcaoWriteData) {
    return prisma.$transaction(async (tx) => {
      for (const item of data.itens) {
        const resultado = await tx.produto.updateMany({
          where: {
            id: item.produtoId,
            status: {
              in: ["DISPONIVEL", "RESERVADO"],
            },
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

      const agora = Date.now();

      // As linhas de pagamento entram na mesma transação que cria a
      // venda e marca as peças como vendidas — nada de gravação
      // parcial. O `createdAt` escalonado em 1ms por linha preserva a
      // ordem em que o caixa lançou (a última é sempre "o resto").
      const venda = await tx.vendaBalcao.create({
        data: {
          nomeCliente: data.nomeCliente,
          emailCliente: data.emailCliente,
          telefoneCliente: data.telefoneCliente,
          parcelas: data.parcelas,
          subtotal: data.subtotal,
          descontoTipo: data.descontoTipo,
          descontoEntrada: data.descontoEntrada,
          descontoAplicado: data.descontoAplicado,
          total: data.total,
          totalComJuros: data.totalComJuros,
          formaPagamento: data.formaPagamento,
          itens: {
            create: data.itens.map((item) => ({
              produtoId: item.produtoId,
              nomeProduto: item.nomeProduto,
              precoUnitario: item.precoUnitario,
            })),
          },
          pagamentos: {
            create: data.pagamentos.map(
              (pagamento, index) => ({
                forma: pagamento.forma,
                valor: pagamento.valor,
                parcelas: pagamento.parcelas,
                valorComJuros:
                  pagamento.valorComJuros,
                createdAt: new Date(
                  agora + index
                ),
              })
            ),
          },
        },
        include: this.includeRelations(),
      });

      // Se alguma das peças vendidas tinha reserva ativa, essa venda é
      // exatamente o que converte ela — não bloqueia por nome do
      // cliente (decisão já validada na especificação).
      await tx.reserva.updateMany({
        where: {
          produtoId: {
            in: data.itens.map(
              (item) => item.produtoId
            ),
          },
          status: "ATIVA",
        },
        data: {
          status: "CONVERTIDA",
          vendaBalcaoId: venda.id,
        },
      });

      return venda;
    });
  }

  async findAll(filtros: VendaBalcaoListFilters = {}) {
    const where: Record<string, unknown> = {};

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

    if (filtros.nomeCliente) {
      where.nomeCliente = {
        contains: filtros.nomeCliente,
        mode: "insensitive",
      };
    }

    return prisma.vendaBalcao.findMany({
      where,
      include: this.includeRelations(),
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async findById(id: string) {
    return prisma.vendaBalcao.findUnique({
      where: { id },
    });
  }

  async findItemById(id: string) {
    return prisma.vendaBalcaoItem.findUnique({
      where: { id },
    });
  }

  /**
   * Candidatas a "venda de troca": mesmo cliente, exclui a própria
   * venda de origem e qualquer venda que já tenha sido usada como
   * troca de outra peça (constraint única em `vendaTrocaId` — aqui é
   * só pra não nem oferecer a opção na busca).
   */
  async findCandidatasParaTroca(
    nomeCliente: string,
    excluirVendaId: string
  ) {
    return prisma.vendaBalcao.findMany({
      where: {
        nomeCliente: {
          contains: nomeCliente,
          mode: "insensitive",
        },
        id: { not: excluirVendaId },
        devolucaoComoTroca: null,
      },
      include: { itens: true },
      orderBy: { createdAt: "desc" },
      take: 10,
    });
  }

  /**
   * Não é uma lista já deduplicada — traz até `take` vendas cruas
   * ordenadas por mais recente primeiro, pra o service deduplicar por
   * cliente mantendo os dados da venda mais recente de cada um.
   */
  async findClientesPorNome(termo: string) {
    return prisma.vendaBalcao.findMany({
      where: {
        nomeCliente: {
          contains: termo,
          mode: "insensitive",
        },
      },
      select: {
        nomeCliente: true,
        emailCliente: true,
        telefoneCliente: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 30,
    });
  }

  private includeRelations() {
    return {
      pagamentos: {
        orderBy: { createdAt: "asc" as const },
      },
      itens: {
        include: {
          produto: {
            select: { referencia: true },
          },
          devolucoes: {
            include: {
              vendaTroca: {
                select: {
                  nomeCliente: true,
                  total: true,
                  createdAt: true,
                },
              },
            },
          },
        },
      },
    };
  }
}
