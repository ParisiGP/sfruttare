import { UsuarioRepository } from "./usuario.repository";
import {
  cadastroSchema,
  perfilSchema,
  type PerfilInput,
} from "./usuario.schema";

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
  const dadosValidados =
    cadastroSchema.parse({
      nome: data.nome,
      email: data.email,
      senha: data.senha,
    });

  const usuarioExistente =
    await this.usuarioRepository.findByEmail(
      dadosValidados.email
    );

  if (usuarioExistente) {
    throw new Error(
      "Já existe um usuário com este e-mail."
    );
  }

  const senhaHash =
    await bcrypt.hash(dadosValidados.senha, 10);

  return this.usuarioRepository.create({
    nome: dadosValidados.nome,
    email: dadosValidados.email,
    senha: senhaHash,
    role: data.role ?? "CLIENTE",
  });
}

  async atualizarPerfil(
    id: string,
    data: PerfilInput
  ) {
    const dadosValidados =
      perfilSchema.parse(data);

    const usuarioExistente =
      await this.usuarioRepository.findByEmail(
        dadosValidados.email
      );

    if (
      usuarioExistente &&
      usuarioExistente.id !== id
    ) {
      throw new Error(
        "Já existe um usuário com este e-mail."
      );
    }

    return this.usuarioRepository.update(
      id,
      dadosValidados
    );
  }
}