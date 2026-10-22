'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Bell, Heart, Package, ShoppingBag, Trash2 } from 'lucide-react'
import { fmtPrice } from '@/lib/format'
import { useCurrencyStore } from '@/lib/store/useCurrencyStore'
import { useExchangeRates } from '@/lib/useExchangeRates'
import { useFavorites } from '@/lib/useFavorites'
import { useToast } from '@/components/ui/toast'
import { AddToCartButton } from '@/components/AddToCartButton'
import { useL } from '@/lib/i18n-inline'
import { useLocale } from 'next-intl'
import { localizeProduct, toCatalogLocale } from '@/lib/catalog-en'

export type FavoriteProductSummary = {
  id: string
  slug: string | null
  name: string
  description?: string
  brand: string | null
  category: string
  price: number
  oldPrice: number | null
  discount: number | null
  campaign: string | null
  image: string | null
  stock: number | null
  variants: { key: string; label: string; price: number }[]
  defaultVariantKey: string | null
}

/** Favori listesindeki ürünlerin güncel katalog bilgisi (fiyat, kampanya, stok); yalnızca eksik id'ler istenir. */
function useFavoriteProducts(ids: string[]) {
  const [products, setProducts] = useState<Record<string, FavoriteProductSummary | null>>({})
  const [error, setError] = useState(false)
  const missingKey = ids.filter((id) => !(id in products)).join(',')

  useEffect(() => {
    if (!missingKey) return
    let cancelled = false
    setError(false)
    fetch(`/api/favorites?ids=${encodeURIComponent(missingKey)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data: { products: FavoriteProductSummary[]; missing: string[] }) => {
        if (cancelled) return
        setProducts((prev) => {
          const next = { ...prev }
          for (const p of data.products) next[p.id] = p
          for (const id of data.missing) next[id] = null
          // slug ile kaydedilmiş eski favoriler: istenen id'yi de eşle
          for (const id of missingKey.split(',')) if (!(id in next)) next[id] = data.products.find((p) => p.slug === id) ?? null
          return next
        })
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })
    return () => {
      cancelled = true
    }
  }, [missingKey])

  return { products, loading: !!missingKey && !error, error }
}

function VariantAddToCart({ product }: { product: FavoriteProductSummary }) {
  const initial = product.variants.find((v) => v.key === product.defaultVariantKey) ?? product.variants[0]
  const [key, setKey] = useState(initial?.key ?? '')
  const selected = product.variants.find((v) => v.key === key) ?? initial
  const currency = useCurrencyStore((s) => s.currency)
  const { rates } = useExchangeRates()
  const L = useL()
  return (
    <div className="space-y-2">
      <label className="sr-only" htmlFor={`fav-variant-${product.id}`}>
        {L('Seçenek', 'Option')}
      </label>
      <select
        id={`fav-variant-${product.id}`}
        value={key}
        onChange={(e) => setKey(e.target.value)}
        className="h-10 w-full rounded-lg border border-[#d3d9e1] bg-white px-2.5 text-sm text-[#20384e] focus:border-[#0b2540] focus:outline-none focus:ring-2 focus:ring-[#0b2540]/15"
      >
        {product.variants.map((v) => (
          <option key={v.key} value={v.key}>
            {v.label} — {fmtPrice(v.price, currency, rates?.rates ?? null)}
          </option>
        ))}
      </select>
      <AddToCartButton
        product={{ id: product.id, name: product.name, description: product.description, price: product.price, image: product.image ?? undefined, category: product.category }}
        selectedVariant={selected}
        stock={product.stock ?? undefined}
        className="h-10 w-full rounded-lg text-sm"
      />
    </div>
  )
}

function FavoriteCard({ id, product: rawProduct, onRemove }: { id: string; product: FavoriteProductSummary | null; onRemove: (id: string) => void }) {
  const locale = toCatalogLocale(useLocale())
  const product = rawProduct && localizeProduct(rawProduct, locale)
  const currency = useCurrencyStore((s) => s.currency)
  const { rates } = useExchangeRates()
  const formatPrice = (n: number) => fmtPrice(n, currency, rates?.rates ?? null)
  const L = useL()

  if (!product) {
    return (
      <div className="flex flex-col rounded-xl border border-dashed border-[#d3d9e1] bg-[#f5f7fa] p-4">
        <div className="flex aspect-[4/3] items-center justify-center rounded-lg bg-white">
          <Package className="h-10 w-10 text-slate-300" />
        </div>
        <p className="mt-3 text-sm font-semibold text-[#121926]">{L('Bu ürün artık satışta değil', 'This product is no longer available')}</p>
        <p className="mt-1 text-xs text-[#5d6e80]">{L('Benzer ürünlere göz atabilirsiniz.', 'You can browse similar products.')}</p>
        <div className="mt-auto flex gap-2 pt-3">
          <Link href={`/products/${id}`} className="inline-flex h-9 flex-1 items-center justify-center rounded-lg border border-[#d3d9e1] bg-white text-xs font-semibold text-[#0b2540] hover:border-[#0b2540]">
            {L('Benzerlerini gör', 'See similar')}
          </Link>
          <button type="button" onClick={() => onRemove(id)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#d3d9e1] bg-white text-[#5d6e80] hover:text-[#b42318]" aria-label={L('Favorilerden kaldır', 'Remove from favorites')}>
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    )
  }

  const href = `/products/${product.id}`
  const outOfStock = product.stock != null && product.stock <= 0
  const lowStock = product.stock != null && product.stock > 0 && product.stock <= 5
  const hasVariants = product.variants.length > 0

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border border-[#e6ebf1] bg-white transition-shadow hover:shadow-[0_8px_24px_rgba(11,37,64,0.08)]">
      <Link href={href} className="relative block aspect-[4/3] bg-white">
        {product.image ? (
          <Image src={product.image} alt={product.name} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw" className={`object-contain p-4 ${outOfStock ? 'opacity-60' : ''}`} />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center bg-[#f5f7fa]">
            <Package className="h-10 w-10 text-slate-300" />
          </span>
        )}
        {!!product.discount && !outOfStock && (
          <span className="absolute left-2 top-2 rounded-md bg-[#f5b400] px-1.5 py-0.5 text-[11px] font-bold text-[#111]">{L(`%${product.discount} İndirim`, `${product.discount}% Off`)}</span>
        )}
      </Link>
      <button
        type="button"
        onClick={() => onRemove(id)}
        className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#f5b400] bg-[#f5b400] text-[#111] shadow-sm transition-colors hover:bg-[#e0a500] touch-manipulation"
        aria-label={L(`${product.name} favorilerden kaldır`, `Remove ${product.name} from favorites`)}
        title={L('Favorilerden kaldır', 'Remove from favorites')}
      >
        <Heart className="h-4 w-4 fill-current" />
      </button>

      <div className="flex flex-1 flex-col border-t border-[#f1f4f8] p-3 sm:p-4">
        {product.brand && <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[#5d6e80]">{product.brand}</p>}
        <Link href={href} className="line-clamp-2 text-sm font-medium leading-snug text-[#121926] hover:text-[#0b2540] hover:underline">
          {product.name}
        </Link>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-2">
          <div>
            {product.oldPrice && product.oldPrice > product.price && (
              <span className="block text-xs text-[#5d6e80] line-through">{formatPrice(product.oldPrice)}</span>
            )}
            <span className={`text-base font-bold ${product.oldPrice ? 'text-[#b42318]' : 'text-[#121926]'}`}>
              {formatPrice(product.price)}
            </span>
            {product.variants.length > 1 && <span className="ml-1.5 text-[11px] text-[#5d6e80]">{L(`${product.variants.length} seçenek`, `${product.variants.length} options`)}</span>}
          </div>
          {outOfStock ? (
            <span className="rounded bg-[#f1f4f8] px-1.5 py-0.5 text-[11px] font-semibold text-[#5d6e80]">{L('Tükendi', 'Sold Out')}</span>
          ) : lowStock ? (
            <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[11px] font-semibold text-amber-700">{L(`Son ${product.stock} adet`, `Only ${product.stock} left`)}</span>
          ) : (
            <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[11px] font-semibold text-emerald-700">{L('Stokta', 'In stock')}</span>
          )}
        </div>
        {product.campaign && <p className="mt-1 text-[11px] text-[#5d6e80]">{product.campaign}</p>}

        <div className="mt-auto pt-3">
          {outOfStock ? (
            <Link href={href} className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-lg border border-[#d3d9e1] bg-[#f5f7fa] text-sm font-semibold text-[#20384e] hover:border-[#0b2540]">
              <Bell className="h-4 w-4" />
              {L('Gelince haber ver', 'Notify me when available')}
            </Link>
          ) : hasVariants ? (
            <VariantAddToCart product={product} />
          ) : (
            <AddToCartButton
              product={{ id: product.id, name: product.name, description: product.description, price: product.price, image: product.image ?? undefined, category: product.category }}
              stock={product.stock ?? undefined}
              className="h-10 w-full rounded-lg text-sm"
            />
          )}
        </div>
      </div>
    </div>
  )
}

/** Favori ürünler ızgarası — favoriler sayfası ve profil "Favorilerim" sekmesi kullanır. */
export function FavoritesGrid({ compact = false }: { compact?: boolean }) {
  const { ids, ready, remove, isMember } = useFavorites()
  const { addToast } = useToast()
  const L = useL()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const { products, loading, error } = useFavoriteProducts(ids)
  const list = useMemo(() => ids.filter((id) => id in products), [ids, products])

  const handleRemove = async (id: string) => {
    try {
      await remove(id)
      addToast({ type: 'success', title: L('Favorilerden kaldırıldı', 'Removed from favorites'), description: products[id]?.name ?? '' })
    } catch {
      addToast({ type: 'error', title: L('Kaldırılamadı', 'Could not remove'), description: L('Lütfen tekrar deneyin.', 'Please try again.') })
    }
  }

  const grid = compact ? 'grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3' : 'grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 sm:gap-5'

  // Favoriler üyelere özel: misafire liste yerine giriş / üye ol seçenekleri
  if (mounted && ready && !isMember) {
    return (
      <div className="flex flex-col items-center rounded-xl border border-[#e6ebf1] bg-white px-6 py-14 text-center">
        <h2 className="text-lg font-semibold text-[#121926]">{L('Favorilerinizi görmek için giriş yapın', 'Sign in to see your favorites')}</h2>
        <p className="mt-2 max-w-sm text-sm text-[#5d6e80]">
          {L('Beğendiğiniz ürünleri hesabınıza kaydedin; fiyatını ve stok durumunu tüm cihazlarınızdan takip edin.', 'Save the products you like to your account and track their price and stock from any device.')}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/login?redirect=/favorites" className="inline-flex h-11 items-center rounded-lg bg-[#0b2540] px-5 text-sm font-semibold text-white hover:bg-[#12335a]">
            {L('Giriş yap', 'Sign in')}
          </Link>
          <Link href="/register?redirect=/favorites" className="inline-flex h-11 items-center rounded-lg border border-[#d3d9e1] bg-white px-5 text-sm font-semibold text-[#0b2540] hover:border-[#0b2540]">
            {L('Üye ol', 'Create account')}
          </Link>
        </div>
      </div>
    )
  }

  if (!mounted || !ready || (loading && list.length === 0)) {
    return (
      <div className={grid} aria-busy="true" aria-label={L('Favoriler yükleniyor', 'Loading favorites')}>
        {Array.from({ length: compact ? 3 : 4 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-xl border border-[#e6ebf1] bg-white">
            <div className="aspect-[4/3] animate-pulse bg-[#f1f4f8]" />
            <div className="space-y-2 p-4">
              <div className="h-3 w-1/3 animate-pulse rounded bg-[#f1f4f8]" />
              <div className="h-4 w-4/5 animate-pulse rounded bg-[#f1f4f8]" />
              <div className="h-10 animate-pulse rounded-lg bg-[#f1f4f8]" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (ids.length === 0) {
    return (
      <div>
        <div className="flex flex-col items-center rounded-xl border border-[#e6ebf1] bg-white px-6 py-14 text-center">
          <h2 className="text-lg font-semibold text-[#121926]">{L('Henüz favori ürününüz yok', 'You have no favorite products yet')}</h2>
          <p className="mt-2 max-w-sm text-sm text-[#5d6e80]">
            {L('Beğendiğiniz ürünlerdeki kalp simgesine dokunun; fiyatını ve stok durumunu buradan takip edin.', 'Tap the heart icon on products you like and track their price and stock status here.')}
          </p>
          <Link href="/products" className="mt-6 inline-flex h-11 items-center gap-2 rounded-lg bg-[#0b2540] px-5 text-sm font-semibold text-white hover:bg-[#12335a]">
            <ShoppingBag className="h-4 w-4" />
            {L('Ürünleri keşfet', 'Explore products')}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div>
      {error && list.length < ids.length && (
        <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {L('Bazı ürün bilgileri yüklenemedi. Sayfayı yenileyip tekrar deneyin.', 'Some product details could not be loaded. Please refresh the page and try again.')}
        </p>
      )}
      <div className={grid}>
        {list.map((id) => (
          <FavoriteCard key={id} id={id} product={products[id]} onRemove={handleRemove} />
        ))}
      </div>
    </div>
  )
}
