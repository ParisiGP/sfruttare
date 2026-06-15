import styles from "./CategoriaCard.module.css";
import { Button } from "../../ui/Button/Button";

type CategoriaCardProps = {
    categoria: {
        id: string;
        nome: string;
    };
};

export function CategoriaCard({
    categoria,
}: CategoriaCardProps) {
    return (
        <article className={styles.card}>
            <h3 className={styles.title}>
                {categoria.nome}
            </h3>

            <div className={styles.actions}>
                <Button variant="primary">
                    Editar
                </Button>

                <Button variant="danger">
                    Excluir
                </Button>
            </div>
        </article>
    );
}