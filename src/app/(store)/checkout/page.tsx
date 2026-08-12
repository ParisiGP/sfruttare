import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { CarrinhoService } from "@/modules/carrinho/carrinho.service";
import { EnderecoService } from "@/modules/endereco/endereco.service";
import { EnderecoSelecao } from "@/components/store/EnderecoSelecao/EnderecoSelecao";
import { formatarPreco } from "@/lib/formatarPreco";

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

        <div className={styles.layout}>
          <EnderecoSelecao
            enderecos={enderecos}
          />

          <aside className={styles.resumo}>
            <h2>Resumo do pedido</h2>

            <ul className={styles.resumoLista}>
              {resumo.itens.map((item) => (
                <li
                  key={item.id}
                  className={styles.resumoItem}
                >
                  <span>
                    {item.quantidade}x{" "}
                    {item.produto.nome}
                  </span>

                  <strong>
                    {formatarPreco(item.subtotal)}
                  </strong>
                </li>
              ))}
            </ul>

            <div className={styles.resumoLinha}>
              <span>Subtotal</span>
              <span>
                {formatarPreco(resumo.subtotal)}
              </span>
            </div>

            <div className={styles.resumoLinha}>
              <span>Frete</span>
              <span>A calcular no checkout</span>
            </div>

            <div className={styles.resumoTotal}>
              <span>Total</span>

              <strong>
                {formatarPreco(resumo.total)}
              </strong>
            </div>

            <button
              type="button"
              className={styles.finalizarButton}
              disabled
            >
              Finalizar compra (em breve)
            </button>
          </aside>
        </div>
      </div>
    </main>
  );
}
