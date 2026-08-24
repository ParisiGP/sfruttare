import type { NextRequest } from "next/server";

import { ProdutoService } from "@/modules/produto/produto.service";

const produtoService = new ProdutoService();

export async function GET(request: NextRequest) {
  const query =
    request.nextUrl.searchParams.get("q") ?? "";

  const produtos =
    await produtoService.buscarPublico(query, 6);

  return Response.json({ produtos });
}
