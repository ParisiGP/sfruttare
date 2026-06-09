import { z } from "zod";

export const produtoSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(2, "Nome deve ter no mínimo 2 caracteres"),

  descricao: z
    .string()
    .optional(),

  marca: z
    .string()
    .optional(),

  tamanho: z
    .string()
    .optional(),

  preco: z.coerce.number().positive(),

  estoque: z.coerce.number().int().min(0),

  categoriaId: z.string().cuid(),

  tipo: z.enum([
    "BRECHO",
    "NA_ETIQUETA",
  ]),
});

export type ProdutoInput =
  z.infer<typeof produtoSchema>;