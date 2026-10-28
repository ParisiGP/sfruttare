import { prisma } from "@/lib/prisma";

/** O próprio `prisma` ou o `tx` de uma transação em andamento. */
type ClienteDb = Pick<typeof prisma, "produto">;

export type VendaMaisRecente = {
  /** Preço de tabela na venda (`precoUnitario` do item). */
  base: number;
  data: Date;
};

const STATUS_PEDIDO_PAGO = [
  "PAGO",
  "ENVIADO",
  "ENTREGUE",
] as const;

export class ConsignacaoRepository {
  /** Valores distintos de `Produto.consignante` — um prefixo novo aparece sozinho. */
  async listarConsignantes() {
    const grupos = await prisma.produto.groupBy({
      by: ["consignante"],
      where: { consignante: { not: null } },
      _count: { _all: true },
      orderBy: { consignante: "asc" },
    });

    const semPercentual = await prisma.produto.groupBy({
      by: ["consignante"],
      where: {
        consignante: { not: null },
        percentualRepasse: null,
      },
      _count: { _all: true },
    });

    const semPorNome = new Map(
      semPercentual.map((grupo) => [
        grupo.consignante,
        grupo._count._all,
      ])
    );

    return grupos.flatMap((grupo) =>
      grupo.consignante
        ? [
            {
              nome: grupo.consignante,
              total: grupo._count._all,
              semPercentual:
                semPorNome.get(grupo.consignante) ?? 0,
            },
          ]
        : []
    );
  }

  async findConsignados(consignante?: string) {
    return prisma.produto.findMany({
      where: consignante
        ? { consignante }
        : { consignante: { not: null } },
      select: {
        id: true,
        nome: true,
        referencia: true,
        preco: true,
        status: true,
        consignante: true,
        percentualRepasse: true,
        repassadoEm: true,
        valorRepassado: true,
      },
      orderBy: { referencia: "asc" },
    });
  }

  async findProduto(id: string) {
    return prisma.produto.findUnique({
      where: { id },
      select: {
        id: true,
        preco: true,
        status: true,
        consignante: true,
        percentualRepasse: true,
        repassadoEm: true,
      },
    });
  }

  /**
   * Venda mais recente de cada peça: item de Balcão sem devolução ou
   * item de pedido pago do site. Peça sem venda registrada fica fora do
   * mapa (quem chama usa o preço atual).
   */
  async findVendasMaisRecentes(
    produtoIds: string[]
  ): Promise<Map<string, VendaMaisRecente>> {
    const resultado = new Map<string, VendaMaisRecente>();

    if (produtoIds.length === 0) {
      return resultado;
    }

    const [itensBalcao, itensPedido] = await Promise.all([
      prisma.vendaBalcaoItem.findMany({
        where: {
          produtoId: { in: produtoIds },
          devolucoes: { none: {} },
        },
        select: {
          produtoId: true,
          precoUnitario: true,
          createdAt: true,
        },
      }),
      prisma.pedidoItem.findMany({
        where: {
          produtoId: { in: produtoIds },
          pedido: {
            status: { in: [...STATUS_PEDIDO_PAGO] },
          },
        },
        select: {
          produtoId: true,
          precoUnitario: true,
          pedido: { select: { createdAt: true } },
        },
      }),
    ]);

    const candidatos = [
      ...itensBalcao.map((item) => ({
        produtoId: item.produtoId,
        base: Number(item.precoUnitario),
        data: item.createdAt,
      })),
      ...itensPedido.map((item) => ({
        produtoId: item.produtoId,
        base: Number(item.precoUnitario),
        data: item.pedido.createdAt,
      })),
    ];

    for (const candidato of candidatos) {
      const atual = resultado.get(candidato.produtoId);

      if (
        !atual ||
        candidato.data.getTime() > atual.data.getTime()
      ) {
        resultado.set(candidato.produtoId, {
          base: candidato.base,
          data: candidato.data,
        });
      }
    }

    return resultado;
  }

  /**
   * Só marca se a peça ainda estiver `VENDIDO`, sem repasse e com o
   * mesmo % lido pelo service. A condição vai no próprio `updateMany`:
   * dois cliques, ou duas abas, não gravam duas vezes (o segundo vê
   * `count = 0`).
   */
  async marcarRepassado(
    id: string,
    percentual: number,
    valor: number
  ) {
    const resultado = await prisma.produto.updateMany({
      where: {
        id,
        status: "VENDIDO",
        repassadoEm: null,
        percentualRepasse: percentual,
      },
      data: {
        repassadoEm: new Date(),
        valorRepassado: valor,
      },
    });

    return resultado.count;
  }

  /** Só desfaz o que está de fato repassado (mesma proteção do `marcarRepassado`). */
  async desfazerRepasse(id: string) {
    const resultado = await prisma.produto.updateMany({
      where: { id, repassadoEm: { not: null } },
      data: { repassadoEm: null, valorRepassado: null },
    });

    return resultado.count;
  }

  /**
   * Zera o registro de repasse de uma peça que deixou de estar vendida
   * (devolução/troca no Balcão ou mudança manual de status). É o único
   * lugar que faz isso. Aceita o `tx` pra rodar na mesma transação de
   * quem reverte o produto; só toca em peça que de fato foi repassada.
   */
  async zerarRepasse(
    produtoId: string,
    client: ClienteDb = prisma
  ) {
    const resultado = await client.produto.updateMany({
      where: {
        id: produtoId,
        repassadoEm: { not: null },
      },
      data: { repassadoEm: null, valorRepassado: null },
    });

    return resultado.count;
  }

  /** Peça repassada não aceita mudar o % (precisa desfazer o repasse antes). */
  async definirPercentual(id: string, percentual: number) {
    const resultado = await prisma.produto.updateMany({
      where: {
        id,
        consignante: { not: null },
        repassadoEm: null,
      },
      data: { percentualRepasse: percentual },
    });

    return resultado.count;
  }

  /** Só preenche onde `percentualRepasse` é nulo — nunca sobrescreve. */
  async definirPercentualEmLote(
    consignante: string,
    percentual: number
  ) {
    const resultado = await prisma.produto.updateMany({
      where: { consignante, percentualRepasse: null },
      data: { percentualRepasse: percentual },
    });

    return resultado.count;
  }

  async contarSemPercentual(consignante: string) {
    return prisma.produto.count({
      where: { consignante, percentualRepasse: null },
    });
  }
}
