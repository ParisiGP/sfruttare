import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { CarrinhoService } from "@/modules/carrinho/carrinho.service";
import type { CarrinhoItemResumo } from "@/modules/carrinho/carrinho.types";
import { EnderecoService } from "@/modules/endereco/endereco.service";
import { FreteService } from "@/modules/frete/frete.service";
import type { OpcaoFrete } from "@/modules/frete/frete.types";
import { Carrinho } from "@/components/store/Carrinho/Carrinho";

export default async function CarrinhoPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const carrinhoService =
    new CarrinhoService();

  const resumo =
    await carrinhoService.obterResumo(
      session.user.id
    );

  const freteEstimado =
    await estimarFrete(
      session.user.id,
      resumo.itens
    );

  return (
    <main>
      <Carrinho
        resumo={resumo}
        freteEstimado={freteEstimado}
      />
    </main>
  );
}

async function estimarFrete(
  usuarioId: string,
  itens: CarrinhoItemResumo[]
): Promise<OpcaoFrete | null> {
  if (itens.length === 0) {
    return null;
  }

  const enderecoService =
    new EnderecoService();

  const enderecos =
    await enderecoService.listarEnderecos(
      usuarioId
    );

  const enderecoMaisRecente = enderecos[0];

  if (!enderecoMaisRecente) {
    return null;
  }

  try {
    const freteService = new FreteService();

    const opcoes =
      await freteService.calcularOpcoes(
        enderecoMaisRecente.cep,
        itens
      );

    if (opcoes.length === 0) {
      return null;
    }

    return opcoes.reduce((maisBarata, opcao) =>
      opcao.preco < maisBarata.preco
        ? opcao
        : maisBarata
    );
  } catch {
    return null;
  }
}
