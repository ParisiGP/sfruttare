import { formatarPreco } from "@/lib/formatarPreco";

import type {
  FormaPagamentoBalcao,
  FormaPagamentoLinha,
  PagamentoBalcaoResumo,
} from "./vendaBalcao.types";

export const MAXIMO_LINHAS_PAGAMENTO = 4;

export const FORMAS_PAGAMENTO: {
  valor: FormaPagamentoLinha;
  label: string;
}[] = [
  { valor: "DINHEIRO", label: "Dinheiro" },
  { valor: "PIX", label: "Pix" },
  { valor: "DEBITO", label: "Débito" },
  { valor: "CREDITO", label: "Crédito" },
];

const LABEL_FORMA: Record<
  FormaPagamentoBalcao,
  string
> = {
  DINHEIRO: "Dinheiro",
  PIX: "Pix",
  DEBITO: "Débito",
  CREDITO: "Crédito",
  MISTO: "Misto",
};

function paraCentavos(valor: number) {
  return Math.round(valor * 100);
}

function ehFormaLinha(
  valor: string | null
): valor is FormaPagamentoLinha {
  return FORMAS_PAGAMENTO.some(
    (forma) => forma.valor === valor
  );
}

type VendaParaPagamentos = {
  formaPagamento: string | null;
  parcelas: number;
  total: unknown;
  totalComJuros: unknown;
  pagamentos: {
    forma: string;
    valor: unknown;
    parcelas: number;
    valorComJuros: unknown;
  }[];
};

/**
 * Único ponto que resolve "como foi pago" uma venda — toda tela e
 * relatório passa por aqui, nenhum monta essa regra sozinho.
 *
 * Venda nova tem linhas em `PagamentoBalcao`. Venda antiga (anterior
 * ao pagamento dividido) não tem linha nenhuma e nunca ganha: vira um
 * pagamento único implícito montado a partir dos campos que ela já
 * tinha. Antes da especificação de forma de pagamento nem
 * `formaPagamento` existia; como parcelar só é possível no crédito da
 * maquininha, `parcelas > 1` sem forma gravada é lido como Crédito.
 * Sem forma e sem parcelamento a forma fica `null` (não informada).
 */
export function obterPagamentosDaVenda(
  venda: VendaParaPagamentos
): PagamentoBalcaoResumo[] {
  if (venda.pagamentos.length > 0) {
    return venda.pagamentos.map((pagamento) => ({
      forma: ehFormaLinha(pagamento.forma)
        ? pagamento.forma
        : null,
      valor: Number(pagamento.valor),
      parcelas: pagamento.parcelas,
      valorComJuros:
        pagamento.valorComJuros === null
          ? null
          : Number(pagamento.valorComJuros),
    }));
  }

  const forma = ehFormaLinha(venda.formaPagamento)
    ? venda.formaPagamento
    : venda.parcelas > 1
    ? "CREDITO"
    : null;

  return [
    {
      forma,
      valor: Number(venda.total),
      parcelas: venda.parcelas,
      valorComJuros:
        venda.parcelas > 1 &&
        venda.totalComJuros !== null
          ? Number(venda.totalComJuros)
          : null,
    },
  ];
}

/**
 * Resumo gravado nos campos que já existiam em `VendaBalcao`, pra
 * histórico e relatórios atuais não quebrarem: forma única ou
 * `"MISTO"`, maior número de parcelas, e o total que o cliente de fato
 * desembolsa somando todas as linhas (com juros onde houver).
 */
export function resumirPagamentos(
  pagamentos: {
    forma: FormaPagamentoLinha;
    valor: number;
    parcelas: number;
    valorComJuros: number | null;
  }[]
): {
  formaPagamento: FormaPagamentoBalcao;
  parcelas: number;
  totalComJuros: number;
} {
  const formasDistintas = new Set(
    pagamentos.map((pagamento) => pagamento.forma)
  );

  const formaPagamento: FormaPagamentoBalcao =
    formasDistintas.size === 1
      ? pagamentos[0].forma
      : "MISTO";

  const parcelas = Math.max(
    1,
    ...pagamentos.map((pagamento) => pagamento.parcelas)
  );

  const centavosComJuros = pagamentos.reduce(
    (soma, pagamento) =>
      soma +
      paraCentavos(
        pagamento.valorComJuros ?? pagamento.valor
      ),
    0
  );

  return {
    formaPagamento,
    parcelas,
    totalComJuros: centavosComJuros / 100,
  };
}

/** Ex.: `Crédito 3x R$ 150,00` ou `Pix R$ 100,00`. */
export function descreverPagamento(
  pagamento: PagamentoBalcaoResumo
) {
  const label = pagamento.forma
    ? LABEL_FORMA[pagamento.forma]
    : "Não informado";

  const parcelas =
    pagamento.parcelas > 1
      ? ` ${pagamento.parcelas}x`
      : "";

  return `${label}${parcelas} ${formatarPreco(
    pagamento.valor
  )}`;
}

/** Ex.: `Pix R$ 100,00 + Crédito 3x R$ 150,00`. */
export function descreverPagamentos(
  pagamentos: PagamentoBalcaoResumo[]
) {
  return pagamentos
    .map(descreverPagamento)
    .join(" + ");
}
