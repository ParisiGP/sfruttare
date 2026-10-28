import { ConsignacaoRepository } from "./consignacao.repository";
import {
  calcularRepasse,
  obterStatusRepasse,
  percentualValido,
} from "./consignacao";
import type {
  ConsignadoLinha,
  FiltroConsignados,
  GrupoConsignante,
  PainelConsignados,
  TotaisConsignados,
} from "./consignacao.types";

function emCentavos(valor: number) {
  return Math.round(valor * 100);
}

function somar(valores: number[]) {
  return (
    valores.reduce(
      (soma, valor) => soma + emCentavos(valor),
      0
    ) / 100
  );
}

type ProdutoConsignado = {
  id: string;
  nome: string;
  referencia: string | null;
  preco: unknown;
  status: string;
  consignante: string | null;
  percentualRepasse: unknown;
  repassadoEm: Date | null;
  valorRepassado: unknown;
};

const MENSAGEM_PERCENTUAL_INVALIDO =
  "Informe um percentual maior que 0 e até 100 (no máximo 2 casas decimais).";

export class ConsignacaoService {
  constructor(
    private repository = new ConsignacaoRepository()
  ) { }

  /**
   * Tela de repasses. Os totais e os cabeçalhos dos grupos olham todas as
   * peças do consignante (ou do filtro de consignante); só a lista de
   * linhas respeita o filtro de status — assim "A repassar" continua
   * certo quando se filtra por "Repassado".
   */
  async obterPainel(
    filtros: FiltroConsignados = {}
  ): Promise<PainelConsignados> {
    const [produtos, consignantes] = await Promise.all([
      this.repository.findConsignados(
        filtros.consignante || undefined
      ),
      this.repository.listarConsignantes(),
    ]);

    const vendas =
      await this.repository.findVendasMaisRecentes(
        produtos
          .filter((produto) => produto.status === "VENDIDO")
          .map((produto) => produto.id)
      );

    const linhas = produtos.map((produto) =>
      this.montarLinha(
        produto,
        vendas.get(produto.id) ?? null
      )
    );

    return {
      totais: this.calcularTotais(linhas),
      grupos: this.agrupar(linhas, filtros.status ?? "A_REPASSAR"),
      consignantes,
    };
  }

  /**
   * Quanto falta repassar de cada peça (base da venda × %), pra mostrar
   * no `ProdutoCard`. Só devolve entrada pra peça consignada, vendida,
   * ainda não repassada; sem % o valor é `null` (indefinido).
   */
  async resolverRepassesAPagar(
    produtos: {
      id: string;
      status: string;
      consignante: string | null;
      percentualRepasse: unknown;
      repassadoEm: Date | null;
      preco: unknown;
    }[]
  ): Promise<Map<string, number | null>> {
    const resultado = new Map<string, number | null>();

    const alvo = produtos.filter(
      (produto) =>
        produto.consignante &&
        produto.status === "VENDIDO" &&
        !produto.repassadoEm
    );

    if (alvo.length === 0) {
      return resultado;
    }

    const vendas =
      await this.repository.findVendasMaisRecentes(
        alvo.map((produto) => produto.id)
      );

    for (const produto of alvo) {
      const percentual =
        produto.percentualRepasse === null ||
        produto.percentualRepasse === undefined
          ? null
          : Number(produto.percentualRepasse);

      resultado.set(
        produto.id,
        percentual === null
          ? null
          : calcularRepasse(
              vendas.get(produto.id)?.base ??
                Number(produto.preco),
              percentual
            )
      );
    }

    return resultado;
  }

  async marcarRepassado(id: string) {
    const valor = await this.prepararMarcacao(id);

    const marcadas =
      await this.repository.marcarRepassado(
        id,
        valor.percentual,
        valor.repasse
      );

    if (marcadas === 0) {
      throw new Error(
        "Não foi possível marcar: o estado da peça mudou (já repassada ou alterada em outra aba). Atualize a tela."
      );
    }

    return valor.repasse;
  }

