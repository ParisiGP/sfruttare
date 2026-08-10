"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { Input } from "@/components/ui/Input/Input";
import { Button } from "@/components/ui/Button/Button";

import {
  cadastrarUsuario,
  type UsuarioActionState,
} from "@/modules/usuario/actions";

import styles from "./CadastroForm.module.css";

const initialState: UsuarioActionState = {
  ok: false,
  message: "",
};

export function CadastroForm() {
  const router = useRouter();

  const [state, formAction, pending] =
    useActionState(cadastrarUsuario, initialState);

  useEffect(() => {
    if (!state.ok) {
      return;
    }

    const timeout = setTimeout(() => {
      router.push("/login");
    }, 1500);

    return () => clearTimeout(timeout);
  }, [state.ok, router]);

  return (
    <section className={styles.card}>
      <h1 className={styles.title}>
        Sfruttare
      </h1>

      <p className={styles.subtitle}>
        Criar conta
      </p>

      <form className={styles.form} action={formAction}>
        <label className={styles.field}>
          <span>Nome</span>

          <Input
            type="text"
            name="nome"
            placeholder="Seu nome completo"
            required
          />
        </label>

        <label className={styles.field}>
          <span>E-mail</span>

          <Input
            type="email"
            name="email"
            placeholder="Digite seu e-mail"
            required
          />
        </label>

        <label className={styles.field}>
          <span>Senha</span>

          <Input
            type="password"
            name="senha"
            placeholder="Crie uma senha"
            minLength={6}
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
          {pending ? "Criando conta..." : "Criar conta"}
        </Button>
      </form>

      <p className={styles.loginLink}>
        Já tem uma conta? <Link href="/login">Entrar</Link>
      </p>
    </section>
  );
}
