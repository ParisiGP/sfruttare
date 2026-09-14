export type DescontoTipo = "VALOR" | "PERCENTUAL";

function arredondar(valor: number) {
  return Math.round(valor * 100) / 100;
}

/**
 * Calcula o valor final em R$ do desconto a partir do tipo escolhido
 * (VALOR = número já em reais, PERCENTUAL = número de 0 a 100 aplicado
 * sobre o subtotal). Não faz clamping contra o subtotal — quem chama
 * decide o que fazer se o resultado ultrapassar o valor da venda.
 */
export function calcularDescontoAplicado(
  subtotal: number,
  tipo: DescontoTipo | undefined,
  entrada: number | undefined
) {
  if (!tipo || entrada === undefined || entrada === null) {
    return 0;
  }

  if (tipo === "PERCENTUAL") {
    return arredondar((subtotal * entrada) / 100);
  }

  return arredondar(entrada);
}
