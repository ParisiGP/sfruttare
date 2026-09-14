-- AlterTable (aditivo: colunas novas, todas opcionais — vendas ja gravadas ficam com NULL)
ALTER TABLE "VendaBalcao" ADD COLUMN     "descontoAplicado" DECIMAL(10,2),
ADD COLUMN     "descontoEntrada" DECIMAL(10,2),
ADD COLUMN     "descontoTipo" TEXT;

-- CreateTable
CREATE TABLE "DevolucaoBalcao" (
    "id" TEXT NOT NULL,
    "vendaBalcaoItemId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "valorDevolvido" DECIMAL(10,2) NOT NULL,
    "novoProdutoId" TEXT,
    "diferencaValor" DECIMAL(10,2),
    "motivo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DevolucaoBalcao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DevolucaoBalcao_vendaBalcaoItemId_key" ON "DevolucaoBalcao"("vendaBalcaoItemId");

-- AddForeignKey
ALTER TABLE "DevolucaoBalcao" ADD CONSTRAINT "DevolucaoBalcao_vendaBalcaoItemId_fkey" FOREIGN KEY ("vendaBalcaoItemId") REFERENCES "VendaBalcaoItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DevolucaoBalcao" ADD CONSTRAINT "DevolucaoBalcao_novoProdutoId_fkey" FOREIGN KEY ("novoProdutoId") REFERENCES "Produto"("id") ON DELETE SET NULL ON UPDATE CASCADE;
