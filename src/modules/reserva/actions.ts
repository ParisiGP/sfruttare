"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/requireAdmin";
import { ReservaService } from "./reserva.service";
import type { CriarReservaInput } from "./reserva.types";

const reservaService = new ReservaService();

export type ReservaActionState = {
  ok: boolean;
  message: string;
};

function formatError(error: unknown) {
  if (error instanceof z.ZodError) {
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
): ReservaActionState {
  console.error(`[reserva:${action}]`, error);

  return {
    ok: false,
    message: formatError(error),
  };
}

function revalidarTelasAfetadas() {
  revalidatePath("/admin/balcao");
  revalidatePath("/admin/produtos");
  revalidatePath("/admin/reservas");
  revalidatePath("/admin/desempenho");
  revalidatePath("/pecas");
}

export async function criarReserva(
  dados: CriarReservaInput
): Promise<ReservaActionState> {
  try {
    await requireAdmin();

    await reservaService.criarReserva(dados);

    revalidarTelasAfetadas();

    return {
      ok: true,
      message: "Reserva registrada com sucesso.",
    };
  } catch (error) {
    return handleError("criarReserva", error);
  }
}

export async function cancelarReserva(
  reservaId: string
): Promise<ReservaActionState> {
  try {
    await requireAdmin();

    await reservaService.cancelarReserva(
      reservaId
    );

    revalidarTelasAfetadas();

    return {
      ok: true,
      message:
        "Reserva cancelada — a peça voltou a ficar disponível.",
    };
  } catch (error) {
    return handleError(
      "cancelarReserva",
      error
    );
  }
}

export async function cancelarReservaDoProduto(
  produtoId: string
): Promise<ReservaActionState> {
  try {
    await requireAdmin();

    await reservaService.cancelarReservaAtivaDoProduto(
      produtoId
    );

    revalidarTelasAfetadas();

    return {
      ok: true,
      message:
        "Reserva cancelada — a peça voltou a ficar disponível.",
    };
  } catch (error) {
    return handleError(
      "cancelarReservaDoProduto",
      error
    );
  }
}
