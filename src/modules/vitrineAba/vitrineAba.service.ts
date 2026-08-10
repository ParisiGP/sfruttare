import { VitrineAbaRepository } from "./vitrineAba.repository";
import {
  vitrineAbaSchema,
  type VitrineAbaInput,
} from "./vitrineAba.schema";
import type {
  VitrineAbaAdminItem,
  VitrineAbaPublica,
} from "./vitrineAba.types";

export class VitrineAbaService {
  constructor(
    private vitrineAbaRepository =
      new VitrineAbaRepository()
  ) { }

  async listarAbasAdmin(): Promise<
    VitrineAbaAdminItem[]
  > {
    const abas =
      await this.vitrineAbaRepository.findAll();

    return abas.map((aba) => ({
      id: aba.id,
      nome: aba.nome,
      slug: aba.slug,
      ordem: aba.ordem,
      ativo: aba.ativo,
      totalProdutos: aba._count.produtos,
    }));
  }

  async listarAbasPublicas(): Promise<
    VitrineAbaPublica[]
  > {
    const abas =
      await this.vitrineAbaRepository.findAllAtivasComProdutos();

    return abas
      .filter((aba) => aba.produtos.length > 0)
      .map((aba) => ({
        id: aba.id,
        nome: aba.nome,
        slug: aba.slug,
        produtos: aba.produtos.map(
          (vinculo) => ({
            id: vinculo.produto.id,
            nome: vinculo.produto.nome,
            slug: vinculo.produto.slug,
            referencia:
              vinculo.produto.referencia ?? "",
            preco: Number(vinculo.produto.preco),
            categoria: {
              nome: vinculo.produto.categoria.nome,
            },
            imagemUrl:
              vinculo.produto.imagens[0]?.url ?? null,
          })
        ),
      }));
  }

  async findProdutoIdsDaAba(abaId: string) {
    return this.vitrineAbaRepository.findProdutoIdsDaAba(
      abaId
    );
  }

  async criarAba(data: VitrineAbaInput) {
    const dadosValidados =
      vitrineAbaSchema.parse(data);

    const abaExistente =
      await this.vitrineAbaRepository.findByName(
        dadosValidados.nome
      );

    if (abaExistente) {
      throw new Error("Aba já cadastrada.");
    }

    const slug =
      await this.generateUniqueSlug(
        dadosValidados.nome
      );

    return this.vitrineAbaRepository.create({
      ...dadosValidados,
      slug,
    });
  }

  async editarAba(
    id: string,
    data: VitrineAbaInput
  ) {
    const dadosValidados =
      vitrineAbaSchema.parse(data);

    const abaExistente =
      await this.vitrineAbaRepository.findByName(
        dadosValidados.nome
      );

    if (
      abaExistente &&
      abaExistente.id !== id
    ) {
      throw new Error("Aba já cadastrada.");
    }

    const abaAtual =
      await this.vitrineAbaRepository.findById(id);

    if (!abaAtual) {
      throw new Error("Aba não encontrada.");
    }

    const slug =
      abaAtual.nome === dadosValidados.nome
        ? abaAtual.slug
        : await this.generateUniqueSlug(
          dadosValidados.nome,
          id
        );

    return this.vitrineAbaRepository.update(id, {
      ...dadosValidados,
      slug,
    });
  }

  async excluirAba(id: string) {
    return this.vitrineAbaRepository.delete(id);
  }

  async reordenarAbas(
    abas: {
      id: string;
      ordem: number;
    }[]
  ) {
    await this.vitrineAbaRepository.updateOrder(
      abas
    );
  }

  async atualizarProdutosDaAba(
    abaId: string,
    produtoIds: string[]
  ) {
    await this.vitrineAbaRepository.setProdutos(
      abaId,
      produtoIds
    );
  }

  private async generateUniqueSlug(
    nome: string,
    ignoreId?: string
  ) {
    const baseSlug =
      this.slugify(nome) || "aba";

    let slug =
      baseSlug;

    let suffix =
      2;

    while (true) {
      const existing =
        await this.vitrineAbaRepository.findBySlug(
          slug
        );

      if (
        !existing ||
        existing.id === ignoreId
      ) {
        return slug;
      }

      slug = `${baseSlug}-${suffix}`;
      suffix += 1;
    }
  }

  private slugify(value: string) {
    return value
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }
}
