"use server";

import { revalidatePath } from "next/cache";
import { ZodError } from "zod";

import { requireAuth } from "@/lib/auth/requireAuth";
import { EnderecoService } from "./endereco.service";
import type { EnderecoInput } from "./endereco.schema";

const enderecoService =
  new EnderecoService();

export type EnderecoActionState = {
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
): EnderecoActionState {
  console.error(`[endereco:${action}]`, error);

  return {
    ok: false,
    message: formatError(error),
  };
}

export async function criarEndereco(
  data: EnderecoInput
): Promise<EnderecoActionState> {
  try {
    const usuario = await requireAuth();

    await enderecoService.criarEndereco(
      usuario.id,
      data
    );

    revalidatePath("/checkout");

    return {
      ok: true,
      message: "Endereço cadastrado com sucesso.",
    };
  } catch (error) {
    return handleError("criarEndereco", error);
  }
}

export async function editarEndereco(
  id: string,
  data: EnderecoInput
): Promise<EnderecoActionState> {
  try {
    const usuario = await requireAuth();

    await enderecoService.editarEndereco(
      usuario.id,
      id,
      data
    );

    revalidatePath("/checkout");

    return {
      ok: true,
      message: "Endereço atualizado com sucesso.",
    };
  } catch (error) {
    return handleError("editarEndereco", error);
  }
}

export async function excluirEndereco(
  id: string
): Promise<EnderecoActionState> {
  try {
    const usuario = await requireAuth();

    await enderecoService.excluirEndereco(
      usuario.id,
      id
    );

    revalidatePath("/checkout");

    return {
      ok: true,
      message: "Endereço removido com sucesso.",
    };
  } catch (error) {
    return handleError("excluirEndereco", error);
  }
}
