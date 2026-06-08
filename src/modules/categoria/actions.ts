"use server";

import { revalidatePath } from "next/cache";
import { CategoriaService } from "./categoria.service";

const categoriaService =
  new CategoriaService();

export async function criarCategoria(
  formData: FormData
) {
  const nome = formData.get("nome");

  await categoriaService.criarCategoria({
    nome: String(nome),
  });
  revalidatePath("/admin/categorias");
}

export async function excluirCategoria(
  formData: FormData
){

  const id = formData.get("id");

  await categoriaService.excluirCategoria(String(id));

  revalidatePath("/admin/categorias");

}

export async function editarCategoria(
  formData: FormData
){ 
  const id = formData.get("id");
  const nome = formData.get("nome");
  await categoriaService.editarCategoria(String(id), {
    nome: String(nome),
  });
  revalidatePath("/admin/categorias");
}