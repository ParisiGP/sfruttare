import { chaveDoCliente } from "@/modules/vendaBalcao/clientes";

import type {
  GrupoReservasCliente,
  ReservaResumo,
  TotaisReservas,
} from "./reserva.types";

function emCentavos(valor: number) {
  return Math.round(valor * 100);
}

/**
 * Totais do topo da tela de Reservas. Recebe a lista **antes** do
 * filtro de status: os cards não mudam quando se filtra por
 * "Canceladas".
 */
export function calcularTotaisReservas(
  reservas: ReservaResumo[]
): TotaisReservas {
  const ativas = reservas.filter(
    (reserva) => reserva.status === "ATIVA"
  );

  return {
    ativas: ativas.length,
    valorReservado:
      ativas.reduce(
        (soma, reserva) =>
          soma + emCentavos(reserva.valorProduto),
        0
      ) / 100,
    convertidas: reservas.filter(
      (reserva) => reserva.status === "CONVERTIDA"
    ).length,
    canceladas: reservas.filter(
      (reserva) => reserva.status === "CANCELADA"
    ).length,
  };
}

/**
 * Reservas do mesmo cliente (nome normalizado) juntas. Grupos pela
 * reserva mais recente de cada um, e dentro do grupo a mais nova
 * primeiro.
 */
export function agruparReservasPorCliente(
  reservas: ReservaResumo[]
): GrupoReservasCliente[] {
  const maisRecentesPrimeiro = [...reservas].sort(
    (a, b) =>
      b.createdAt.getTime() - a.createdAt.getTime()
  );

  const grupos = new Map<string, GrupoReservasCliente>();

  for (const reserva of maisRecentesPrimeiro) {
    const chave = chaveDoCliente(reserva.nomeCliente);

    const grupo = grupos.get(chave) ?? {
      chave,
      nomeCliente: reserva.nomeCliente,
      telefoneCliente: "",
      reservas: [],
      ativas: 0,
      subtotalAtivas: 0,
      idsAtivas: [],
    };

    grupo.reservas.push(reserva);

    // Celular: o mais recente que não seja vazio.
    if (!grupo.telefoneCliente) {
      grupo.telefoneCliente = reserva.telefoneCliente;
    }

    if (reserva.status === "ATIVA") {
      grupo.ativas += 1;
      grupo.idsAtivas.push(reserva.id);
      grupo.subtotalAtivas =
        (emCentavos(grupo.subtotalAtivas) +
          emCentavos(reserva.valorProduto)) /
        100;
    }

    grupos.set(chave, grupo);
  }

  return [...grupos.values()];
}
