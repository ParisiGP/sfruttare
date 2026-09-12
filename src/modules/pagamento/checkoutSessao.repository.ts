import { prisma } from "@/lib/prisma";

export type CheckoutSessaoStatus =
  | "PENDENTE"
  | "CONCLUIDA"
  | "REJEITADA";

export type CheckoutSessaoWriteData = {
  usuarioId: string;
  enderecoId: string;
  frete: number;
  mpPreferenceId: string;
};

export class CheckoutSessaoRepository {
  async create(data: CheckoutSessaoWriteData) {
    return prisma.checkoutSessao.create({
      data,
    });
  }

  async findById(id: string) {
    return prisma.checkoutSessao.findUnique({
      where: {
        id,
      },
    });
  }

  async findByPreferenceId(
    mpPreferenceId: string
  ) {
    return prisma.checkoutSessao.findUnique({
      where: {
        mpPreferenceId,
      },
    });
  }

  /**
   * A CheckoutSessao nasce com um `mpPreferenceId` placeholder (ainda não
   * sabemos o id real da preferência antes de criá-la no Mercado Pago, e
   * a coluna é NOT NULL + UNIQUE). Este método substitui o placeholder
   * pelo id real assim que a preferência é criada.
   */
  async atualizarPreferenceId(
    id: string,
    mpPreferenceId: string
  ) {
    return prisma.checkoutSessao.update({
      where: {
        id,
      },
      data: {
        mpPreferenceId,
      },
    });
  }

  async updateStatus(
    id: string,
    status: CheckoutSessaoStatus,
    pedidoId?: string
  ) {
    return prisma.checkoutSessao.update({
      where: {
        id,
      },
      data: {
        status,
        ...(pedidoId ? { pedidoId } : {}),
      },
    });
  }
}
