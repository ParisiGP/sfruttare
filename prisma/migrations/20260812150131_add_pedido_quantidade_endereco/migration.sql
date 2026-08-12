-- AlterTable
ALTER TABLE "Pedido" ADD COLUMN     "enderecoId" TEXT;

-- AlterTable
ALTER TABLE "PedidoItem" ADD COLUMN     "quantidade" INTEGER NOT NULL DEFAULT 1;

-- AddForeignKey
ALTER TABLE "Pedido" ADD CONSTRAINT "Pedido_enderecoId_fkey" FOREIGN KEY ("enderecoId") REFERENCES "Endereco"("id") ON DELETE SET NULL ON UPDATE CASCADE;
