"use client";

import { useActionState, useEffect, useState } from "react";

import { Modal } from "@/components/ui/Modal/Modal";
import { Button } from "@/components/ui/Button/Button";
import { Input } from "@/components/ui/Input/Input";

import {
  alterarRoleUsuario,
  type UsuarioActionState,
} from "@/modules/usuario/actions";
import type { UsuarioAdminItem } from "@/modules/usuario/usuario.types";

import styles from "./UsuariosAdmin.module.css";

type UsuariosAdminProps = {
  usuarios: UsuarioAdminItem[];
  busca: string;
  adminId: string;
};

const initialState: UsuarioActionState = {
  ok: false,
  message: "",
};

const roleLabel: Record<
  UsuarioAdminItem["role"],
  string
> = {
  ADMIN: "Admin",
  CLIENTE: "Cliente",
};

const dataFormatador = new Intl.DateTimeFormat(
  "pt-BR",
  {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }
);

export function UsuariosAdmin({
  usuarios,
  busca,
  adminId,
}: UsuariosAdminProps) {
  const [usuarioSelecionado, setUsuarioSelecionado] =
    useState<UsuarioAdminItem | null>(null);

  function fecharModal() {
    setUsuarioSelecionado(null);
  }

  return (
    <div className={styles.wrapper}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>
            Administração
          </p>

          <h1>Usuários</h1>

          <p className={styles.description}>
            Gerencie o nível de acesso dos
            usuários cadastrados na loja.
          </p>
        </div>
      </header>

      <form
        className={styles.filters}
        method="GET"
      >
        <label className={styles.search}>
          <span>Busca</span>

          <Input
            name="busca"
            type="search"
            placeholder="Nome ou e-mail"
            defaultValue={busca}
          />
        </label>

        <button type="submit">
          Filtrar
        </button>
      </form>

      {usuarios.length === 0 ? (
        <div className={styles.empty}>
          <strong>
            Nenhum usuário encontrado
          </strong>

          <span>
            Ajuste a busca ou aguarde novos
            cadastros.
          </span>
        </div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Email</th>
                <th>Nível de acesso</th>
                <th>Desde</th>
                <th>Ação</th>
              </tr>
            </thead>

            <tbody>
              {usuarios.map((usuario) => {
                const ehProprioAdmin =
                  usuario.id === adminId;

                return (
                  <tr key={usuario.id}>
                    <td>{usuario.nome}</td>

                    <td>{usuario.email}</td>

                    <td>
                      <span
                        className={`${styles.badge} ${
                          usuario.role === "ADMIN"
                            ? styles.admin
                            : styles.cliente
                        }`}
                      >
                        {roleLabel[usuario.role]}
                      </span>
                    </td>

                    <td>
                      {dataFormatador.format(
                        usuario.createdAt
                      )}
                    </td>

                    <td>
                      <button
                        type="button"
                        className={
                          styles.actionButton
                        }
                        disabled={ehProprioAdmin}
                        title={
                          ehProprioAdmin
                            ? "Você não pode alterar seu próprio acesso"
                            : undefined
                        }
                        onClick={() =>
                          setUsuarioSelecionado(
                            usuario
                          )
                        }
                      >
                        {usuario.role === "ADMIN"
                          ? "Remover admin"
                          : "Tornar admin"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <AlterarRoleModal
        key={usuarioSelecionado?.id ?? "nenhum"}
        usuario={usuarioSelecionado}
        onClose={fecharModal}
      />
    </div>
  );
}

function AlterarRoleModal({
  usuario,
  onClose,
}: {
  usuario: UsuarioAdminItem | null;
  onClose: () => void;
}) {
  const [state, formAction, pending] =
    useActionState(
      alterarRoleUsuario,
      initialState
    );

  useEffect(() => {
    if (state.ok) {
      onClose();
    }
  }, [state, onClose]);

  if (!usuario) {
    return null;
  }

  const novoRole =
    usuario.role === "ADMIN"
      ? "CLIENTE"
      : "ADMIN";

  return (
    <Modal
      aberto={usuario !== null}
      onClose={onClose}
    >
      <div className={styles.modalContent}>
        <h2 className={styles.modalTitle}>
          {novoRole === "ADMIN"
            ? "Tornar administrador"
            : "Remover acesso de administrador"}
        </h2>

        <p className={styles.modalMessage}>
          Tem certeza que deseja alterar o
          nível de acesso de{" "}
          <strong>{usuario.nome}</strong> (
          {usuario.email}) para{" "}
          <strong>
            {roleLabel[novoRole]}
          </strong>
          ?
        </p>

        {state.message && !state.ok && (
          <p className={styles.error}>
            {state.message}
          </p>
        )}

        <form
          action={formAction}
          className={styles.modalActions}
        >
          <input
            type="hidden"
            name="id"
            value={usuario.id}
          />

          <input
            type="hidden"
            name="role"
            value={novoRole}
          />

          <Button
            type="button"
            variant="outline"
            onClick={onClose}
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
        </form>
      </div>
    </Modal>
  );
}
