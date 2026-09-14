"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/requireAdmin";
import { VendaBalcaoService } from "./vendaBalcao.service";
import { DevolucaoBalcaoService } from "./devolucao.service";
import type {
  ConfirmarVendaBalcaoInput,
  RegistrarDevolucaoInput,
} from "./vendaBalcao.types";

const vendaBalcaoService =
  new VendaBalcaoService();

const devolucaoBalcaoService =
  new DevolucaoBalcaoService();

export type BalcaoActionState = {
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
): BalcaoActionState {
  console.error(
    `[vendaBalcao:${action}]`,
    error
  );

  return {
    ok: false,
    message: formatError(error),
  };
}

export async function buscarProdutosParaBalcao(
  busca: string
): Promise<
  BalcaoActionState & {
    produtos: Awaited<
      ReturnType<
        VendaBalcaoService["buscarProdutosDisponiveis"]
      >
    >;
  }
> {
  try {
    await requireAdmin();

    const produtos =
      await vendaBalcaoService.buscarProdutosDisponiveis(
        busca
      );

    return {
      ok: true,
      message: "",
      produtos,
    };
  } catch (error) {
    return {
      ...handleError(
        "buscarProdutosParaBalcao",
        error
      ),
      produtos: [],
    };
  }
}

export async function buscarClientesParaBalcao(
  termo: string
): Promise<
  BalcaoActionState & {
    clientes: Awaited<
      ReturnType<
        VendaBalcaoService["buscarClientes"]
      >
    >;
  }
> {
  try {
    await requireAdmin();

    const clientes =
      await vendaBalcaoService.buscarClientes(
        termo
      );

    return {
      ok: true,
      message: "",
      clientes,
    };
  } catch (error) {
    return {
      ...handleError(
        "buscarClientesParaBalcao",
        error
      ),
      clientes: [],
    };
  }
}

export async function buscarVendasParaTroca(
  nomeCliente: string,
  excluirVendaId: string
): Promise<
  BalcaoActionState & {
    vendas: Awaited<
      ReturnType<
        VendaBalcaoService["buscarVendasParaTroca"]
      >
    >;
  }
> {
  try {
    await requireAdmin();

    const vendas =
      await vendaBalcaoService.buscarVendasParaTroca(
        nomeCliente,
        excluirVendaId
      );

    return {
      ok: true,
      message: "",
      vendas,
    };
  } catch (error) {
    return {
      ...handleError(
        "buscarVendasParaTroca",
        error
      ),
      vendas: [],
    };
  }
}

export async function confirmarVendaBalcao(
  dados: ConfirmarVendaBalcaoInput
): Promise<BalcaoActionState> {
  try {
    await requireAdmin();

    await vendaBalcaoService.confirmarVenda(
      dados
    );

    revalidatePath("/admin/balcao");
    revalidatePath("/admin/balcao/historico");
    revalidatePath("/admin/produtos");

    return {
      ok: true,
      message: "Venda confirmada com sucesso.",
    };
  } catch (error) {
    return handleError(
      "confirmarVendaBalcao",
      error
    );
  }
}

export async function registrarDevolucaoBalcao(
  dados: RegistrarDevolucaoInput
): Promise<BalcaoActionState> {
  try {
    await requireAdmin();

    await devolucaoBalcaoService.registrarDevolucao(
      dados
    );

    revalidatePath("/admin/balcao/historico");
    revalidatePath("/admin/balcao");
    revalidatePath("/admin/produtos");

    return {
      ok: true,
      message:
        dados.tipo === "TROCA"
          ? "Troca registrada com sucesso."
          : "Devolução registrada com sucesso.",
    };
  } catch (error) {
    return handleError(
      "registrarDevolucaoBalcao",
      error
    );
  }
}
