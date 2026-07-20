"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

import styles from "./LoginForm.module.css";

export function LoginForm() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setErro("");

    const result = await signIn("credentials", {
      email,
      senha,
      redirect: false,
    });

    if (result?.error) {
      setErro("E-mail ou senha inválidos.");
      return;
    }

    router.push("/admin/produtos");
    router.refresh();
  }

  return (
    <section className={styles.card}>
      <h1 className={styles.title}>
        Sfruttare
      </h1>

      <p className={styles.subtitle}>
        Painel Administrativo
      </p>

      <form className={styles.form}
        onSubmit={handleSubmit}>
        <label>
          <span>E-mail</span>

          <input
            type="email"
            placeholder="Digite seu e-mail"
            value={email}
            onChange={(event) =>
              setEmail(event.target.value)
            }
            required
          />
        </label>

        <label>
          <span>Senha</span>

          <input
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
        <button type="submit">
          Entrar
        </button>
      </form>
    </section>
  );
}
