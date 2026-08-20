"use server";

import { ZodError } from "zod";

import { NewsletterService } from "./newsletter.service";

const newsletterService = new NewsletterService();

export type NewsletterActionState = {
  ok: boolean;
  message: string;
};

function formatError(error: unknown) {
  if (error instanceof ZodError) {
    return error.issues
      .map((issue) => issue.message)
      .join(" ");
  }

  return "Não foi possível concluir a inscrição.";
}

export async function inscreverNewsletter(
  _state: NewsletterActionState,
  formData: FormData
): Promise<NewsletterActionState> {
  try {
    const email = String(
      formData.get("email") ?? ""
    );

    await newsletterService.inscrever(email);

    return {
      ok: true,
      message:
        "Inscrição confirmada! Fique de olho no seu e-mail.",
    };
  } catch (error) {
    console.error(
      "[newsletter:inscrever]",
      error
    );

    return {
      ok: false,
      message: formatError(error),
    };
  }
}
