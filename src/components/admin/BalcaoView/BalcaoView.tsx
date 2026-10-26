"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import { ClienteAutocomplete } from "@/components/admin/ClienteAutocomplete/ClienteAutocomplete";
import { NovoProdutoModal } from "@/components/admin/NovoProdutoModal/NovoProdutoModal";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import {
  buscarProdutosParaBalcao,
  confirmarVendaBalcao,
} from "@/modules/vendaBalcao/actions";
import { criarReserva } from "@/modules/reserva/actions";
import type { ConversaoReservas } from "@/modules/reserva/reserva.types";
import { calcularTotalComJuros } from "@/modules/vendaBalcao/tabelaJurosMaquininha";
import { calcularDescontoAplicado } from "@/modules/vendaBalcao/desconto";
import {
  FORMAS_PAGAMENTO,
  MAXIMO_LINHAS_PAGAMENTO,
} from "@/modules/vendaBalcao/pagamentos";
import type {
  ClienteBalcaoResumo,
  DescontoTipo,
  FormaPagamentoLinha,
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

/**
 * Uma linha de pagamento na tela. `valor` é o texto digitado e só vale
 * pra linhas que NÃO são a última — a última é sempre "o resto"
 * (total − soma das anteriores) e se calcula sozinha.
 */
type LinhaPagamento = {
  id: string;
  forma: FormaPagamentoLinha | null;
  valor: string;
  parcelas: number;
};

let contadorLinhas = 0;

function novaLinha(valor = ""): LinhaPagamento {
  contadorLinhas += 1;

  return {
    id: `linha-${contadorLinhas}`,
    forma: null,
    valor,
    parcelas: 1,
  };
}

function paraCentavos(valor: number) {
  return Math.round(valor * 100);
}

function textoParaCentavos(texto: string) {
  const numero = Number(texto);

  return Number.isFinite(numero)
    ? paraCentavos(numero)
    : 0;
}

/**
 * Texto de uma opção do combo de parcelas: as duas parcelas (sem e com
 * juros), pro caixa ter o comparativo na hora de falar com o cliente.
 * Em tela estreita o rótulo fica só com a parcela com juros; o
 * comparativo completo vai pra linha de resumo abaixo do combo.
 */
function rotuloDaParcela(
  valor: number,
  parcelas: number,
  resumido: boolean
) {
  const semJuros = valor > 0 ? valor / parcelas : 0;

  const comJuros =
    valor > 0
      ? calcularTotalComJuros(valor, parcelas) /
        parcelas
      : 0;

  if (parcelas === 1) {
    return `1x de ${formatarPreco(semJuros)}`;
  }

  if (resumido) {
    return `${parcelas}x de ${formatarPreco(comJuros)}`;
  }

  return `${parcelas}x de ${formatarPreco(
    semJuros
  )}  (com juros: ${parcelas}x de ${formatarPreco(
    comJuros
  )})`;
}

/**
 * Linha de resumo abaixo do combo (só em parcelado). O "total no cartão"
 * é o que o cliente de fato paga naquela linha, com juros.
 */
function resumoDoCartao(
  valor: number,
  parcelas: number,
  totalComJuros: number,
  resumido: boolean
) {
  const total = `Total no cartão: ${formatarPreco(
    totalComJuros
  )}`;

  if (!resumido) {
    return total;
  }

  return `Sem juros: ${parcelas}x de ${formatarPreco(
    valor / parcelas
  )} · Com juros: ${parcelas}x de ${formatarPreco(
    calcularTotalComJuros(valor, parcelas) / parcelas
  )} · ${total}`;
}

type Categoria = {
  id: string;
  nome: string;
};

type BalcaoViewProps = {
  categorias: Categoria[];
  /**
   * Reservas pedidas em `?reservas=`, já resolvidas no servidor (só as
   * ainda ativas e de um mesmo cliente). `null` fora de uma conversão.
   * Vale só como estado inicial — nada é buscado ao carregar.
   */
  conversaoInicial: ConversaoReservas | null;
};

export function BalcaoView({
  categorias,
  conversaoInicial,
}: BalcaoViewProps) {
  const router = useRouter();

  const telaEstreita = useMediaQuery(
    "(max-width: 640px)"
  );

  const inputBuscaRef =
    useRef<HTMLInputElement>(null);

  const [busca, setBusca] = useState("");
  const [resultados, setResultados] = useState<
    ProdutoBalcaoResumo[]
  >([]);
  const [buscando, setBuscando] = useState(false);

  const [
    reservandoProdutoId,
    setReservandoProdutoId,
  ] = useState<string | null>(null);
  const [nomeReservaInline, setNomeReservaInline] =
    useState("");
  const [
    telefoneReservaInline,
    setTelefoneReservaInline,
  ] = useState("");
  const [salvandoReserva, setSalvandoReserva] =
    useState(false);
  const [erroReservaInline, setErroReservaInline] =
    useState("");

  const [carrinho, setCarrinho] = useState<
    ProdutoBalcaoResumo[]
  >(() => conversaoInicial?.produtos ?? []);

  const [nomeCliente, setNomeCliente] = useState(
    () => conversaoInicial?.cliente?.nomeCliente ?? ""
  );
  const [emailCliente, setEmailCliente] = useState(
    () => conversaoInicial?.cliente?.emailCliente ?? ""
  );
  const [telefoneCliente, setTelefoneCliente] =
    useState(
      () =>
        conversaoInicial?.cliente?.telefoneCliente ??
        ""
    );

  // Avisos da conversão de reserva (topo da tela). Somem quando a venda
  // é confirmada.
  const [convertendoDe, setConvertendoDe] = useState<
    string | null
  >(() =>
    conversaoInicial?.cliente &&
    conversaoInicial.produtos.length > 0
      ? conversaoInicial.cliente.nomeCliente
      : null
  );
  const [reservasNaoCarregadas, setReservasNaoCarregadas] =
    useState(() => conversaoInicial?.naoCarregadas ?? 0);

  const [descontoTipo, setDescontoTipo] =
    useState<DescontoTipo | null>(null);
  const [descontoValor, setDescontoValor] =
    useState("");
  const [linhas, setLinhas] = useState<
    LinhaPagamento[]
  >(() => [novaLinha()]);

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

  function selecionarCliente(
    cliente: ClienteBalcaoResumo
  ) {
    setNomeCliente(cliente.nomeCliente);
    setEmailCliente(cliente.emailCliente);
    setTelefoneCliente(cliente.telefoneCliente);
  }

  // Peça recém-cadastrada: joga a referência (ou o nome, se não tiver)
  // na busca pra ela aparecer no topo, com "Adicionar" e "Reservar".
  // Não entra no carrinho sozinha — o cadastro pode ser só isso.
  function buscarPecaCadastrada(produto?: {
    nome: string;
    referencia: string;
  }) {
    const termo =
      produto?.referencia.trim() ||
      produto?.nome.trim();

    if (!termo) {
      return;
    }

    setBusca(termo);
    inputBuscaRef.current?.focus();
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

  // Tudo em centavos inteiros pra soma das linhas bater exatamente com
  // o total (o servidor confere igual, em centavos).
  const totalCentavos = paraCentavos(totalFinal);

  const somaAnterioresCentavos = linhas
    .slice(0, -1)
    .reduce(
      (soma, linha) =>
        soma + textoParaCentavos(linha.valor),
      0
    );

  const restoCentavos =
    totalCentavos - somaAnterioresCentavos;

  const linhasCalculadas = linhas.map(
    (linha, index) => {
      const ehUltima = index === linhas.length - 1;

      const valorCentavos = ehUltima
        ? restoCentavos
        : textoParaCentavos(linha.valor);

      const valor = valorCentavos / 100;

      const parcelado =
        linha.forma === "CREDITO" &&
        linha.parcelas > 1;

      return {
        ...linha,
        ehUltima,
        valorCentavos,
        valor,
        // Juros só na parte paga no crédito parcelado.
        valorComJuros: parcelado
          ? Math.round(
              calcularTotalComJuros(
                valor,
                linha.parcelas
              ) * 100
            ) / 100
          : null,
      };
    }
  );

  const temJuros = linhasCalculadas.some(
    (linha) => linha.valorComJuros !== null
  );

  const totalCobradoComJuros =
    linhasCalculadas.reduce(
      (soma, linha) =>
        soma +
        paraCentavos(
          linha.valorComJuros ?? linha.valor
        ),
      0
    ) / 100;

  // Dois cartões na mesma venda: cada linha de Crédito ganha título
  // próprio pra ficar óbvio que são cartões diferentes. (Não se registra
  // qual cartão/bandeira — não há campo pra isso.)
  const doisCartoes =
    linhasCalculadas.filter(
      (linha) => linha.forma === "CREDITO"
    ).length >= 2;

  const linhaSemForma = linhas.some(
    (linha) => !linha.forma
  );

  const valorAnteriorInvalido =
    linhasCalculadas
      .slice(0, -1)
      .some((linha) => linha.valorCentavos <= 0);

  const restoInvalido = restoCentavos <= 0;

  const avisoCobreTotal =
    linhas.length > 1 &&
    totalCentavos > 0 &&
    restoInvalido;

  const pagamentosValidos =
    !linhaSemForma &&
    !valorAnteriorInvalido &&
    !restoInvalido;

  function atualizarLinha(
    id: string,
    mudancas: Partial<LinhaPagamento>
  ) {
    setLinhas((atual) =>
      atual.map((linha) =>
        linha.id === id
          ? { ...linha, ...mudancas }
          : linha
      )
    );
  }

  function escolherForma(
    id: string,
    forma: FormaPagamentoLinha
  ) {
    setLinhas((atual) =>
      atual.map((linha) =>
        linha.id === id
          ? {
              ...linha,
              forma,
              parcelas:
                forma === "CREDITO"
                  ? linha.parcelas
                  : 1,
            }
          : linha
      )
    );
  }

  function adicionarLinha() {
    if (
      linhas.length >= MAXIMO_LINHAS_PAGAMENTO ||
      restoCentavos <= 0
    ) {
      return;
    }

    // A linha nova vira a última ("o resto"); a que era a última passa
    // a ser editável já com o valor que tinha (o resto atual).
    setLinhas((atual) => [
      ...atual.map((linha, index) =>
        index === atual.length - 1
          ? {
              ...linha,
              valor: (restoCentavos / 100).toFixed(2),
            }
          : linha
      ),
      novaLinha(),
    ]);
  }

  function removerLinha(id: string) {
    setLinhas((atual) =>
      atual.length > 1
        ? atual.filter((linha) => linha.id !== id)
        : atual
    );
  }

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

  function abrirReservaInline(
    produtoId: string
  ) {
    setReservandoProdutoId(produtoId);
    setNomeReservaInline("");
    setTelefoneReservaInline("");
    setErroReservaInline("");
  }

  function cancelarReservaInline() {
    setReservandoProdutoId(null);
    setNomeReservaInline("");
    setTelefoneReservaInline("");
    setErroReservaInline("");
  }

  async function confirmarReservaInline(
    produtoId: string
  ) {
    if (!nomeReservaInline.trim()) {
      setErroReservaInline(
        "Informe o nome do cliente pra reservar."
      );
      return;
    }

    setSalvandoReserva(true);
    setErroReservaInline("");

    const resultado = await criarReserva({
      produtoId,
      nomeCliente: nomeReservaInline.trim(),
      telefoneCliente:
        telefoneReservaInline.trim() ||
        undefined,
      canal: "BALCAO",
    });

    setSalvandoReserva(false);

    if (!resultado.ok) {
      setErroReservaInline(resultado.message);
      return;
    }

    cancelarReservaInline();

    // Atualiza a busca na hora pra trocar "Reservar" pelo selo — a
    // action já revalida a rota, mas essa lista é estado local.
    const termo = busca.trim();

    if (termo) {
      const resultadoBusca =
        await buscarProdutosParaBalcao(termo);

      setResultados(
        resultadoBusca.ok
          ? resultadoBusca.produtos
          : []
      );
    }
  }

  const telefoneInvalido =
    telefoneCliente.trim().length > 0 &&
    !celularValido(telefoneCliente);

  const podeConfirmar =
    nomeCliente.trim().length > 0 &&
    carrinho.length > 0 &&
    !telefoneInvalido &&
    !descontoInvalido &&
    pagamentosValidos &&
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
      pagamentos: linhasCalculadas.map(
        (linha) => ({
          forma: linha.forma as FormaPagamentoLinha,
          valor: linha.valor,
          parcelas:
            linha.forma === "CREDITO"
              ? linha.parcelas
              : 1,
        })
      ),
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

    const eraConversao = convertendoDe !== null;

    setCarrinho([]);
    setNomeCliente("");
    setEmailCliente("");
    setTelefoneCliente("");
    setDescontoTipo(null);
    setDescontoValor("");
    setLinhas([novaLinha()]);
    setConvertendoDe(null);
    setReservasNaoCarregadas(0);
    setBusca("");
    setResultados([]);
    inputBuscaRef.current?.focus();

    // Sai de `?reservas=…`: a reserva já virou Convertida e recarregar
    // a tela não deve tentar converter de novo.
    if (eraConversao) {
      router.replace("/admin/balcao");
    }
  }

  return (
    <div className={styles.layout}>
      {(convertendoDe ||
        reservasNaoCarregadas > 0) && (
        <div
          className={styles.avisosConversao}
          role="status"
        >
          {convertendoDe && (
            <p className={styles.avisoConversao}>
              Convertendo reserva de{" "}
              <strong>{convertendoDe}</strong>
            </p>
          )}

          {reservasNaoCarregadas > 0 && (
            <p
              className={`${styles.avisoConversao} ${styles.avisoConversaoAtencao}`}
            >
              {reservasNaoCarregadas} reserva(s) não
              puderam ser carregadas (já convertidas
              ou canceladas).
            </p>
          )}
        </div>
      )}

      <div className={styles.colunaEsquerda}>
        <section className={styles.buscaColuna}>
          <div className={styles.buscaTopo}>
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

            <NovoProdutoModal
              categorias={categorias}
              className={styles.novoProdutoButton}
              onSaved={buscarPecaCadastrada}
            />
          </div>

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

              const reservandoEssa =
                reservandoProdutoId ===
                produto.id;

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

                    {produto.status ===
                      "RESERVADO" && (
                      <span
                        className={
                          styles.seloReservado
                        }
                      >
                        Reservado para{" "}
                        {produto.reservadoPara}
                      </span>
                    )}

                    {reservandoEssa && (
                      <div
                        className={
                          styles.reservaInline
                        }
                      >
                        <ClienteAutocomplete
                          variante="embutida"
                          placeholder="Nome do cliente"
                          value={
                            nomeReservaInline
                          }
                          onChange={
                            setNomeReservaInline
                          }
                          onSelecionar={(cliente) => {
                            setNomeReservaInline(
                              cliente.nomeCliente
                            );
                            setTelefoneReservaInline(
                              formatarCelular(
                                cliente.telefoneCliente
                              )
                            );
                          }}
                        />

                        <input
                          type="tel"
                          placeholder="Celular (opcional)"
                          value={
                            telefoneReservaInline
                          }
                          onChange={(event) =>
                            setTelefoneReservaInline(
                              formatarCelular(
                                event.target
                                  .value
                              )
                            )
                          }
                        />

                        {erroReservaInline && (
                          <p
                            className={
                              styles.avisoErro
                            }
                          >
                            {erroReservaInline}
                          </p>
                        )}

                        <div
                          className={
                            styles.reservaInlineAcoes
                          }
                        >
                          <button
                            type="button"
                            onClick={
                              cancelarReservaInline
                            }
                            disabled={
                              salvandoReserva
                            }
                          >
                            Cancelar
                          </button>

                          <button
                            type="button"
                            className={
                              styles.adicionarButton
                            }
                            disabled={
                              salvandoReserva
                            }
                            onClick={() =>
                              confirmarReservaInline(
                                produto.id
                              )
                            }
                          >
                            {salvandoReserva
                              ? "Salvando..."
                              : "Confirmar reserva"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {!reservandoEssa && (
                    <div
                      className={
                        styles.resultadoAcoes
                      }
                    >
                      <button
                        type="button"
                        className={
                          styles.adicionarButton
                        }
                        disabled={jaNoCarrinho}
                        onClick={() =>
                          adicionarAoCarrinho(
                            produto
                          )
                        }
                      >
                        {jaNoCarrinho
                          ? "Adicionado"
                          : "Adicionar"}
                      </button>

                      {produto.status ===
                        "DISPONIVEL" && (
                        <button
                          type="button"
                          className={
                            styles.reservarButton
                          }
                          onClick={() =>
                            abrirReservaInline(
                              produto.id
                            )
                          }
                        >
                          Reservar
                        </button>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>

        <section className={styles.pagamentoPainel}>
          <span className={styles.pagamentoLabel}>
            Pagamento
          </span>

          <div className={styles.pagamentoLinhas}>
            {linhasCalculadas.map((linha, index) => (
              <div
                key={linha.id}
                className={styles.pagamentoLinha}
              >
                <div
                  className={styles.pagamentoLinhaTopo}
                >
                  <span
                    className={
                      styles.pagamentoLinhaTitulo
                    }
                  >
                    {linhas.length === 1
                      ? "Forma de pagamento"
                      : doisCartoes &&
                          linha.forma === "CREDITO"
                        ? `Pagamento ${index + 1} — Cartão de crédito`
                        : `Pagamento ${index + 1}`}
                  </span>

                  {linhas.length > 1 && (
                    <button
                      type="button"
                      className={
                        styles.removerLinhaButton
                      }
                      aria-label={`Remover pagamento ${
                        index + 1
                      }`}
                      onClick={() =>
                        removerLinha(linha.id)
                      }
                    >
                      ×
                    </button>
                  )}
                </div>

                <div
                  className={
                    styles.formaPagamentoOpcoes
                  }
                >
                  {FORMAS_PAGAMENTO.map((opcao) => (
                    <button
                      key={opcao.valor}
                      type="button"
                      className={
                        linha.forma === opcao.valor
                          ? `${styles.formaPagamentoBotao} ${styles.formaPagamentoBotaoAtivo}`
                          : styles.formaPagamentoBotao
                      }
                      aria-pressed={
                        linha.forma === opcao.valor
                      }
                      onClick={() =>
                        escolherForma(
                          linha.id,
                          opcao.valor
                        )
                      }
                    >
                      {opcao.label}
                    </button>
                  ))}
                </div>

                {linhas.length > 1 && (
                  <label className={styles.campo}>
                    <span>
                      {linha.ehUltima
                        ? "Valor — o resto"
                        : "Valor (R$)"}
                    </span>

                    {linha.ehUltima ? (
                      <input
                        type="text"
                        readOnly
                        className={
                          styles.campoSomenteLeitura
                        }
                        value={formatarPreco(
                          linha.valor
                        )}
                      />
                    ) : (
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        inputMode="decimal"
                        value={linha.valor}
                        onChange={(event) =>
                          atualizarLinha(linha.id, {
                            valor:
                              event.target.value,
                          })
                        }
                      />
                    )}
                  </label>
                )}

                {linha.forma === "CREDITO" && (
                  <>
                    <label className={styles.campo}>
                      <span>Parcelas</span>

                      <select
                        value={linha.parcelas}
                        onChange={(event) =>
                          atualizarLinha(linha.id, {
                            parcelas: Number(
                              event.target.value
                            ),
                          })
                        }
                      >
                        {PARCELAS_DISPONIVEIS.map(
                          (n) => (
                            <option key={n} value={n}>
                              {rotuloDaParcela(
                                linha.valor,
                                n,
                                telaEstreita
                              )}
                            </option>
                          )
                        )}
                      </select>
                    </label>

                    {linha.parcelas > 1 &&
                      linha.valor > 0 && (
                        <p
                          className={styles.resumoCartao}
                        >
                          {resumoDoCartao(
                            linha.valor,
                            linha.parcelas,
                            linha.valorComJuros ??
                              linha.valor,
                            telaEstreita
                          )}
                        </p>
                      )}
                  </>
                )}
              </div>
            ))}
          </div>

          {linhaSemForma && (
            <p className={styles.avisoErro}>
              Escolha a forma de cada pagamento.
            </p>
          )}

          {avisoCobreTotal && (
            <p className={styles.avisoErro}>
              Os valores informados já cobrem o total;
              remova ou reduza uma linha.
            </p>
          )}

          {!avisoCobreTotal &&
            valorAnteriorInvalido && (
              <p className={styles.avisoErro}>
                Informe um valor maior que zero em
                cada pagamento.
              </p>
            )}

          {linhas.length < MAXIMO_LINHAS_PAGAMENTO && (
            <button
              type="button"
              className={styles.dividirButton}
              disabled={restoCentavos <= 0}
              onClick={adicionarLinha}
            >
              + Dividir em outra forma
            </button>
          )}
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

        <ClienteAutocomplete
          rotulo="Nome do cliente *"
          classeCampo={styles.campo}
          value={nomeCliente}
          onChange={setNomeCliente}
          onSelecionar={selecionarCliente}
        />

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

          {temJuros && (
            <div className={styles.totalLinha}>
              <span>Total cobrado com juros</span>
              <strong>
                {formatarPreco(
                  totalCobradoComJuros
                )}
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
