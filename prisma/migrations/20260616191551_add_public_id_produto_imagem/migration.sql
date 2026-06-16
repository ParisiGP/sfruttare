/*
  Warnings:

  - Added the required column `publicId` to the `ProdutoImagem` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ProdutoImagem" ADD COLUMN     "publicId" TEXT NOT NULL;
