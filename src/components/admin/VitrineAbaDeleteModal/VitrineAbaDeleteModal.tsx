"use client";

import { useActionState, useEffect, useState } from "react";

import { Modal } from "@/components/ui/Modal/Modal";
import { Button } from "@/components/ui/Button/Button";

import {
  excluirAba,
  type VitrineAbaActionState,
} from "@/modules/vitrineAba/actions";
import type { VitrineAbaAdminItem } from "@/modules/vitrineAba/vitrineAba.types";

import styles from "./VitrineAbaDeleteModal.module.css";

type VitrineAbaDeleteModalProps = {
  aberto: boolean;
  aba: VitrineAbaAdminItem | null;
  onClose: () => void;
};

const initialState: VitrineAbaActionState = {
  ok: false,
  message: "",
};

export function VitrineAbaDeleteModal({
  aberto,
  aba,
  onClose,
}: VitrineAbaDeleteModalProps) {
  const [state, formAction, pending] =
    useActionState(excluirAba, initialState);

  const [errorMessage, setErrorMessage] =
    useState("");

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

  useEffect(() => {
    if (aberto) {
      setErrorMessage("");
    }
  }, [aberto]);

  if (!aba) {
    return null;
  }

  return (
    <Modal aberto={aberto} onClose={onClose}>
      <div className={styles.content}>
        <h2 className={styles.title}>Excluir aba</h2>

        <p className={styles.message}>
          Tem certeza que deseja excluir esta aba? Os
          produtos associados a ela não são excluídos,
          apenas deixam de aparecer nessa aba na loja.
        </p>

        <strong className={styles.abaName}>
          {aba.nome}
        </strong>

        {errorMessage && (
          <p className={styles.error}>{errorMessage}</p>
        )}

        <form action={formAction} className={styles.actions}>
          <input type="hidden" name="id" value={aba.id} />

          <Button
            type="button"
            variant="outline"
            onClick={onClose}
          >
            Cancelar
          </Button>

          <Button
            type="submit"
            variant="danger"
            disabled={pending}
          >
            {pending ? "Excluindo..." : "Confirmar exclusão"}
          </Button>
        </form>
      </div>
    </Modal>
  );
}
