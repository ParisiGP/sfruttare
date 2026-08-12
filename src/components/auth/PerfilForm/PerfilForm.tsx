"use client";

import { useActionState, useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";

import { Input } from "@/components/ui/Input/Input";
import { Button } from "@/components/ui/Button/Button";

import {
  atualizarPerfil,
  type PerfilActionState,
} from "@/modules/usuario/actions";
import type { UsuarioPerfil } from "@/modules/usuario/usuario.types";

import styles from "./PerfilForm.module.css";

type PerfilFormProps = {
  usuario: UsuarioPerfil;
};

const initialState: PerfilActionState = {
  ok: false,
  message: "",
};

export function PerfilForm({
  usuario,
}: PerfilFormProps) {
  const { update } = useSession();

  const [state, formAction, pending] =
    useActionState(atualizarPerfil, initialState);

  const [saindo, setSaindo] = useState(false);

  useEffect(() => {
    if (state.ok && state.nome && state.email) {
      update({
        name: state.nome,
        email: state.email,
      });
    }
  }, [state, update]);

  async function handleSair() {
    setSaindo(true);
    await signOut({ callbackUrl: "/" });
  }

  return (
    <section className={styles.wrapper}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>
          Minha conta
        </p>

        <h1>Perfil</h1>

        <p className={styles.description}>
          Atualize seu nome e e-mail.
        </p>
      </header>

      <form
        className={styles.form}
        action={formAction}
      >
        <label className={styles.field}>
          <span>Nome</span>

          <Input
            type="text"
            name="nome"
            defaultValue={usuario.nome}
            required
          />
        </label>

        <label className={styles.field}>
          <span>E-mail</span>

          <Input
            type="email"
            name="email"
            defaultValue={usuario.email}
            required
          />
        </label>

        {state.message && (
          <p
            className={
              state.ok ? styles.success : styles.error
            }
          >
            {state.message}
          </p>
        )}

        <Button type="submit" disabled={pending}>
          {pending ? "Salvando..." : "Salvar alterações"}
        </Button>
      </form>

      {usuario.role === "ADMIN" && (
        <div className={styles.adminSection}>
          <p className={styles.adminText}>
            Você tem acesso administrativo.
          </p>

          <Link
            href="/admin/produtos"
            className={styles.adminButton}
          >
            Modo Admin
          </Link>
        </div>
      )}

      <div className={styles.logoutSection}>
        <Button
          type="button"
          variant="outline"
          disabled={saindo}
          onClick={handleSair}
        >
          {saindo ? "Saindo..." : "Sair da conta"}
        </Button>
      </div>
    </section>
  );
}
