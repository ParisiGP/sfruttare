/**
 * Mapeia os campos de método de pagamento que o Mercado Pago retorna no
 * objeto de pagamento (`payment_method_id`/`payment_type_id`, mesmos
 * nomes da API REST deles) pra uma das 4 formas que o projeto rastreia.
 * Config isolada, mesmo espírito de `tabelaJurosMaquininha.ts`.
 */
export function mapearFormaPagamento(
  paymentMethodId?: string,
  paymentTypeId?: string
) {
  if (paymentMethodId === "pix") {
    return "PIX";
  }

  if (paymentTypeId === "credit_card") {
    return "CREDITO";
  }

  if (paymentTypeId === "debit_card") {
    return "DEBITO";
  }

  return "OUTRO";
}
