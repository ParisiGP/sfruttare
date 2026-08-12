"use client";

import { useEffect, useState } from "react";

import { EnderecoSelecao } from "@/components/store/EnderecoSelecao/EnderecoSelecao";

import { calcularFrete } from "@/modules/frete/actions";
import type { OpcaoFrete } from "@/modules/frete/frete.types";
import type { EnderecoResumo } from "@/modules/endereco/endereco.types";
import type { CarrinhoItemResumo } from "@/modules/carrinho/carrinho.types";
import { formatarPreco } from "@/lib/formatarPreco";

import styles from "./CheckoutResumo.module.css";

type CheckoutResumoProps = {
  enderecos: EnderecoResumo[];
  itens: CarrinhoItemResumo[];
  subtotal: number;
};

export function CheckoutResumo({
  enderecos,
  itens,
  subtotal,
}: CheckoutResumoProps) {
  const [enderecoSelecionado, setEnderecoSelecionado] =
    useState<EnderecoResumo | null>(null);

  const [opcoesFrete, setOpcoesFrete] =
    useState<OpcaoFrete[]>([]);

  const [opcaoSelecionadaId, setOpcaoSelecionadaId] =
    useState<string | null>(null);

  const [carregandoFrete, setCarregandoFrete] =
    useState(false);

  const [erroFrete, setErroFrete] = useState("");

  useEffect(() => {
    if (!enderecoSelecionado) {
      setOpcoesFrete([]);
      setOpcaoSelecionadaId(null);
      setErroFrete("");
      setCarregandoFrete(false);
      return;
    }

    let cancelado = false;

    setCarregandoFrete(true);
    setErroFrete("");
    setOpcoesFrete([]);
    setOpcaoSelecionadaId(null);

    calcularFrete(enderecoSelecionado.cep).then(
      (resultado) => {
        if (cancelado) {
          return;
        }

        setCarregandoFrete(false);

        if (!resultado.ok) {
          setErroFrete(resultado.message);
          return;
        }

        setOpcoesFrete(resultado.opcoes);
        setOpcaoSelecionadaId(
          resultado.opcoes[0]?.id ?? null
        );
      }
    );

    return () => {
      cancelado = true;
    };
  }, [
    enderecoSelecionado?.id,
    enderecoSelecionado?.cep,
  ]);

  const opcaoSelecionada = opcoesFrete.find(
    (opcao) => opcao.id === opcaoSelecionadaId
  );

  const total =
    subtotal + (opcaoSelecionada?.preco ?? 0);

  return (
    <div className={styles.layout}>
      <EnderecoSelecao
        enderecos={enderecos}
        onEnderecoSelecionado={setEnderecoSelecionado}
      />

      <aside className={styles.resumo}>
        <h2>Resumo do pedido</h2>

        <ul className={styles.resumoLista}>
          {itens.map((item) => (
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
          <span>{formatarPreco(subtotal)}</span>
        </div>

        <div className={styles.freteSection}>
          <span className={styles.freteTitulo}>
            Frete
          </span>

          {!enderecoSelecionado && (
            <p className={styles.freteStatus}>
              Selecione um endereço para calcular o
              frete.
            </p>
          )}

          {enderecoSelecionado && carregandoFrete && (
            <p
              className={`${styles.freteStatus} ${styles.freteCarregando}`}
            >
              Calculando opções de frete...
            </p>
          )}

          {enderecoSelecionado &&
            !carregandoFrete &&
            erroFrete && (
              <p className={styles.freteErro}>
                {erroFrete}
              </p>
            )}

          {enderecoSelecionado &&
            !carregandoFrete &&
            !erroFrete &&
            opcoesFrete.length > 0 && (
              <div className={styles.freteLista}>
                {opcoesFrete.map((opcao) => (
                  <label
                    key={opcao.id}
                    className={styles.freteOpcao}
                  >
                    <span
                      className={
                        styles.freteOpcaoInfo
                      }
                    >
                      <input
                        type="radio"
                        name="opcaoFrete"
                        checked={
                          opcaoSelecionadaId ===
                          opcao.id
                        }
                        onChange={() =>
                          setOpcaoSelecionadaId(
                            opcao.id
                          )
                        }
                      />

                      <span
                        className={
                          styles.freteOpcaoTexto
                        }
                      >
                        <span
                          className={
                            styles.freteOpcaoNome
                          }
                        >
                          {opcao.nome}
                        </span>

                        <span
                          className={
                            styles.freteOpcaoPrazo
                          }
                        >
                          {opcao.prazoDias > 0
                            ? `Até ${opcao.prazoDias} dia(s) útil(eis)`
                            : "Prazo a confirmar"}
                        </span>
                      </span>
                    </span>

                    <span
                      className={
                        styles.freteOpcaoPreco
                      }
                    >
                      {formatarPreco(opcao.preco)}
                    </span>
                  </label>
                ))}
              </div>
            )}
        </div>

        <div className={styles.resumoTotal}>
          <span>Total</span>

          <strong>{formatarPreco(total)}</strong>
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
  );
}
