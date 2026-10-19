export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { checkAdmin } from '@/lib/adminAuth'
import { getMergedProducts } from '@/lib/catalog-merge'
import { grossPrice } from '@/lib/store-config'
import { csvResponseHeaders, toCsv } from '@/lib/csv'

/**
 * Katalog dökümü (Excel uyumlu CSV): stok ve fiyat bu dosyada düzenlenip Ürünler & Stok > İçe aktar ile geri yüklenebilir.
 * Fiyatlar TL; "Fiyat (KDV hariç)" düzenlenen sütundur, "Fiyat (KDV dahil)" bilgi amaçlıdır.
 */
export async function GET(request: NextRequest) {
  const auth = await checkAdmin(request)
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const products = await getMergedProducts()
  const rows = products
    .slice()
    .sort((a, b) => (a.category ?? '').localeCompare(b.category ?? '', 'tr') || a.name.localeCompare(b.name, 'tr'))
    .map((p) => [
      p.id,
      p.sku ?? '',
      p.name,
      p.brand ?? '',
      p.category ?? '',
      p.price,
      grossPrice(p.price),
      p.stock ?? '',
      p.desi ?? '',
      p.isVariantProduct ? `Evet (${p.variants?.length ?? 0})` : 'Hayır',
    ])
  const csv = toCsv(
    ['Ürün kodu', 'SKU', 'Ürün adı', 'Marka', 'Kategori', 'Fiyat (KDV hariç)', 'Fiyat (KDV dahil)', 'Stok', 'Desi', 'Varyantlı'],
    rows
  )
  const date = new Date().toISOString().slice(0, 10)
  return new NextResponse(csv, { headers: csvResponseHeaders(`voltekno-katalog-${date}.csv`) })
}
