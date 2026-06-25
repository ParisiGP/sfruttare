/*
  Warnings:

  - A unique constraint covering the columns `[referencia]` on the table `Produto` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Produto" ADD COLUMN     "cor" TEXT,
ADD COLUMN     "referencia" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Produto_referencia_key" ON "Produto"("referencia");
