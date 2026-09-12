import { ProdutoRepository } from "@/modules/produto/produto.repository";

import { VendaBalcaoRepository } from "./vendaBalcao.repository";
import { confirmarVendaBalcaoSchema } from "./vendaBalcao.schema";
import { calcularTotalComJuros } from "./tabelaJurosMaquininha";
import type {
  ConfirmarVendaBalcaoInput,
  ProdutoBalcaoResumo,
  VendaBalcaoResumo,
} from "./vendaBalcao.types";

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

    const total = subtotal;

    const totalComJuros = calcularTotalComJuros(
      subtotal,
      dadosValidados.parcelas
    );

    const venda =
      await this.vendaBalcaoRepository.create({
        nomeCliente: dadosValidados.nomeCliente,
        emailCliente:
          dadosValidados.emailCliente || undefined,
        parcelas: dadosValidados.parcelas,
        subtotal,
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

  async listarVendas(): Promise<
    VendaBalcaoResumo[]
  > {
    const vendas =
      await this.vendaBalcaoRepository.findAll();

    return vendas.map((venda) =>
      this.serializeVenda(venda)
    );
  }

  private serializeVenda(venda: {
    id: string;
    nomeCliente: string;
    emailCliente: string | null;
    parcelas: number;
    subtotal: unknown;
    total: unknown;
    totalComJuros: unknown;
    createdAt: Date;
    itens: {
      id: string;
      nomeProduto: string;
      precoUnitario: unknown;
    }[];
  }): VendaBalcaoResumo {
    return {
      id: venda.id,
      nomeCliente: venda.nomeCliente,
      emailCliente: venda.emailCliente ?? "",
      parcelas: venda.parcelas,
      subtotal: Number(venda.subtotal),
      total: Number(venda.total),
      totalComJuros:
        venda.totalComJuros === null
          ? null
          : Number(venda.totalComJuros),
      createdAt: venda.createdAt,
      itens: venda.itens.map((item) => ({
        id: item.id,
        nomeProduto: item.nomeProduto,
        precoUnitario: Number(
          item.precoUnitario
        ),
      })),
    };
  }
}
