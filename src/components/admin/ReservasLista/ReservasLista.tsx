"use client";

import { useState } from "react";
import Link from "next/link";

import { cancelarReserva } from "@/modules/reserva/actions";
import type {
  GrupoReservasCliente,
  ReservaResumo,
} from "@/modules/reserva/reserva.types";
import { formatarPreco } from "@/lib/formatarPreco";

import styles from "./ReservasLista.module.css";

type Props = {
  grupos: GrupoReservasCliente[];
};

const canalLabel: Record<string, string> = {
  BALCAO: "Balcão",
  SITE: "Site",
};

const statusLabel: Record<string, string> = {
  ATIVA: "Ativa",
  CONVERTIDA: "Convertida",
  CANCELADA: "Cancelada",
};

const formatadorDataHora =
  new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });

/** O Balcão abre já preenchido com essas reservas (ele mesmo confere se ainda estão ativas). */
function hrefDeConversao(ids: string[]) {
  return `/admin/balcao?reservas=${ids.join(",")}`;
}

function resumoDoGrupo(grupo: GrupoReservasCliente) {
  if (grupo.ativas === 0) {
    return "Sem reservas ativas";
  }

  return `${grupo.ativas} ${
    grupo.ativas === 1
      ? "reserva ativa"
      : "reservas ativas"
  } · ${formatarPreco(grupo.subtotalAtivas)}`;
}

export function ReservasLista({ grupos }: Props) {
  const [confirmandoId, setConfirmandoId] =
    useState<string | null>(null);
  const [cancelandoId, setCancelandoId] =
    useState<string | null>(null);
  const [erro, setErro] = useState("");

  async function handleCancelar(id: string) {
    setCancelandoId(id);
    setErro("");

    const resultado = await cancelarReserva(id);

    setCancelandoId(null);

    if (!resultado.ok) {
      setErro(resultado.message);
      return;
    }

    setConfirmandoId(null);
  }

  if (grupos.length === 0) {
    return (
      <p className={styles.vazio}>
        Nenhuma reserva encontrada.
      </p>
    );
  }

  function renderAcoes(reserva: ReservaResumo) {
    if (reserva.status !== "ATIVA") {
      return null;
    }

    if (confirmandoId === reserva.id) {
      return (
        <div className={styles.confirmacao}>
          <button
            type="button"
            onClick={() => setConfirmandoId(null)}
            disabled={cancelandoId === reserva.id}
          >
            Voltar
          </button>

          <button
            type="button"
            className={styles.confirmarCancelamento}
            onClick={() => handleCancelar(reserva.id)}
            disabled={cancelandoId === reserva.id}
          >
            {cancelandoId === reserva.id
              ? "Cancelando..."
              : "Confirmar"}
          </button>
        </div>
      );
    }

    return (
      <div className={styles.acoes}>
        <Link
          href={hrefDeConversao([reserva.id])}
          className={styles.converterButton}
        >
          Converter em venda
        </Link>

        <button
          type="button"
          className={styles.cancelarButton}
          onClick={() => setConfirmandoId(reserva.id)}
        >
          Cancelar reserva
        </button>
      </div>
    );
  }

  return (
    <div className={styles.lista}>
      {erro && (
        <p className={styles.erro}>{erro}</p>
      )}

      {grupos.map((grupo) => (
        <section
          key={grupo.chave}
          className={styles.grupo}
        >
          <header className={styles.grupoCabecalho}>
            <div className={styles.grupoCliente}>
              <h2>{grupo.nomeCliente}</h2>
              <span>
                {grupo.telefoneCliente || "Sem celular"}
              </span>
            </div>

            <p className={styles.grupoResumo}>
              {resumoDoGrupo(grupo)}
            </p>

            {grupo.ativas >= 2 && (
              <Link
                href={hrefDeConversao(grupo.idsAtivas)}
                className={styles.converterButton}
              >
                Converter todas ({grupo.ativas})
              </Link>
            )}
          </header>

          <table className={styles.table}>
            <thead>
              <tr>
                <th>Peça</th>
                <th>Valor</th>
                <th>Canal</th>
                <th>Data</th>
                <th>Status</th>
                <th>Ação</th>
              </tr>
            </thead>

            <tbody>
              {grupo.reservas.map((reserva) => (
                <tr key={reserva.id}>
                  <td data-label="Peça">
                    {reserva.nomeProduto}
                    {reserva.referenciaProduto && (
                      <>
                        {" · "}
                        {reserva.referenciaProduto}
                      </>
                    )}
                  </td>

                  <td data-label="Valor">
                    {formatarPreco(reserva.valorProduto)}
                  </td>

                  <td data-label="Canal">
                    {canalLabel[reserva.canal]}
                  </td>

                  <td data-label="Data">
                    {formatadorDataHora.format(
                      reserva.createdAt
                    )}
                  </td>

                  <td data-label="Status">
                    <span
                      className={`${styles.badge} ${
                        styles[
                          reserva.status.toLowerCase()
                        ]
                      }`}
                    >
                      {statusLabel[reserva.status]}
                    </span>
                  </td>

                  <td data-label="Ação">
                    {renderAcoes(reserva)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}
    </div>
  );
}
