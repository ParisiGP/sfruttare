-- Aditivo: tabela nova PagamentoBalcao (pagamento dividido no Balcao).
-- Nenhuma coluna/linha existente e alterada; vendas antigas nao ganham
-- linhas aqui (a leitura trata "sem linhas" como pagamento unico).
CREATE TABLE "PagamentoBalcao" (
    "id" TEXT NOT NULL,
    "vendaBalcaoId" TEXT NOT NULL,
    "forma" TEXT NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "parcelas" INTEGER NOT NULL DEFAULT 1,
    "valorComJuros" DECIMAL(10,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PagamentoBalcao_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "PagamentoBalcao" ADD CONSTRAINT "PagamentoBalcao_vendaBalcaoId_fkey" FOREIGN KEY ("vendaBalcaoId") REFERENCES "VendaBalcao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
