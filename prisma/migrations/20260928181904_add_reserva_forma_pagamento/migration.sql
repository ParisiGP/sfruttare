-- Aditivo: colunas novas opcionais em Pedido/VendaBalcao (vendas ja
-- gravadas ficam com NULL) + tabela nova Reserva. Nada existente e alterado.
ALTER TABLE "Pedido" ADD COLUMN     "formaPagamento" TEXT;

ALTER TABLE "VendaBalcao" ADD COLUMN     "formaPagamento" TEXT;

CREATE TABLE "Reserva" (
    "id" TEXT NOT NULL,
    "produtoId" TEXT NOT NULL,
    "nomeCliente" TEXT NOT NULL,
    "telefoneCliente" TEXT,
    "canal" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ATIVA',
    "vendaBalcaoId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reserva_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Reserva" ADD CONSTRAINT "Reserva_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "Produto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Reserva" ADD CONSTRAINT "Reserva_vendaBalcaoId_fkey" FOREIGN KEY ("vendaBalcaoId") REFERENCES "VendaBalcao"("id") ON DELETE SET NULL ON UPDATE CASCADE;
