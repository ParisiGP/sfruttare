import { ProdutoRepository } from "@/modules/produto/produto.repository";

import { CarrinhoRepository } from "./carrinho.repository";
import {
  adicionarItemSchema,
  atualizarQuantidadeSchema,
} from "./carrinho.schema";
import type { CarrinhoResumo } from "./carrinho.types";

const carrinhoVazio: CarrinhoResumo = {
  itens: [],
  quantidadeTotal: 0,
  subtotal: 0,
  frete: null,
  total: 0,
};

export class CarrinhoService {
  constructor(
    private carrinhoRepository =
      new CarrinhoRepository(),
    private produtoRepository =
      new ProdutoRepository()
  ) { }

  async obterResumo(
    usuarioId: string
  ): Promise<CarrinhoResumo> {
    const carrinho =
      await this.carrinhoRepository.findComItensByUsuarioId(
        usuarioId
      );

    if (!carrinho) {
      return carrinhoVazio;
    }

    const itens = carrinho.itens.map((item) => {
      const precoUnitario =
        Number(item.produto.preco);

      const subtotal =
        precoUnitario * item.quantidade;

      const disponivel =
        item.produto.status === "DISPONIVEL" &&
        item.quantidade <= item.produto.estoque;

      const imagemPrincipal =
        item.produto.imagens[0];

      return {
        id: item.id,
        produto: {
          id: item.produto.id,
          nome: item.produto.nome,
          slug: item.produto.slug,
          referencia:
            item.produto.referencia ?? "",
          imagemPrincipal: imagemPrincipal
            ? {
              url: imagemPrincipal.url,
              zoom: imagemPrincipal.zoom,
              offsetX: imagemPrincipal.offsetX,
              offsetY: imagemPrincipal.offsetY,
            }
            : null,
          categoria: {
            nome: item.produto.categoria.nome,
          },
        },
        precoUnitario,
        quantidade: item.quantidade,
        subtotal,
        disponivel,
      };
    });

    const quantidadeTotal = itens.reduce(
      (total, item) => total + item.quantidade,
      0
    );

    const subtotal = itens.reduce(
      (total, item) => total + item.subtotal,
      0
    );

    return {
      itens,
      quantidadeTotal,
      subtotal,
      frete: null,
      total: subtotal,
    };
  }

  async contarItens(
    usuarioId: string
  ): Promise<number> {
    const carrinho =
      await this.carrinhoRepository.findComItensByUsuarioId(
        usuarioId
      );

    if (!carrinho) {
      return 0;
    }

    return carrinho.itens.reduce(
      (total, item) => total + item.quantidade,
      0
    );
  }

  async adicionarItem(
    usuarioId: string,
    produtoId: string,
    quantidade: number
  ) {
    const dadosValidados =
      adicionarItemSchema.parse({
        produtoId,
        quantidade,
      });

    const produto =
      await this.produtoRepository.findById(
        dadosValidados.produtoId
      );

    if (!produto) {
      throw new Error(
        "Produto não encontrado."
      );
    }

    if (produto.status !== "DISPONIVEL") {
      throw new Error(
        "Este produto não está disponível no momento."
      );
    }

    if (
      dadosValidados.quantidade >
      produto.estoque
    ) {
      throw new Error(
        "Quantidade solicitada maior que o estoque disponível."
      );
    }

    const carrinho =
      await this.carrinhoRepository.findOrCreateByUsuarioId(
        usuarioId
      );

    return this.carrinhoRepository.upsertItem(
      carrinho.id,
      dadosValidados.produtoId,
      dadosValidados.quantidade
    );
  }

  async atualizarQuantidade(
    usuarioId: string,
    itemId: string,
    quantidade: number
  ) {
    const dadosValidados =
      atualizarQuantidadeSchema.parse({
        itemId,
        quantidade,
      });

    const item =
      await this.carrinhoRepository.findItemById(
        dadosValidados.itemId
      );

    if (
      !item ||
      item.carrinho.usuarioId !== usuarioId
    ) {
      throw new Error(
        "Item não encontrado no seu carrinho."
      );
    }

    const produto =
      await this.produtoRepository.findById(
        item.produtoId
      );

    if (!produto) {
      throw new Error(
        "Produto não encontrado."
      );
    }

    if (
      dadosValidados.quantidade >
      produto.estoque
    ) {
      throw new Error(
        "Quantidade solicitada maior que o estoque disponível."
      );
    }

    return this.carrinhoRepository.updateQuantidade(
      dadosValidados.itemId,
      dadosValidados.quantidade
    );
  }

  async removerItem(
    usuarioId: string,
    itemId: string
  ) {
    const item =
      await this.carrinhoRepository.findItemById(
        itemId
      );

    if (
      !item ||
      item.carrinho.usuarioId !== usuarioId
    ) {
      throw new Error(
        "Item não encontrado no seu carrinho."
      );
    }

    return this.carrinhoRepository.removeItem(
      itemId
    );
  }

  async esvaziarCarrinho(usuarioId: string) {
    const carrinho =
      await this.carrinhoRepository.findOrCreateByUsuarioId(
        usuarioId
      );

    await this.carrinhoRepository.clear(
      carrinho.id
    );
  }
}
