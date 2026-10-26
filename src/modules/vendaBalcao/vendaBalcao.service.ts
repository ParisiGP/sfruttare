import { ProdutoRepository } from "@/modules/produto/produto.repository";
import { ReservaRepository } from "@/modules/reserva/reserva.repository";
import { converterPeriodo } from "@/lib/periodo";

import { VendaBalcaoRepository } from "./vendaBalcao.repository";
import type { VendaBalcaoListFilters } from "./vendaBalcao.repository";
import { confirmarVendaBalcaoSchema } from "./vendaBalcao.schema";
import { calcularTotalComJuros } from "./tabelaJurosMaquininha";
import { calcularDescontoAplicado } from "./desconto";
import {
  chaveDoCliente,
  mesclarClientes,
} from "./clientes";
import { paraProdutoBalcaoResumo } from "./produtoBalcao.mapper";
import {
  obterPagamentosDaVenda,
  resumirPagamentos,
} from "./pagamentos";
import type {
  ClienteBalcaoResumo,
  ConfirmarVendaBalcaoInput,
  FiltroHistoricoBalcao,
  FormaPagamentoBalcao,
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
      new ProdutoRepository(),
    private reservaRepository =
      new ReservaRepository()
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

    return produtos.map(paraProdutoBalcaoResumo);
  }

  /**
   * Autocomplete de cliente. Não existe model `Cliente` dedicado: a
   * fonte é o histórico de `VendaBalcao` **e** de `Reserva` (quem só
   * reservou e nunca comprou também aparece), juntados por nome
   * normalizado — ver `mesclarClientes` pra regra de "valor mais
   * recente" por campo.
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

    const clientes =
      await this.carregarClientes(termoLimpo);

    return clientes.slice(0, MAXIMO_SUGESTOES_CLIENTE);
  }

  /**
   * Cliente com exatamente esse nome (normalizado), com os dados mais
   * recentes de todas as origens — usado pra completar o e-mail quando
   * uma reserva é convertida em venda.
   */
  async obterClientePorNome(
    nome: string
  ): Promise<ClienteBalcaoResumo | null> {
    const chave = chaveDoCliente(nome);

    if (!chave) {
      return null;
    }

    const clientes = await this.carregarClientes(
      nome.trim()
    );

    return (
      clientes.find(
        (cliente) =>
          chaveDoCliente(cliente.nomeCliente) === chave
      ) ?? null
    );
  }

  private async carregarClientes(termo: string) {
    const [vendas, reservas] = await Promise.all([
      this.vendaBalcaoRepository.findClientesPorNome(
        termo
      ),
      this.reservaRepository.findClientesPorNome(
        termo
      ),
    ]);

    return mesclarClientes([
      ...vendas,
      ...reservas.map((reserva) => ({
        ...reserva,
        emailCliente: null,
      })),
    ]);
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

      if (
        produto.status !== "DISPONIVEL" &&
        produto.status !== "RESERVADO"
      ) {
        throw new Error(
          `A peça "${produto.nome}" já foi vendida. Remova-a do carrinho e tente novamente.`
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

    // O total vem sempre do servidor — nunca se confia no valor que o
    // cliente (a tela) calculou. A soma das linhas de pagamento tem
    // que bater com ele em centavos, senão a venda é recusada.
    const somaPagamentosEmCentavos =
      dadosValidados.pagamentos.reduce(
        (soma, pagamento) =>
          soma + Math.round(pagamento.valor * 100),
        0
      );

    if (
      somaPagamentosEmCentavos !==
      Math.round(total * 100)
    ) {
      throw new Error(
        "A soma dos pagamentos não bate com o total da venda."
      );
    }

    // Os juros da maquininha incidem só na parte paga no crédito
    // parcelado — nunca sobre Pix/Dinheiro/Débito — e sobre o próprio
    // valor da linha (já com o desconto aplicado). Arredonda em
    // centavos por linha pra a soma gravada bater com as linhas.
    const pagamentos = dadosValidados.pagamentos.map(
      (pagamento) => ({
        forma: pagamento.forma,
        valor: pagamento.valor,
        parcelas: pagamento.parcelas,
        valorComJuros:
          pagamento.forma === "CREDITO" &&
          pagamento.parcelas > 1
            ? Math.round(
                calcularTotalComJuros(
                  pagamento.valor,
                  pagamento.parcelas
                ) * 100
              ) / 100
            : null,
      })
    );

    const {
      formaPagamento,
      parcelas,
      totalComJuros,
    } = resumirPagamentos(pagamentos);

    const venda =
      await this.vendaBalcaoRepository.create({
        nomeCliente: dadosValidados.nomeCliente,
        emailCliente:
          dadosValidados.emailCliente || undefined,
        telefoneCliente:
          dadosValidados.telefoneCliente ||
          undefined,
        parcelas,
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
        formaPagamento,
        pagamentos,
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
    const resultado: VendaBalcaoListFilters =
      converterPeriodo(filtros);

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
    formaPagamento: string | null;
    pagamentos: {
      forma: string;
      valor: unknown;
      parcelas: number;
      valorComJuros: unknown;
    }[];
    createdAt: Date;
    itens: {
      id: string;
      nomeProduto: string;
      precoUnitario: unknown;
      produto: { referencia: string | null } | null;
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
      formaPagamento:
        venda.formaPagamento as
          | FormaPagamentoBalcao
          | null,
      pagamentos: obterPagamentosDaVenda(venda),
      createdAt: venda.createdAt,
      itens: venda.itens.map((item) => {
        const devolucao = item.devolucoes[0];

        return {
          id: item.id,
          nomeProduto: item.nomeProduto,
          referencia:
            item.produto?.referencia ?? "",
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
