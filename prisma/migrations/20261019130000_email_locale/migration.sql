-- Sipariş dışı müşteri e-postalarının dili (tr | en): talebin / sepetin site dili.
-- Mevcut kayıtlar Türkçe kabul edilir.
ALTER TABLE "StockAlert" ADD COLUMN "locale" TEXT NOT NULL DEFAULT 'tr';
ALTER TABLE "CartSnapshot" ADD COLUMN "locale" TEXT NOT NULL DEFAULT 'tr';
ALTER TABLE "StoreQuestion" ADD COLUMN "locale" TEXT NOT NULL DEFAULT 'tr';
