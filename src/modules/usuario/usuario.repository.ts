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

  async update(
    id: string,
    data: {
      nome: string;
      email: string;
    }
  ) {
    return prisma.usuario.update({
      where: {
        id,
      },
      data,
    });
  }

  async findAll(busca?: string) {
    return prisma.usuario.findMany({
      where: busca
        ? {
          OR: [
            {
              nome: {
                contains: busca,
                mode: "insensitive",
              },
            },
            {
              email: {
                contains: busca,
                mode: "insensitive",
              },
            },
          ],
        }
        : undefined,
      orderBy: {
        nome: "asc",
      },
    });
  }

  async countByRole(
    role: "ADMIN" | "CLIENTE"
  ) {
    return prisma.usuario.count({
      where: {
        role,
      },
    });
  }

  async updateRole(
    id: string,
    role: "ADMIN" | "CLIENTE"
  ) {
    return prisma.usuario.update({
      where: {
        id,
      },
      data: {
        role,
      },
    });
  }
}