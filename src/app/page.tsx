import Image from "next/image";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1>
          Bem-vindo ao Sfruttare!
        </h1>
        link para pagina de Admin        <a href="/admin/categorias">
          Ir para Admin
        </a>
      </main>
    </div>
  );
}
