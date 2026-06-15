"use client";

import {
    useActionState,
    useEffect,
    useState,
} from "react";

import { Modal } from "@/components/ui/Modal/Modal";
import { Button } from "@/components/ui/Button/Button";

import {
    criarCategoria,
    type CategoriaActionState,
} from "@/modules/categoria/actions";

import styles from "./CategoriaModal.module.css";

const initialState: CategoriaActionState = {
    ok: false,
    message: "",
};

export function CategoriaModal() {
    const [aberto, setAberto] =
        useState(false);

    const [formKey, setFormKey] =
        useState(0);

    const fecharModal = () => {
        setErrorMessage("");

        setAberto(false);

        setFormKey((prev) => prev + 1);
    };

    const [state, formAction, pending] =
        useActionState(
            criarCategoria,
            initialState
        );
    const [errorMessage, setErrorMessage] =
        useState("");

    useEffect(() => {
        if (state.ok) {
            fecharModal();
            return;
        }

        if (state.message) {
            setErrorMessage(state.message);
        }
    }, [state]);

    return (
        <>
            <Button
                variant="primary"
                onClick={() =>
                    setAberto(true)
                }
            >
                Nova Categoria
            </Button>

            {aberto && (
                <Modal
                    aberto={aberto}
                    onClose={fecharModal}
                >
                    <div className={styles.content}>
                        <h2 className={styles.title}>
                            Nova Categoria
                        </h2>

                        <form
                            key={formKey}
                            action={formAction}
                            className={styles.form}
                        >
                            <input
                                type="text"
                                name="nome"
                                placeholder="Nome da categoria"
                                className={styles.field}
                            />

                            {errorMessage && (
                                <p className={styles.error}>
                                    {errorMessage}
                                </p>
                            )}

                            <div
                                className={styles.actions}
                            >
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={fecharModal}
                                >
                                    Cancelar
                                </Button>

                                <Button
                                    type="submit"
                                    disabled={pending}
                                >
                                    {pending
                                        ? "Salvando..."
                                        : "Confirmar"}
                                </Button>
                            </div>
                        </form>
                    </div>
                </Modal>
            )}
        </>
    );
}