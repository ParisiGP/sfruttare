import { z } from "zod";

export const categoriaSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(2, "Nome muito curto")
    .max(50, "Nome muito longo"),
});

export type CategoriaInput =
  z.infer<typeof categoriaSchema>;