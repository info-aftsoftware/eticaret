'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronRight, Heart, Minus, Package, Plus, ShoppingCart } from 'lucide-react'
import { fmtPrice } from '@/lib/format'
import { useCurrencyStore } from '@/lib/store/useCurrencyStore'
import { useExchangeRates } from '@/lib/useExchangeRates'
import type { ProductVariant } from '@/components/AddToCartButton'
import { useCartStore } from '@/lib/store/useCartStore'
import { useToast } from '@/components/ui/toast'
import { useRouter } from 'next/navigation'
import { favoriteLoginHref, useFavorites } from '@/lib/useFavorites'
import { useL } from '@/lib/i18n-inline'
import { isContactOnlyProduct } from '@/lib/shipping/battery'
import { isQuoteOnly } from '@/lib/sale-mode'
import { grossPrice } from '@/lib/store-config'
import { useTranslations } from 'next-intl'

export interface ProductCardProduct {
  id: string
  name: string
  description?: string
  price: number
  image?: string
  category?: string
  brand?: string
  /** Bazı listeler ürünü olduğu gibi verir; prop verilmezse bu alanlar kullanılır */
  stock?: number
  isVariantProduct?: boolean
  variants?: unknown[]
  /** 'quote': fiyat yok, teklif alınır · 'install': kurulum ve nakliye ayrıca (lib/sale-mode.ts) */
  saleMode?: string
}

export interface ProductCardProps {
  product: ProductCardProduct
  oldPrice?: number
  discount?: number
  badges?: string[]
  sku?: string
  rating?: number
  stock?: number
  isVariantProduct?: boolean
  selectedVariant?: ProductVariant
  variant?: 'compact' | 'full'
  /** İlk ekrandaki kartlar: görsel gecikmeli (lazy) değil, öncelikli yüklenir (LCP) */
  priority?: boolean
  className?: string
}

