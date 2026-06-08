import { prisma } from "@/lib/prisma";

export class CategoriaRepository {
  async findAll() {
    return prisma.categoria.findMany({
      orderBy: {
        nome: "asc",
      },
    });
  }

  async findByName(nome: string) {
    return prisma.categoria.findFirst({
      where: {
        nome,
      },
    });
  }

  async create(nome: string) {
    return prisma.categoria.create({
      data: {
        nome,
      },
    });
  }

async delete(id: string) {
    return prisma.categoria.delete({
      where: {
        id,
      },
    });
}

async edit(id: string, nome: string) {
    return prisma.categoria.update({
      where: {
        id,
      },
      data: {
        nome,
      },
    });
  }

}

