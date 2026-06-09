"use server";

import { revalidatePath } from "next/cache";

import { ProdutoService } from "./produto.service";

const produtoService =
    new ProdutoService();

export async function criarProduto(
    formData: FormData
) {
    const nome = formData.get("nome");

    const descricao =
        formData.get("descricao");

    const marca =
        formData.get("marca");

    const tamanho =
        formData.get("tamanho");

    const preco =
        formData.get("preco");

    const estoque =
        formData.get("estoque");

    const categoriaId =
        formData.get("categoriaId");

    const tipo =
        formData.get("tipo");

    await produtoService.criarProduto({
        nome: String(nome),
        descricao: String(descricao || ""),
        marca: String(marca || ""),
        tamanho: String(tamanho || ""),
        preco: Number(preco),
        estoque: Number(estoque),
        categoriaId: String(categoriaId),
        tipo:
            tipo === "NA_ETIQUETA"
                ? "NA_ETIQUETA"
                : "BRECHO",
    });

    revalidatePath("/admin/produtos");
}

export async function excluirProduto(
    formData: FormData
) {
    const id = formData.get("id");
    await produtoService.excluirProduto(String(id));
    revalidatePath("/admin/produtos");
}