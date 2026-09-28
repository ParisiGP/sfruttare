import { z } from "zod";

import { celularValido } from "@/lib/telefone";

export const criarReservaSchema = z.object({
  produtoId: z.string().cuid(),

  nomeCliente: z
    .string()
    .trim()
    .min(1, "Informe o nome do cliente."),

  telefoneCliente: z
    .string()
    .trim()
    .refine(celularValido, {
      message:
        "Digite um celular válido, com DDD.",
    })
    .optional()
    .or(z.literal("")),

  canal: z.enum(["BALCAO", "SITE"]),
});

export type CriarReservaSchemaInput =
  z.infer<typeof criarReservaSchema>;
