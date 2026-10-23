/**
 * Sipariş stoğu: tüm kalemler tek transaction içinde, koşullu olarak düşülür (ya hepsi ya hiçbiri).
 * Stok kaynağı StockOverride satırıdır; katalog ürünü için satır yoksa ProductOverride / katalog stoğundan tohumlanır.
 * Anahtar stok anahtarıdır (lib/variant-stock): varyantlar ayrı stoklanmıyorsa ürün id'si (adetler ürün bazında toplanır),
 * ayrı stoklanıyorsa "productId::variantKey" (her varyant kendi stoğundan düşer).
 */

import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { getBaseStock } from '@/lib/catalog-merge'

export class InsufficientStockError extends Error {
  constructor(
    public readonly productId: string,
    public readonly productName: string,
    public readonly available: number
  ) {
    super(
      available > 0
        ? `"${productName}" için stokta yalnızca ${available} adet kaldı. Lütfen sepetinizi güncelleyin.`
        : `"${productName}" tükendi. Lütfen sepetinizden çıkarın.`
    )
    this.name = 'InsufficientStockError'
  }
}

/** productId alanı stok anahtarıdır: ürün id'si veya "productId::variantKey" */
export type StockLine = { productId: string; productName: string; quantity: number }

function isUniqueViolation(e: unknown): boolean {
  return e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002'
}

/**
 * Stoğu düşer; stoğu gerçekten düşülen ürün id'lerini döner (stok takibi olmayan ürünler dahil edilmez).
 * Stok yetmezse InsufficientStockError fırlatır ve hiçbir ürünün stoğu değişmez.
 */
export async function reserveStock(lines: StockLine[]): Promise<Set<string>> {
  const totals = new Map<string, { qty: number; name: string }>()
  for (const l of lines) {
    const t = totals.get(l.productId)
    totals.set(l.productId, { qty: (t?.qty ?? 0) + l.quantity, name: t?.name ?? l.productName })
  }

  // Aynı anda iki sipariş aynı ürünün satırını oluşturmaya çalışırsa (P2002) yeniden denenir
  for (let attempt = 0; ; attempt++) {
    try {
      return await prisma.$transaction(async (tx) => {
        const done = new Set<string>()
        for (const [productId, { qty, name }] of totals) {
          const res = await tx.stockOverride.updateMany({
            where: { productId, stock: { gte: qty } },
            data: { stock: { decrement: qty } },
          })
          if (res.count > 0) {
            done.add(productId)
            continue
          }
          const row = await tx.stockOverride.findUnique({ where: { productId }, select: { stock: true } })
          if (row) throw new InsufficientStockError(productId, name, Math.max(0, row.stock))
          const base = await getBaseStock(productId, tx)
          if (base == null) continue
          if (base < qty) throw new InsufficientStockError(productId, name, Math.max(0, base))
          await tx.stockOverride.create({ data: { productId, stock: base - qty } })
          done.add(productId)
        }
        return done
      })
    } catch (e) {
      if (isUniqueViolation(e) && attempt < 2) continue
      throw e
    }
  }
}
