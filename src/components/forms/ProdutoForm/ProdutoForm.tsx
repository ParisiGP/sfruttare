import styles from "./ProdutoForm.module.css";
import { criarProduto } from "@/modules/produto/actions";

type Categoria = {
    id: string;
    nome: string;
};

type ProdutoFormProps = {
    categorias: Categoria[];
};

export function ProdutoForm({ categorias }: ProdutoFormProps) {
    return (
        <form className={styles.form} action={criarProduto}>
            <div className={styles.field}>
                <label htmlFor="nome">
                    Nome *
                </label>

                <input
                    id="nome"
                    name="nome"
                    type="text"
                    required
                />
            </div>

            <div className={styles.field}>
                <label htmlFor="descricao">
                    Descrição
                </label>

                <textarea
                    id="descricao"
                    name="descricao"
                />
            </div>

            <div className={styles.field}>
                <label htmlFor="marca">
                    Marca
                </label>

                <input
                    id="marca"
                    name="marca"
                    type="text"
                />
            </div>

            <div className={styles.field}>
                <label htmlFor="tamanho">
                    Tamanho
                </label>

                <input
                    id="tamanho"
                    name="tamanho"
                    type="text"
                />
            </div>

            <div className={styles.field}>
                <label htmlFor="preco">
                    Preço*
                </label>

                <input
                    id="preco"
                    name="preco"
                    type="number"
                    step="0.01"
                    required
                />
            </div>

            <div className={styles.field}>
                <label htmlFor="estoque">
                    Estoque*
                </label>

                <input
                    id="estoque"
                    name="estoque"
                    type="number"
                    min="0"
                    required
                />
            </div>

            <div className={styles.field}>
                <label htmlFor="categoria">
                    Categoria*
                </label>

                <select
                    id="categoria"
                    name="categoriaId"
                    required
                >
                    {categorias.map(
                        (categoria) => (
                            <option
                                key={categoria.id}
                                value={categoria.id}
                            >
                                {categoria.nome}
                            </option>
                        )
                    )}
                </select>
            </div>

            <div className={styles.field}>
                <label>
                    Tipo*
                </label>

                <select name="tipo" required>
                    <option value="BRECHO">
                        Brechó
                    </option>

                    <option value="NA_ETIQUETA">
                        Na Etiqueta
                    </option>
                </select>
            </div>

            <button
                type="submit"
                className={styles.submitButton}
            >
                Salvar Produto
            </button>
        </form>
    );
}