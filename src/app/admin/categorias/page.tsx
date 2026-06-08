import { CategoriaService } from "@/modules/categoria/categoria.service";
import { criarCategoria, excluirCategoria, editarCategoria } from "@/modules/categoria/actions";

export default async function CategoriasPage() {
  const categoriaService =
    new CategoriaService();

  const categorias =
    await categoriaService.listarCategorias();

  return (
    <main>
      <h1>Categorias</h1>

      <form action={criarCategoria}>
        <input
          type="text"
          name="nome"
          placeholder="Nome da categoria"
        />

        <button type="submit">
          Salvar
        </button>
      </form>

      <hr />

      <ul>
  {categorias.map((categoria) => (
    <li key={categoria.id}>
      {categoria.nome}

      <form action={excluirCategoria}>
        <input
          type="hidden"
          name="id"
          value={categoria.id}
        />

        <button type="submit">
          Excluir
        </button>
      </form>

    <form action={editarCategoria}>
        <input
          type="hidden"
          name="id"
          value={categoria.id}
        />
        <input
          type="text"
          name="nome"
          defaultValue={categoria.nome}
        />

        <button type="submit">
          Editar
        </button>
      </form>

    </li>
  ))}
</ul>
    </main>
  );
}