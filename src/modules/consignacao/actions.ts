"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/requireAdmin";
import { formatarPreco } from "@/lib/formatarPreco";

import { ConsignacaoService } from "./consignacao.service";
import type { AcaoConsignacaoResultado } from "./consignacao.types";

const consignacaoService = new ConsignacaoService();

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
): AcaoConsignacaoResultado {
  console.error(`[consignacao:${action}]`, error);

  return { ok: false, message: formatError(error) };
}

function revalidarTelasAfetadas() {
  revalidatePath("/admin/consignados");
  revalidatePath("/admin/produtos");
}

export async function marcarRepassadoAction(
  produtoId: string
): Promise<AcaoConsignacaoResultado> {
  try {
    await requireAdmin();

    const valor =
      await consignacaoService.marcarRepassado(produtoId);

    revalidarTelasAfetadas();

    return {
      ok: true,
      message: `Repasse de ${formatarPreco(valor)} marcado.`,
    };
  } catch (error) {
    return handleError("marcarRepassado", error);
  }
}

export async function marcarTodasRepassadasAction(
  consignante: string
): Promise<AcaoConsignacaoResultado> {
  try {
    await requireAdmin();

    const { marcadas, valorTotal } =
      await consignacaoService.marcarTodasRepassadas(
        consignante
      );

    revalidarTelasAfetadas();

    return {
      ok: true,
      message:
        marcadas === 0
          ? "Nenhuma peça pôde ser marcada (já repassadas ou sem %)."
          : `${marcadas} peça(s) de ${consignante} marcada(s) como repassada(s) — ${formatarPreco(
              valorTotal
            )}.`,
    };
  } catch (error) {
    return handleError("marcarTodasRepassadas", error);
  }
}

export async function desfazerRepasseAction(
  produtoId: string
): Promise<AcaoConsignacaoResultado> {
  try {
    await requireAdmin();

    await consignacaoService.desfazerRepasse(produtoId);

    revalidarTelasAfetadas();

    return {
      ok: true,
      message: "Repasse desfeito.",
    };
  } catch (error) {
    return handleError("desfazerRepasse", error);
  }
}

export async function informarPercentualAction(
  produtoId: string,
  percentual: number
): Promise<AcaoConsignacaoResultado> {
  try {
    await requireAdmin();

    await consignacaoService.informarPercentual(
      produtoId,
      percentual
    );

    revalidarTelasAfetadas();

    return {
      ok: true,
      message: "% de repasse salvo.",
    };
  } catch (error) {
    return handleError("informarPercentual", error);
  }
}

export async function definirPercentualEmLoteAction(
  consignante: string,
  percentual: number
): Promise<AcaoConsignacaoResultado> {
  try {
    await requireAdmin();

    const afetadas =
      await consignacaoService.definirPercentualEmLote(
        consignante,
        percentual
      );

    revalidarTelasAfetadas();

    return {
      ok: true,
      message: `${percentual}% aplicado em ${afetadas} peça(s) de ${consignante} que estavam sem %.`,
    };
  } catch (error) {
    return handleError("definirPercentualEmLote", error);
  }
}
