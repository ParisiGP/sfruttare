"use client";

import { useState } from "react";

import { Modal } from "@/components/ui/Modal/Modal";
import { formatarPreco } from "@/lib/formatarPreco";
import { percentualValido } from "@/modules/consignacao/consignacao";
import {
  definirPercentualEmLoteAction,
  desfazerRepasseAction,
  informarPercentualAction,
  marcarRepassadoAction,
  marcarTodasRepassadasAction,
} from "@/modules/consignacao/actions";
import type {
  ConsignadoLinha,
  FiltroStatusConsignados,
  GrupoConsignante,
  ResumoConsignante,
} from "@/modules/consignacao/consignacao.types";

import styles from "./ConsignadosLista.module.css";

type Props = {
  grupos: GrupoConsignante[];
  consignantes: ResumoConsignante[];
  statusFiltro: FiltroStatusConsignados;
};

type Mensagem = {
  ok: boolean;
  texto: string;
};

const formatadorData = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeZone: "America/Sao_Paulo",
});

function formatarData(iso: string | null) {
  return iso ? formatadorData.format(new Date(iso)) : "—";
}

function rotuloDoStatus(linha: ConsignadoLinha) {
  if (linha.statusRepasse === "REPASSADO") {
    return `Repassado em ${formatarData(linha.repassadoEm)}`;
  }

  return linha.statusRepasse === "A_REPASSAR"
    ? "A repassar"
    : "Em estoque";
}

