export type UsuarioRole =
  | "ADMIN"
  | "CLIENTE";

export type UsuarioAuth = {
  id: string;
  nome: string;
  email: string;
  senha: string;
  role: UsuarioRole;
};