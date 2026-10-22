'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { X, Package } from 'lucide-react'
import { ClassicPageShell } from '@/components/ClassicPageShell'
import { Button } from '@/components/ui/button'
import { useCompareStore } from '@/lib/store/useCompareStore'
import { useCartStore } from '@/lib/store/useCartStore'
import { useCurrencyStore } from '@/lib/store/useCurrencyStore'
import { useExchangeRates } from '@/lib/useExchangeRates'
import { fmtPrice } from '@/lib/format'
import { VAT_RATE } from '@/lib/store-config'
import { useL } from '@/lib/i18n-inline'
import { isContactOnlyProduct } from '@/lib/shipping/battery'
import { useLocale } from 'next-intl'
import { productName, specKeyLabel, specValueLabel, toCatalogLocale } from '@/lib/catalog-en'

type P = {
  id: string
  slug?: string
  name: string
  brand?: string
  category?: string
  price: number
  oldPrice?: number
  stock?: number
  image?: string
  warranty?: string
  isVariantProduct?: boolean
  variants?: { key: string; label: string; price: number }[]
  specifications?: Record<string, string>
}

/** Ürün karşılaştırma: seçilen ürünlerin teknik özellikleri yan yana (farklı değerler vurgulanır). */
export default function ComparePage() {
  const L = useL()
  const catalogLocale = toCatalogLocale(useLocale())
  const ids = useCompareStore((s) => s.ids)
  const remove = useCompareStore((s) => s.remove)
  const addItem = useCartStore((s) => s.addItem)
  const currency = useCurrencyStore((s) => s.currency)
  const { rates } = useExchangeRates()
  const price = (n: number) => fmtPrice(n, currency, rates?.rates ?? null)
  const [products, setProducts] = useState<P[] | null>(null)
  const [onlyDiff, setOnlyDiff] = useState(false)

  useEffect(() => {
    if (ids.length === 0) {
      setProducts([])
      return
    }
    fetch('/api/products')
      .then((r) => (r.ok ? r.json() : []))
      .then((all: P[]) => {
        // Katalogdan kaldırılmış ürünler karşılaştırma listesinden de çıkarılır (yer kaplamasın)
        if (Array.isArray(all) && all.length > 0) ids.filter((id) => !all.some((p) => p.id === id)).forEach(remove)
        setProducts(ids.map((id) => all.find((p) => p.id === id)).filter(Boolean) as P[])
      })
      .catch(() => setProducts([]))
  }, [ids])

  const specKeys = useMemo(() => {
    const keys: string[] = []
    for (const p of products ?? []) for (const k of Object.keys(p.specifications ?? {})) if (!keys.includes(k)) keys.push(k)
    return keys
  }, [products])

  const isDiff = (k: string) => new Set((products ?? []).map((p) => (p.specifications?.[k] ?? '—').trim())).size > 1
  const rows = onlyDiff ? specKeys.filter(isDiff) : specKeys

  return (
    <ClassicPageShell breadcrumbs={[{ label: L('Ürün Karşılaştırma', 'Product Comparison') }]} title={L('Ürün Karşılaştırma', 'Product Comparison')} description={L('Seçtiğiniz ürünlerin teknik özelliklerini yan yana inceleyin.', 'Compare the technical specifications of your selected products side by side.')}>
      {products === null ? (
        <div className="py-16 text-center text-ink-muted">{L('Yükleniyor…', 'Loading…')}</div>
      ) : products.length === 0 ? (
        <div className="py-16 text-center space-y-3">
          <Package className="w-12 h-12 mx-auto text-slate-300" aria-hidden />
          <p className="text-ink-muted">{L('Karşılaştırma listeniz boş. Ürün sayfalarındaki “Karşılaştır” düğmesiyle en fazla 4 ürün ekleyebilirsiniz.', 'Your comparison list is empty. You can add up to 4 products using the “Compare” button on product pages.')}</p>
          <Button asChild><Link href="/products">{L('Ürünlere Göz At', 'Browse Products')}</Link></Button>
        </div>
      ) : (
        <div className="space-y-3">
          {new Set(products.map((p) => p.category)).size > 1 && (
            <p className="text-sm text-amber-700">{L('Farklı kategorilerden ürünler seçtiniz; özellikler tam karşılaştırılabilir olmayabilir.', 'You have selected products from different categories; specifications may not be fully comparable.')}</p>
          )}
          <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={onlyDiff} onChange={(e) => setOnlyDiff(e.target.checked)} className="w-4 h-4" />
            {L('Yalnızca farklı özellikleri göster', 'Show only differing specifications')}
          </label>
          <div className="overflow-x-auto rounded-lg border border-palette bg-surface-elevated">
            <table className="w-full min-w-[640px] text-sm">
              <caption className="sr-only">{L('Seçilen ürünlerin karşılaştırması', 'Comparison of selected products')}</caption>
              <thead>
                <tr className="align-top">
                  <th scope="col" className="w-40 p-3 text-left text-ink-muted font-medium">{L('Ürün', 'Product')}</th>
                  {products.map((p) => (
                    <th key={p.id} scope="col" className="p-3 text-left font-normal">
                      <div className="relative space-y-2">
                        <button type="button" onClick={() => remove(p.id)} aria-label={L(`${p.name} ürününü karşılaştırmadan çıkar`, `Remove ${productName(p, catalogLocale)} from comparison`)} className="absolute -top-1 right-0 p-1 rounded hover:bg-slate-100">
                          <X className="w-4 h-4" />
                        </button>
                        <div className="relative w-24 h-24 bg-white rounded">
                          {p.image ? <Image src={p.image} alt="" fill sizes="96px" className="object-contain" /> : <Package className="w-10 h-10 m-7 text-slate-300" />}
                        </div>
                        <Link href={`/products/${p.slug ?? p.id}`} className="block font-semibold text-ink hover:text-brand pr-6">{productName(p, catalogLocale)}</Link>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-palette">
                <tr>
                  <th scope="row" className="p-3 text-left text-ink-muted font-medium">{L('Fiyat (KDV dahil)', 'Price (incl. VAT)')}</th>
                  {products.map((p) => (
                    <td key={p.id} className="p-3">
                      {p.oldPrice && <span className="block text-xs text-slate-400 line-through">{price(p.oldPrice * (1 + VAT_RATE / 100))}</span>}
                      <span className="font-bold text-ink">{p.isVariantProduct ? L('Başlangıç ', 'From ') : ''}{price(p.price * (1 + VAT_RATE / 100))}</span>
                    </td>
                  ))}
                </tr>
                <tr>
                  <th scope="row" className="p-3 text-left text-ink-muted font-medium">{L('Marka', 'Brand')}</th>
                  {products.map((p) => <td key={p.id} className="p-3">{p.brand ?? '—'}</td>)}
                </tr>
                <tr>
                  <th scope="row" className="p-3 text-left text-ink-muted font-medium">{L('Stok', 'Stock')}</th>
                  {products.map((p) => <td key={p.id} className="p-3">{(p.stock ?? 0) > 0 ? L('Stokta', 'In stock') : L('Tükendi', 'Out of stock')}</td>)}
                </tr>
                {products.some((p) => p.warranty) && (
                  <tr>
                    <th scope="row" className="p-3 text-left text-ink-muted font-medium">{L('Garanti', 'Warranty')}</th>
                    {products.map((p) => <td key={p.id} className="p-3">{p.warranty ?? '—'}</td>)}
                  </tr>
                )}
                {rows.map((k) => (
                  <tr key={k} className={isDiff(k) ? 'bg-amber-50/60' : ''}>
                    <th scope="row" className="p-3 text-left text-ink-muted font-medium">{specKeyLabel(k, catalogLocale)}</th>
                    {products.map((p) => <td key={p.id} className="p-3">{p.specifications?.[k] != null ? specValueLabel(p.specifications[k], catalogLocale) : '—'}</td>)}
                  </tr>
                ))}
                <tr>
                  <th scope="row" className="p-3" />
                  {products.map((p) => (
                    <td key={p.id} className="p-3">
                      {isContactOnlyProduct(p) ? (
                        <Button asChild size="sm" variant="outline"><Link href={`/products/${p.slug ?? p.id}`}>{L('İletişime geç', 'Contact us')}</Link></Button>
                      ) : p.isVariantProduct ? (
                        <Button asChild size="sm" variant="outline"><Link href={`/products/${p.slug ?? p.id}`}>{L('Seçenekleri Gör', 'View Options')}</Link></Button>
                      ) : (
                        <Button
                          size="sm"
                          disabled={(p.stock ?? 0) <= 0}
                          onClick={() => addItem({ id: p.id, productId: p.id, maxQuantity: p.stock, name: p.name, price: p.price, image: p.image, category: p.category })}
                        >
                          {L('Sepete Ekle', 'Add to Cart')}
                        </Button>
                      )}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
          {rows.length === 0 && onlyDiff && <p className="text-sm text-ink-muted">{L('Seçilen ürünlerin teknik özellikleri aynı.', 'The selected products have identical specifications.')}</p>}
        </div>
      )}
    </ClassicPageShell>
  )
}
