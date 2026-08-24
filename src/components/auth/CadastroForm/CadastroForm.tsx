"use client";

import { useActionState, useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";

import { Input } from "@/components/ui/Input/Input";
import { Button } from "@/components/ui/Button/Button";
import { isCallbackUrlSegura } from "@/lib/auth/isCallbackUrlSegura";

import {
  cadastrarUsuario,
  type UsuarioActionState,
} from "@/modules/usuario/actions";

import styles from "./CadastroForm.module.css";

const initialState: UsuarioActionState = {
  ok: false,
  message: "",
};

type CadastroFormProps = {
  callbackUrl?: string;
};

export function CadastroForm({
  callbackUrl,
}: CadastroFormProps) {
  const [state, formAction, pending] =
    useActionState(cadastrarUsuario, initialState);

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [entrando, setEntrando] = useState(false);

  useEffect(() => {
    if (!state.ok) {
      return;
    }

    let cancelado = false;

    setEntrando(true);

    signIn("credentials", {
      email,
      senha,
      redirect: false,
    }).then(() => {
      if (cancelado) {
        return;
      }

      window.location.href = isCallbackUrlSegura(
        callbackUrl
      )
        ? callbackUrl
        : "/";
    });

    return () => {
      cancelado = true;
    };
  }, [state.ok, email, senha, callbackUrl]);

  return (
    <section className={styles.card}>
      <Image
        src="/logo-sfruttare-completo.png"
        alt="Sfruttare"
        width={1619}
        height={971}
        priority
        className={styles.logo}
      />

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
            value={email}
            onChange={(event) =>
              setEmail(event.target.value)
            }
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
            value={senha}
            onChange={(event) =>
              setSenha(event.target.value)
            }
            required
          />
        </label>

        {state.message && !state.ok && (
          <p className={styles.error}>
            {state.message}
          </p>
        )}

        <Button
          type="submit"
          disabled={pending || entrando}
        >
          {pending
            ? "Criando conta..."
            : entrando
              ? "Entrando..."
              : "Criar conta"}
        </Button>
      </form>

      <p className={styles.loginLink}>
        Já tem uma conta? <Link href="/login">Entrar</Link>
      </p>
    </section>
  );
}
