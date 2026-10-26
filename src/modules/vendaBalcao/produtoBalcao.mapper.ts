import type { ProdutoBalcaoResumo } from "./vendaBalcao.types";

type ProdutoParaBalcao = {
  id: string;
  nome: string;
  referencia: string | null;
  preco: unknown;
  cor: string | null;
  tamanho: string | null;
  status: string;
  imagens: { url: string }[];
  /** Reserva ativa da peça (se houver) — de onde vem o "Reservado para …". */
  reservas?: { nomeCliente: string }[];
};

/**
 * Formato da peça na tela do Balcão (busca e carrinho). Único ponto que
 * monta isso: a busca de peças e a conversão de reserva em venda passam
 * por aqui, pra o carrinho receber a mesma coisa nos dois caminhos.
 */
export function paraProdutoBalcaoResumo(
  produto: ProdutoParaBalcao
): ProdutoBalcaoResumo {
  return {
    id: produto.id,
    nome: produto.nome,
    referencia: produto.referencia ?? "",
    preco: Number(produto.preco),
    cor: produto.cor ?? "",
    tamanho: produto.tamanho ?? "",
    imagemUrl: produto.imagens[0]?.url ?? null,
    status: produto.status as
      | "DISPONIVEL"
      | "RESERVADO",
    reservadoPara:
      produto.reservas?.[0]?.nomeCliente ?? null,
  };
}
