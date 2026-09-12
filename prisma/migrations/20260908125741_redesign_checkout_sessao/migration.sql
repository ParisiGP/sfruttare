-- Remove abandoned test rows from the old CheckoutSessao shape
-- (status PENDENTE, pedidoId null, mpPreferenceId placeholder values
-- from before this feature's code was lost; confirmed harmless before deleting)
DELETE FROM "CheckoutSessao" WHERE "id" IN (
  'cmsypudqh00006kuy9ox2q1kx',
  'cmsypukgg00016kuyfzsewwer'
);

-- AlterTable
ALTER TABLE "CheckoutSessao" DROP COLUMN "freteNome",
DROP COLUMN "freteValor",
DROP COLUMN "itensSnapshot",
DROP COLUMN "subtotal",
DROP COLUMN "total",
ADD COLUMN     "frete" DECIMAL(10,2) NOT NULL;
