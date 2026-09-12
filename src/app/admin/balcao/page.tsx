import Link from "next/link";

import { requireAdmin } from "@/lib/auth/requireAdmin";
import { BalcaoView } from "@/components/admin/BalcaoView/BalcaoView";

import styles from "./page.module.css";

export default async function BalcaoPage() {
  await requireAdmin();

  return (
    <main>
      <header className={styles.header}>
        <h1>Balcão — Venda presencial</h1>

        <Link
          href="/admin/balcao/historico"
          className={styles.historicoLink}
        >
          Ver histórico de vendas
        </Link>
      </header>

      <BalcaoView />
    </main>
  );
}
