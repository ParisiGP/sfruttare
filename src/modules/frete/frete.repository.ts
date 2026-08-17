import { prisma } from "@/lib/prisma";

export class FreteRepository {
  async obterIntegracao(
    provedor = "melhor_envio"
  ) {
    return prisma.integracaoFrete.findFirst({
      where: {
        provedor,
      },
    });
  }

  async atualizarToken(
    id: string,
    dados: {
      accessToken: string;
      refreshToken: string;
      expiraEm: Date;
    }
  ) {
    return prisma.integracaoFrete.update({
      where: {
        id,
      },
      data: dados,
    });
  }
}