export function ProductCard({
  product,
  selectedVariant,
  variant = 'full',
  priority = false,
  className = '',
  stock: stockProp,
  isVariantProduct,
  oldPrice,
  discount,
}: ProductCardProps) {
  const currency = useCurrencyStore((s) => s.currency)
  const { rates } = useExchangeRates()
  const addItem = useCartStore((s) => s.addItem)
  const updateQuantity = useCartStore((s) => s.updateQuantity)
  const { addToast } = useToast()
  const L = useL()
  const tCart = useTranslations('addToCart')
  const showStockLimit = () =>
    addToast({ type: 'info', title: tCart('stockLimit'), description: tCart('stockLimitDesc', { maxQty: stock ?? 0 }) })
  const { isFavorite, toggle, isMember, authReady } = useFavorites()
  const router = useRouter()
  const isCompact = variant === 'compact'
  const [imageError, setImageError] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setImageError(false)
  }, [product.id, product.image])

  useEffect(() => {
    setMounted(true)
  }, [])

  const stock = stockProp ?? product.stock
  const hasVariants = !selectedVariant && Boolean(isVariantProduct ?? product.isVariantProduct ?? (product.variants?.length ?? 0) > 0)
  const variantCount = product.variants?.length ?? 0
  const outOfStock = typeof stock === 'number' && stock <= 0
  // Akü / batarya: sepete eklenmez, ürün sayfasındaki iletişim kutusuna gider (lib/shipping/battery.ts)
  const contactOnly = isContactOnlyProduct(product)
  // Teklifle satılan ürün ve fiyatı olmayan ürün: fiyat yerine "Fiyat için teklif alın" (hiçbir listede ₺0 görünmesin)
  const quoteOnly = isQuoteOnly(product) || !(product.price > 0)
  const lowStock = typeof stock === 'number' && stock > 0 && stock <= 5

  const cartId = selectedVariant ? `${product.id}-${selectedVariant.key}` : product.id
  const displayName = selectedVariant ? `${product.name} (${selectedVariant.label})` : product.name
  const quantity = useCartStore((s) => (mounted ? s.items.find((i) => i.id === cartId)?.quantity ?? 0 : 0))
  const productQty = useCartStore((s) =>
    mounted ? s.items.filter((i) => (i.productId ?? i.id) === product.id || i.id === cartId).reduce((n, i) => n + i.quantity, 0) : 0
  )
  const isInCart = quantity > 0
  const atMax = typeof stock === 'number' && productQty >= stock
  const favorited = mounted && isFavorite(product.id)
  const href = `/products/${product.id}`

  const stop = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleAddToCart = (e: React.MouseEvent) => {
    stop(e)
    if (outOfStock || hasVariants) return
    const price = selectedVariant ? selectedVariant.price : product.price
    const added = addItem({
      id: cartId,
      productId: product.id,
      maxQuantity: typeof stock === 'number' ? stock : undefined,
      name: displayName,
      description: product.description,
      price,
      image: product.image,
      category: product.category,
    })
    if (added > 0) addToast({ type: 'success', title: tCart('addedToCart'), description: displayName, action: { label: L('Sepete git', 'Go to cart'), href: '/cart' } })
    else showStockLimit()
  }

  const handleIncrease = (e: React.MouseEvent) => {
    stop(e)
    if (atMax) {
      showStockLimit()
      return
    }
    updateQuantity(cartId, quantity + 1)
  }

  const handleDecrease = (e: React.MouseEvent) => {
    stop(e)
    updateQuantity(cartId, quantity - 1)
  }

  const handleFavorite = async (e: React.MouseEvent) => {
    stop(e)
    if (!authReady) return
    // Favoriler üyelere özel: misafir giriş/kayıt sayfasına gider, ürün girişten sonra eklenir
    if (!isMember) {
      router.push(favoriteLoginHref(product.id))
      return
    }
    try {
      const added = await toggle(product.id)
      addToast({
        type: 'success',
        variant: 'snackbar',
        title: added ? L('Favorilere eklendi', 'Added to favorites') : L('Favorilerden çıkarıldı', 'Removed from favorites'),
        action: added ? { label: L('Favorilere git', 'View favorites'), href: '/favorites' } : undefined,
        duration: 4000,
      })
    } catch {
      addToast({ type: 'error', title: L('Favori kaydedilemedi', 'Could not save favorite'), description: L('Lütfen tekrar deneyin.', 'Please try again.') })
    }
  }

  const hasRealImage = Boolean(product.image && !imageError && !product.image.includes('placeholder'))
  const displayPrice = selectedVariant ? selectedVariant.price : product.price
  const formatPrice = (amount: number) => fmtPrice(amount, currency, rates?.rates ?? null)
  const showOldPrice = !selectedVariant && !!oldPrice && oldPrice > displayPrice

  const btnBase = `inline-flex w-full items-center justify-center gap-1.5 rounded-lg font-semibold transition-colors touch-manipulation ${
    isCompact ? 'h-9 text-xs' : 'h-10 text-xs sm:text-sm'
  }`
  const icon = isCompact ? 'w-3.5 h-3.5' : 'w-4 h-4'

  return (
    <div
      className={`group relative flex h-full flex-col overflow-hidden rounded-xl border border-[#e6ebf1] bg-white transition-all duration-200 hover:border-[#d3d9e1] hover:shadow-[0_8px_24px_rgba(11,37,64,0.08)] ${className}`}
    >
      <Link href={href} className="flex flex-1 flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b2540]/30 rounded-t-xl">
        {/* Görsel — sabit oran */}
        <div className="relative aspect-square overflow-hidden bg-white">
          <div className={`absolute inset-0 flex items-center justify-center ${hasRealImage ? 'bg-white' : 'bg-[#f5f7fa]'}`}>
            {hasRealImage ? (
              <Image
                src={product.image!}
                alt={product.name}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                priority={priority}
                className={`object-contain p-3 transition-transform duration-300 group-hover:scale-[1.04] ${outOfStock ? 'opacity-60' : ''}`}
                onError={() => setImageError(true)}
              />
            ) : (
              <Package className="w-14 h-14 text-slate-300" />
            )}
          </div>

          <div className="absolute left-2 top-2 z-10 flex flex-col items-start gap-1">
            {!!discount && discount > 0 && !outOfStock && (
              <span className="rounded-md bg-[#f5b400] px-1.5 py-0.5 text-[11px] font-bold text-[#111]">{L(`%${discount} İndirim`, `${discount}% Off`)}</span>
            )}
            {outOfStock && (
              <span className="rounded-md bg-[#121926]/80 px-1.5 py-0.5 text-[11px] font-semibold text-white">{L('Tükendi', 'Sold Out')}</span>
            )}
          </div>
        </div>

        {/* Bilgi alanı */}
        <div className={`flex flex-1 flex-col border-t border-[#f1f4f8] ${isCompact ? 'p-2.5 sm:p-3' : 'p-3'}`}>
          {product.brand && (
            <p className={`mb-1 font-semibold uppercase tracking-wide text-[#5d6e80] ${isCompact ? 'text-[10px]' : 'text-[10px] sm:text-[11px]'}`}>
              {product.brand}
            </p>
          )}
          <h3 className={`line-clamp-2 font-medium leading-snug text-[#121926] ${isCompact ? 'text-xs' : 'text-xs sm:text-sm'}`}>
            {product.name}
          </h3>
          <div className="mt-auto flex items-end justify-between gap-2 pt-2">
            {quoteOnly ? (
              <p className={`font-semibold leading-tight text-[#0b2540] ${isCompact ? 'text-xs' : 'text-xs sm:text-sm'}`}>
                {L('Fiyat için teklif alın', 'Request a quote')}
              </p>
            ) : (
              <p className={`font-bold leading-tight text-[#121926] ${isCompact ? 'text-sm' : 'text-sm sm:text-base'}`}>
                {showOldPrice && (
                  <span className="block text-[11px] font-normal text-[#5d6e80] line-through">{formatPrice(grossPrice(oldPrice!))}</span>
                )}
                {/* Ana fiyat KDV dahil: ürün sayfası ve sepetle aynı tutar */}
                <span className={showOldPrice ? 'text-[#b42318]' : ''}>{formatPrice(grossPrice(displayPrice))}</span>
                <span className="block text-[10px] font-normal text-[#5d6e80]">{L('KDV dahil', 'incl. VAT')}</span>
              </p>
            )}
            {quoteOnly ? null : hasVariants && variantCount > 1 ? (
              <span className="shrink-0 rounded bg-[#f1f4f8] px-1.5 py-0.5 text-[10px] font-semibold text-[#20384e]">{L(`${variantCount} seçenek`, `${variantCount} options`)}</span>
            ) : lowStock ? (
              <span className="shrink-0 rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">{L(`Son ${stock} adet`, `Only ${stock} left`)}</span>
            ) : null}
          </div>
        </div>
      </Link>

      {/* Favori — dokunmatikte her zaman görünür */}
      <button
        type="button"
        onClick={handleFavorite}
        aria-label={favorited ? L('Favorilerden çıkar', 'Remove from favorites') : L('Favorilere ekle', 'Add to favorites')}
        aria-pressed={favorited}
        className={`absolute right-2 top-2 z-10 flex h-9 w-9 !min-h-0 !min-w-0 items-center justify-center rounded-full border shadow-sm transition-colors touch-manipulation ${
          favorited
            ? 'border-[#f5b400] bg-[#f5b400] text-[#111]'
            : 'border-[#e6ebf1] bg-white/95 text-[#5d6e80] hover:border-[#0b2540] hover:text-[#0b2540]'
        }`}
      >
        <Heart className={`h-4 w-4 ${favorited ? 'fill-current' : ''}`} />
      </button>

      {/* Sepet aksiyonu — her cihazda görünür; masaüstünde kart üzerine gelince vurgulanır */}
      <div className={isCompact ? 'px-2.5 pb-2.5 sm:px-3 sm:pb-3' : 'px-3 pb-3'}>
        {contactOnly ? (
          <Link
            href={href}
            className={`${btnBase} border border-[#d3d9e1] bg-white text-[#0b2540] hover:border-[#0b2540] hover:bg-[#0b2540] hover:text-white [@media(hover:hover)]:group-hover:border-[#0b2540]`}
            aria-label={
              quoteOnly
                ? L(`${product.name}: fiyat için teklif alın`, `${product.name}: request a quote`)
                : L(`${product.name}: kargo dahil fiyat için teklif alın`, `${product.name}: request a quote including shipping`)
            }
          >
            <span>{L('Teklif Al', 'Request a Quote')}</span>
            <ChevronRight className={`${icon} shrink-0`} />
          </Link>
        ) : outOfStock ? (
          <button type="button" disabled aria-disabled="true" className={`${btnBase} cursor-not-allowed bg-[#f1f4f8] text-[#5d6e80]`}>
            {L('Stokta yok', 'Out of stock')}
          </button>
        ) : hasVariants ? (
          <Link
            href={href}
            className={`${btnBase} border border-[#d3d9e1] bg-white text-[#0b2540] hover:border-[#0b2540] hover:bg-[#0b2540] hover:text-white [@media(hover:hover)]:group-hover:border-[#0b2540]`}
          >
            <span>{L('Seçenekleri Gör', 'View Options')}</span>
            <ChevronRight className={`${icon} shrink-0`} />
          </Link>
        ) : isInCart ? (
          <div className={`flex w-full items-center overflow-hidden rounded-lg bg-[#0b2540] text-white ${isCompact ? 'h-9' : 'h-10'}`}>
            <button
              type="button"
              onClick={handleDecrease}
              className="flex h-full w-10 items-center justify-center transition-colors hover:bg-white/10 touch-manipulation"
              aria-label={L('Adet azalt', 'Decrease quantity')}
            >
              <Minus className={icon} />
            </button>
            <span className={`flex-1 min-w-0 truncate text-center font-semibold tabular-nums ${isCompact ? 'text-xs' : 'text-sm'}`} aria-live="polite">
              {quantity}<span className="sr-only">{L(' adet sepette', ' in cart')}</span>
            </span>
            <button
              type="button"
              onClick={handleIncrease}
              aria-disabled={atMax}
              className={`flex h-full w-10 items-center justify-center transition-colors touch-manipulation ${atMax ? 'opacity-40' : 'hover:bg-white/10'}`}
              aria-label={L('Adet artır', 'Increase quantity')}
            >
              <Plus className={icon} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleAddToCart}
            className={`${btnBase} border border-[#d3d9e1] bg-white text-[#0b2540] hover:border-[#0b2540] hover:bg-[#0b2540] hover:text-white [@media(hover:hover)]:group-hover:border-[#0b2540]`}
            aria-label={L(`${product.name} sepete ekle`, `Add ${product.name} to cart`)}
          >
            <ShoppingCart className={`${icon} shrink-0`} />
            <span>{tCart('addToCart')}</span>
          </button>
        )}
      </div>
    </div>
  )
}
