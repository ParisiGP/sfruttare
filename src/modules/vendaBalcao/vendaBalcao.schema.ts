import { z } from "zod";

import { celularValido } from "@/lib/telefone";

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

    parcelas: z.coerce
      .number()
      .int()
      .min(1, "Parcelas deve ser entre 1 e 12.")
      .max(12, "Parcelas deve ser entre 1 e 12."),

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
