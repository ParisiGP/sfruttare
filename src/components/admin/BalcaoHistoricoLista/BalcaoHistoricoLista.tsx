"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { formatarPreco } from "@/lib/formatarPreco";
import type { VendaBalcaoResumo } from "@/modules/vendaBalcao/vendaBalcao.types";
import { DevolucaoModal } from "@/components/admin/DevolucaoModal/DevolucaoModal";

import styles from "./BalcaoHistoricoLista.module.css";

type Props = {
  vendas: VendaBalcaoResumo[];
  totalLiquido: number;
};

type ModalAlvo = {
  vendaBalcaoItemId: string;
  vendaBalcaoId: string;
  tipo: "DEVOLUCAO" | "TROCA";
  nomeProduto: string;
  precoOriginal: number;
  nomeCliente: string;
};

const formatadorHora = new Intl.DateTimeFormat(
  "pt-BR",
  { timeStyle: "short" }
);

const formatadorDia = new Intl.DateTimeFormat(
  "pt-BR",
  { dateStyle: "long" }
);

const formatadorChaveDia = new Intl.DateTimeFormat(
  "pt-BR"
);

export function BalcaoHistoricoLista({
  vendas,
  totalLiquido,
}: Props) {
  const router = useRouter();

  const [modalAlvo, setModalAlvo] =
    useState<ModalAlvo | null>(null);

  const grupos = useMemo(() => {
    const mapa = new Map<
      string,
      { data: Date; vendas: VendaBalcaoResumo[] }
    >();

    for (const venda of vendas) {
      const chave = formatadorChaveDia.format(
        venda.createdAt
      );

      const grupo = mapa.get(chave);

      if (grupo) {
        grupo.vendas.push(venda);
      } else {
        mapa.set(chave, {
          data: venda.createdAt,
          vendas: [venda],
        });
      }
    }

    return Array.from(mapa.entries());
  }, [vendas]);

  function handleSucesso() {
    setModalAlvo(null);
    router.refresh();
  }

  if (vendas.length === 0) {
    return (
      <p className={styles.vazio}>
        Nenhuma venda encontrada.
      </p>
    );
  }

  return (
    <div className={styles.lista}>
      <div className={styles.totalLiquido}>
        <span>Total líquido do período</span>
        <strong>
          {formatarPreco(totalLiquido)}
        </strong>
      </div>

      {grupos.map(([chave, grupo]) => {
        const subtotalDia = grupo.vendas.reduce(
          (soma, venda) => soma + venda.total,
          0
        );

        return (
          <section
            key={chave}
            className={styles.grupoDia}
          >
            <header
              className={styles.grupoHeader}
            >
              <h2>
                {formatadorDia.format(
                  grupo.data
                )}
              </h2>
              <span>
                {formatarPreco(subtotalDia)}
              </span>
            </header>

            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Hora</th>
                    <th>Cliente</th>
                    <th>E-mail</th>
                    <th>Celular</th>
                    <th>Itens</th>
                    <th>Desconto</th>
                    <th>Parcelas</th>
                    <th>Total</th>
                  </tr>
                </thead>

                <tbody>
                  {grupo.vendas.map((venda) => (
                    <tr key={venda.id}>
                      <td>
                        {formatadorHora.format(
                          venda.createdAt
                        )}
                      </td>

                      <td>
                        {venda.nomeCliente}
                      </td>

                      <td>
                        {venda.emailCliente ||
                          "—"}
                      </td>

                      <td>
                        {venda.telefoneCliente ||
                          "—"}
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
                                <span
                                  className={
                                    item.devolucao
                                      ? styles.itemDevolvido
                                      : undefined
                                  }
                                >
                                  {
                                    item.nomeProduto
                                  }{" "}
                                  (
                                  {formatarPreco(
                                    item.precoUnitario
                                  )}
                                  )
                                </span>

                                {item.devolucao ? (
                                  <span
                                    className={
                                      styles.badge
                                    }
                                  >
                                    {item.devolucao
                                      .tipo ===
                                    "TROCA"
                                      ? `Trocado pela venda de ${
                                          item
                                            .devolucao
                                            .vendaTrocaResumo
                                            ?.nomeCliente ??
                                          "—"
                                        } (${formatarPreco(
                                          item
                                            .devolucao
                                            .vendaTrocaResumo
                                            ?.total ??
                                            0
                                        )})`
                                      : "Devolvido"}
                                  </span>
                                ) : (
                                  <span
                                    className={
                                      styles.itemAcoes
                                    }
                                  >
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setModalAlvo(
                                          {
                                            vendaBalcaoItemId:
                                              item.id,
                                            vendaBalcaoId:
                                              venda.id,
                                            tipo: "DEVOLUCAO",
                                            nomeProduto:
                                              item.nomeProduto,
                                            precoOriginal:
                                              item.precoUnitario,
                                            nomeCliente:
                                              venda.nomeCliente,
                                          }
                                        )
                                      }
                                    >
                                      Devolver
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        setModalAlvo(
                                          {
                                            vendaBalcaoItemId:
                                              item.id,
                                            vendaBalcaoId:
                                              venda.id,
                                            tipo: "TROCA",
                                            nomeProduto:
                                              item.nomeProduto,
                                            precoOriginal:
                                              item.precoUnitario,
                                            nomeCliente:
                                              venda.nomeCliente,
                                          }
                                        )
                                      }
                                    >
                                      Trocar
                                    </button>
                                  </span>
                                )}
                              </li>
                            )
                          )}
                        </ul>
                      </td>

                      <td>
                        {venda.descontoAplicado
                          ? venda.descontoTipo ===
                            "PERCENTUAL"
                            ? `${venda.descontoEntrada}% (${formatarPreco(
                                venda.descontoAplicado
                              )})`
                            : formatarPreco(
                                venda.descontoAplicado
                              )
                          : "—"}
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
          </section>
        );
      })}

      {modalAlvo && (
        <DevolucaoModal
          vendaBalcaoItemId={
            modalAlvo.vendaBalcaoItemId
          }
          vendaBalcaoId={
            modalAlvo.vendaBalcaoId
          }
          tipo={modalAlvo.tipo}
          nomeProduto={modalAlvo.nomeProduto}
          precoOriginal={
            modalAlvo.precoOriginal
          }
          nomeCliente={modalAlvo.nomeCliente}
          onClose={() => setModalAlvo(null)}
          onSucesso={handleSucesso}
        />
      )}
    </div>
  );
}
