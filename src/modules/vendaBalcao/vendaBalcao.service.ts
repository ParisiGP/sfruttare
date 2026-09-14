import { ProdutoRepository } from "@/modules/produto/produto.repository";

import { VendaBalcaoRepository } from "./vendaBalcao.repository";
import type { VendaBalcaoListFilters } from "./vendaBalcao.repository";
import { confirmarVendaBalcaoSchema } from "./vendaBalcao.schema";
import { calcularTotalComJuros } from "./tabelaJurosMaquininha";
import { calcularDescontoAplicado } from "./desconto";
import type {
  ClienteBalcaoResumo,
  ConfirmarVendaBalcaoInput,
  FiltroHistoricoBalcao,
  HistoricoBalcaoResultado,
  ProdutoBalcaoResumo,
  VendaBalcaoCandidataResumo,
  VendaBalcaoResumo,
} from "./vendaBalcao.types";

const MINIMO_CARACTERES_BUSCA_CLIENTE = 2;
const MAXIMO_SUGESTOES_CLIENTE = 6;

export class VendaBalcaoService {
  constructor(
    private vendaBalcaoRepository =
      new VendaBalcaoRepository(),
    private produtoRepository =
      new ProdutoRepository()
  ) { }

  async buscarProdutosDisponiveis(
    busca: string
  ): Promise<ProdutoBalcaoResumo[]> {
    const termo = busca.trim();

    if (!termo) {
      return [];
    }

    const produtos =
      await this.produtoRepository.findDisponiveisParaBalcao(
        termo
      );

    return produtos.map((produto) => ({
      id: produto.id,
      nome: produto.nome,
      referencia: produto.referencia ?? "",
      preco: Number(produto.preco),
      cor: produto.cor ?? "",
      tamanho: produto.tamanho ?? "",
      imagemUrl:
        produto.imagens[0]?.url ?? null,
    }));
  }

  /**
   * Autocomplete de cliente a partir do próprio histórico de
   * `VendaBalcao` — não existe model `Cliente` dedicado. Deduplica por
   * nome normalizado mantendo a venda mais recente de cada cliente
   * (a query já vem ordenada por `createdAt desc`).
   */
  async buscarClientes(
    termo: string
  ): Promise<ClienteBalcaoResumo[]> {
    const termoLimpo = termo.trim();

    if (
      termoLimpo.length < MINIMO_CARACTERES_BUSCA_CLIENTE
    ) {
      return [];
    }

    const vendas =
      await this.vendaBalcaoRepository.findClientesPorNome(
        termoLimpo
      );

    const nomesVistos = new Set<string>();
    const resultado: ClienteBalcaoResumo[] = [];

    for (const venda of vendas) {
      const chave = venda.nomeCliente
        .trim()
        .toLowerCase();

      if (nomesVistos.has(chave)) {
        continue;
      }

      nomesVistos.add(chave);

      resultado.push({
        nomeCliente: venda.nomeCliente,
        emailCliente: venda.emailCliente ?? "",
        telefoneCliente:
          venda.telefoneCliente ?? "",
      });

      if (
        resultado.length >=
        MAXIMO_SUGESTOES_CLIENTE
      ) {
        break;
      }
    }

    return resultado;
  }

