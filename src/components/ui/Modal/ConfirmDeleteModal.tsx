"use client";

import { useState } from "react";

import { Modal } from "./Modal";

import { excluirProduto } from "@/modules/produto/actions";

import styles from "./Modal.module.css";

type ModalExcluirProdutoProps = {
  produto: {
    id: string;
    nome: string;
  };
};

export function ModalExcluirProduto({
  produto,
}: ModalExcluirProdutoProps) {
  const [aberto, setAberto] =
    useState(false);

  return (
    <>
      <button 
        className={styles.modalExcluir}
        onClick={() =>
          setAberto(true)
        }
      >
        Excluir
      </button>

      <Modal
        aberto={aberto}
        onClose={() =>
          setAberto(false)
        }
      >
        <h2>Excluir Produto</h2>

        <p>
          Tem certeza que deseja excluir:
        </p>

        <strong>
          {produto.nome}
        </strong>

        <form action={excluirProduto} className={styles.buttons}>
          <input
            type="hidden"
            name="id"
            value={produto.id}
          />
        <div className={styles.modalContainerButtons}>
          <button className={styles.modalCancelar}
            type="button"
            onClick={() =>
              setAberto(false)
            }
          >
            Cancelar
          </button>

          <button type="submit" className={styles.modalExcluir}>
            Confirmar
          </button>
        </div>
        </form>
      </Modal>
    </>
  );
}