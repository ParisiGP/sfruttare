-- A troca agora referencia a venda inteira que substitui a peça devolvida,
-- em vez de um único produto. Tabela DevolucaoBalcao ainda estava com 0
-- linhas em producao (feature recem-criada, nunca usada de verdade) —
-- seguro trocar a coluna sem migrar dado nenhum.
ALTER TABLE "DevolucaoBalcao" DROP CONSTRAINT "DevolucaoBalcao_novoProdutoId_fkey";

ALTER TABLE "DevolucaoBalcao" DROP COLUMN "novoProdutoId",
ADD COLUMN     "vendaTrocaId" TEXT;

CREATE UNIQUE INDEX "DevolucaoBalcao_vendaTrocaId_key" ON "DevolucaoBalcao"("vendaTrocaId");

ALTER TABLE "DevolucaoBalcao" ADD CONSTRAINT "DevolucaoBalcao_vendaTrocaId_fkey" FOREIGN KEY ("vendaTrocaId") REFERENCES "VendaBalcao"("id") ON DELETE SET NULL ON UPDATE CASCADE;
