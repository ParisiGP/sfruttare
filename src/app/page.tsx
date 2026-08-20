import { VitrineAbaService } from "@/modules/vitrineAba/vitrineAba.service";
import { Hero } from "@/components/store/Hero/Hero";
import { Destaques } from "@/components/store/Destaques/Destaques";
import { Beneficios } from "@/components/store/Beneficios/Beneficios";
import { NossoInstagram } from "@/components/store/NossoInstagram/NossoInstagram";
import { Newsletter } from "@/components/store/Newsletter/Newsletter";

export default async function Home() {
  const vitrineAbaService =
    new VitrineAbaService();

  const abas =
    await vitrineAbaService.listarAbasPublicas();

  const produtosDestaque =
    abas[0]?.produtos.slice(0, 6) ?? [];

  return (
    <main>
      <Hero />
      <Destaques produtos={produtosDestaque} />
      <Beneficios />
      <NossoInstagram />
      <Newsletter />
    </main>
  );
}
