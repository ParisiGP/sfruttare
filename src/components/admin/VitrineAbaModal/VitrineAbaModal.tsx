"use client";

import { useActionState, useEffect, useState } from "react";

import { Modal } from "@/components/ui/Modal/Modal";
import { Button } from "@/components/ui/Button/Button";
import { Input } from "@/components/ui/Input/Input";

import {
  criarAba,
  editarAba,
  type VitrineAbaActionState,
} from "@/modules/vitrineAba/actions";
import type { VitrineAbaAdminItem } from "@/modules/vitrineAba/vitrineAba.types";

import styles from "./VitrineAbaModal.module.css";

type VitrineAbaModalProps = {
  aberto: boolean;
  aba: VitrineAbaAdminItem | null;
  onClose: () => void;
};

const initialState: VitrineAbaActionState = {
  ok: false,
  message: "",
};

export function VitrineAbaModal({
  aberto,
  aba,
  onClose,
}: VitrineAbaModalProps) {
  const acao = aba ? editarAba : criarAba;

  const [state, formAction, pending] =
    useActionState(acao, initialState);

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
  }, [aberto, aba]);

  if (!aberto) {
    return null;
  }

  return (
    <Modal aberto={aberto} onClose={onClose}>
      <div className={styles.content}>
        <h2 className={styles.title}>
          {aba ? "Editar aba" : "Nova aba"}
        </h2>

        <form
          key={aba?.id ?? "nova-aba"}
          action={formAction}
          className={styles.form}
        >
          {aba && (
            <input type="hidden" name="id" value={aba.id} />
          )}

          <label className={styles.field}>
            <span>Nome</span>
            <Input
              type="text"
              name="nome"
              placeholder="Ex: Novidades"
              defaultValue={aba?.nome ?? ""}
              required
            />
          </label>

          <label className={styles.checkboxField}>
            <input
              type="checkbox"
              name="ativo"
              defaultChecked={aba?.ativo ?? true}
            />
            <span>Aba ativa na loja pública</span>
          </label>

          {errorMessage && (
            <p className={styles.error}>{errorMessage}</p>
          )}

          <div className={styles.actions}>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Cancelar
            </Button>

            <Button type="submit" disabled={pending}>
              {pending
                ? "Salvando..."
                : aba
                ? "Salvar alterações"
                : "Criar aba"}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
