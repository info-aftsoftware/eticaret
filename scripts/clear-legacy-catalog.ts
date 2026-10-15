/**
 * Ürün kataloğu değiştiğinde (ör. ikas Excel import'u) veritabanındaki eski ürün kayıtlarını temizler.
 *
 *   npx tsx scripts/clear-legacy-catalog.ts          → yalnızca rapor (değişiklik yapmaz)
 *   npx tsx scripts/clear-legacy-catalog.ts --apply  → temizler
 *
 * Silinenler (katalogda artık olmayan ürünler için):
 *   - ProductOverride, StockOverride, StockAlert kayıtları
 *   - Eski Prisma Product/LegacyProduct tabloları (Variant, PriceRule, Review, ProductQuestion cascade ile);
 *     varyantına sipariş satırı bağlı ürünler sipariş geçmişi korunsun diye silinmez, pasife alınır
 *   - Eski sepet kalemleri (CartItem → eski Variant)
 * Kampanyalar (Discount): ürün listesi katalogdan arındırılır; boşalan veya kategorisi kalmayan kampanya pasife alınır.
 * Siparişler, kullanıcılar, kuponlar ve Firestore verilerine dokunulmaz.
 */

import { PrismaClient } from '@prisma/client'
import catalog from '../lib/catalog/products.json'
import { ALL_CATEGORY_VALUES } from '../lib/categories'

const prisma = new PrismaClient()
const apply = process.argv.includes('--apply')
const ids = new Set((catalog as { id: string }[]).map((p) => p.id))
const categories = new Set<string>(ALL_CATEGORY_VALUES)

async function main() {
  console.log(apply ? '== Temizlik uygulanıyor ==' : '== Kuru çalışma (değişiklik için --apply) ==')
  console.log(`Katalog: ${ids.size} ürün, ${categories.size} kategori`)

  const overrides = (await prisma.productOverride.findMany({ select: { productId: true } })).filter((o) => !ids.has(o.productId))
  const stockOverrides = (await prisma.stockOverride.findMany({ select: { productId: true } })).filter((o) => !ids.has(o.productId))
  const stockAlerts = (await prisma.stockAlert.findMany({ select: { id: true, productId: true } })).filter((a) => !ids.has(a.productId))
  console.log(`ProductOverride (eski): ${overrides.length}`)
  console.log(`StockOverride (eski): ${stockOverrides.length}`)
  console.log(`StockAlert (eski ürün): ${stockAlerts.length}`)

  const legacyProducts = await prisma.product.findMany({ select: { id: true, slug: true, variants: { select: { id: true } } } })
  const variantIds = legacyProducts.flatMap((p) => p.variants.map((v) => v.id))
  const orderedVariantIds = new Set(
    (await prisma.orderLine.findMany({ where: { variantId: { in: variantIds } }, select: { variantId: true } }))
      .map((l) => l.variantId)
      .filter(Boolean) as string[]
  )
  const keepProducts = legacyProducts.filter((p) => p.variants.some((v) => orderedVariantIds.has(v.id)))
  const deleteProducts = legacyProducts.filter((p) => !keepProducts.includes(p))
  const legacyRows = await prisma.legacyProduct.count()
  const cartItems = await prisma.cartItem.count({ where: { variantId: { in: variantIds } } })
  console.log(`Eski Product: ${legacyProducts.length} (silinecek ${deleteProducts.length}, siparişte geçtiği için pasife alınacak ${keepProducts.length})`)
  console.log(`LegacyProduct: ${legacyRows}, eski sepet kalemi: ${cartItems}`)

  const discounts = await prisma.discount.findMany()
  const discountUpdates: { id: string; name: string; productIds?: string[]; deactivate: boolean }[] = []
  for (const d of discounts) {
    if (d.scope === 'PRODUCT') {
      const list = Array.isArray(d.productIds) ? (d.productIds as unknown[]).map(String) : []
      const kept = list.filter((id) => ids.has(id))
      if (kept.length !== list.length) discountUpdates.push({ id: d.id, name: d.name, productIds: kept, deactivate: kept.length === 0 && d.active })
    } else if (d.scope === 'CATEGORY' && d.active && (!d.categoryName || !categories.has(d.categoryName))) {
      discountUpdates.push({ id: d.id, name: d.name, deactivate: true })
    }
  }
  for (const u of discountUpdates) {
    console.log(`Kampanya "${u.name}": ${u.productIds ? `ürün listesi → ${u.productIds.length}` : 'kategori artık yok'}${u.deactivate ? ', pasife alınacak' : ''}`)
  }

  if (!apply) return

  await prisma.$transaction(async (tx) => {
    await tx.productOverride.deleteMany({ where: { productId: { in: overrides.map((o) => o.productId) } } })
    await tx.stockOverride.deleteMany({ where: { productId: { in: stockOverrides.map((o) => o.productId) } } })
    await tx.stockAlert.deleteMany({ where: { id: { in: stockAlerts.map((a) => a.id) } } })
    await tx.cartItem.deleteMany({ where: { variantId: { in: variantIds } } })
    await tx.product.deleteMany({ where: { id: { in: deleteProducts.map((p) => p.id) } } })
    await tx.product.updateMany({ where: { id: { in: keepProducts.map((p) => p.id) } }, data: { active: false } })
    await tx.legacyProduct.deleteMany({})
    for (const u of discountUpdates) {
      await tx.discount.update({
        where: { id: u.id },
        data: {
          ...(u.productIds ? { productIds: u.productIds } : {}),
          ...(u.deactivate ? { active: false } : {}),
        },
      })
    }
  })
  console.log('Temizlik tamamlandı.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
