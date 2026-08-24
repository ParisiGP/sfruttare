import { ProdutoService } from "@/modules/produto/produto.service";
import { ProdutoVitrineCard } from "@/components/store/ProdutoVitrineCard/ProdutoVitrineCard";
import { Ornamento } from "@/components/store/Ornamento/Ornamento";

import styles from "./page.module.css";

type BuscaPageProps = {
  searchParams?: Promise<
    Record<string, string | string[] | undefined>
  >;
};

export default async function BuscaPage({
  searchParams,
}: BuscaPageProps) {
  const params = (await searchParams) ?? {};

  const qParam = params.q;

  const query = Array.isArray(qParam)
    ? qParam[0]
    : qParam;

  const busca = (query ?? "").trim();

  const produtoService = new ProdutoService();

  const produtos = busca
    ? await produtoService.buscarPublico(busca)
    : [];

  return (
    <main>
      <div className={styles.wrapper}>
        <header className={styles.header}>
          <p className={styles.eyebrow}>Sfruttare</p>
          <h1>Busca</h1>

          <Ornamento className={styles.divider} />

          {busca && (
            <p className={styles.description}>
              {produtos.length > 0
                ? `Resultados para "${busca}"`
                : `Nenhum produto encontrado para "${busca}"`}
            </p>
          )}
        </header>

        {!busca ? (
          <div className={styles.empty}>
            <p className={styles.emptyMessage}>
              Digite algo no campo de busca para
              encontrar peças no nosso catálogo.
            </p>
          </div>
        ) : produtos.length === 0 ? (
          <div className={styles.empty}>
            <p className={styles.emptyMessage}>
              Tente buscar por outro nome, marca
              ou categoria.
            </p>
          </div>
        ) : (
          <div className={styles.grid}>
            {produtos.map((produto) => (
              <ProdutoVitrineCard
                key={produto.id}
                produto={produto}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
