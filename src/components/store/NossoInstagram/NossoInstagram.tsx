import { Camera } from "lucide-react";

import { Ornamento } from "@/components/store/Ornamento/Ornamento";

import styles from "./NossoInstagram.module.css";

const INSTAGRAM_URL = "https://www.instagram.com/sfruttare/";

const placeholders = [1, 2, 3, 4, 5];

export function NossoInstagram() {
  return (
    <section className={styles.instagram}>
      <div className={styles.header}>
        <h2 className={styles.title}>
          No nosso Instagram
        </h2>

        <Ornamento
          className={styles.divider}
          width={70}
          height={18}
        />

        <a
          href={INSTAGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.handle}
        >
          <Camera size={16} strokeWidth={1.6} />
          @sfruttare
        </a>
      </div>

      <div className={styles.grid}>
        {placeholders.map((item) => (
          <a
            key={item}
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.tile}
            aria-label="Ver no Instagram"
          />
        ))}
      </div>
    </section>
  );
}
