"use server";

import { requireAuth } from "@/lib/auth/requireAuth";
import { EnderecoService } from "@/modules/endereco/endereco.service";
import { MercadoPagoService } from "./pagamento.service";

const mercadoPagoService =
  new MercadoPagoService();

const enderecoService =
  new EnderecoService();

export type IniciarPagamentoState = {
  ok: boolean;
  message: string;
  initPoint?: string;
};

export async function iniciarPagamento(
  enderecoId: string,
  freteNome: string,
  freteValor: number
): Promise<IniciarPagamentoState> {
  try {
    const usuario = await requireAuth();

    if (!enderecoId) {
      throw new Error(
        "Selecione um endereço de entrega."
      );
    }

    if (
      !Number.isFinite(freteValor) ||
      freteValor < 0
    ) {
      throw new Error(
        "Selecione uma opção de frete."
      );
    }

    const enderecos =
      await enderecoService.listarEnderecos(
        usuario.id
      );

    const enderecoValido = enderecos.some(
      (endereco) => endereco.id === enderecoId
    );

    if (!enderecoValido) {
      throw new Error(
        "Endereço inválido para este usuário."
      );
    }

    const { initPoint } =
      await mercadoPagoService.criarPreferencia({
        usuarioId: usuario.id,
        enderecoId,
        frete: freteValor,
        freteNome,
      });

    return {
      ok: true,
      message: "",
      initPoint,
    };
  } catch (error) {
    console.error(
      "[pagamento:iniciarPagamento]",
      error
    );

    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Não foi possível iniciar o pagamento.",
    };
  }
}
