import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { CarrinhoService } from "@/modules/carrinho/carrinho.service";
import { EnderecoService } from "@/modules/endereco/endereco.service";
import { CheckoutResumo } from "@/components/store/CheckoutResumo/CheckoutResumo";

import styles from "./page.module.css";

export default async function CheckoutPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const carrinhoService =
    new CarrinhoService();

  const enderecoService =
    new EnderecoService();

  const [resumo, enderecos] = await Promise.all([
    carrinhoService.obterResumo(
      session.user.id
    ),
    enderecoService.listarEnderecos(
      session.user.id
    ),
  ]);

  if (resumo.itens.length === 0) {
    redirect("/carrinho");
  }

  return (
    <main>
      <div className={styles.wrapper}>
        <header className={styles.header}>
          <p className={styles.eyebrow}>
            Minha conta
          </p>

          <h1>Checkout</h1>
        </header>

        <CheckoutResumo
          enderecos={enderecos}
          itens={resumo.itens}
          subtotal={resumo.subtotal}
        />
      </div>
    </main>
  );
}
