import { z } from "zod";

export const criarPedidoSchema = z.object({
  enderecoId: z.string().cuid(),
  frete: z.number().nonnegative(),
});

export type CriarPedidoInput =
  z.infer<typeof criarPedidoSchema>;
