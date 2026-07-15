"use client";

import styles from "./LoginForm.module.css";

export function LoginForm() {
  return (
    <section className={styles.card}>
      <h1 className={styles.title}>
        Sfruttare
      </h1>

      <p className={styles.subtitle}>
        Painel Administrativo
      </p>

      <form className={styles.form}>
        <label>
          <span>E-mail</span>

          <input
            type="email"
            placeholder="Digite seu e-mail"
          />
        </label>

        <label>
          <span>Senha</span>

          <input
            type="password"
            placeholder="Digite sua senha"
          />
        </label>

        <button type="submit">
          Entrar
        </button>
      </form>
    </section>
  );
}