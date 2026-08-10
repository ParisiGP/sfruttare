"use server";

import { revalidatePath } from "next/cache";
import { ZodError } from "zod";

import { requireAuth } from "@/lib/auth/requireAuth";
import { CarrinhoService } from "./carrinho.service";

const carrinhoService =
  new CarrinhoService();

export type CarrinhoActionState = {
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
): CarrinhoActionState {
  console.error(`[carrinho:${action}]`, error);

  return {
    ok: false,
    message: formatError(error),
  };
}

export async function adicionarAoCarrinho(
  produtoId: string,
  quantidade: number
): Promise<CarrinhoActionState> {
  try {
    const usuario = await requireAuth();

    await carrinhoService.adicionarItem(
      usuario.id,
      produtoId,
      quantidade
    );

    revalidatePath("/carrinho");

    return {
      ok: true,
      message: "Produto adicionado ao carrinho.",
    };
  } catch (error) {
    return handleError(
      "adicionarAoCarrinho",
      error
    );
  }
}

export async function atualizarQuantidadeCarrinho(
  itemId: string,
  quantidade: number
): Promise<CarrinhoActionState> {
  try {
    const usuario = await requireAuth();

    await carrinhoService.atualizarQuantidade(
      usuario.id,
      itemId,
      quantidade
    );

    revalidatePath("/carrinho");

    return {
      ok: true,
      message: "Quantidade atualizada.",
    };
  } catch (error) {
    return handleError(
      "atualizarQuantidadeCarrinho",
      error
    );
  }
}

export async function removerDoCarrinho(
  itemId: string
): Promise<CarrinhoActionState> {
  try {
    const usuario = await requireAuth();

    await carrinhoService.removerItem(
      usuario.id,
      itemId
    );

    revalidatePath("/carrinho");

    return {
      ok: true,
      message: "Produto removido do carrinho.",
    };
  } catch (error) {
    return handleError(
      "removerDoCarrinho",
      error
    );
  }
}

export async function esvaziarCarrinho(): Promise<CarrinhoActionState> {
  try {
    const usuario = await requireAuth();

    await carrinhoService.esvaziarCarrinho(
      usuario.id
    );

    revalidatePath("/carrinho");

    return {
      ok: true,
      message: "Carrinho esvaziado.",
    };
  } catch (error) {
    return handleError(
      "esvaziarCarrinho",
      error
    );
  }
}
