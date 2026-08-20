import { z } from "zod";

export const newsletterInscricaoSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Digite um e-mail válido."),
});

export type NewsletterInscricaoInput = z.infer<
  typeof newsletterInscricaoSchema
>;
