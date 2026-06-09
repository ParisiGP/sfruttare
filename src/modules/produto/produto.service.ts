import { ProdutoRepository } from "./produto.repository";
import {
    produtoSchema,
    ProdutoInput,
} from "./produto.schema";

export class ProdutoService {
    constructor(
        private produtoRepository =
            new ProdutoRepository()
    ) { }

    async criarProduto(
        data: ProdutoInput
    ) {
        const dadosValidados =
            produtoSchema.parse(data);

        const slug =
            dadosValidados.nome
                .toLowerCase()
                .trim()
                .replaceAll(" ", "-");

        const estoque =
            dadosValidados.estoque ?? 1;

        return this.produtoRepository.create({
            ...dadosValidados,
            slug,
            estoque,
        });
    }
    async listarProdutos() {
        return this.produtoRepository.findAll();
    }

    async excluirProduto(id: string) {
        return this.produtoRepository.delete(id);
    }

}