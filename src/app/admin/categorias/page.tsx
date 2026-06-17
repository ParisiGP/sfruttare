import { CategoriaService } from "@/modules/categoria/categoria.service";
import { criarCategoria, excluirCategoria, editarCategoria } from "@/modules/categoria/actions";
import { CategoriaGrid } from "@/components/admin/CategoriaGrid/CategoriaGrid";
import { CategoriaModal } from "@/components/admin/categoriaModal/CategoriaModal";
import styles from "./categorias.module.css";
import {
  revalidatePath,
} from "next/cache";

export default async function CategoriasPage() {
  const categoriaService =
    new CategoriaService();

  const categorias =
    await categoriaService.listarCategorias();

  return (
    <main>
      <div className={styles.wrapper}>
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>
              Catálogo
            </p>

            <h1>
              Categorias
            </h1>

            <p className={styles.description}>
              Gerencie as categorias utilizadas
              no catálogo da Sfruttare.
            </p>
          </div>
          <CategoriaModal />
        </header>




        <CategoriaGrid
          categorias={categorias}
        />
      </div>
    </main>
  );

  revalidatePath(
    "/admin/categorias"
  );
}