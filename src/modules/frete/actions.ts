"use server";

import { requireAuth } from "@/lib/auth/requireAuth";
import { CarrinhoService } from "@/modules/carrinho/carrinho.service";
import { FreteService } from "./frete.service";
import type { OpcaoFrete } from "./frete.types";

const carrinhoService = new CarrinhoService();
const freteService = new FreteService();

export type CalcularFreteState =
  | {
    ok: true;
    opcoes: OpcaoFrete[];
  }
  | {
    ok: false;
    message: string;
  };

function formatError(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Não foi possível calcular o frete.";
}

export async function calcularFrete(
  cep: string
): Promise<CalcularFreteState> {
  try {
    const usuario = await requireAuth();

    const cepLimpo = cep.replace(/\D/g, "");

    if (cepLimpo.length !== 8) {
      return {
        ok: false,
        message: "CEP inválido.",
      };
    }

    const carrinho =
      await carrinhoService.obterResumo(
        usuario.id
      );

    if (carrinho.itens.length === 0) {
      return {
        ok: false,
        message: "Seu carrinho está vazio.",
      };
    }

    const opcoes =
      await freteService.calcularOpcoes(
        cepLimpo,
        carrinho.itens
      );

    if (opcoes.length === 0) {
      return {
        ok: false,
        message:
          "Nenhuma opção de frete disponível para este CEP.",
      };
    }

    return {
      ok: true,
      opcoes,
    };
  } catch (error) {
    console.error(
      "[frete:calcularFrete]",
      error
    );

    return {
      ok: false,
      message: formatError(error),
    };
  }
}
