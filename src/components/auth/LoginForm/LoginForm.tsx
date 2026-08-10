"use client";

import { useState } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";

import { Input } from "@/components/ui/Input/Input";
import { Button } from "@/components/ui/Button/Button";

import styles from "./LoginForm.module.css";

type LoginFormProps = {
  subtitle?: string;
};

export function LoginForm({
  subtitle = "Entrar",
}: LoginFormProps) {
  const router = useRouter();

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

    const destino =
      session?.user?.role === "ADMIN"
        ? "/admin/produtos"
        : "/perfil";

    router.push(destino);
    router.refresh();
  }

  return (
    <section className={styles.card}>
      <h1 className={styles.title}>
        Sfruttare
      </h1>

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
    </section>
  );
}