  /** Marca todas as peças vendidas, com %, ainda não repassadas, do consignante. */
  async marcarTodasRepassadas(consignante: string) {
    const produtos =
      await this.repository.findConsignados(consignante);

    const elegiveis = produtos.filter(
      (produto) =>
        produto.status === "VENDIDO" &&
        !produto.repassadoEm &&
        produto.percentualRepasse !== null
    );

    const vendas =
      await this.repository.findVendasMaisRecentes(
        elegiveis.map((produto) => produto.id)
      );

    let marcadas = 0;
    let valorTotal = 0;

    for (const produto of elegiveis) {
      const percentual = Number(produto.percentualRepasse);

      const repasse = calcularRepasse(
        vendas.get(produto.id)?.base ??
          Number(produto.preco),
        percentual
      );

      // Cada peça com a sua condição de estado: se outra aba mexeu
      // numa delas no meio do caminho, ela só fica de fora.
      const gravadas =
        await this.repository.marcarRepassado(
          produto.id,
          percentual,
          repasse
        );

      if (gravadas > 0) {
        marcadas += 1;
        valorTotal = somar([valorTotal, repasse]);
      }
    }

    return { marcadas, valorTotal };
  }

  async desfazerRepasse(id: string) {
    const desfeitas =
      await this.repository.desfazerRepasse(id);

    if (desfeitas === 0) {
      throw new Error(
        "Esse repasse já tinha sido desfeito (ou nunca foi marcado). Atualize a tela."
      );
    }
  }

  async informarPercentual(id: string, percentual: number) {
    if (!percentualValido(percentual)) {
      throw new Error(MENSAGEM_PERCENTUAL_INVALIDO);
    }

    const gravadas =
      await this.repository.definirPercentual(
        id,
        percentual
      );

    if (gravadas === 0) {
      throw new Error(
        "Não foi possível definir o %: a peça não é consignada ou já foi repassada. Atualize a tela."
      );
    }
  }

  async definirPercentualEmLote(
    consignante: string,
    percentual: number
  ) {
    if (!percentualValido(percentual)) {
      throw new Error(MENSAGEM_PERCENTUAL_INVALIDO);
    }

    if (!/^CS[A-Z&]*$/.test(consignante)) {
      throw new Error("Consignante inválido.");
    }

    return this.repository.definirPercentualEmLote(
      consignante,
      percentual
    );
  }

  /** Lê, valida e calcula o valor a congelar — a gravação é que carrega a condição de estado. */
  private async prepararMarcacao(id: string) {
    const produto = await this.repository.findProduto(id);

    if (!produto || !produto.consignante) {
      throw new Error(
        "Peça consignada não encontrada."
      );
    }

    if (produto.status !== "VENDIDO") {
      throw new Error(
        "Só dá pra marcar repasse de peça já vendida."
      );
    }

    if (produto.repassadoEm) {
      throw new Error(
        "Esse repasse já foi marcado (talvez em outra aba). Atualize a tela."
      );
    }

    if (produto.percentualRepasse === null) {
      throw new Error(
        "Defina o % de repasse antes de marcar."
      );
    }

    const percentual = Number(produto.percentualRepasse);

    const venda = (
      await this.repository.findVendasMaisRecentes([id])
    ).get(id);

    return {
      percentual,
      repasse: calcularRepasse(
        venda?.base ?? Number(produto.preco),
        percentual
      ),
    };
  }

