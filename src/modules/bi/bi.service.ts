import { VendaBalcaoService } from "@/modules/vendaBalcao/vendaBalcao.service";
import { PedidoRepository } from "@/modules/pedido/pedido.repository";
import { converterPeriodo } from "@/lib/periodo";

import { identificarTipoPeca } from "./tiposPeca";
import type {
  ComparativoGrupo,
  FiltroPeriodoBI,
  MetricasCanal,
  RankingTipoPeca,
  ResultadoBI,
} from "./bi.types";

type ItemVendidoAgregado = {
  nome: string;
  referencia: string;
  quantidade: number;
  faturamento: number;
};

function montarMetricas(
  faturamento: number,
  numeroVendas: number
): MetricasCanal {
  return {
    faturamento,
    numeroVendas,
    ticketMedio:
      numeroVendas > 0
        ? faturamento / numeroVendas
        : 0,
  };
}

function ehConsignado(referencia: string) {
  return referencia
    .trim()
    .toUpperCase()
    .startsWith("CS");
}

export class BiService {
  constructor(
    private vendaBalcaoService =
      new VendaBalcaoService(),
    private pedidoRepository =
      new PedidoRepository()
  ) { }

  async obterDesempenho(
    filtro: FiltroPeriodoBI
  ): Promise<ResultadoBI> {
    const periodo = converterPeriodo(filtro);

    const [
      { vendas: vendasBalcao, totalLiquido: balcaoFaturamento },
      pedidos,
    ] = await Promise.all([
      this.vendaBalcaoService.listarVendas(
        filtro
      ),
      this.pedidoRepository.findPagosNoPeriodo(
        periodo.dataInicial,
        periodo.dataFinal
      ),
    ]);

    const balcaoNumeroVendas =
      vendasBalcao.length;

    const siteFaturamento = pedidos.reduce(
      (soma, pedido) =>
        soma +
        (Number(pedido.total) -
          Number(pedido.frete)),
      0
    );
    const siteNumeroVendas = pedidos.length;

    const geralFaturamento =
      balcaoFaturamento + siteFaturamento;
    const geralNumeroVendas =
      balcaoNumeroVendas + siteNumeroVendas;

    const itensVendidos: ItemVendidoAgregado[] =
      [];

    for (const venda of vendasBalcao) {
      for (const item of venda.itens) {
        // Peça devolvida ou trocada não foi efetivamente vendida no
        // fim das contas — a peça nova de uma troca é um item à parte
        // (de outra venda), já contado normalmente aqui.
        if (item.devolucao) {
          continue;
        }

        itensVendidos.push({
          nome: item.nomeProduto,
          referencia: item.referencia,
          quantidade: 1,
          faturamento: item.precoUnitario,
        });
      }
    }

    for (const pedido of pedidos) {
      for (const item of pedido.itens) {
        itensVendidos.push({
          nome: item.produto.nome,
          referencia:
            item.produto.referencia ?? "",
          quantidade: item.quantidade,
          faturamento:
            Number(item.precoUnitario) *
            item.quantidade,
        });
      }
    }

    return {
      geral: montarMetricas(
        geralFaturamento,
        geralNumeroVendas
      ),
      balcao: montarMetricas(
        balcaoFaturamento,
        balcaoNumeroVendas
      ),
      site: montarMetricas(
        siteFaturamento,
        siteNumeroVendas
      ),
      rankingTipos:
        this.calcularRankingTipos(
          itensVendidos
        ),
      ...this.calcularConsignadoProprio(
        itensVendidos
      ),
    };
  }

  private calcularRankingTipos(
    itens: ItemVendidoAgregado[]
  ): RankingTipoPeca[] {
    const mapa = new Map<
      string,
      { quantidade: number; faturamento: number }
    >();

    for (const item of itens) {
      const tipo = identificarTipoPeca(
        item.nome
      );
      const atual = mapa.get(tipo) ?? {
        quantidade: 0,
        faturamento: 0,
      };

      atual.quantidade += item.quantidade;
      atual.faturamento += item.faturamento;

      mapa.set(tipo, atual);
    }

    return Array.from(mapa.entries())
      .map(([tipo, dados]) => ({
        tipo,
        ...dados,
      }))
      .sort(
        (a, b) => b.quantidade - a.quantidade
      );
  }

  private calcularConsignadoProprio(
    itens: ItemVendidoAgregado[]
  ): {
    consignado: ComparativoGrupo;
    proprio: ComparativoGrupo;
  } {
    const consignado = {
      quantidade: 0,
      faturamento: 0,
    };
    const proprio = {
      quantidade: 0,
      faturamento: 0,
    };

    for (const item of itens) {
      const alvo = ehConsignado(
        item.referencia
      )
        ? consignado
        : proprio;

      alvo.quantidade += item.quantidade;
      alvo.faturamento += item.faturamento;
    }

    return {
      consignado: {
        ...consignado,
        ticketMedio:
          consignado.quantidade > 0
            ? consignado.faturamento /
              consignado.quantidade
            : 0,
      },
      proprio: {
        ...proprio,
        ticketMedio:
          proprio.quantidade > 0
            ? proprio.faturamento /
              proprio.quantidade
            : 0,
      },
    };
  }
}
