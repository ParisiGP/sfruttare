import { z } from "zod";

export const vitrineAbaSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(2, "Nome muito curto")
    .max(50, "Nome muito longo"),
  ativo: z.boolean(),
});

export type VitrineAbaInput = z.infer<typeof vitrineAbaSchema>;
