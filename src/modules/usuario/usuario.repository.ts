import { prisma } from "@/lib/prisma";

export class UsuarioRepository {
  async findByEmail(email: string) {
    return prisma.usuario.findUnique({
      where: {
        email,
      },
    });
  }

  async findById(id: string) {
    return prisma.usuario.findUnique({
      where: {
        id,
      },
    });
  }
}