  private montarLinha(
    produto: ProdutoConsignado,
    venda: { base: number; data: Date } | null
  ): ConsignadoLinha {
    const statusRepasse = obterStatusRepasse(produto);

    const percentual =
      produto.percentualRepasse === null
        ? null
        : Number(produto.percentualRepasse);

    const precoTabela =
      produto.status === "VENDIDO" && venda
        ? venda.base
        : Number(produto.preco);

    let repasse: number | null = null;

    if (statusRepasse === "REPASSADO") {
      repasse =
        produto.valorRepassado === null
          ? null
          : Number(produto.valorRepassado);
    } else if (percentual !== null) {
      repasse = calcularRepasse(precoTabela, percentual);
    }

    return {
      id: produto.id,
      referencia: produto.referencia ?? "",
      nome: produto.nome,
      consignante: produto.consignante ?? "",
      statusRepasse,
      precoTabela,
      dataVenda:
        produto.status === "VENDIDO" && venda
          ? venda.data.toISOString()
          : null,
      percentual,
      repasse,
      repassadoEm: produto.repassadoEm
        ? produto.repassadoEm.toISOString()
        : null,
    };
  }

  private calcularTotais(
    linhas: ConsignadoLinha[]
  ): TotaisConsignados {
    const aRepassar = linhas.filter(
      (linha) => linha.statusRepasse === "A_REPASSAR"
    );
    const repassadas = linhas.filter(
      (linha) => linha.statusRepasse === "REPASSADO"
    );

    return {
      aRepassarQtd: aRepassar.length,
      aRepassarValor: somar(
        aRepassar.flatMap((linha) =>
          linha.repasse === null ? [] : [linha.repasse]
        )
      ),
      repassadoQtd: repassadas.length,
      repassadoValor: somar(
        repassadas.flatMap((linha) =>
          linha.repasse === null ? [] : [linha.repasse]
        )
      ),
      semPercentualQtd: linhas.filter(
        (linha) => linha.percentual === null
      ).length,
    };
  }

  private agrupar(
    linhas: ConsignadoLinha[],
    status: NonNullable<FiltroConsignados["status"]>
  ): GrupoConsignante[] {
    const porConsignante = new Map<string, ConsignadoLinha[]>();

    for (const linha of linhas) {
      const lista = porConsignante.get(linha.consignante) ?? [];
      lista.push(linha);
      porConsignante.set(linha.consignante, lista);
    }

    const passaNoFiltro = (linha: ConsignadoLinha) => {
      if (status === "TODOS") return true;
      if (status === "SEM_PERCENTUAL") {
        return linha.percentual === null;
      }
      return linha.statusRepasse === status;
    };

    return [...porConsignante.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .flatMap(([consignante, todas]) => {
        const visiveis = todas
          .filter(passaNoFiltro)
          .sort(compararLinhas);

        if (visiveis.length === 0) {
          return [];
        }

        const aRepassar = todas.filter(
          (linha) => linha.statusRepasse === "A_REPASSAR"
        );
        const repassaveis = aRepassar.filter(
          (linha) => linha.percentual !== null
        );

        return [
          {
            consignante,
            linhas: visiveis,
            aRepassarQtd: aRepassar.length,
            aRepassarValor: somar(
              repassaveis.flatMap((linha) =>
                linha.repasse === null ? [] : [linha.repasse]
              )
            ),
            repassaveisQtd: repassaveis.length,
            repassaveisValor: somar(
              repassaveis.flatMap((linha) =>
                linha.repasse === null ? [] : [linha.repasse]
              )
            ),
            repassaveisIds: repassaveis.map((linha) => linha.id),
          },
        ];
      });
  }
}

/** Venda mais recente primeiro; sem data (em estoque / sem venda) depois, por referência. */
function compararLinhas(
  a: ConsignadoLinha,
  b: ConsignadoLinha
) {
  const dataA = a.dataVenda
    ? new Date(a.dataVenda).getTime()
    : 0;
  const dataB = b.dataVenda
    ? new Date(b.dataVenda).getTime()
    : 0;

  if (dataA !== dataB) {
    return dataB - dataA;
  }

  return a.referencia.localeCompare(b.referencia, "pt-BR", {
    numeric: true,
  });
}
