'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Card } from '@/components/ui/card'
import { Heart, Minus, Package, Plus } from 'lucide-react'
import { fmtPrice } from '@/lib/format'
import { useCurrencyStore } from '@/lib/store/useCurrencyStore'
import { useExchangeRates } from '@/lib/useExchangeRates'
import type { ProductVariant } from '@/components/AddToCartButton'
import { ShoppingCart } from 'lucide-react'
import { useCartStore } from '@/lib/store/useCartStore'
import { useToast } from '@/components/ui/toast'

export interface ProductCardProduct {
  id: string
  name: string
  description?: string
  price: number
  image?: string
  category?: string
  brand?: string
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
  className?: string
}

export function ProductCard({
  product,
  selectedVariant,
  variant = 'full',
  className = '',
  stock,
  isVariantProduct,
  oldPrice,
  discount,
}: ProductCardProps) {
  const currency = useCurrencyStore((s) => s.currency)
  const { rates } = useExchangeRates()
  const { addItem, updateQuantity, getItemQuantity } = useCartStore()
  const { addToast } = useToast()
  const isCompact = variant === 'compact'
  const [imageError, setImageError] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [isFavorited, setIsFavorited] = useState(false)

  useEffect(() => {
    setImageError(false)
  }, [product.id, product.image])

  useEffect(() => {
    setMounted(true)
  }, [])

  const cartId = selectedVariant ? `${product.id}-${selectedVariant.key}` : product.id
  const displayName = selectedVariant ? `${product.name} (${selectedVariant.label})` : product.name
  const quantity = mounted ? getItemQuantity(cartId) : 0
  const isInCart = quantity > 0

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const price = selectedVariant ? selectedVariant.price : product.price
    addItem({ id: cartId, name: displayName, description: product.description, price, image: product.image, category: product.category })
    addToast({ type: 'success', title: 'Sepete eklendi', description: `${displayName} sepete eklendi.` })
  }

  const handleIncrease = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    updateQuantity(cartId, quantity + 1)
  }

  const handleDecrease = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    updateQuantity(cartId, quantity - 1)
  }

  const handleFavorite = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsFavorited((prev) => !prev)
    addToast({
      type: 'success',
      title: isFavorited ? 'Favorilerden çıkarıldı' : 'Favorilere eklendi',
      description: displayName,
    })
  }

  const hasRealImage = Boolean(product.image && !imageError && !product.image.includes('placeholder'))
  const displayPrice = selectedVariant ? selectedVariant.price : product.price
  const formatPrice = (amount: number) => fmtPrice(amount, currency, rates?.rates ?? null)

  return (
    <Link href={`/products/${product.id}`} className="block h-full">
      <Card
        className={`group bg-white rounded-xl border border-slate-200 shadow-sm hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col h-full ${className}`}
      >
        {/* Resim — sabit oran, sıfır iç padding */}
        <div className="relative aspect-square overflow-hidden bg-white">
          <div className={`absolute inset-0 flex items-center justify-center ${hasRealImage ? 'bg-white' : 'bg-slate-50'}`}>
            {hasRealImage ? (
              <Image
                src={product.image!}
                alt={product.name}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="object-contain p-3 group-hover:scale-105 transition-transform duration-300"
                onError={() => setImageError(true)}
              />
            ) : (
              <Package className="w-14 h-14 text-slate-300" />
            )}
          </div>

          {/* Kampanya rozeti */}
          {!!discount && discount > 0 && (
            <span className="absolute top-2 left-2 z-10 rounded-md bg-brand px-1.5 py-0.5 text-[11px] font-bold text-white shadow-sm">
              %{discount} İndirim
            </span>
          )}

          {/* Favori butonu — hover'da görünür */}
          <button
            type="button"
            onClick={handleFavorite}
            aria-label={isFavorited ? 'Favorilerden çıkar' : 'Favorilere ekle'}
            className={`absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-full border transition-all duration-200 shadow-sm z-10
              ${isFavorited
                ? 'bg-brand border-brand text-white opacity-100'
                : 'bg-white border-slate-200 text-slate-400 hover:border-brand hover:text-brand opacity-0 group-hover:opacity-100'}
            `}
          >
            <Heart className={`w-3.5 h-3.5 ${isFavorited ? 'fill-white' : ''}`} />
          </button>
        </div>

        {/* Bilgi alanı — içerik kadar uzar */}
        <div className={`${isCompact ? 'p-2 sm:p-3' : 'p-3'} border-t border-slate-100 flex flex-col`}>
          {product.brand && (
            <p className={`text-brand font-semibold uppercase tracking-wide mb-1 ${isCompact ? 'text-[10px]' : 'text-[10px] sm:text-xs'}`}>
              {product.brand}
            </p>
          )}
          <h3 className={`font-medium text-slate-900 line-clamp-2 leading-tight ${isCompact ? 'text-xs' : 'text-xs sm:text-sm'}`}>
            {product.name}
          </h3>
          <div className="flex items-center justify-between mt-1.5">
            <p className={`font-bold text-slate-900 ${isCompact ? 'text-sm' : 'text-sm sm:text-base'}`}>
              {!selectedVariant && oldPrice && oldPrice > displayPrice && (
                <span className="block text-[11px] font-normal text-slate-400 line-through">{formatPrice(oldPrice)}</span>
              )}
              <span className={!selectedVariant && oldPrice && oldPrice > displayPrice ? 'text-brand' : ''}>{formatPrice(displayPrice)}</span>
            </p>
            {stock !== undefined && stock <= 5 && stock > 0 && (
              <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                Son {stock} adet
              </span>
            )}
          </div>

          {/* Sepet butonu — hover'da açılır */}
          <div className="mt-2 overflow-hidden">
            {isInCart ? (
              <div
                className={`flex w-full items-center overflow-hidden rounded-xl border border-brand/20 bg-white text-brand shadow-sm opacity-0 max-h-0 translate-y-2 pointer-events-none transition-all duration-300 group-hover:opacity-100 group-hover:max-h-12 group-hover:translate-y-0 group-hover:pointer-events-auto ${isCompact ? 'h-9' : 'h-10'}`}
              >
                <button
                  type="button"
                  onClick={handleDecrease}
                  className="flex h-full w-10 items-center justify-center transition-colors hover:bg-brand/5"
                  aria-label="Adet azalt"
                >
                  <Minus className={`${isCompact ? 'w-3.5 h-3.5' : 'w-4 h-4'}`} />
                </button>
                <span className={`flex-1 text-center font-semibold tabular-nums ${isCompact ? 'text-xs' : 'text-sm'}`}>
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={handleIncrease}
                  className="flex h-full w-10 items-center justify-center transition-colors hover:bg-brand/5"
                  aria-label="Adet artır"
                >
                  <Plus className={`${isCompact ? 'w-3.5 h-3.5' : 'w-4 h-4'}`} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleAddToCart}
                className={`inline-flex w-full items-center justify-center gap-2 rounded-xl border border-brand/20 bg-white text-brand shadow-sm opacity-0 max-h-0 translate-y-2 pointer-events-none transition-all duration-300 group-hover:opacity-100 group-hover:max-h-12 group-hover:translate-y-0 group-hover:pointer-events-auto hover:border-brand hover:shadow-md active:translate-y-0 ${isCompact ? 'h-9 text-xs font-semibold' : 'h-10 text-xs sm:text-sm font-semibold'}`}
                aria-label="Sepete ekle"
              >
                <ShoppingCart className={`${isCompact ? 'w-3.5 h-3.5' : 'w-4 h-4'} shrink-0`} />
                <span>Sepete Ekle</span>
              </button>
            )}
          </div>
        </div>
      </Card>
    </Link>
  )
}
