import { requireAdmin } from "@/lib/auth/requireAdmin";
import { CategoriaService } from "@/modules/categoria/categoria.service";
import { ReservaService } from "@/modules/reserva/reserva.service";
import { BalcaoView } from "@/components/admin/BalcaoView/BalcaoView";

import styles from "./page.module.css";

type BalcaoPageProps = {
  searchParams?: Promise<
    Record<string, string | string[] | undefined>
  >;
};

/** `?reservas=a,b` (ou repetido) → lista de ids. */
function lerIdsDeReservas(
  valor: string | string[] | undefined
) {
  const partes = Array.isArray(valor) ? valor : [valor];

  return partes
    .flatMap((parte) => (parte ?? "").split(","))
    .map((id) => id.trim())
    .filter(Boolean);
}

export default async function BalcaoPage({
  searchParams,
}: BalcaoPageProps) {
  await requireAdmin();

  const params = (await searchParams) ?? {};
  const idsReservas = lerIdsDeReservas(
    params.reservas
  );

  const [categorias, conversao] = await Promise.all([
    new CategoriaService().listarCategorias(),
    idsReservas.length > 0
      ? new ReservaService().obterAtivasParaConversao(
          idsReservas
        )
      : null,
  ]);

  return (
    <div>
      <header className={styles.header}>
        <h1>Balcão — Venda presencial</h1>
      </header>

      <BalcaoView
        categorias={categorias.map((categoria) => ({
          id: categoria.id,
          nome: categoria.nome,
        }))}
        conversaoInicial={conversao}
      />
    </div>
  );
}