export function ConsignadosLista({
  grupos,
  consignantes,
  statusFiltro,
}: Props) {
  // Chave da ação em andamento ("linha:<id>", "grupo:<nome>", "lote"):
  // enquanto houver uma, os botões ficam desabilitados.
  const [pendente, setPendente] = useState<string | null>(
    null
  );
  const [mensagem, setMensagem] =
    useState<Mensagem | null>(null);
  const [desfazendoId, setDesfazendoId] = useState<
    string | null
  >(null);
  const [grupoParaMarcar, setGrupoParaMarcar] =
    useState<GrupoConsignante | null>(null);
  const [percentuais, setPercentuais] = useState<
    Record<string, string>
  >({});

  const [loteAberto, setLoteAberto] = useState(false);
  const [loteConsignante, setLoteConsignante] =
    useState("");
  const [lotePercentual, setLotePercentual] =
    useState("");

  const ocupado = pendente !== null;

  async function executar(
    chave: string,
    acao: () => Promise<{ ok: boolean; message: string }>
  ) {
    setPendente(chave);
    setMensagem(null);

    const resultado = await acao();

    setPendente(null);
    setMensagem({
      ok: resultado.ok,
      texto: resultado.message,
    });

    return resultado.ok;
  }

  async function marcar(linha: ConsignadoLinha) {
    await executar(`linha:${linha.id}`, () =>
      marcarRepassadoAction(linha.id)
    );
  }

  async function desfazer(linha: ConsignadoLinha) {
    const ok = await executar(`linha:${linha.id}`, () =>
      desfazerRepasseAction(linha.id)
    );

    if (ok) {
      setDesfazendoId(null);
    }
  }

  async function marcarTodas(grupo: GrupoConsignante) {
    await executar(`grupo:${grupo.consignante}`, () =>
      marcarTodasRepassadasAction(grupo.consignante)
    );

    setGrupoParaMarcar(null);
  }

  /** Salva ao sair do campo / Enter; vazio ou inválido não grava. */
  async function salvarPercentual(linha: ConsignadoLinha) {
    const texto = (percentuais[linha.id] ?? "").trim();

    if (texto === "") {
      return;
    }

    const percentual = Number(texto.replace(",", "."));

    if (!percentualValido(percentual)) {
      setMensagem({
        ok: false,
        texto:
          "Informe um % maior que 0 e até 100 (no máximo 2 casas).",
      });
      return;
    }

    const ok = await executar(`linha:${linha.id}`, () =>
      informarPercentualAction(linha.id, percentual)
    );

    if (ok) {
      setPercentuais((atual) => {
        const proximo = { ...atual };
        delete proximo[linha.id];
        return proximo;
      });
    }
  }

  const consignantesSemPercentual = consignantes.filter(
    (consignante) => consignante.semPercentual > 0
  );

  const consignanteDoLote =
    consignantesSemPercentual.find(
      (consignante) => consignante.nome === loteConsignante
    ) ?? null;

  const percentualDoLote = Number(
    lotePercentual.replace(",", ".")
  );

  const loteValido =
    consignanteDoLote !== null &&
    percentualValido(percentualDoLote);

  async function aplicarLote() {
    if (!consignanteDoLote || !loteValido) {
      return;
    }

    const ok = await executar("lote", () =>
      definirPercentualEmLoteAction(
        consignanteDoLote.nome,
        percentualDoLote
      )
    );

    if (ok) {
      setLoteAberto(false);
      setLotePercentual("");
      setLoteConsignante("");
    }
  }

  function abrirLote() {
    setLoteConsignante(
      consignantesSemPercentual[0]?.nome ?? ""
    );
    setLotePercentual("");
    setLoteAberto(true);
  }

  function renderAcao(linha: ConsignadoLinha) {
    const emAndamento = pendente === `linha:${linha.id}`;

    if (linha.statusRepasse === "REPASSADO") {
      if (desfazendoId === linha.id) {
        return (
          <div className={styles.confirmacao}>
            <button
              type="button"
              onClick={() => setDesfazendoId(null)}
              disabled={ocupado}
            >
              Voltar
            </button>

            <button
              type="button"
              className={styles.confirmarDesfazer}
              onClick={() => desfazer(linha)}
              disabled={ocupado}
            >
              {emAndamento ? "Desfazendo..." : "Confirmar"}
            </button>
          </div>
        );
      }

      return (
        <button
          type="button"
          className={styles.desfazerButton}
          onClick={() => setDesfazendoId(linha.id)}
          disabled={ocupado}
        >
          Desfazer
        </button>
      );
    }

    if (linha.statusRepasse === "A_REPASSAR") {
      if (linha.percentual === null) {
        return <span className={styles.semAcao}>Informe o %</span>;
      }

      return (
        <button
          type="button"
          className={styles.marcarButton}
          onClick={() => marcar(linha)}
          disabled={ocupado}
        >
          {emAndamento ? "Marcando..." : "Marcar repassado"}
        </button>
      );
    }

    return <span className={styles.semAcao}>—</span>;
  }

  function renderPercentual(linha: ConsignadoLinha) {
    if (linha.percentual !== null) {
      return `${linha.percentual}%`;
    }

    if (linha.statusRepasse === "REPASSADO") {
      return "—";
    }

    return (
      <input
        className={styles.percentualInput}
        type="number"
        min="0"
        max="100"
        step="0.01"
        inputMode="decimal"
        placeholder="Informar %"
        aria-label={`Informar % de repasse de ${linha.referencia}`}
        value={percentuais[linha.id] ?? ""}
        disabled={ocupado}
        onChange={(event) =>
          setPercentuais((atual) => ({
            ...atual,
            [linha.id]: event.target.value,
          }))
        }
        onBlur={() => salvarPercentual(linha)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            event.currentTarget.blur();
          }
        }}
      />
    );
  }

  const vazio =
    statusFiltro === "A_REPASSAR"
      ? "Nada a repassar."
      : "Nenhuma peça consignada neste filtro.";

  return (
    <div className={styles.lista}>
      <div className={styles.barra}>
        <button
          type="button"
          className={styles.loteButton}
          onClick={abrirLote}
          disabled={
            ocupado ||
            consignantesSemPercentual.length === 0
          }
          title={
            consignantesSemPercentual.length === 0
              ? "Todas as peças consignadas já têm %"
              : undefined
          }
        >
          Definir % em lote
        </button>
      </div>

      {mensagem && (
        <p
          className={
            mensagem.ok ? styles.sucesso : styles.erro
          }
          role={mensagem.ok ? "status" : "alert"}
        >
          {mensagem.texto}
        </p>
      )}

      {grupos.length === 0 && (
        <p className={styles.vazio}>{vazio}</p>
      )}

      {grupos.map((grupo) => (
        <section
          key={grupo.consignante}
          className={styles.grupo}
        >
          <header className={styles.grupoCabecalho}>
            <h2>{grupo.consignante}</h2>

            <p className={styles.grupoResumo}>
              {grupo.aRepassarQtd === 0
                ? "Nada a repassar"
                : `${grupo.aRepassarQtd} a repassar · ${formatarPreco(
                    grupo.aRepassarValor
                  )}`}
            </p>

            <button
              type="button"
              className={styles.marcarTodasButton}
              onClick={() => setGrupoParaMarcar(grupo)}
              disabled={
                ocupado || grupo.repassaveisQtd === 0
              }
            >
              Marcar todas como repassadas
            </button>
          </header>

          <table className={styles.table}>
            <thead>
              <tr>
                <th>Referência</th>
                <th>Peça</th>
                <th>Venda</th>
                <th>Preço de tabela</th>
                <th>%</th>
                <th>Repasse</th>
                <th>Status</th>
                <th>Ação</th>
              </tr>
            </thead>

            <tbody>
              {grupo.linhas.map((linha) => (
                <tr key={linha.id}>
                  <td data-label="Referência">
                    {linha.referencia}
                  </td>

                  <td data-label="Peça">{linha.nome}</td>

                  <td data-label="Venda">
                    {formatarData(linha.dataVenda)}
                  </td>

                  <td data-label="Preço de tabela">
                    {formatarPreco(linha.precoTabela)}
                  </td>

                  <td data-label="%">
                    {renderPercentual(linha)}
                  </td>

                  <td data-label="Repasse">
                    {linha.repasse === null
                      ? "—"
                      : formatarPreco(linha.repasse)}
                  </td>

                  <td data-label="Status">
                    <span
                      className={`${styles.badge} ${
                        styles[linha.statusRepasse]
                      }`}
                    >
                      {rotuloDoStatus(linha)}
                    </span>
                  </td>

                  <td data-label="Ação">
                    {renderAcao(linha)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}

      <Modal
        aberto={grupoParaMarcar !== null}
        onClose={() => setGrupoParaMarcar(null)}
      >
        {grupoParaMarcar && (
          <div className={styles.modalConteudo}>
            <h2>Marcar como repassadas</h2>

            <p>
              Marcar{" "}
              <strong>
                {grupoParaMarcar.repassaveisQtd} peça(s)
              </strong>{" "}
              de{" "}
              <strong>{grupoParaMarcar.consignante}</strong>{" "}
              como repassadas, num total de{" "}
              <strong>
                {formatarPreco(
                  grupoParaMarcar.repassaveisValor
                )}
              </strong>
              ? Só entram as peças com % definido.
            </p>

            <div className={styles.modalAcoes}>
              <button
                type="button"
                onClick={() => setGrupoParaMarcar(null)}
                disabled={ocupado}
              >
                Cancelar
              </button>

              <button
                type="button"
                className={styles.modalConfirmar}
                onClick={() => marcarTodas(grupoParaMarcar)}
                disabled={ocupado}
              >
                {ocupado ? "Marcando..." : "Confirmar"}
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        aberto={loteAberto}
        onClose={() => setLoteAberto(false)}
      >
        <div className={styles.modalConteudo}>
          <h2>Definir % em lote</h2>

          <label className={styles.campo}>
            <span>Consignante</span>
            <select
              value={loteConsignante}
              onChange={(event) =>
                setLoteConsignante(event.target.value)
              }
            >
              {consignantesSemPercentual.map(
                (consignante) => (
                  <option
                    key={consignante.nome}
                    value={consignante.nome}
                  >
                    {consignante.nome} (
                    {consignante.semPercentual} sem %)
                  </option>
                )
              )}
            </select>
          </label>

          <label className={styles.campo}>
            <span>% de repasse</span>
            <input
              type="number"
              min="0"
              max="100"
              step="0.01"
              inputMode="decimal"
              placeholder="Ex.: 40"
              value={lotePercentual}
              onChange={(event) =>
                setLotePercentual(event.target.value)
              }
            />
          </label>

          <p className={styles.modalTexto}>
            {loteValido && consignanteDoLote
              ? `Aplicar ${percentualDoLote}% em ${consignanteDoLote.semPercentual} peça(s) ${consignanteDoLote.nome} que estão sem %? Quem já tem % não é alterado.`
              : "Informe o % (maior que 0 e até 100) para ver quantas peças serão afetadas."}
          </p>

          <div className={styles.modalAcoes}>
            <button
              type="button"
              onClick={() => setLoteAberto(false)}
              disabled={ocupado}
            >
              Cancelar
            </button>

            <button
              type="button"
              className={styles.modalConfirmar}
              onClick={aplicarLote}
              disabled={!loteValido || ocupado}
            >
              {ocupado ? "Aplicando..." : "Aplicar"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
