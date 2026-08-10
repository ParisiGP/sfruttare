"use server";

import { ZodError } from "zod";

import { requireAuth } from "@/lib/auth/requireAuth";
import { UsuarioService } from "./usuario.service";

const usuarioService =
  new UsuarioService();

export type UsuarioActionState = {
  ok: boolean;
  message: string;
};

function formatError(error: unknown) {
  if (error instanceof ZodError) {
    return error.issues
      .map((issue) => issue.message)
      .join(" ");
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Não foi possível concluir a ação.";
}

function handleError(
  action: string,
  error: unknown
): UsuarioActionState {
  console.error(`[usuario:${action}]`, error);

  return {
    ok: false,
    message: formatError(error),
  };
}

export async function cadastrarUsuario(
  prevState: UsuarioActionState,
  formData: FormData
): Promise<UsuarioActionState> {
  try {
    await usuarioService.criarUsuario({
      nome: String(formData.get("nome") ?? ""),
      email: String(formData.get("email") ?? ""),
      senha: String(formData.get("senha") ?? ""),
    });

    return {
      ok: true,
      message:
        "Cadastro realizado com sucesso. Você já pode entrar.",
    };
  } catch (error) {
    return handleError("cadastrarUsuario", error);
  }
}

export type PerfilActionState = UsuarioActionState & {
  nome?: string;
  email?: string;
};

export async function atualizarPerfil(
  prevState: PerfilActionState,
  formData: FormData
): Promise<PerfilActionState> {
  try {
    const usuario = await requireAuth();

    const nome = String(formData.get("nome") ?? "");
    const email = String(formData.get("email") ?? "");

    await usuarioService.atualizarPerfil(usuario.id, {
      nome,
      email,
    });

    return {
      ok: true,
      message: "Perfil atualizado com sucesso.",
      nome,
      email,
    };
  } catch (error) {
    return handleError("atualizarPerfil", error);
  }
}
