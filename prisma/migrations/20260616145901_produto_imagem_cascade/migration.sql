-- DropForeignKey
ALTER TABLE "ProdutoImagem" DROP CONSTRAINT "ProdutoImagem_produtoId_fkey";

-- AddForeignKey
ALTER TABLE "ProdutoImagem" ADD CONSTRAINT "ProdutoImagem_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "Produto"("id") ON DELETE CASCADE ON UPDATE CASCADE;
