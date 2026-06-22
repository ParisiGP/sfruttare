import { ProdutoRepository } from "./produto.repository";
import {
  alterarStatusProdutoSchema,
  editarProdutoSchema,
  produtoSchema,
  type EditarProdutoInput,
  type ProdutoInput,
} from "./produto.schema";
import type {
  ProdutoAdminItem,
  ProdutoListFilters,
  ProdutoStatus,
} from "./produto.types";

export class ProdutoService {
  constructor(
    private produtoRepository =
      new ProdutoRepository()
  ) {}

  async criarProduto(data: ProdutoInput) {
    const dadosValidados =
      produtoSchema.parse(data);

    const slug =
      await this.generateUniqueSlug(
        dadosValidados.nome
      );

    return this.produtoRepository.create({
      ...dadosValidados,
      slug,
    });
  }

  async editarProduto(data: EditarProdutoInput) {
    const dadosValidados =
      editarProdutoSchema.parse(data);

    const produtoExistente =
      await this.produtoRepository.findById(
        dadosValidados.id
      );

    if (!produtoExistente) {
      throw new Error("Produto nao encontrado.");
    }

    const slug =
      await this.generateUniqueSlug(
        dadosValidados.nome,
        dadosValidados.id
      );

    const { id, ...produto } =
      dadosValidados;

    return this.produtoRepository.update(id, {
      ...produto,
      slug,
    });
  }

  async listarProdutos(
    filters: ProdutoListFilters = {}
  ) {
    return this.produtoRepository.findManyPaginated(
      filters
    );
  }

  async listarTodosProdutos() {
    return this.produtoRepository.findAll();
  }

  async obterMetricas() {
    return this.produtoRepository.metrics();
  }

  async alterarStatusProduto(
    id: string,
    status: ProdutoStatus
  ) {
    const dadosValidados =
      alterarStatusProdutoSchema.parse({
        id,
        status,
      });

    return this.produtoRepository.updateStatus(
      dadosValidados.id,
      dadosValidados.status
    );
  }

  async excluirProduto(id: string) {
    const temPedidos =
      await this.produtoRepository.hasPedidoItens(id);

    if (temPedidos) {
      throw new Error(
        "Este produto possui pedidos vinculados. Altere o status para vendido em vez de excluir."
      );
    }

    return this.produtoRepository.delete(id);
  }

  serializeProduto(produto: {
    id: string;
    nome: string;
    slug: string;
    descricao?: string | null;
    marca?: string | null;
    tamanho?: string | null;
    preco: unknown;
    estoque: number;
    categoriaId: string;
    categoria: {
      nome: string;
    };
    tipo: "BRECHO" | "NA_ETIQUETA";
    status: "DISPONIVEL" | "RESERVADO" | "VENDIDO";
    imagens: {
      id: string;
      publicId: string;
      url: string;
      ordem: number;
    }[];
    createdAt: Date;
    updatedAt: Date;
  }): ProdutoAdminItem {
    return {
      id: produto.id,
      nome: produto.nome,
      slug: produto.slug,
      descricao: produto.descricao ?? "",
      marca: produto.marca ?? "",
      tamanho: produto.tamanho ?? "",
      preco: Number(produto.preco),
      estoque: produto.estoque,
      categoriaId: produto.categoriaId,
      categoria: {
        nome: produto.categoria.nome,
      },
      tipo: produto.tipo,
      status: produto.status,
      imagens: produto.imagens.map((imagem) => ({
        id:imagem.publicId,
        publicId: imagem.publicId,
        url: imagem.url,
        ordem: imagem.ordem,
      })),
      createdAt: produto.createdAt.toISOString(),
      updatedAt: produto.updatedAt.toISOString(),
    };
  }

  private async generateUniqueSlug(
    nome: string,
    ignoreId?: string
  ) {
    const baseSlug =
      this.slugify(nome);

    let slug =
      baseSlug;

    let suffix =
      2;

    while (true) {
      const existing =
        await this.produtoRepository.findBySlug(slug);

      if (!existing || existing.id === ignoreId) {
        return slug;
      }

      slug = `${baseSlug}-${suffix}`;
      suffix += 1;
    }
  }

  private slugify(value: string) {
    return value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }
}
