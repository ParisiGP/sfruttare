import Link from "next/link";

import { requireAdmin } from "@/lib/auth/requireAdmin";
import { formatarPreco } from "@/lib/formatarPreco";
import { ConsignacaoService } from "@/modules/consignacao/consignacao.service";
import type {
  FiltroConsignados,
  FiltroStatusConsignados,
} from "@/modules/consignacao/consignacao.types";
import { ConsignadosLista } from "@/components/admin/ConsignadosLista/ConsignadosLista";

import styles from "./page.module.css";

type PageProps = {
  searchParams?: Promise<
    Record<string, string | string[] | undefined>
  >;
};

const STATUS_VALIDOS: FiltroStatusConsignados[] = [
  "A_REPASSAR",
  "REPASSADO",
  "EM_ESTOQUE",
  "SEM_PERCENTUAL",
  "TODOS",
];

function getParam(
  value: string | string[] | undefined
) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ConsignadosPage({
  searchParams,
}: PageProps) {
  await requireAdmin();

  const params = (await searchParams) ?? {};

  const statusParam = getParam(params.status);

  const filtros: FiltroConsignados = {
    consignante: getParam(params.consignante) || undefined,
    status: STATUS_VALIDOS.includes(
      statusParam as FiltroStatusConsignados
    )
      ? (statusParam as FiltroStatusConsignados)
      : "A_REPASSAR",
  };

  const { totais, grupos, consignantes } =
    await new ConsignacaoService().obterPainel(filtros);

  const hrefSemPercentual = (() => {
    const query = new URLSearchParams({
      status: "SEM_PERCENTUAL",
    });

    if (filtros.consignante) {
      query.set("consignante", filtros.consignante);
    }

    return `/admin/consignados?${query.toString()}`;
  })();

  const filtroPadrao =
    !filtros.consignante && filtros.status === "A_REPASSAR";

  return (
    <div>
      <div className={styles.wrapper}>
        <header className={styles.header}>
          <h1>Consignados</h1>
        </header>

        {/* Os totais respeitam o consignante, mas não o filtro de status. */}
        <section className={styles.totais}>
          <article className={styles.totalCard}>
            <strong>
              {formatarPreco(totais.aRepassarValor)}
            </strong>
            <span>A repassar</span>
            <small>{totais.aRepassarQtd} peça(s)</small>
          </article>

          <article className={styles.totalCard}>
            <strong>
              {formatarPreco(totais.repassadoValor)}
            </strong>
            <span>Já repassado</span>
            <small>{totais.repassadoQtd} peça(s)</small>
          </article>

          <Link
            href={hrefSemPercentual}
            className={`${styles.totalCard} ${styles.totalCardLink}`}
          >
            <strong>{totais.semPercentualQtd}</strong>
            <span>Sem % informado</span>
            <small>ver peças</small>
          </Link>
        </section>

        <form method="GET" className={styles.filtros}>
          <label className={styles.filtroCampo}>
            <span>Consignante</span>
            <select
              name="consignante"
              defaultValue={filtros.consignante ?? ""}
            >
              <option value="">Todos</option>
              {consignantes.map((consignante) => (
                <option
                  key={consignante.nome}
                  value={consignante.nome}
                >
                  {consignante.nome}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.filtroCampo}>
            <span>Status</span>
            <select
              name="status"
              defaultValue={filtros.status}
            >
              <option value="A_REPASSAR">A repassar</option>
              <option value="REPASSADO">Repassado</option>
              <option value="EM_ESTOQUE">Em estoque</option>
              <option value="SEM_PERCENTUAL">Sem %</option>
              <option value="TODOS">Todos</option>
            </select>
          </label>

          <button
            type="submit"
            className={styles.filtrarButton}
          >
            Filtrar
          </button>

          {!filtroPadrao && (
            <Link
              href="/admin/consignados"
              className={styles.limparLink}
            >
              Limpar filtros
            </Link>
          )}
        </form>

        <ConsignadosLista
          grupos={grupos}
          consignantes={consignantes}
          statusFiltro={filtros.status ?? "A_REPASSAR"}
        />
      </div>
    </div>
  );
}
