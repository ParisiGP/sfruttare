import { UsuarioRepository } from "./usuario.repository";

import bcrypt from "bcrypt";

export class UsuarioService {
  private usuarioRepository =
    new UsuarioRepository();

  async buscarPorEmail(
    email: string
  ) {
    return this.usuarioRepository.findByEmail(
      email
    );
  }

  async buscarPorId(
    id: string
  ) {
    return this.usuarioRepository.findById(
      id
    );
  }

  async criarUsuario(data: {
  nome: string;
  email: string;
  senha: string;
  role?: "ADMIN" | "CLIENTE";
}) {
  const usuarioExistente =
    await this.usuarioRepository.findByEmail(
      data.email
    );

  if (usuarioExistente) {
    throw new Error(
      "Já existe um usuário com este e-mail."
    );
  }

  const senhaHash =
    await bcrypt.hash(data.senha, 10);

  return this.usuarioRepository.create({
    nome: data.nome,
    email: data.email,
    senha: senhaHash,
    role: data.role ?? "CLIENTE",
  });
}
}