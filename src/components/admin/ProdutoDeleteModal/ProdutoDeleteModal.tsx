"use client";

import { useActionState, useEffect } from "react";

import { Modal } from "@/components/ui/Modal/Modal";
import {
  excluirProduto,
  type ProdutoActionState,
} from "@/modules/produto/actions";
import type { ProdutoAdminItem } from "@/modules/produto/produto.types";

import styles from "./ProdutoDeleteModal.module.css";

type ProdutoDeleteModalProps = {
  produto: ProdutoAdminItem | null;
  aberto: boolean;
  onClose: () => void;
};

const initialState: ProdutoActionState = {
  ok: false,
  message: "",
};

export function ProdutoDeleteModal({
  produto,
  aberto,
  onClose,
}: ProdutoDeleteModalProps) {
  const [state, formAction, pending] =
    useActionState(
      excluirProduto,
      initialState
    );

  useEffect(() => {
    if (state.ok && state.message) {
      onClose();
    }
  }, [state, onClose]);

  if (!produto) {
    return null;
  }

  return (
    <Modal
      aberto={aberto}
      onClose={onClose}
    >
      <div className={styles.content}>
        <h2 className={styles.title}>
          Excluir produto
        </h2>

        <p className={styles.message}>
          Tem certeza que deseja excluir este produto?
          Produtos com pedidos vinculados nao podem ser
          excluidos.
        </p>

        <strong className={styles.productName}>
          {produto.nome}
        </strong>

        {state.message && !state.ok && (
          <p className={styles.error}>
            {state.message}
          </p>
        )}

        <form
          action={formAction}
          className={styles.actions}
        >
          <input
            type="hidden"
            name="id"
            value={produto.id}
          />

          <button
            type="button"
            className={styles.cancelButton}
            onClick={onClose}
          >
            Cancelar
          </button>

          <button
            type="submit"
            className={styles.confirmButton}
            disabled={pending}
          >
            {pending
              ? "Excluindo..."
              : "Confirmar exclusao"}
          </button>
        </form>
      </div>
    </Modal>
  );
}
