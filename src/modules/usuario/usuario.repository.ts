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

  async create(data: {
  nome: string;
  email: string;
  senha: string;
  role: "ADMIN" | "CLIENTE";
}) {
  return prisma.usuario.create({
    data,
  });
}
}