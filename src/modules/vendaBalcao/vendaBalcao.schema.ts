import { z } from "zod";

import { celularValido } from "@/lib/telefone";

import { MAXIMO_LINHAS_PAGAMENTO } from "./pagamentos";

const pagamentoSchema = z
  .object({
    forma: z.enum(
      ["DINHEIRO", "PIX", "DEBITO", "CREDITO"],
      { message: "Escolha a forma de cada pagamento." }
    ),

    valor: z.coerce
      .number()
      .positive(
        "Informe um valor maior que zero em cada pagamento."
      ),

    parcelas: z.coerce
      .number()
      .int()
      .min(1, "Parcelas deve ser entre 1 e 12.")
      .max(12, "Parcelas deve ser entre 1 e 12."),
  })
  .refine(
    (pagamento) =>
      pagamento.parcelas === 1 ||
      pagamento.forma === "CREDITO",
    {
      message: "Só o crédito pode ser parcelado.",
      path: ["parcelas"],
    }
  );

export const confirmarVendaBalcaoSchema = z
  .object({
    nomeCliente: z
      .string()
      .trim()
      .min(1, "Informe o nome do cliente."),

    emailCliente: z
      .string()
      .trim()
      .email("Digite um e-mail válido.")
      .optional()
      .or(z.literal("")),

    telefoneCliente: z
      .string()
      .trim()
      .refine(celularValido, {
        message:
          "Digite um celular válido, com DDD.",
      })
      .optional()
      .or(z.literal("")),

    descontoTipo: z
      .enum(["VALOR", "PERCENTUAL"])
      .optional(),

    descontoEntrada: z.coerce
      .number()
      .min(0, "O desconto não pode ser negativo.")
      .optional(),

    pagamentos: z
      .array(pagamentoSchema)
      .min(1, "Informe ao menos uma forma de pagamento.")
      .max(
        MAXIMO_LINHAS_PAGAMENTO,
        `Use no máximo ${MAXIMO_LINHAS_PAGAMENTO} formas de pagamento por venda.`
      ),

    produtoIds: z
      .array(z.string().cuid())
      .min(1, "Adicione ao menos uma peça ao carrinho."),
  })
  .refine(
    (dados) =>
      (dados.descontoTipo === undefined) ===
      (dados.descontoEntrada === undefined),
    {
      message:
        "Informe o tipo e o valor do desconto juntos.",
      path: ["descontoEntrada"],
    }
  )
  .refine(
    (dados) =>
      dados.descontoTipo !== "PERCENTUAL" ||
      (dados.descontoEntrada ?? 0) <= 100,
    {
      message:
        "O desconto percentual não pode passar de 100%.",
      path: ["descontoEntrada"],
    }
  );

export type ConfirmarVendaBalcaoSchemaInput =
  z.infer<typeof confirmarVendaBalcaoSchema>;
