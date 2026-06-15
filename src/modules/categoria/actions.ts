"use server";

import { revalidatePath } from "next/cache";

import { CategoriaService } from "./categoria.service";

import { ZodError } from "zod";

const categoriaService =
  new CategoriaService();

export type CategoriaActionState = {
  ok: boolean;
  message: string;
};

export async function criarCategoria(
  prevState: CategoriaActionState,
  formData: FormData
): Promise<CategoriaActionState> {
  try {
    const nome = formData.get("nome");

    await categoriaService.criarCategoria({
      nome: String(nome),
    });

    revalidatePath("/admin/categorias");

    return {
      ok: true,
      message:
        "Categoria criada com sucesso",
    };
  } catch (error) {
     if (error instanceof ZodError) {
    return {
      ok: false,
      message:
        error.issues[0]?.message ??
        "Dados inválidos",
    };
  }
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Erro ao criar categoria",
    };
  }
}

export async function editarCategoria(
  prevState: CategoriaActionState,
  formData: FormData
): Promise<CategoriaActionState> {
  try {
    const id = formData.get("id");
    const nome = formData.get("nome");

    await categoriaService.editarCategoria(
      String(id),
      {
        nome: String(nome),
      }
    );

    revalidatePath("/admin/categorias");

    return {
      ok: true,
      message:
        "Categoria atualizada com sucesso",
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Erro ao editar categoria",
    };
  }
}

export async function excluirCategoria(
  prevState: CategoriaActionState,
  formData: FormData
): Promise<CategoriaActionState> {
  try {
    const id = formData.get("id");

    await categoriaService.excluirCategoria(
      String(id)
    );

    revalidatePath("/admin/categorias");

    return {
      ok: true,
      message:
        "Categoria excluída com sucesso",
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Erro ao excluir categoria",
    };
  }
}