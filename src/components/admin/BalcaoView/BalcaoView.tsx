"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  buscarProdutosParaBalcao,
  confirmarVendaBalcao,
} from "@/modules/vendaBalcao/actions";
import { calcularTotalComJuros } from "@/modules/vendaBalcao/tabelaJurosMaquininha";
import type { ProdutoBalcaoResumo } from "@/modules/vendaBalcao/vendaBalcao.types";
import { formatarPreco } from "@/lib/formatarPreco";

import styles from "./BalcaoView.module.css";

const PARCELAS_DISPONIVEIS = Array.from(
  { length: 12 },
  (_, index) => index + 1
);

const DEBOUNCE_MS = 300;

export function BalcaoView() {
  const inputBuscaRef =
    useRef<HTMLInputElement>(null);

  const [busca, setBusca] = useState("");
  const [resultados, setResultados] = useState<
    ProdutoBalcaoResumo[]
  >([]);
  const [buscando, setBuscando] = useState(false);

  const [carrinho, setCarrinho] = useState<
    ProdutoBalcaoResumo[]
  >([]);

  const [nomeCliente, setNomeCliente] =
    useState("");
  const [emailCliente, setEmailCliente] =
    useState("");
  const [parcelas, setParcelas] = useState(1);

  const [confirmando, setConfirmando] =
    useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  useEffect(() => {
    inputBuscaRef.current?.focus();
  }, []);

  useEffect(() => {
    const termo = busca.trim();

    if (!termo) {
      setResultados([]);
      setBuscando(false);
      return;
    }

    let cancelado = false;

    setBuscando(true);

    const timer = setTimeout(async () => {
      const resultado =
        await buscarProdutosParaBalcao(termo);

      if (cancelado) {
        return;
      }

      setBuscando(false);
      setResultados(
        resultado.ok ? resultado.produtos : []
      );
    }, DEBOUNCE_MS);

    return () => {
      cancelado = true;
      clearTimeout(timer);
    };
  }, [busca]);

  const subtotal = useMemo(
    () =>
      carrinho.reduce(
        (soma, produto) => soma + produto.preco,
        0
      ),
    [carrinho]
  );

  const totalComJuros = useMemo(
    () =>
      calcularTotalComJuros(subtotal, parcelas),
    [subtotal, parcelas]
  );

  function adicionarAoCarrinho(
    produto: ProdutoBalcaoResumo
  ) {
    setCarrinho((atual) =>
      atual.some((item) => item.id === produto.id)
        ? atual
        : [...atual, produto]
    );
  }

  function removerDoCarrinho(produtoId: string) {
    setCarrinho((atual) =>
      atual.filter(
        (item) => item.id !== produtoId
      )
    );
  }

  const podeConfirmar =
    nomeCliente.trim().length > 0 &&
    carrinho.length > 0 &&
    !confirmando;

  async function handleConfirmarVenda() {
    if (!podeConfirmar) {
      return;
    }

    setConfirmando(true);
    setErro("");
    setSucesso("");

    const resultado = await confirmarVendaBalcao({
      nomeCliente: nomeCliente.trim(),
      emailCliente: emailCliente.trim() || undefined,
      parcelas,
      produtoIds: carrinho.map(
        (produto) => produto.id
      ),
    });

    setConfirmando(false);

    if (!resultado.ok) {
      setErro(resultado.message);
      return;
    }

    setSucesso(
      `Venda de ${formatarPreco(
        subtotal
      )} confirmada para ${nomeCliente.trim()}.`
    );

    setCarrinho([]);
    setNomeCliente("");
    setEmailCliente("");
    setParcelas(1);
    setBusca("");
    setResultados([]);
    inputBuscaRef.current?.focus();
  }

  return (
    <div className={styles.layout}>
      <div className={styles.colunaEsquerda}>
        <section className={styles.buscaColuna}>
          <input
            ref={inputBuscaRef}
            type="search"
            className={styles.buscaInput}
            placeholder="Buscar por nome, marca, referência, cor, tamanho..."
            value={busca}
            onChange={(event) =>
              setBusca(event.target.value)
            }
          />

          {buscando && (
            <p className={styles.mensagemNeutra}>
              Buscando...
            </p>
          )}

          {!buscando &&
            busca.trim() &&
            resultados.length === 0 && (
              <p className={styles.mensagemNeutra}>
                Nenhuma peça encontrada para
                &ldquo;{busca.trim()}&rdquo;.
              </p>
            )}

          <ul className={styles.resultadosLista}>
            {resultados.map((produto) => {
              const jaNoCarrinho = carrinho.some(
                (item) => item.id === produto.id
              );

              return (
                <li
                  key={produto.id}
                  className={styles.resultadoItem}
                >
                  <div
                    className={
                      styles.resultadoFoto
                    }
                  >
                    {produto.imagemUrl ? (
                      <img
                        src={produto.imagemUrl}
                        alt={produto.nome}
                      />
                    ) : (
                      <span>Sem foto</span>
                    )}
                  </div>

                  <div
                    className={
                      styles.resultadoInfo
                    }
                  >
                    <strong>
                      {produto.nome}
                    </strong>

                    <span>
                      {produto.referencia && (
                        <>
                          {produto.referencia}
                          {" · "}
                        </>
                      )}
                      {formatarPreco(
                        produto.preco
                      )}
                    </span>
                  </div>

                  <button
                    type="button"
                    className={
                      styles.adicionarButton
                    }
                    disabled={jaNoCarrinho}
                    onClick={() =>
                      adicionarAoCarrinho(produto)
                    }
                  >
                    {jaNoCarrinho
                      ? "Adicionado"
                      : "Adicionar"}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        <section className={styles.parcelasPainel}>
          <span className={styles.parcelasLabel}>
            Parcelas
          </span>

          <table className={styles.parcelasTable}>
            <thead>
              <tr>
                <th>Parcela</th>
                <th>Sem juros</th>
                <th>Com juros</th>
              </tr>
            </thead>

            <tbody>
              {PARCELAS_DISPONIVEIS.map((n) => {
                const valorSemJuros =
                  subtotal > 0
                    ? subtotal / n
                    : 0;

                const valorComJuros =
                  subtotal > 0
                    ? calcularTotalComJuros(
                        subtotal,
                        n
                      ) / n
                    : 0;

                const selecionada =
                  n === parcelas;

                return (
                  <tr
                    key={n}
                    className={
                      selecionada
                        ? `${styles.parcelaRow} ${styles.parcelaRowAtiva}`
                        : styles.parcelaRow
                    }
                    role="button"
                    tabIndex={0}
                    aria-pressed={selecionada}
                    onClick={() =>
                      setParcelas(n)
                    }
                    onKeyDown={(event) => {
                      if (
                        event.key === "Enter" ||
                        event.key === " "
                      ) {
                        event.preventDefault();
                        setParcelas(n);
                      }
                    }}
                  >
                    <td>{n}x</td>
                    <td>
                      {formatarPreco(
                        valorSemJuros
                      )}
                    </td>
                    <td>
                      {formatarPreco(
                        valorComJuros
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      </div>

      <aside className={styles.carrinhoColuna}>
        <h2>Carrinho do caixa</h2>

        {carrinho.length === 0 ? (
          <p className={styles.mensagemNeutra}>
            Nenhuma peça adicionada ainda. Busque
            ao lado e clique em &ldquo;Adicionar&rdquo;.
          </p>
        ) : (
          <ul className={styles.carrinhoLista}>
            {carrinho.map((produto) => (
              <li
                key={produto.id}
                className={styles.carrinhoItem}
              >
                <span>{produto.nome}</span>

                <strong>
                  {formatarPreco(produto.preco)}
                </strong>

                <button
                  type="button"
                  className={
                    styles.removerButton
                  }
                  onClick={() =>
                    removerDoCarrinho(produto.id)
                  }
                >
                  Remover
                </button>
              </li>
            ))}
          </ul>
        )}

        <label className={styles.campo}>
          <span>Nome do cliente *</span>
          <input
            type="text"
            value={nomeCliente}
            onChange={(event) =>
              setNomeCliente(event.target.value)
            }
          />
        </label>

        <label className={styles.campo}>
          <span>E-mail do cliente</span>
          <input
            type="email"
            value={emailCliente}
            onChange={(event) =>
              setEmailCliente(event.target.value)
            }
          />
        </label>

        <div className={styles.totais}>
          <div className={styles.totalLinha}>
            <span>Sem juros</span>
            <strong>
              {formatarPreco(subtotal)}
            </strong>
          </div>

          <div className={styles.totalLinha}>
            <span>Com juros ({parcelas}x)</span>
            <strong>
              {formatarPreco(totalComJuros)}
            </strong>
          </div>
        </div>

        {erro && (
          <p className={styles.erro}>{erro}</p>
        )}

        {sucesso && (
          <p className={styles.sucesso}>
            {sucesso}
          </p>
        )}

        <button
          type="button"
          className={styles.confirmarButton}
          disabled={!podeConfirmar}
          onClick={handleConfirmarVenda}
        >
          {confirmando
            ? "Confirmando..."
            : "Confirmar venda"}
        </button>
      </aside>
    </div>
  );
}
