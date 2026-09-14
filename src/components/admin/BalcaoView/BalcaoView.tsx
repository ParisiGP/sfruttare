"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  buscarClientesParaBalcao,
  buscarProdutosParaBalcao,
  confirmarVendaBalcao,
} from "@/modules/vendaBalcao/actions";
import { calcularTotalComJuros } from "@/modules/vendaBalcao/tabelaJurosMaquininha";
import { calcularDescontoAplicado } from "@/modules/vendaBalcao/desconto";
import type {
  ClienteBalcaoResumo,
  DescontoTipo,
  ProdutoBalcaoResumo,
} from "@/modules/vendaBalcao/vendaBalcao.types";
import { formatarPreco } from "@/lib/formatarPreco";
import {
  celularValido,
  formatarCelular,
} from "@/lib/telefone";

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
  const [sugestoesClientes, setSugestoesClientes] =
    useState<ClienteBalcaoResumo[]>([]);
  const [
    indiceDestacadoCliente,
    setIndiceDestacadoCliente,
  ] = useState(-1);
  const suprimirBuscaClienteRef = useRef(false);
  const clienteWrapRef =
    useRef<HTMLDivElement>(null);
  const [emailCliente, setEmailCliente] =
    useState("");
  const [telefoneCliente, setTelefoneCliente] =
    useState("");
  const [descontoTipo, setDescontoTipo] =
    useState<DescontoTipo | null>(null);
  const [descontoValor, setDescontoValor] =
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

  useEffect(() => {
    if (suprimirBuscaClienteRef.current) {
      suprimirBuscaClienteRef.current = false;
      setSugestoesClientes([]);
      return;
    }

    const termo = nomeCliente.trim();

    if (termo.length < 2) {
      setSugestoesClientes([]);
      return;
    }

    let cancelado = false;

    const timer = setTimeout(async () => {
      const resultado =
        await buscarClientesParaBalcao(termo);

      if (cancelado) {
        return;
      }

      setSugestoesClientes(
        resultado.ok ? resultado.clientes : []
      );
      setIndiceDestacadoCliente(-1);
    }, DEBOUNCE_MS);

    return () => {
      cancelado = true;
      clearTimeout(timer);
    };
  }, [nomeCliente]);

  useEffect(() => {
    function handleClickFora(
      event: MouseEvent
    ) {
      if (
        clienteWrapRef.current &&
        !clienteWrapRef.current.contains(
          event.target as Node
        )
      ) {
        setSugestoesClientes([]);
      }
    }

    document.addEventListener(
      "mousedown",
      handleClickFora
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickFora
      );
    };
  }, []);

  function selecionarCliente(
    cliente: ClienteBalcaoResumo
  ) {
    suprimirBuscaClienteRef.current = true;
    setNomeCliente(cliente.nomeCliente);
    setEmailCliente(cliente.emailCliente);
    setTelefoneCliente(cliente.telefoneCliente);
    setSugestoesClientes([]);
    setIndiceDestacadoCliente(-1);
  }

  function handleNomeClienteKeyDown(
    event: React.KeyboardEvent<HTMLInputElement>
  ) {
    if (sugestoesClientes.length === 0) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setIndiceDestacadoCliente(
        (atual) =>
          (atual + 1) % sugestoesClientes.length
      );
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setIndiceDestacadoCliente((atual) =>
        atual <= 0
          ? sugestoesClientes.length - 1
          : atual - 1
      );
    } else if (event.key === "Enter") {
      if (indiceDestacadoCliente >= 0) {
        event.preventDefault();
        selecionarCliente(
          sugestoesClientes[
            indiceDestacadoCliente
          ]
        );
      }
    } else if (event.key === "Escape") {
      setSugestoesClientes([]);
      setIndiceDestacadoCliente(-1);
    }
  }

  const subtotal = useMemo(
    () =>
      carrinho.reduce(
        (soma, produto) => soma + produto.preco,
        0
      ),
    [carrinho]
  );

  const descontoEntradaNumero =
    descontoValor === ""
      ? undefined
      : Number(descontoValor);

  const descontoAplicado = useMemo(
    () =>
      calcularDescontoAplicado(
        subtotal,
        descontoTipo ?? undefined,
        descontoEntradaNumero
      ),
    [
      subtotal,
      descontoTipo,
      descontoEntradaNumero,
    ]
  );

  const descontoInvalido =
    descontoAplicado > subtotal;

  const totalFinal = descontoInvalido
    ? subtotal
    : subtotal - descontoAplicado;

  const totalComJuros = useMemo(
    () =>
      calcularTotalComJuros(
        totalFinal,
        parcelas
      ),
    [totalFinal, parcelas]
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

  const telefoneInvalido =
    telefoneCliente.trim().length > 0 &&
    !celularValido(telefoneCliente);

  const podeConfirmar =
    nomeCliente.trim().length > 0 &&
    carrinho.length > 0 &&
    !telefoneInvalido &&
    !descontoInvalido &&
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
      telefoneCliente:
        telefoneCliente.trim() || undefined,
      descontoTipo:
        descontoTipo ?? undefined,
      descontoEntrada: descontoEntradaNumero,
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
        totalFinal
      )} confirmada para ${nomeCliente.trim()}.`
    );

    setCarrinho([]);
    setNomeCliente("");
    setSugestoesClientes([]);
    setIndiceDestacadoCliente(-1);
    setEmailCliente("");
    setTelefoneCliente("");
    setDescontoTipo(null);
    setDescontoValor("");
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
                      {produto.tamanho && (
                        <>
                          Tam. {produto.tamanho}
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
                  totalFinal > 0
                    ? totalFinal / n
                    : 0;

                const valorComJuros =
                  totalFinal > 0
                    ? calcularTotalComJuros(
                        totalFinal,
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

        <div
          className={styles.campoComSugestoes}
          ref={clienteWrapRef}
        >
          <label className={styles.campo}>
            <span>Nome do cliente *</span>
            <input
              type="text"
              autoComplete="off"
              value={nomeCliente}
              onChange={(event) =>
                setNomeCliente(
                  event.target.value
                )
              }
              onKeyDown={
                handleNomeClienteKeyDown
              }
            />
          </label>

          {sugestoesClientes.length > 0 && (
            <ul
              className={styles.sugestoesLista}
            >
              {sugestoesClientes.map(
                (cliente, index) => (
                  <li
                    key={
                      cliente.nomeCliente +
                      index
                    }
                  >
                    <button
                      type="button"
                      className={
                        index ===
                        indiceDestacadoCliente
                          ? `${styles.sugestaoItem} ${styles.sugestaoItemAtiva}`
                          : styles.sugestaoItem
                      }
                      onClick={() =>
                        selecionarCliente(
                          cliente
                        )
                      }
                      onMouseEnter={() =>
                        setIndiceDestacadoCliente(
                          index
                        )
                      }
                    >
                      <strong>
                        {cliente.nomeCliente}
                      </strong>
                      {cliente.telefoneCliente && (
                        <span>
                          {" "}
                          —{" "}
                          {
                            cliente.telefoneCliente
                          }
                        </span>
                      )}
                    </button>
                  </li>
                )
              )}
            </ul>
          )}
        </div>

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

        <label className={styles.campo}>
          <span>Celular do cliente</span>
          <input
            type="tel"
            inputMode="tel"
            placeholder="(11) 91234-5678"
            value={telefoneCliente}
            onChange={(event) =>
              setTelefoneCliente(
                formatarCelular(
                  event.target.value
                )
              )
            }
          />
          {telefoneInvalido && (
            <span
              className={styles.campoErro}
            >
              Digite um celular válido, com
              DDD.
            </span>
          )}
        </label>

        <div className={styles.descontoGrupo}>
          <label className={styles.campo}>
            <span>Desconto em R$</span>
            <input
              type="number"
              min={0}
              step="0.01"
              disabled={
                descontoTipo === "PERCENTUAL"
              }
              value={
                descontoTipo === "VALOR"
                  ? descontoValor
                  : ""
              }
              onChange={(event) => {
                const valor =
                  event.target.value;

                if (valor === "") {
                  setDescontoTipo(null);
                  setDescontoValor("");
                  return;
                }

                setDescontoTipo("VALOR");
                setDescontoValor(valor);
              }}
            />
          </label>

          <label className={styles.campo}>
            <span>Desconto em %</span>
            <input
              type="number"
              min={0}
              max={100}
              step="0.1"
              disabled={
                descontoTipo === "VALOR"
              }
              value={
                descontoTipo === "PERCENTUAL"
                  ? descontoValor
                  : ""
              }
              onChange={(event) => {
                const valor =
                  event.target.value;

                if (valor === "") {
                  setDescontoTipo(null);
                  setDescontoValor("");
                  return;
                }

                setDescontoTipo("PERCENTUAL");
                setDescontoValor(valor);
              }}
            />
          </label>
        </div>

        {descontoInvalido && (
          <p className={styles.erro}>
            O desconto não pode ser maior que o
            subtotal da venda.
          </p>
        )}

        <div className={styles.totais}>
          <div className={styles.totalLinha}>
            <span>Subtotal</span>
            <strong>
              {formatarPreco(subtotal)}
            </strong>
          </div>

          {descontoAplicado > 0 &&
            !descontoInvalido && (
              <div
                className={styles.totalLinha}
              >
                <span>Desconto aplicado</span>
                <strong>
                  −
                  {formatarPreco(
                    descontoAplicado
                  )}
                </strong>
              </div>
            )}

          <div className={styles.totalLinha}>
            <span>Total</span>
            <strong>
              {formatarPreco(totalFinal)}
            </strong>
          </div>

          {totalComJuros !== totalFinal && (
            <div className={styles.totalLinha}>
              <span>Com juros ({parcelas}x)</span>
              <strong>
                {formatarPreco(totalComJuros)}
              </strong>
            </div>
          )}
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
