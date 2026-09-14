import { z } from "zod";

export const registrarDevolucaoSchema = z
  .object({
    vendaBalcaoItemId: z.string().cuid(),

    tipo: z.enum(["DEVOLUCAO", "TROCA"]),

    motivo: z
      .string()
      .trim()
      .max(500, "Motivo muito longo.")
      .optional()
      .or(z.literal("")),

    vendaTrocaId: z.string().cuid().optional(),
  })
  .refine(
    (dados) =>
      dados.tipo !== "TROCA" || !!dados.vendaTrocaId,
    {
      message:
        "Escolha a venda que substitui essa peça pra registrar a troca.",
      path: ["vendaTrocaId"],
    }
  );

export type RegistrarDevolucaoSchemaInput =
  z.infer<typeof registrarDevolucaoSchema>;
