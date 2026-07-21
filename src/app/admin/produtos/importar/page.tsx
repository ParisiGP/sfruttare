import { ProdutoImportacao } from "@/components/admin/ProdutoImportacao/ProdutoImportacao";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { CategoriaService } from "@/modules/categoria/categoria.service";

export default async function ImportarProdutosPage() {
  await requireAdmin();

  const categoriaService =
    new CategoriaService();

  const categorias =
    await categoriaService.listarCategorias();

  return (
    <main>
      <ProdutoImportacao
        categorias={categorias.map((categoria) => ({
          id: categoria.id,
          nome: categoria.nome,
        }))}
      />
    </main>
  );
}
