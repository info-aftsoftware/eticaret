/**
 * E2E fiyat testleri için sabit fiyatlı test ürünü.
 * Katalog fiyatları döviz kuruna bağlı olduğundan (lib/fx-rates) testler, yalnızca ProductOverride'da bulunan
 * TL fiyatlı bir ürün kullanır: 450 TL (KDV hariç), "10w" varyantı. Testler bitince kayıt silinir.
 */

import { PrismaClient } from '@prisma/client'

export const E2E_PRODUCT_ID = 'e2e-test-urunu'

export async function createE2EProduct() {
  const prisma = new PrismaClient()
  try {
    const data = {
      name: 'E2E Test Ürünü',
      description: 'Otomatik testler için geçici ürün',
      price: 450,
      stock: 100,
      category: 'Panel',
      brand: 'TommaTech',
      sku: 'E2E-TEST-10W',
      // Merchant akışı görselsiz ürünü almaz; katalogdaki bir panel görseli kullanılır
      image: '/images/products/voltekno/1SfPNowoPDRUrusBcQf2n8JRxFaOjxZbe.jpg',
      variants: [{ key: '10w', label: '10W', price: 450, sku: 'E2E-TEST-10W' }],
    }
    await prisma.productOverride.upsert({ where: { productId: E2E_PRODUCT_ID }, create: { productId: E2E_PRODUCT_ID, ...data }, update: data })
  } finally {
    await prisma.$disconnect()
  }
}

export async function removeE2EProduct() {
  const prisma = new PrismaClient()
  try {
    await prisma.productOverride.deleteMany({ where: { productId: E2E_PRODUCT_ID } })
    await prisma.stockAlert.deleteMany({ where: { productId: E2E_PRODUCT_ID } })
  } finally {
    await prisma.$disconnect()
  }
}

export default createE2EProduct
