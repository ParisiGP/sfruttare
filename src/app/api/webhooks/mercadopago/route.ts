import type { NextRequest } from "next/server";
import { WebhookSignatureValidator } from "mercadopago";

import { MercadoPagoService } from "@/modules/pagamento/pagamento.service";
import { CheckoutSessaoRepository } from "@/modules/pagamento/checkoutSessao.repository";
import { PedidoService } from "@/modules/pedido/pedido.service";

const mercadoPagoService =
  new MercadoPagoService();

const checkoutSessaoRepository =
  new CheckoutSessaoRepository();

const pedidoService =
  new PedidoService();

const STATUS_APROVADO = "approved";

const STATUS_FINAIS_REJEITADOS = [
  "rejected",
  "cancelled",
];

type NotificacaoMercadoPago = {
  type?: string;
  data?: {
    id?: string;
  };
};

export async function POST(request: NextRequest) {
  const secret =
    process.env.MERCADOPAGO_WEBHOOK_SECRET;

  if (!secret) {
    console.error(
      "[webhook:mercadopago] MERCADOPAGO_WEBHOOK_SECRET não configurado."
    );

    // Não há como validar a origem da notificação sem o secret. Responde
    // 200 pra não entrar em loop de retentativa do Mercado Pago, mas não
    // processa nada.
    return new Response(null, { status: 200 });
  }

  try {
    WebhookSignatureValidator.validate({
      xSignature: request.headers.get(
        "x-signature"
      ),
      xRequestId: request.headers.get(
        "x-request-id"
      ),
      dataId: request.nextUrl.searchParams.get(
        "data.id"
      ),
      secret,
    });
  } catch (error) {
    console.error(
      "[webhook:mercadopago] Assinatura inválida.",
      error
    );

    return new Response(null, { status: 401 });
  }

  let notificacao: NotificacaoMercadoPago;

  try {
    notificacao = await request.json();
  } catch {
    return new Response(null, { status: 200 });
  }

  if (
    notificacao.type !== "payment" ||
    !notificacao.data?.id
  ) {
    // Outros tópicos (merchant_order, etc.) não interessam a este fluxo.
    return new Response(null, { status: 200 });
  }

  try {
    const pagamento =
      await mercadoPagoService.buscarPagamento(
        notificacao.data.id
      );

    const checkoutSessaoId =
      pagamento.external_reference;

    if (!checkoutSessaoId) {
      console.error(
        "[webhook:mercadopago] Pagamento sem external_reference.",
        notificacao.data.id
      );

      return new Response(null, { status: 200 });
    }

    const checkoutSessao =
      await checkoutSessaoRepository.findById(
        checkoutSessaoId
      );

    if (!checkoutSessao) {
      console.error(
        "[webhook:mercadopago] CheckoutSessao não encontrada.",
        checkoutSessaoId
      );

      return new Response(null, { status: 200 });
    }

    // Idempotência: o Mercado Pago pode reenviar a mesma notificação
    // mais de uma vez. Uma CheckoutSessao só é processada enquanto
    // ainda está PENDENTE.
    if (checkoutSessao.status !== "PENDENTE") {
      return new Response(null, { status: 200 });
    }

    if (pagamento.status === STATUS_APROVADO) {
      const pedido =
        await pedidoService.criarPedidoAPartirDoCarrinho(
          checkoutSessao.usuarioId,
          checkoutSessao.enderecoId,
          Number(checkoutSessao.frete)
        );

      await checkoutSessaoRepository.updateStatus(
        checkoutSessao.id,
        "CONCLUIDA",
        pedido.id
      );
    } else if (
      pagamento.status &&
      STATUS_FINAIS_REJEITADOS.includes(
        pagamento.status
      )
    ) {
      await checkoutSessaoRepository.updateStatus(
        checkoutSessao.id,
        "REJEITADA"
      );
    }
    // Outros status (pending, in_process, authorized, in_mediation)
    // ainda não são finais — nada a fazer até uma próxima notificação.

    return new Response(null, { status: 200 });
  } catch (error) {
    console.error(
      "[webhook:mercadopago] Erro ao processar notificação.",
      error
    );

    // 500 faz o Mercado Pago retentar — apropriado para falhas
    // possivelmente transitórias (rede, banco).
    return new Response(null, { status: 500 });
  }
}
