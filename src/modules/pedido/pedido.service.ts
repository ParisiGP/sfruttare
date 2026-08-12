import { CarrinhoService } from "@/modules/carrinho/carrinho.service";

import { PedidoRepository } from "./pedido.repository";
import { criarPedidoSchema } from "./pedido.schema";
import type {
  PedidoResumo,
  PedidoStatus,
} from "./pedido.types";

export class PedidoService {
  constructor(
    private pedidoRepository =
      new PedidoRepository(),
    private carrinhoService =
      new CarrinhoService()
  ) { }

  /**
   * Cria o Pedido a partir do carrinho atual do usuário e esvazia o
   * carrinho em seguida. Não tem caller na UI ainda — será chamado
   * pelo handler do webhook do Mercado Pago (Sprint 3), depois que o
   * pagamento for confirmado. Nunca deve ser chamado antes disso.
   */
  async criarPedidoAPartirDoCarrinho(
    usuarioId: string,
    enderecoId: string,
    frete: number
  ) {
    const dadosValidados =
      criarPedidoSchema.parse({
        enderecoId,
        frete,
      });

    const resumoCarrinho =
      await this.carrinhoService.obterResumo(
        usuarioId
      );

    if (resumoCarrinho.itens.length === 0) {
      throw new Error(
        "O carrinho está vazio."
      );
    }

    const possuiItemIndisponivel =
      resumoCarrinho.itens.some(
        (item) => !item.disponivel
      );

    if (possuiItemIndisponivel) {
      throw new Error(
        "Existem itens indisponíveis no carrinho. Revise antes de continuar."
      );
    }

    const total =
      resumoCarrinho.subtotal +
      dadosValidados.frete;

    const pedido =
      await this.pedidoRepository.create({
        usuarioId,
        enderecoId: dadosValidados.enderecoId,
        frete: dadosValidados.frete,
        total,
        itens: resumoCarrinho.itens.map(
          (item) => ({
            produtoId: item.produto.id,
            quantidade: item.quantidade,
            precoUnitario: item.precoUnitario,
          })
        ),
      });

    await this.carrinhoService.esvaziarCarrinho(
      usuarioId
    );

    return pedido;
  }

  async listarPedidos(
    usuarioId: string
  ): Promise<PedidoResumo[]> {
    const pedidos =
      await this.pedidoRepository.findManyByUsuarioId(
        usuarioId
      );

    return pedidos.map((pedido) =>
      this.serializePedido(pedido)
    );
  }

  async obterPedido(
    id: string
  ): Promise<PedidoResumo | null> {
    const pedido =
      await this.pedidoRepository.findById(id);

    return pedido
      ? this.serializePedido(pedido)
      : null;
  }

  private serializePedido(pedido: {
    id: string;
    status: string;
    frete: unknown;
    total: unknown;
    createdAt: Date;
    itens: {
      produto: {
        nome: string;
      };
      quantidade: number;
      precoUnitario: unknown;
    }[];
  }): PedidoResumo {
    return {
      id: pedido.id,
      status: pedido.status as PedidoStatus,
      frete: Number(pedido.frete),
      total: Number(pedido.total),
      createdAt: pedido.createdAt,
      itens: pedido.itens.map((item) => ({
        produtoNome: item.produto.nome,
        quantidade: item.quantidade,
        precoUnitario: Number(
          item.precoUnitario
        ),
      })),
    };
  }
}
