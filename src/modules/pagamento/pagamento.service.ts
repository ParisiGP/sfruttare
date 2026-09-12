import { randomUUID } from "crypto";
import {
  MercadoPagoConfig,
  Preference,
  Payment,
} from "mercadopago";

import { CarrinhoService } from "@/modules/carrinho/carrinho.service";
import { CheckoutSessaoRepository } from "./checkoutSessao.repository";

const MENSAGEM_INDISPONIVEL =
  "Pagamento indisponível no momento. Tente novamente mais tarde.";

const MENSAGEM_ERRO_MP =
  "Não foi possível iniciar o pagamento agora. Tente novamente em instantes.";

function obterConfig() {
  const accessToken =
    process.env.MERCADOPAGO_ACCESS_TOKEN;

  if (!accessToken) {
    throw new Error(MENSAGEM_INDISPONIVEL);
  }

  return new MercadoPagoConfig({
    accessToken,
  });
}

function obterUrlBase() {
  const url =
    process.env.NEXT_PUBLIC_APP_URL;

  if (url) {
    return url.replace(/\/+$/, "");
  }

  // NEXT_PUBLIC_APP_URL é opcional em dev (cai pro localhost) e
  // obrigatória em produção, onde o Mercado Pago precisa de uma URL
  // pública de verdade para back_urls e notification_url.
  if (process.env.NODE_ENV !== "production") {
    return "http://localhost:3000";
  }

  throw new Error(MENSAGEM_INDISPONIVEL);
}

type CriarPreferenciaInput = {
  usuarioId: string;
  enderecoId: string;
  frete: number;
  freteNome?: string;
};

export class MercadoPagoService {
  constructor(
    private checkoutSessaoRepository =
      new CheckoutSessaoRepository(),
    private carrinhoService =
      new CarrinhoService()
  ) { }

  async criarPreferencia({
    usuarioId,
    enderecoId,
    frete,
    freteNome,
  }: CriarPreferenciaInput) {
    const resumoCarrinho =
      await this.carrinhoService.obterResumo(
        usuarioId
      );

    if (resumoCarrinho.itens.length === 0) {
      throw new Error(
        "O carrinho está vazio."
      );
    }

    const possuiItemIndisponivel =
      resumoCarrinho.itens.some(
        (item) => !item.disponivel
      );

    if (possuiItemIndisponivel) {
      throw new Error(
        "Existem itens indisponíveis no carrinho. Revise antes de continuar."
      );
    }

    // Valida a configuração antes de criar qualquer registro — evita
    // deixar CheckoutSessao órfã (mpPreferenceId placeholder pra sempre)
    // quando o ambiente ainda não tem as credenciais do Mercado Pago.
    const urlBase = obterUrlBase();
    const config = obterConfig();
    const preferenceClient = new Preference(config);

    // A coluna mpPreferenceId é NOT NULL + UNIQUE, mas só sabemos o id
    // real da preferência depois de criá-la no Mercado Pago — nasce com
    // um placeholder e é atualizada logo abaixo.
    const checkoutSessao =
      await this.checkoutSessaoRepository.create({
        usuarioId,
        enderecoId,
        frete,
        mpPreferenceId: `pendente-${randomUUID()}`,
      });

    let resposta;

    try {
      resposta = await preferenceClient.create({
        body: {
          items: resumoCarrinho.itens.map(
            (item) => ({
              id: item.produto.id,
              title: item.produto.nome,
              quantity: item.quantidade,
              unit_price: item.precoUnitario,
              currency_id: "BRL",
            })
          ),
          shipments: {
            cost: frete,
            mode: "not_specified",
          },
          external_reference: checkoutSessao.id,
          back_urls: {
            success: `${urlBase}/checkout/retorno`,
            pending: `${urlBase}/checkout/retorno`,
            failure: `${urlBase}/checkout/retorno`,
          },
          notification_url: `${urlBase}/api/webhooks/mercadopago`,
          auto_return: "approved",
          ...(freteNome
            ? {
                additional_info: `Frete: ${freteNome}`,
              }
            : {}),
        },
      });
    } catch (error) {
      console.error(
        "[pagamento:criarPreferencia] Falha ao criar preferência no Mercado Pago.",
        error
      );

      throw new Error(MENSAGEM_ERRO_MP);
    }

    if (!resposta.id || !resposta.init_point) {
      throw new Error(MENSAGEM_ERRO_MP);
    }

    await this.checkoutSessaoRepository.atualizarPreferenceId(
      checkoutSessao.id,
      resposta.id
    );

    return {
      preferenceId: resposta.id,
      initPoint: resposta.init_point,
    };
  }

  /**
   * Sempre reconsulta a API do Mercado Pago pelo id do pagamento — nunca
   * confia no corpo do webhook, que pode ser forjado.
   */
  async buscarPagamento(paymentId: string) {
    const config = obterConfig();
    const paymentClient = new Payment(config);

    return paymentClient.get({
      id: paymentId,
    });
  }
}
