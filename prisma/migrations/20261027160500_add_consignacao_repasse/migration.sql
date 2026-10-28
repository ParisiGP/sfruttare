-- Aditivo: 4 colunas novas e opcionais em "Produto" (consignacao e repasse).
-- Nenhum valor existente e alterado e nenhuma linha e apagada.
ALTER TABLE "Produto" ADD COLUMN "consignante" TEXT;
ALTER TABLE "Produto" ADD COLUMN "percentualRepasse" DECIMAL(5,2);
ALTER TABLE "Produto" ADD COLUMN "repassadoEm" TIMESTAMP(3);
ALTER TABLE "Produto" ADD COLUMN "valorRepassado" DECIMAL(10,2);

-- Unico preenchimento retroativo: so escreve na coluna nova "consignante"
-- (idempotente: so toca linhas CS que ainda estao com ela nula).
UPDATE "Produto"
SET "consignante" = (regexp_match(upper("referencia"), '^CS[A-Z&]*'))[1]
WHERE "referencia" ILIKE 'CS%' AND "consignante" IS NULL;
