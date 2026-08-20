"use client";

import { useState } from "react";
import { signIn, getSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";

import { Input } from "@/components/ui/Input/Input";
import { Button } from "@/components/ui/Button/Button";

import styles from "./LoginForm.module.css";

type LoginFormProps = {
  subtitle?: string;
  exibirLinkCadastro?: boolean;
  exibirLogo?: boolean;
  callbackUrl?: string;
};

function isCallbackUrlSegura(
  callbackUrl: string | undefined
): callbackUrl is string {
  return (
    !!callbackUrl &&
    callbackUrl.startsWith("/") &&
    !callbackUrl.startsWith("//")
  );
}

export function LoginForm({
  subtitle = "Entrar",
  exibirLinkCadastro = false,
  exibirLogo = false,
  callbackUrl,
}: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setErro("");
    setCarregando(true);

    const result = await signIn("credentials", {
      email,
      senha,
      redirect: false,
    });

    if (result?.error) {
      setCarregando(false);
      setErro("E-mail ou senha inválidos.");
      return;
    }

    const session = await getSession();

    const destino = isCallbackUrlSegura(callbackUrl)
      ? callbackUrl
      : session?.user?.role === "ADMIN"
      ? "/admin/produtos"
      : "/perfil";

    window.location.href = destino;
  }

  return (
    <section className={styles.card}>
      {exibirLogo ? (
        <Image
          src="/logo-sfruttare-completo.png"
          alt="Sfruttare"
          width={1619}
          height={971}
          priority
          className={styles.logo}
        />
      ) : (
        <h1 className={styles.title}>
          Sfruttare
        </h1>
      )}

      <p className={styles.subtitle}>
        {subtitle}
      </p>

      <form className={styles.form}
        onSubmit={handleSubmit}>
        <label className={styles.field}>
          <span>E-mail</span>

          <Input
            type="email"
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
            placeholder="Digite sua senha"
            value={senha}
            onChange={(event) =>
              setSenha(event.target.value)
            }
            required
          />
        </label>

        {erro && (
          <p className={styles.error}>
            {erro}
          </p>
        )}

        <Button
          type="submit"
          disabled={carregando}
        >
          {carregando ? "Entrando..." : "Entrar"}
        </Button>
      </form>

      {exibirLinkCadastro && (
        <p className={styles.loginLink}>
          Ainda não possui conta?{" "}
          <Link href="/cadastro">Criar conta</Link>
        </p>
      )}
    </section>
  );
}
