import { ProdutoForm } from "@/components/forms/ProdutoForm/ProdutoForm";
import { CategoriaService } from "@/modules/categoria/categoria.service";
import { ProdutoService } from "@/modules/produto/produto.service";
import { ProdutoTable } from "@/components/admin/ProdutoTable/ProdutoTable";
import styles from "./produtos.module.css";


export default async function ProdutosPage() {
  const categoriaService =
    new CategoriaService();

  const produtoService =
    new ProdutoService();

  const categorias =
    await categoriaService.listarCategorias();

  const produtos =
        await produtoService.listarProdutos();

  return (
    <main>

      <h1>Produtos</h1>

      <div className={styles.container}>
      <pre>
        <ProdutoTable produtos={produtos} />
      </pre>
      <ProdutoForm categorias={categorias} />
      </div>
    </main>
  );
}