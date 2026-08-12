import { z } from "zod";

export const cadastroSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(2, "Nome muito curto")
    .max(80, "Nome muito longo"),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("E-mail inválido"),
  senha: z
    .string()
    .min(6, "Senha deve ter pelo menos 6 caracteres"),
});

export type CadastroInput = z.infer<typeof cadastroSchema>;

export const perfilSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(2, "Nome muito curto")
    .max(80, "Nome muito longo"),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("E-mail inválido"),
});

export type PerfilInput = z.infer<typeof perfilSchema>;

export const alterarRoleSchema = z.object({
  id: z.string().cuid(),
  role: z.enum(["ADMIN", "CLIENTE"]),
});

export type AlterarRoleInput =
  z.infer<typeof alterarRoleSchema>;
