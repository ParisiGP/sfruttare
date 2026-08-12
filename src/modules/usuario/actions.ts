"use server";

import { revalidatePath } from "next/cache";
import { ZodError } from "zod";

import { requireAuth } from "@/lib/auth/requireAuth";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { UsuarioService } from "./usuario.service";
import { alterarRoleSchema } from "./usuario.schema";

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

export async function alterarRoleUsuario(
  prevState: UsuarioActionState,
  formData: FormData
): Promise<UsuarioActionState> {
  try {
    const admin = await requireAdmin();

    const dadosValidados =
      alterarRoleSchema.parse({
        id: formData.get("id"),
        role: formData.get("role"),
      });

    await usuarioService.alterarRole(
      dadosValidados.id,
      dadosValidados.role,
      admin.id
    );

    revalidatePath("/admin/usuarios");

    return {
      ok: true,
      message:
        "Nível de acesso atualizado com sucesso.",
    };
  } catch (error) {
    return handleError(
      "alterarRoleUsuario",
      error
    );
  }
}
