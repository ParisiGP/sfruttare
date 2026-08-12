import { prisma } from "@/lib/prisma";

export type EnderecoWriteData = {
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
};

export class EnderecoRepository {
  async findByUsuarioId(usuarioId: string) {
    return prisma.endereco.findMany({
      where: {
        usuarioId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async findById(id: string) {
    return prisma.endereco.findUnique({
      where: {
        id,
      },
    });
  }

  async create(
    usuarioId: string,
    data: EnderecoWriteData
  ) {
    return prisma.endereco.create({
      data: {
        ...data,
        usuarioId,
      },
    });
  }

  async update(
    id: string,
    data: EnderecoWriteData
  ) {
    return prisma.endereco.update({
      where: {
        id,
      },
      data,
    });
  }

  async delete(id: string) {
    return prisma.endereco.delete({
      where: {
        id,
      },
    });
  }
}
