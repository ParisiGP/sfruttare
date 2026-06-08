import { CategoriaRepository } from "./categoria.repository";
import {
  categoriaSchema,
  CategoriaInput,
} from "./categoria.schema";

export class CategoriaService {
  constructor(
    private categoriaRepository =
      new CategoriaRepository()
  ) {}

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
    return this.categoriaRepository.delete(id);
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
    if (categoriaExistente) {
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