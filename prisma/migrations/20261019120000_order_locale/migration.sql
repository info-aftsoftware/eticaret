-- Sipariş anındaki site dili (tr | en): müşteri e-postaları bu dilde gönderilir.
-- Mevcut siparişler Türkçe kabul edilir.
ALTER TABLE "Order" ADD COLUMN "locale" TEXT NOT NULL DEFAULT 'tr';
