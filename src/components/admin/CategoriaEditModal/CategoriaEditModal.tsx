"use client";

import {
  useActionState,
  useEffect,
  useState,
} from "react";

import { Modal } from "@/components/ui/Modal/Modal";
import { Button } from "@/components/ui/Button/Button";

import {
  editarCategoria,
  type CategoriaActionState,
} from "@/modules/categoria/actions";

import styles from "./CategoriaEditModal.module.css";

type CategoriaEditModalProps = {
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

export function CategoriaEditModal({
  categoria,
  aberto,
  onClose,
}: CategoriaEditModalProps) {
  const [errorMessage, setErrorMessage] =
    useState("");

  const [state, formAction, pending] =
    useActionState(
      editarCategoria,
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
          Editar categoria
        </h2>

        <form
          action={formAction}
          className={styles.form}
        >
          <input
            type="hidden"
            name="id"
            value={categoria.id}
          />

          <input
            type="text"
            name="nome"
            defaultValue={categoria.nome}
            className={styles.field}
          />

          {errorMessage && (
            <p className={styles.error}>
              {errorMessage}
            </p>
          )}

          <div className={styles.actions}>
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
                : "Salvar alterações"}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}