import Link from "next/link";

import { requireAdmin } from "@/lib/auth/requireAdmin";
import { VendaBalcaoService } from "@/modules/vendaBalcao/vendaBalcao.service";
import { BalcaoHistoricoLista } from "@/components/admin/BalcaoHistoricoLista/BalcaoHistoricoLista";

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

export default async function BalcaoHistoricoPage({
  searchParams,
}: PageProps) {
  await requireAdmin();

  const params = (await searchParams) ?? {};

  const filtros = {
    dataInicial:
      getParam(params.dataInicial) || undefined,
    dataFinal:
      getParam(params.dataFinal) || undefined,
    nomeCliente:
      getParam(params.nomeCliente) || undefined,
  };

  const filtroAtivo =
    !!filtros.dataInicial ||
    !!filtros.dataFinal ||
    !!filtros.nomeCliente;

  const vendaBalcaoService =
    new VendaBalcaoService();

  const { vendas, totalLiquido } =
    await vendaBalcaoService.listarVendas(
      filtros
    );

  return (
    <main>
      <div className={styles.wrapper}>
        <header className={styles.header}>
          <h1>Histórico de vendas — Balcão</h1>

          <Link
            href="/admin/balcao"
            className={styles.voltarLink}
          >
            ← Voltar pro balcão
          </Link>
        </header>

        <form
          method="GET"
          className={styles.filtros}
        >
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

          <label className={styles.filtroCampo}>
            <span>Cliente</span>
            <input
              type="text"
              name="nomeCliente"
              defaultValue={
                filtros.nomeCliente ?? ""
              }
              placeholder="Nome do cliente"
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
              href="/admin/balcao/historico"
              className={styles.limparLink}
            >
              Limpar filtros
            </Link>
          )}
        </form>

        <BalcaoHistoricoLista
          vendas={vendas}
          totalLiquido={totalLiquido}
        />
      </div>
    </main>
  );
}
