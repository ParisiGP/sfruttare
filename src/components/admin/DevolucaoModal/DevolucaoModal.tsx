"use client";

import { useEffect, useState } from "react";

import {
  buscarVendasParaTroca,
  registrarDevolucaoBalcao,
} from "@/modules/vendaBalcao/actions";
import type { VendaBalcaoCandidataResumo } from "@/modules/vendaBalcao/vendaBalcao.types";
import { formatarPreco } from "@/lib/formatarPreco";
import { Modal } from "@/components/ui/Modal/Modal";

import styles from "./DevolucaoModal.module.css";

type Props = {
  vendaBalcaoItemId: string;
  vendaBalcaoId: string;
  tipo: "DEVOLUCAO" | "TROCA";
  nomeProduto: string;
  precoOriginal: number;
  nomeCliente: string;
  onClose: () => void;
  onSucesso: () => void;
};

const DEBOUNCE_MS = 300;

export function DevolucaoModal({
  vendaBalcaoItemId,
  vendaBalcaoId,
  tipo,
  nomeProduto,
  precoOriginal,
  nomeCliente,
  onClose,
  onSucesso,
}: Props) {
  const [motivo, setMotivo] = useState("");
  const [busca, setBusca] = useState(nomeCliente);
  const [resultados, setResultados] = useState<
    VendaBalcaoCandidataResumo[]
  >([]);
  const [buscando, setBuscando] = useState(false);
  const [vendaTroca, setVendaTroca] =
    useState<VendaBalcaoCandidataResumo | null>(
      null
    );
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    const termo = busca.trim();

    if (!termo || tipo !== "TROCA") {
      setResultados([]);
      setBuscando(false);
      return;
    }

    let cancelado = false;

    setBuscando(true);

    const timer = setTimeout(async () => {
      const resultado = await buscarVendasParaTroca(
        termo,
        vendaBalcaoId
      );

      if (cancelado) {
        return;
      }

      setBuscando(false);
      setResultados(
        resultado.ok ? resultado.vendas : []
      );
    }, DEBOUNCE_MS);

    return () => {
      cancelado = true;
      clearTimeout(timer);
    };
  }, [busca, tipo, vendaBalcaoId]);

  const podeConfirmar =
    (tipo === "DEVOLUCAO" || !!vendaTroca) &&
    !enviando;

  async function handleConfirmar() {
    if (!podeConfirmar) {
      return;
    }

    setEnviando(true);
    setErro("");

    const resultado = await registrarDevolucaoBalcao({
      vendaBalcaoItemId,
      tipo,
      motivo: motivo.trim() || undefined,
      vendaTrocaId: vendaTroca?.id,
    });

    setEnviando(false);

    if (!resultado.ok) {
      setErro(resultado.message);
      return;
    }

    onSucesso();
  }

  return (
    <Modal aberto onClose={onClose}>
      <div className={styles.conteudo}>
        <h2>
          {tipo === "TROCA"
            ? "Trocar peça"
            : "Registrar devolução"}
        </h2>

        <p className={styles.peca}>
          {nomeProduto}
        </p>

        {tipo === "TROCA" && (
          <div className={styles.buscaTroca}>
            <label className={styles.campo}>
              <span>
                Venda que substitui essa peça
              </span>
              <input
                type="search"
                value={busca}
                onChange={(event) =>
                  setBusca(event.target.value)
                }
                placeholder="Nome do cliente"
                disabled={!!vendaTroca}
              />
            </label>

            {buscando && (
              <p
                className={
                  styles.mensagemNeutra
                }
              >
                Buscando...
              </p>
            )}

            {!buscando &&
              busca.trim() &&
              !vendaTroca &&
              resultados.length === 0 && (
                <p
                  className={
                    styles.mensagemNeutra
                  }
                >
                  Nenhuma venda encontrada para
                  &ldquo;{busca.trim()}&rdquo;.
                </p>
              )}

            {vendaTroca ? (
              <div
                className={
                  styles.produtoSelecionado
                }
              >
                <span>
                  {vendaTroca.nomeCliente} —{" "}
                  {vendaTroca.itens.join(", ")}{" "}
                  —{" "}
                  {formatarPreco(
                    vendaTroca.total
                  )}
                </span>

                <button
                  type="button"
                  onClick={() => {
                    setVendaTroca(null);
                  }}
                >
                  Trocar venda escolhida
                </button>
              </div>
            ) : (
              resultados.length > 0 && (
                <ul
                  className={
                    styles.resultadosLista
                  }
                >
                  {resultados.map((venda) => (
                    <li key={venda.id}>
                      <span>
                        {venda.nomeCliente} —{" "}
                        {venda.itens.join(", ")}{" "}
                        —{" "}
                        {formatarPreco(
                          venda.total
                        )}
                      </span>

                      <button
                        type="button"
                        onClick={() => {
                          setVendaTroca(venda);
                          setResultados([]);
                        }}
                      >
                        Escolher
                      </button>
                    </li>
                  ))}
                </ul>
              )
            )}

            {vendaTroca && (
              <p
                className={
                  styles.mensagemNeutra
                }
              >
                Diferença:{" "}
                {formatarPreco(
                  vendaTroca.total
                )}{" "}
                (venda nova) −{" "}
                {formatarPreco(precoOriginal)}{" "}
                (peça devolvida) ={" "}
                <strong>
                  {formatarPreco(
                    vendaTroca.total -
                      precoOriginal
                  )}
                </strong>
              </p>
            )}
          </div>
        )}

        <label className={styles.campo}>
          <span>Motivo (opcional)</span>
          <textarea
            value={motivo}
            onChange={(event) =>
              setMotivo(event.target.value)
            }
            rows={3}
          />
        </label>

        {erro && (
          <p className={styles.erro}>{erro}</p>
        )}

        <div className={styles.acoes}>
          <button
            type="button"
            className={styles.cancelarButton}
            onClick={onClose}
            disabled={enviando}
          >
            Cancelar
          </button>

          <button
            type="button"
            className={styles.confirmarButton}
            onClick={handleConfirmar}
            disabled={!podeConfirmar}
          >
            {enviando
              ? "Salvando..."
              : tipo === "TROCA"
              ? "Confirmar troca"
              : "Confirmar devolução"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
