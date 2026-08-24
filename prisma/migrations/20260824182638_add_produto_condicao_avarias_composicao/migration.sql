-- CreateEnum
CREATE TYPE "CondicaoProduto" AS ENUM ('NOVO', 'SEMINOVO', 'USADO');

-- AlterTable
ALTER TABLE "Produto" ADD COLUMN     "avarias" TEXT,
ADD COLUMN     "composicao" TEXT,
ADD COLUMN     "condicao" "CondicaoProduto";
