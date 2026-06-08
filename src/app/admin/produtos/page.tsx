import { ProdutoForm } from "@/components/forms/ProdutoForm/ProdutoForm";
import { CategoriaService } from "@/modules/categoria/categoria.service";

export default async function ProdutosPage() {
  const categoriaService =
    new CategoriaService();

  const categorias =
    await categoriaService.listarCategorias();

  return (
    <main>

      <h1>Produtos</h1>

      <ProdutoForm
        categorias={categorias}
      />

    </main>
  );
}