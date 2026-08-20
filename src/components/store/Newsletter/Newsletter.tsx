"use client";

import { useActionState } from "react";
import Image from "next/image";

import { Input } from "@/components/ui/Input/Input";
import { LinkButton } from "@/components/ui/LinkButton/LinkButton";
import { Ornamento } from "@/components/store/Ornamento/Ornamento";

import {
  inscreverNewsletter,
  type NewsletterActionState,
} from "@/modules/newsletter/actions";

import styles from "./Newsletter.module.css";

const initialState: NewsletterActionState = {
  ok: false,
  message: "",
};

export function Newsletter() {
  const [state, formAction, pending] =
    useActionState(
      inscreverNewsletter,
      initialState
    );

  return (
    <section className={styles.newsletter}>
      <div className={styles.content}>
        <Image
          src="/logo-sfruttare-medalhao.png"
          alt=""
          aria-hidden="true"
          width={1536}
          height={1024}
          className={styles.medalhao}
        />

        <p className={styles.text}>
          Fique por dentro das novidades e receba
          ofertas exclusivas.
        </p>

        <form
          className={styles.form}
          action={formAction}
        >
          <Input
            type="email"
            name="email"
            placeholder="Digite seu e-mail"
            required
            aria-label="E-mail"
          />

          <LinkButton
            type="submit"
            disabled={pending}
          >
            {pending ? "Enviando..." : "Enviar"}
          </LinkButton>
        </form>

        {state.message && (
          <p
            className={
              state.ok
                ? styles.success
                : styles.error
            }
            role="status"
          >
            {state.message}
          </p>
        )}
      </div>

      <Ornamento
        className={styles.ilustracao}
        width={220}
        height={44}
      />
    </section>
  );
}
