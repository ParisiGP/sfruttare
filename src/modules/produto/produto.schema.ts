import { z } from "zod";

import { percentualValido } from "@/modules/consignacao/consignacao";

function campoNumericoOpcional(mensagem: string) {
  return z.preprocess(
    (valor) =>
      valor === "" || valor === null || valor === undefined
        ? undefined
        : valor,
    z.coerce.number().int().positive(mensagem).optional()
  );
}

/**
 * % de repasse do consignado. `undefined` = o campo não veio (não mexe no
 * que está gravado); `""`/`null` = limpou (vira `null`); senão 0 < % ≤ 100
 * com até 2 casas. Só vale pra peça consignada — o service ignora nas demais.
 */
const percentualRepasseSchema = z.preprocess(
  (valor) =>
    valor === undefined
      ? undefined
      : valor === "" || valor === null
        ? null
        : valor,
  z.coerce
    .number()
    .refine(percentualValido, {
      message:
        "% de repasse deve ser maior que 0 e até 100, com no máximo 2 casas.",
    })
    .nullable()
    .optional()
);

const imagemSchema = z.object({
  id: z.string().optional(),

  url: z
    .string()
    .trim()
    .url("Informe uma URL de imagem valida")
    .refine(
      (url) =>
        url.includes("res.cloudinary.com") ||
        url.includes("cloudinary.com"),
      "Use uma URL publica do Cloudinary"
    ),

  publicId: z.string().default(""),

  ordem: z.coerce.number().int().min(0),
});

export const produtoSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(2, "Nome deve ter no minimo 2 caracteres"),

  descricao: z
    .string()
    .trim()
    .optional(),

  marca: z
    .string()
    .trim()
    .optional(),

  cor:
    z
      .string()
      .trim()
      .max(
        40,
        "Cor muito longa."
      )
      .optional(),

  referencia:
    z
      .string()
      .trim()
      .max(
        15,
        "Referência deve ter no máximo 15 caracteres."
      )
      .optional()
      .or(z.literal("")),

  tamanho: z
    .string()
    .trim()
    .optional(),

  preco: z.coerce
    .number()
    .positive("Preco deve ser maior que zero"),

  estoque: z.coerce
    .number()
    .int()
    .min(0, "Estoque nao pode ser negativo"),

  condicao: z
    .enum(["NOVO", "SEMINOVO", "USADO"])
    .optional()
    .or(z.literal(""))
    .transform((valor) =>
      valor === "" ? undefined : valor
    ),

  avarias: z
    .string()
    .trim()
    .optional(),

  composicao: z
    .string()
    .trim()
    .optional(),

  pesoGramas: campoNumericoOpcional(
    "Peso deve ser maior que zero"
  ),

  alturaCm: campoNumericoOpcional(
    "Altura deve ser maior que zero"
  ),

  larguraCm: campoNumericoOpcional(
    "Largura deve ser maior que zero"
  ),

  comprimentoCm: campoNumericoOpcional(
    "Comprimento deve ser maior que zero"
  ),

  categoriaId: z.string().cuid(),

  tipo: z.enum([
    "BRECHO",
    "NA_ETIQUETA",
  ]),

  status: z
    .enum([
      "DISPONIVEL",
      "RESERVADO",
      "VENDIDO",
    ])
    .default("DISPONIVEL"),

  percentualRepasse: percentualRepasseSchema,

  imagens: z
    .array(imagemSchema)
    .default([]),
});

export const editarProdutoSchema =
  produtoSchema.extend({
    id: z.string().cuid(),
  });

export const alterarStatusProdutoSchema =
  z.object({
    id: z.string().cuid(),
    status: z.enum([
      "DISPONIVEL",
      "RESERVADO",
      "VENDIDO",
    ]),
  });

export type ProdutoInput =
  z.infer<typeof produtoSchema>;

export type EditarProdutoInput =
  z.infer<typeof editarProdutoSchema>;
