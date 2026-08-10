"use server";

import { revalidatePath } from "next/cache";
import { ZodError } from "zod";

import { requireAdmin } from "@/lib/auth/requireAdmin";
import { ProdutoService } from "@/modules/produto/produto.service";
import { VitrineAbaService } from "./vitrineAba.service";
import type { ProdutoAdminItem } from "@/modules/produto/produto.types";

const vitrineAbaService =
  new VitrineAbaService();

const produtoService =
  new ProdutoService();

export type VitrineAbaActionState = {
  ok: boolean;
  message: string;
};

function formatError(error: unknown) {
  if (error instanceof ZodError) {
    return error.issues
      .map((issue) => issue.message)
      .join(" ");
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Não foi possível concluir a ação.";
}

function handleError(
  action: string,
  error: unknown
): VitrineAbaActionState {
  console.error(`[vitrineAba:${action}]`, error);

  return {
    ok: false,
    message: formatError(error),
  };
}

function getBoolean(
  formData: FormData,
  key: string
) {
  return formData.get(key) === "on" ||
    formData.get(key) === "true";
}

export async function criarAba(
  prevState: VitrineAbaActionState,
  formData: FormData
): Promise<VitrineAbaActionState> {
  try {
    await requireAdmin();

    await vitrineAbaService.criarAba({
      nome: String(formData.get("nome") ?? ""),
      ativo: getBoolean(formData, "ativo"),
    });

    revalidatePath("/admin/vitrine");
    revalidatePath("/");

    return {
      ok: true,
      message: "Aba criada com sucesso.",
    };
  } catch (error) {
    return handleError("criarAba", error);
  }
}

export async function editarAba(
  prevState: VitrineAbaActionState,
  formData: FormData
): Promise<VitrineAbaActionState> {
  try {
    await requireAdmin();

    await vitrineAbaService.editarAba(
      String(formData.get("id") ?? ""),
      {
        nome: String(formData.get("nome") ?? ""),
        ativo: getBoolean(formData, "ativo"),
      }
    );

    revalidatePath("/admin/vitrine");
    revalidatePath("/");

    return {
      ok: true,
      message: "Aba atualizada com sucesso.",
    };
  } catch (error) {
    return handleError("editarAba", error);
  }
}

export async function excluirAba(
  prevState: VitrineAbaActionState,
  formData: FormData
): Promise<VitrineAbaActionState> {
  try {
    await requireAdmin();

    await vitrineAbaService.excluirAba(
      String(formData.get("id") ?? "")
    );

    revalidatePath("/admin/vitrine");
    revalidatePath("/");

    return {
      ok: true,
      message: "Aba excluída com sucesso.",
    };
  } catch (error) {
    return handleError("excluirAba", error);
  }
}

export async function reordenarAbas(
  abas: {
    id: string;
    ordem: number;
  }[]
): Promise<VitrineAbaActionState> {
  try {
    await requireAdmin();

    await vitrineAbaService.reordenarAbas(abas);

    revalidatePath("/admin/vitrine");
    revalidatePath("/");

    return {
      ok: true,
      message: "Ordem das abas atualizada com sucesso.",
    };
  } catch (error) {
    return handleError("reordenarAbas", error);
  }
}

export async function carregarProdutosParaSelecao(
  abaId: string
): Promise<
  VitrineAbaActionState & {
    produtos: ProdutoAdminItem[];
    selecionados: string[];
  }
> {
  try {
    await requireAdmin();

    const [produtos, selecionados] =
      await Promise.all([
        produtoService.listarTodosProdutos(),
        vitrineAbaService.findProdutoIdsDaAba(
          abaId
        ),
      ]);

    return {
      ok: true,
      message: "",
      produtos: produtos.map((produto) =>
        produtoService.serializeProduto(produto)
      ),
      selecionados,
    };
  } catch (error) {
    return {
      ...handleError(
        "carregarProdutosParaSelecao",
        error
      ),
      produtos: [],
      selecionados: [],
    };
  }
}

export async function atualizarProdutosDaAba(
  abaId: string,
  produtoIds: string[]
): Promise<VitrineAbaActionState> {
  try {
    await requireAdmin();

    await vitrineAbaService.atualizarProdutosDaAba(
      abaId,
      produtoIds
    );

    revalidatePath("/admin/vitrine");
    revalidatePath("/");

    return {
      ok: true,
      message:
        "Produtos da aba atualizados com sucesso.",
    };
  } catch (error) {
    return handleError(
      "atualizarProdutosDaAba",
      error
    );
  }
}
