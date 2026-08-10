-- CreateTable
CREATE TABLE "VitrineAba" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VitrineAba_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VitrineAbaProduto" (
    "id" TEXT NOT NULL,
    "abaId" TEXT NOT NULL,
    "produtoId" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VitrineAbaProduto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VitrineAba_slug_key" ON "VitrineAba"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "VitrineAbaProduto_abaId_produtoId_key" ON "VitrineAbaProduto"("abaId", "produtoId");

-- AddForeignKey
ALTER TABLE "VitrineAbaProduto" ADD CONSTRAINT "VitrineAbaProduto_abaId_fkey" FOREIGN KEY ("abaId") REFERENCES "VitrineAba"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VitrineAbaProduto" ADD CONSTRAINT "VitrineAbaProduto_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "Produto"("id") ON DELETE CASCADE ON UPDATE CASCADE;
