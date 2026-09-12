import { z } from "zod";

export const confirmarVendaBalcaoSchema = z.object({
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

  parcelas: z.coerce
    .number()
    .int()
    .min(1, "Parcelas deve ser entre 1 e 12.")
    .max(12, "Parcelas deve ser entre 1 e 12."),

  produtoIds: z
    .array(z.string().cuid())
    .min(1, "Adicione ao menos uma peça ao carrinho."),
});

export type ConfirmarVendaBalcaoSchemaInput =
  z.infer<typeof confirmarVendaBalcaoSchema>;