  async confirmarVenda(
    input: ConfirmarVendaBalcaoInput
  ) {
    const dadosValidados =
      confirmarVendaBalcaoSchema.parse(input);

    // Remove ids repetidos: cada Produto é uma peça física única, não
    // faz sentido "vender" o mesmo id duas vezes na mesma venda.
    const produtoIdsUnicos = Array.from(
      new Set(dadosValidados.produtoIds)
    );

    const produtos =
      await this.produtoRepository.findManyPorIds(
        produtoIdsUnicos
      );

    const produtosPorId = new Map(
      produtos.map((produto) => [
        produto.id,
        produto,
      ])
    );

    for (const produtoId of produtoIdsUnicos) {
      const produto =
        produtosPorId.get(produtoId);

      if (!produto) {
        throw new Error(
          "Uma das peças do carrinho não foi encontrada. Remova-a e tente novamente."
        );
      }

      if (produto.status !== "DISPONIVEL") {
        throw new Error(
          `A peça "${produto.nome}" já foi vendida ou reservada. Remova-a do carrinho e tente novamente.`
        );
      }
    }

    const subtotal = produtoIdsUnicos.reduce(
      (soma, produtoId) =>
        soma +
        Number(
          produtosPorId.get(produtoId)!.preco
        ),
      0
    );

    const descontoAplicado =
      calcularDescontoAplicado(
        subtotal,
        dadosValidados.descontoTipo,
        dadosValidados.descontoEntrada
      );

    if (descontoAplicado > subtotal) {
      throw new Error(
        "O desconto não pode ser maior que o subtotal da venda."
      );
    }

    const total = subtotal - descontoAplicado;

    // Os juros da maquininha incidem sobre o valor que será de fato
    // cobrado do cliente — ou seja, já com o desconto aplicado.
    const totalComJuros = calcularTotalComJuros(
      total,
      dadosValidados.parcelas
    );

    const venda =
      await this.vendaBalcaoRepository.create({
        nomeCliente: dadosValidados.nomeCliente,
        emailCliente:
          dadosValidados.emailCliente || undefined,
        telefoneCliente:
          dadosValidados.telefoneCliente ||
          undefined,
        parcelas: dadosValidados.parcelas,
        subtotal,
        descontoTipo: dadosValidados.descontoTipo,
        descontoEntrada:
          dadosValidados.descontoEntrada,
        descontoAplicado:
          descontoAplicado > 0
            ? descontoAplicado
            : undefined,
        total,
        totalComJuros,
        itens: produtoIdsUnicos.map(
          (produtoId) => {
            const produto =
              produtosPorId.get(produtoId)!;

            return {
              produtoId,
              nomeProduto: produto.nome,
              precoUnitario: Number(
                produto.preco
              ),
            };
          }
        ),
      });

    return this.serializeVenda(venda);
  }

  async listarVendas(
    filtros: FiltroHistoricoBalcao = {}
  ): Promise<HistoricoBalcaoResultado> {
    const vendas =
      await this.vendaBalcaoRepository.findAll(
        this.montarFiltroData(filtros)
      );

    const vendasSerializadas = vendas.map(
      (venda) => this.serializeVenda(venda)
    );

    const totalLiquido =
      vendasSerializadas.reduce(
        (soma, venda) =>
          soma + this.calcularLiquidoDaVenda(venda),
        0
      );

    return {
      vendas: vendasSerializadas,
      totalLiquido,
    };
  }

  async buscarVendasParaTroca(
    nomeCliente: string,
    excluirVendaId: string
  ): Promise<VendaBalcaoCandidataResumo[]> {
    const termo = nomeCliente.trim();

    if (!termo) {
      return [];
    }

    const vendas =
      await this.vendaBalcaoRepository.findCandidatasParaTroca(
        termo,
        excluirVendaId
      );

    return vendas.map((venda) => ({
      id: venda.id,
      nomeCliente: venda.nomeCliente,
      total: Number(venda.total),
      itens: venda.itens.map(
        (item) => item.nomeProduto
      ),
      createdAt: venda.createdAt,
    }));
  }

  private montarFiltroData(
    filtros: FiltroHistoricoBalcao
  ): VendaBalcaoListFilters {
    const resultado: VendaBalcaoListFilters = {};

    if (filtros.dataInicial) {
      resultado.dataInicial = new Date(
        `${filtros.dataInicial}T00:00:00`
      );
    }

    if (filtros.dataFinal) {
      resultado.dataFinal = new Date(
        `${filtros.dataFinal}T23:59:59.999`
      );
    }

    if (filtros.nomeCliente?.trim()) {
      resultado.nomeCliente =
        filtros.nomeCliente.trim();
    }

    return resultado;
  }

