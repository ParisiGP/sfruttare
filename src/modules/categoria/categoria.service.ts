import { CategoriaRepository } from "./categoria.repository";
import {
  categoriaSchema,
  CategoriaInput,
} from "./categoria.schema";

export class CategoriaService {
  constructor(
    private categoriaRepository =
      new CategoriaRepository()
  ) { }

  async listarCategorias() {
    return this.categoriaRepository.findAll();
  }

  async criarCategoria(data: CategoriaInput) {
    const dadosValidados =
      categoriaSchema.parse(data);

    const categoriaExistente =
      await this.categoriaRepository.findByName(
        dadosValidados.nome
      );

    if (categoriaExistente) {
      throw new Error(
        "Categoria já cadastrada"
      );
    }

    return this.categoriaRepository.create(
      dadosValidados.nome
    );
  }

  async excluirCategoria(id: string) {
    const categoria =
      await this.categoriaRepository.findByIdWithCount(id);

    const produtos =
      await this.categoriaRepository
        .findProdutosByCategoriaId(id);

    if (!categoria) {
      throw new Error(
        "Categoria não encontrada"
      );
    }

    if (produtos.length > 0) {
      const nomes = produtos
        .slice(0, 5)
        .map((p) => p.nome)
        .join(", ");

      const restantes =
        produtos.length - 5;

      throw new Error(
        restantes > 0
          ? `Esta categoria possui produtos vinculados: ${nomes} e mais ${restantes}.`
          : `Esta categoria possui produtos vinculados: ${nomes}.`
      );
    }

    await this.categoriaRepository.delete(id);
  }

  async editarCategoria(
    id: string,
    data: CategoriaInput
  ) {
    const dadosValidados =
      categoriaSchema.parse(data);
    const categoriaExistente =
      await this.categoriaRepository.findByName(
        dadosValidados.nome
      );

    if (
      categoriaExistente &&
      categoriaExistente.id !== id
    ) {
      throw new Error(
        "Categoria já cadastrada"
      );
    }
    return this.categoriaRepository.edit(
      id,
      dadosValidados.nome
    );
  }

}