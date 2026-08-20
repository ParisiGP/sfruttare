import Image from "next/image";

import { Ornamento } from "@/components/store/Ornamento/Ornamento";
import { LinkButton } from "@/components/ui/LinkButton/LinkButton";

import styles from "./Hero.module.css";

export function Hero() {
  return (
    <section className={styles.hero}>
      <div className={styles.content}>
        <h1 className={styles.title}>
          Peças únicas,
          <br />
          histórias reais.
        </h1>

        <Ornamento className={styles.divider} />

        <p className={styles.description}>
          Um brechó feito para quem valoriza
          estilo, autenticidade e boas escolhas.
        </p>

        <LinkButton href="/pecas">
          Ver peças
        </LinkButton>
      </div>

      <div className={styles.illustrationWrapper}>
        <Image
          src="/logo-sfruttare-medalhao.png"
          alt="Medalhão Sfruttare"
          width={1536}
          height={1024}
          priority
          className={styles.illustration}
        />
      </div>
    </section>
  );
}
