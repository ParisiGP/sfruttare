import { requireAdmin } from "@/lib/auth/requireAdmin";
import { VitrineAbaService } from "@/modules/vitrineAba/vitrineAba.service";
import { VitrineAbaAdmin } from "@/components/admin/VitrineAbaAdmin/VitrineAbaAdmin";

export default async function VitrinePage() {
  await requireAdmin();

  const vitrineAbaService =
    new VitrineAbaService();

  const abas =
    await vitrineAbaService.listarAbasAdmin();

  return (
    <main>
      <VitrineAbaAdmin abas={abas} />
    </main>
  );
}