  /**
   * Efeito líquido de uma venda no período: o `total` gravado na hora
   * da venda (já com desconto), menos o `valorDevolvido` de cada peça
   * devolvida ou trocada. Numa troca, a "peça nova" é uma venda
   * inteira à parte que já entra na soma geral com o próprio `total`
   * dela — então o único ajuste necessário aqui é tirar o valor da
   * peça original que saiu, senão a receita ficaria contada em
   * dobro (a venda original inteira + a venda de troca inteira).
   * `diferencaValor` fica só como informação pro admin conferir a
   * troca, não entra nessa conta.
   */
  private calcularLiquidoDaVenda(
    venda: VendaBalcaoResumo
  ): number {
    const ajusteDevolucoes = venda.itens.reduce(
      (soma, item) =>
        item.devolucao
          ? soma - item.devolucao.valorDevolvido
          : soma,
      0
    );

    return venda.total + ajusteDevolucoes;
  }

  private serializeVenda(venda: {
    id: string;
    nomeCliente: string;
    emailCliente: string | null;
    telefoneCliente: string | null;
    parcelas: number;
    subtotal: unknown;
    descontoTipo: string | null;
    descontoEntrada: unknown;
    descontoAplicado: unknown;
    total: unknown;
    totalComJuros: unknown;
    createdAt: Date;
    itens: {
      id: string;
      nomeProduto: string;
      precoUnitario: unknown;
      devolucoes: {
        id: string;
        tipo: string;
        valorDevolvido: unknown;
        vendaTrocaId: string | null;
        vendaTroca: {
          nomeCliente: string;
          total: unknown;
          createdAt: Date;
        } | null;
        diferencaValor: unknown;
        motivo: string | null;
        createdAt: Date;
      }[];
    }[];
  }): VendaBalcaoResumo {
    return {
      id: venda.id,
      nomeCliente: venda.nomeCliente,
      emailCliente: venda.emailCliente ?? "",
      telefoneCliente:
        venda.telefoneCliente ?? "",
      parcelas: venda.parcelas,
      subtotal: Number(venda.subtotal),
      descontoTipo:
        (venda.descontoTipo as
          | "VALOR"
          | "PERCENTUAL"
          | null) ?? null,
      descontoEntrada:
        venda.descontoEntrada === null
          ? null
          : Number(venda.descontoEntrada),
      descontoAplicado:
        venda.descontoAplicado === null
          ? null
          : Number(venda.descontoAplicado),
      total: Number(venda.total),
      totalComJuros:
        venda.totalComJuros === null
          ? null
          : Number(venda.totalComJuros),
      createdAt: venda.createdAt,
      itens: venda.itens.map((item) => {
        const devolucao = item.devolucoes[0];

        return {
          id: item.id,
          nomeProduto: item.nomeProduto,
          precoUnitario: Number(
            item.precoUnitario
          ),
          devolucao: devolucao
            ? {
                id: devolucao.id,
                tipo: devolucao.tipo as
                  | "DEVOLUCAO"
                  | "TROCA",
                valorDevolvido: Number(
                  devolucao.valorDevolvido
                ),
                vendaTrocaId:
                  devolucao.vendaTrocaId,
                vendaTrocaResumo:
                  devolucao.vendaTroca
                    ? {
                        nomeCliente:
                          devolucao.vendaTroca
                            .nomeCliente,
                        total: Number(
                          devolucao.vendaTroca
                            .total
                        ),
                        createdAt:
                          devolucao.vendaTroca
                            .createdAt,
                      }
                    : null,
                diferencaValor:
                  devolucao.diferencaValor ===
                  null
                    ? null
                    : Number(
                        devolucao.diferencaValor
                      ),
                motivo: devolucao.motivo,
                createdAt: devolucao.createdAt,
              }
            : null,
        };
      }),
    };
  }
}
