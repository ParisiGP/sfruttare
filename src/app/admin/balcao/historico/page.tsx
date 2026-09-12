import Link from "next/link";

import { requireAdmin } from "@/lib/auth/requireAdmin";
import { VendaBalcaoService } from "@/modules/vendaBalcao/vendaBalcao.service";
import { formatarPreco } from "@/lib/formatarPreco";

import styles from "./page.module.css";

function formatarDataHora(data: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(data);
}

export default async function BalcaoHistoricoPage() {
  await requireAdmin();

  const vendaBalcaoService =
    new VendaBalcaoService();

  const vendas =
    await vendaBalcaoService.listarVendas();

  return (
    <main>
      <div className={styles.wrapper}>
        <header className={styles.header}>
          <h1>Histórico de vendas — Balcão</h1>

          <Link
            href="/admin/balcao"
            className={styles.voltarLink}
          >
            ← Voltar pro balcão
          </Link>
        </header>

        {vendas.length === 0 ? (
          <p className={styles.vazio}>
            Nenhuma venda registrada ainda.
          </p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Data/hora</th>
                  <th>Cliente</th>
                  <th>E-mail</th>
                  <th>Itens</th>
                  <th>Parcelas</th>
                  <th>Total</th>
                </tr>
              </thead>

              <tbody>
                {vendas.map((venda) => (
                  <tr key={venda.id}>
                    <td>
                      {formatarDataHora(
                        venda.createdAt
                      )}
                    </td>

                    <td>{venda.nomeCliente}</td>

                    <td>
                      {venda.emailCliente || "—"}
                    </td>

                    <td>
                      <ul
                        className={
                          styles.itensLista
                        }
                      >
                        {venda.itens.map(
                          (item) => (
                            <li key={item.id}>
                              {item.nomeProduto}{" "}
                              (
                              {formatarPreco(
                                item.precoUnitario
                              )}
                              )
                            </li>
                          )
                        )}
                      </ul>
                    </td>

                    <td>{venda.parcelas}x</td>

                    <td>
                      <strong>
                        {formatarPreco(
                          venda.total
                        )}
                      </strong>

                      {venda.totalComJuros !==
                        null &&
                        venda.totalComJuros !==
                          venda.total && (
                          <span
                            className={
                              styles.totalComJuros
                            }
                          >
                            {formatarPreco(
                              venda.totalComJuros
                            )}{" "}
                            com juros
                          </span>
                        )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
