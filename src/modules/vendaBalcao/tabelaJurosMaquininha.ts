/**
 * Tabela oficial "Parcelado Com Acréscimos" (modo PCJ) da maquininha
 * Mercado Pago Point, vigente desde 03/11/2025 (fonte: tabela pública de
 * taxas e tarifas do Mercado Pago).
 *
 * Só reflete o valor real cobrado do cliente se o modo "Parcelamento Com
 * Juros" (PCJ) estiver ativo na conta Mercado Pago — não é o padrão da
 * maioria das contas Point (o padrão é o vendedor absorver o custo do
 * parcelamento). Confirmar no painel da conta antes de usar esse valor
 * como referência com o cliente.
 */
export const TAXA_JUROS_PARCELA: Record<number, number> = {
  1: 0,
  2: 0.0964,
  3: 0.1123,
  4: 0.1136,
  5: 0.1431,
  6: 0.1432,
  7: 0.1672,
  8: 0.1673,
  9: 0.1969,
  10: 0.2065,
  11: 0.2066,
  12: 0.2211,
};

export function calcularTotalComJuros(
  subtotal: number,
  parcelas: number
) {
  const taxa =
    TAXA_JUROS_PARCELA[parcelas] ?? 0;

  return subtotal * (1 + taxa);
}
