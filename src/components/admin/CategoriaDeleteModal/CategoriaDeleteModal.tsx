"use client";

import {
    useActionState,
    useEffect,
    useState,
} from "react";

import { Modal } from "@/components/ui/Modal/Modal";
import { Button } from "@/components/ui/Button/Button";

import {
    excluirCategoria,
    type CategoriaActionState,
} from "@/modules/categoria/actions";

import styles from "./CategoriaDeleteModal.module.css";

type CategoriaDeleteModalProps = {
    categoria: {
        id: string;
        nome: string;
    } | null;

    aberto: boolean;

    onClose: () => void;
};

const initialState: CategoriaActionState = {
    ok: false,
    message: "",
};

export function CategoriaDeleteModal({
    categoria,
    aberto,
    onClose,
}: CategoriaDeleteModalProps) {
    const [errorMessage, setErrorMessage] =
        useState("");

    const [state, formAction, pending] =
        useActionState(
            excluirCategoria,
            initialState
        );

    useEffect(() => {
        if (state.ok) {
            setErrorMessage("");
            onClose();
            return;
        }

        if (state.message) {
            setErrorMessage(state.message);
        }
    }, [state, onClose]);

    const fecharModal = () => {
        setErrorMessage("");
        onClose();
    };

    if (!categoria) {
        return null;
    }

    return (
        <Modal
            aberto={aberto}
            onClose={fecharModal}
        >
            <div className={styles.content}>
                <h2 className={styles.title}>
                    Excluir categoria
                </h2>

                <p className={styles.message}>
                    Tem certeza que deseja excluir esta
                    categoria?
                </p>

                <strong
                    className={styles.categoryName}
                >
                    {categoria.nome}
                </strong>

                <p className={styles.message}>
                    Tem certeza que deseja excluir esta
                    categoria?

                    Esta ação não poderá ser desfeita.
                </p>

                {errorMessage && (
                    <p className={styles.error}>
                        {errorMessage}
                    </p>
                )}

                <form
                    action={formAction}
                    className={styles.actions}
                >
                    <input
                        type="hidden"
                        name="id"
                        value={categoria.id}
                    />

                    <Button
                        type="button"
                        variant="outline"
                        onClick={fecharModal}
                    >
                        Cancelar
                    </Button>

                    <Button
                        type="submit"
                        variant="danger"
                        disabled={pending}
                    >
                        {pending
                            ? "Excluindo..."
                            : "Confirmar exclusão"}
                    </Button>
                </form>
            </div>
        </Modal>
    );
}