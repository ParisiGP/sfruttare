"use server";

import { requireAuth } from "@/lib/auth/requireAuth";
import { PedidoService } from "./pedido.service";

const pedidoService =
  new PedidoService();

export async function listarMeusPedidos() {
  const usuario = await requireAuth();

  return pedidoService.listarPedidos(
    usuario.id
  );
}
