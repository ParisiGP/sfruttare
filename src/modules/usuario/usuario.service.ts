import { UsuarioRepository } from "./usuario.repository";

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
}