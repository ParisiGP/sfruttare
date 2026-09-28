"use client";

import { useState } from "react";

import { cancelarReserva } from "@/modules/reserva/actions";
import type { ReservaResumo } from "@/modules/reserva/reserva.types";

import styles from "./ReservasLista.module.css";

type Props = {
  reservas: ReservaResumo[];
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

export function ReservasLista({
  reservas,
}: Props) {
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

  if (reservas.length === 0) {
    return (
      <p className={styles.vazio}>
        Nenhuma reserva encontrada.
      </p>
    );
  }

  return (
    <div className={styles.lista}>
      {erro && (
        <p className={styles.erro}>{erro}</p>
      )}

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Peça</th>
              <th>Cliente</th>
              <th>Celular</th>
              <th>Canal</th>
              <th>Data</th>
              <th>Status</th>
              <th>Ação</th>
            </tr>
          </thead>

          <tbody>
            {reservas.map((reserva) => (
              <tr key={reserva.id}>
                <td>
                  {reserva.nomeProduto}
                  {reserva.referenciaProduto && (
                    <>
                      {" · "}
                      {reserva.referenciaProduto}
                    </>
                  )}
                </td>

                <td>{reserva.nomeCliente}</td>

                <td>
                  {reserva.telefoneCliente ||
                    "—"}
                </td>

                <td>
                  {canalLabel[reserva.canal]}
                </td>

                <td>
                  {formatadorDataHora.format(
                    reserva.createdAt
                  )}
                </td>

                <td>
                  <span
                    className={`${
                      styles.badge
                    } ${
                      styles[
                        reserva.status.toLowerCase()
                      ]
                    }`}
                  >
                    {
                      statusLabel[
                        reserva.status
                      ]
                    }
                  </span>
                </td>

                <td>
                  {reserva.status ===
                    "ATIVA" &&
                    (confirmandoId ===
                    reserva.id ? (
                      <div
                        className={
                          styles.confirmacao
                        }
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setConfirmandoId(
                              null
                            )
                          }
                          disabled={
                            cancelandoId ===
                            reserva.id
                          }
                        >
                          Voltar
                        </button>

                        <button
                          type="button"
                          className={
                            styles.confirmarCancelamento
                          }
                          onClick={() =>
                            handleCancelar(
                              reserva.id
                            )
                          }
                          disabled={
                            cancelandoId ===
                            reserva.id
                          }
                        >
                          {cancelandoId ===
                          reserva.id
                            ? "Cancelando..."
                            : "Confirmar"}
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className={
                          styles.cancelarButton
                        }
                        onClick={() =>
                          setConfirmandoId(
                            reserva.id
                          )
                        }
                      >
                        Cancelar reserva
                      </button>
                    ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
