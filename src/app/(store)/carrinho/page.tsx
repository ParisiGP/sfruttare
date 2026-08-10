import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { CarrinhoService } from "@/modules/carrinho/carrinho.service";
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

  return (
    <main>
      <Carrinho resumo={resumo} />
    </main>
  );
}
