import { VitrineAbaService } from "@/modules/vitrineAba/vitrineAba.service";
import { VitrineTabs } from "@/components/store/VitrineTabs/VitrineTabs";

export default async function PecasPage() {
  const vitrineAbaService =
    new VitrineAbaService();

  const abas =
    await vitrineAbaService.listarAbasPublicas();

  return (
    <main>
      <VitrineTabs abas={abas} />
    </main>
  );
}
