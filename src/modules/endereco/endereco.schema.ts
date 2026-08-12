import { z } from "zod";

export const enderecoSchema = z.object({
  cep: z
    .string()
    .trim()
    .regex(/^\d{8}$/, "CEP deve conter 8 dígitos."),
  logradouro: z
    .string()
    .trim()
    .min(2, "Logradouro muito curto."),
  numero: z
    .string()
    .trim()
    .min(1, "Informe o número."),
  complemento: z
    .string()
    .trim()
    .optional(),
  bairro: z
    .string()
    .trim()
    .min(2, "Bairro muito curto."),
  cidade: z
    .string()
    .trim()
    .min(2, "Cidade muito curta."),
  estado: z
    .string()
    .trim()
    .toUpperCase()
    .length(2, "Use a sigla do estado (2 letras)."),
});

export type EnderecoInput = z.infer<typeof enderecoSchema>;
