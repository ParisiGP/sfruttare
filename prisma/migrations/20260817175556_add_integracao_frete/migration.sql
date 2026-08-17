-- CreateTable
CREATE TABLE "IntegracaoFrete" (
    "id" TEXT NOT NULL,
    "provedor" TEXT NOT NULL DEFAULT 'melhor_envio',
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "expiraEm" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntegracaoFrete_pkey" PRIMARY KEY ("id")
);
