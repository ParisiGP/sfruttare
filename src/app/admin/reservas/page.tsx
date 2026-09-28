import Link from "next/link";

import { requireAdmin } from "@/lib/auth/requireAdmin";
import { ReservaService } from "@/modules/reserva/reserva.service";
import type { FiltroReservas } from "@/modules/reserva/reserva.types";
import { ReservasLista } from "@/components/admin/ReservasLista/ReservasLista";

import styles from "./page.module.css";

type PageProps = {
  searchParams?: Promise<
    Record<string, string | string[] | undefined>
  >;
};

function getParam(
  value: string | string[] | undefined
) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ReservasPage({
  searchParams,
}: PageProps) {
  await requireAdmin();

  const params = (await searchParams) ?? {};

  const filtros: FiltroReservas = {
    status: getParam(params.status) as
      | FiltroReservas["status"]
      | undefined,
    canal: getParam(params.canal) as
      | FiltroReservas["canal"]
      | undefined,
    dataInicial:
      getParam(params.dataInicial) || undefined,
    dataFinal:
      getParam(params.dataFinal) || undefined,
  };

  const filtroAtivo =
    !!filtros.status ||
    !!filtros.canal ||
    !!filtros.dataInicial ||
    !!filtros.dataFinal;

  const reservaService = new ReservaService();
  const reservas =
    await reservaService.listarReservas(
      filtros
    );

  return (
    <main>
      <div className={styles.wrapper}>
        <header className={styles.header}>
          <h1>Reservas</h1>
        </header>

        <form
          method="GET"
          className={styles.filtros}
        >
          <label className={styles.filtroCampo}>
            <span>Status</span>
            <select
              name="status"
              defaultValue={
                filtros.status ?? ""
              }
            >
              <option value="">Todos</option>
              <option value="ATIVA">
                Ativa
              </option>
              <option value="CONVERTIDA">
                Convertida
              </option>
              <option value="CANCELADA">
                Cancelada
              </option>
            </select>
          </label>

          <label className={styles.filtroCampo}>
            <span>Canal</span>
            <select
              name="canal"
              defaultValue={
                filtros.canal ?? ""
              }
            >
              <option value="">Todos</option>
              <option value="BALCAO">
                Balcão
              </option>
              <option value="SITE">Site</option>
            </select>
          </label>

          <label className={styles.filtroCampo}>
            <span>De</span>
            <input
              type="date"
              name="dataInicial"
              defaultValue={
                filtros.dataInicial ?? ""
              }
            />
          </label>

          <label className={styles.filtroCampo}>
            <span>Até</span>
            <input
              type="date"
              name="dataFinal"
              defaultValue={
                filtros.dataFinal ?? ""
              }
            />
          </label>

          <button
            type="submit"
            className={styles.filtrarButton}
          >
            Filtrar
          </button>

          {filtroAtivo && (
            <Link
              href="/admin/reservas"
              className={styles.limparLink}
            >
              Limpar filtros
            </Link>
          )}
        </form>

        <ReservasLista reservas={reservas} />
      </div>
    </main>
  );
}
