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

export type UsuarioPerfil = {
  id: string;
  nome: string;
  email: string;
  role: UsuarioRole;
};

export type UsuarioAdminItem = {
  id: string;
  nome: string;
  email: string;
  role: UsuarioRole;
  createdAt: Date;
};