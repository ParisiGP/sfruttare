import { UsuarioRepository } from "./usuario.repository";
import {
  cadastroSchema,
  perfilSchema,
  type PerfilInput,
} from "./usuario.schema";
import type { UsuarioRole } from "./usuario.types";

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

  async listarUsuarios(busca?: string) {
    const usuarios =
      await this.usuarioRepository.findAll(
        busca
      );

    return usuarios.map((usuario) => ({
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      role: usuario.role,
      createdAt: usuario.createdAt,
    }));
  }

  async alterarRole(
    idAlvo: string,
    novoRole: UsuarioRole,
    idSolicitante: string
  ) {
    if (idAlvo === idSolicitante) {
      throw new Error(
        "Você não pode alterar seu próprio nível de acesso."
      );
    }

    const usuarioAlvo =
      await this.usuarioRepository.findById(
        idAlvo
      );

    if (!usuarioAlvo) {
      throw new Error(
        "Usuário não encontrado."
      );
    }

    if (
      usuarioAlvo.role === "ADMIN" &&
      novoRole === "CLIENTE"
    ) {
      const totalAdmins =
        await this.usuarioRepository.countByRole(
          "ADMIN"
        );

      if (totalAdmins <= 1) {
        throw new Error(
          "Não é possível remover o último administrador do sistema."
        );
      }
    }

    return this.usuarioRepository.updateRole(
      idAlvo,
      novoRole
    );
  }
}