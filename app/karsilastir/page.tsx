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
    <ClassicPageShell breadcrumbs={[{ label: 'Ürün Karşılaştırma' }]} title="Ürün Karşılaştırma" description="Seçtiğiniz ürünlerin teknik özelliklerini yan yana inceleyin.">
      {products === null ? (
        <div className="py-16 text-center text-ink-muted">Yükleniyor…</div>
      ) : products.length === 0 ? (
        <div className="py-16 text-center space-y-3">
          <Package className="w-12 h-12 mx-auto text-slate-300" aria-hidden />
          <p className="text-ink-muted">Karşılaştırma listeniz boş. Ürün sayfalarındaki “Karşılaştır” düğmesiyle en fazla 4 ürün ekleyebilirsiniz.</p>
          <Button asChild><Link href="/products">Ürünlere Göz At</Link></Button>
        </div>
      ) : (
        <div className="space-y-3">
          {new Set(products.map((p) => p.category)).size > 1 && (
            <p className="text-sm text-amber-700">Farklı kategorilerden ürünler seçtiniz; özellikler tam karşılaştırılabilir olmayabilir.</p>
          )}
          <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={onlyDiff} onChange={(e) => setOnlyDiff(e.target.checked)} className="w-4 h-4" />
            Yalnızca farklı özellikleri göster
          </label>
          <div className="overflow-x-auto rounded-lg border border-palette bg-surface-elevated">
            <table className="w-full min-w-[640px] text-sm">
              <caption className="sr-only">Seçilen ürünlerin karşılaştırması</caption>
              <thead>
                <tr className="align-top">
                  <th scope="col" className="w-40 p-3 text-left text-ink-muted font-medium">Ürün</th>
                  {products.map((p) => (
                    <th key={p.id} scope="col" className="p-3 text-left font-normal">
                      <div className="relative space-y-2">
                        <button type="button" onClick={() => remove(p.id)} aria-label={`${p.name} ürününü karşılaştırmadan çıkar`} className="absolute -top-1 right-0 p-1 rounded hover:bg-slate-100">
                          <X className="w-4 h-4" />
                        </button>
                        <div className="relative w-24 h-24 bg-white rounded">
                          {p.image ? <Image src={p.image} alt="" fill sizes="96px" className="object-contain" /> : <Package className="w-10 h-10 m-7 text-slate-300" />}
                        </div>
                        <Link href={`/products/${p.slug ?? p.id}`} className="block font-semibold text-ink hover:text-brand pr-6">{p.name}</Link>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-palette">
                <tr>
                  <th scope="row" className="p-3 text-left text-ink-muted font-medium">Fiyat (KDV dahil)</th>
                  {products.map((p) => (
                    <td key={p.id} className="p-3">
                      {p.oldPrice && <span className="block text-xs text-slate-400 line-through">{price(p.oldPrice * (1 + VAT_RATE / 100))}</span>}
                      <span className="font-bold text-ink">{p.isVariantProduct ? 'Başlangıç ' : ''}{price(p.price * (1 + VAT_RATE / 100))}</span>
                    </td>
                  ))}
                </tr>
                <tr>
                  <th scope="row" className="p-3 text-left text-ink-muted font-medium">Marka</th>
                  {products.map((p) => <td key={p.id} className="p-3">{p.brand ?? '—'}</td>)}
                </tr>
                <tr>
                  <th scope="row" className="p-3 text-left text-ink-muted font-medium">Stok</th>
                  {products.map((p) => <td key={p.id} className="p-3">{(p.stock ?? 0) > 0 ? 'Stokta' : 'Tükendi'}</td>)}
                </tr>
                {products.some((p) => p.warranty) && (
                  <tr>
                    <th scope="row" className="p-3 text-left text-ink-muted font-medium">Garanti</th>
                    {products.map((p) => <td key={p.id} className="p-3">{p.warranty ?? '—'}</td>)}
                  </tr>
                )}
                {rows.map((k) => (
                  <tr key={k} className={isDiff(k) ? 'bg-amber-50/60' : ''}>
                    <th scope="row" className="p-3 text-left text-ink-muted font-medium">{k}</th>
                    {products.map((p) => <td key={p.id} className="p-3">{p.specifications?.[k] ?? '—'}</td>)}
                  </tr>
                ))}
                <tr>
                  <th scope="row" className="p-3" />
                  {products.map((p) => (
                    <td key={p.id} className="p-3">
                      {p.isVariantProduct ? (
                        <Button asChild size="sm" variant="outline"><Link href={`/products/${p.slug ?? p.id}`}>Seçenekleri Gör</Link></Button>
                      ) : (
                        <Button
                          size="sm"
                          disabled={(p.stock ?? 0) <= 0}
                          onClick={() => addItem({ id: p.id, productId: p.id, maxQuantity: p.stock, name: p.name, price: p.price, image: p.image, category: p.category })}
                        >
                          Sepete Ekle
                        </Button>
                      )}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
          {rows.length === 0 && onlyDiff && <p className="text-sm text-ink-muted">Seçilen ürünlerin teknik özellikleri aynı.</p>}
        </div>
      )}
    </ClassicPageShell>
  )
}
