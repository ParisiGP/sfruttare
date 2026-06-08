/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `Produto` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `slug` to the `Produto` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Produto` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Produto" ADD COLUMN     "estoque" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "slug" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "ProdutoImagem" ADD COLUMN     "ordem" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX "Produto_slug_key" ON "Produto"("slug");
