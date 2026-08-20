import type { VitrineAbaPublica } from "@/modules/vitrineAba/vitrineAba.types";
import { ProdutoVitrineCard } from "@/components/store/ProdutoVitrineCard/ProdutoVitrineCard";
import { Ornamento } from "@/components/store/Ornamento/Ornamento";
import { LinkButton } from "@/components/ui/LinkButton/LinkButton";

import styles from "./Destaques.module.css";

type DestaquesProps = {
  produtos: VitrineAbaPublica["produtos"];
};

export function Destaques({
  produtos,
}: DestaquesProps) {
  if (produtos.length === 0) {
    return null;
  }

  return (
    <section className={styles.destaques}>
      <div className={styles.header}>
        <Ornamento
          className={styles.ornamentoLado}
          width={56}
          height={16}
        />

        <h2 className={styles.title}>
          Destaques
        </h2>

        <Ornamento
          className={styles.ornamentoLado}
          width={56}
          height={16}
        />
      </div>

      <div className={styles.grid}>
        {produtos.map((produto) => (
          <ProdutoVitrineCard
            key={produto.id}
            produto={produto}
          />
        ))}
      </div>

      <div className={styles.footer}>
        <LinkButton href="/pecas">
          Ver todas as peças
        </LinkButton>
      </div>
    </section>
  );
}
