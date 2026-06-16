import { z } from "zod";

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
