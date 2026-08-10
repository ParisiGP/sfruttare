import { z } from "zod";

export const adicionarItemSchema = z.object({
  produtoId: z.string().cuid(),
  quantidade: z.coerce
    .number()
    .int()
    .positive("Quantidade deve ser maior que zero."),
});

export const atualizarQuantidadeSchema = z.object({
  itemId: z.string().cuid(),
  quantidade: z.coerce
    .number()
    .int()
    .positive("Quantidade deve ser maior que zero."),
});

export type AdicionarItemInput =
  z.infer<typeof adicionarItemSchema>;

export type AtualizarQuantidadeInput =
  z.infer<typeof atualizarQuantidadeSchema>;
