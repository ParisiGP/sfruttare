-- CreateTable
CREATE TABLE "VendaBalcao" (
    "id" TEXT NOT NULL,
    "nomeCliente" TEXT NOT NULL,
    "emailCliente" TEXT,
    "parcelas" INTEGER NOT NULL DEFAULT 1,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "total" DECIMAL(10,2) NOT NULL,
    "totalComJuros" DECIMAL(10,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VendaBalcao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendaBalcaoItem" (
    "id" TEXT NOT NULL,
    "vendaBalcaoId" TEXT NOT NULL,
    "produtoId" TEXT NOT NULL,
    "nomeProduto" TEXT NOT NULL,
    "precoUnitario" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VendaBalcaoItem_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "VendaBalcaoItem" ADD CONSTRAINT "VendaBalcaoItem_vendaBalcaoId_fkey" FOREIGN KEY ("vendaBalcaoId") REFERENCES "VendaBalcao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendaBalcaoItem" ADD CONSTRAINT "VendaBalcaoItem_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "Produto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
