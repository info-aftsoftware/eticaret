'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ShoppingCart, Plus, Minus } from 'lucide-react'
import { useCartStore } from '@/lib/store/useCartStore'
import { useToast } from '@/components/ui/toast'
import { useTranslations } from 'next-intl'
import { useL } from '@/lib/i18n-inline'
import Link from 'next/link'
import { isContactOnlyProduct } from '@/lib/shipping/battery'

export interface ProductVariant {
  key: string
  label: string
  price: number
}

interface AddToCartButtonProps {
  product: {
    id: string
    name: string
    description?: string
    price: number
    image?: string
    category?: string
  }
  /** Ürün varyantı (örn. 1 kg). Sepette ayrı kalem olur. */
  selectedVariant?: ProductVariant
  /** Stok adedi. 0 ise buton "Stok yok" gösterir ve tıklanamaz. */
  stock?: number
  className?: string
  variant?: 'default' | 'outline'
  size?: 'default' | 'sm' | 'lg'
  disabled?: boolean
  /** false ise (ürün kartında) sepette olsa bile hep "SEPETE EKLE" butonu gösterilir; tıklanınca +1 eklenir. */
  showQuantitySelector?: boolean
}

export function AddToCartButton({
  product,
  selectedVariant,
  stock,
  className = '',
  variant = 'default',
  size = 'default',
  disabled = false,
  showQuantitySelector = true,
}: AddToCartButtonProps) {
  const addItem = useCartStore((s) => s.addItem)
  const updateQuantity = useCartStore((s) => s.updateQuantity)
  const { addToast } = useToast()
  const L = useL()
  const t = useTranslations('addToCart')
  const [mounted, setMounted] = useState(false)

  const cartId = selectedVariant ? `${product.id}-${selectedVariant.key}` : product.id
  const displayName = selectedVariant ? `${product.name} (${selectedVariant.label})` : product.name
  const price = selectedVariant ? selectedVariant.price : product.price
  const outOfStock = typeof stock === 'number' && stock <= 0
  const effectiveDisabled = disabled || outOfStock
  const maxQty = typeof stock === 'number' && stock > 0 ? stock : undefined

  useEffect(() => {
    setMounted(true)
  }, [])

  const quantity = useCartStore((s) => (mounted ? s.items.find((i) => i.id === cartId)?.quantity ?? 0 : 0))
  // Varyantlar ürün stoğunu paylaşır: sınır ürünün sepetteki toplam adedine göre
  const productQty = useCartStore((s) =>
    mounted ? s.items.filter((i) => (i.productId ?? i.id) === product.id || i.id === cartId).reduce((n, i) => n + i.quantity, 0) : 0
  )
  const isInCart = mounted && quantity > 0

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (effectiveDisabled || outOfStock) return
    if (selectedVariant && !selectedVariant.key) return

    try {
      const added = addItem({
        id: cartId,
        productId: product.id,
        maxQuantity: maxQty,
        name: displayName,
        description: product.description,
        price,
        image: product.image,
        category: product.category,
      })
      if (added <= 0) {
        addToast({ type: 'info', title: t('stockLimit'), description: t('stockLimitDesc', { maxQty: maxQty ?? 0 }) })
        return
      }
      addToast({
        type: 'success',
        title: t('addedToCart'),
        description: L(`${displayName} sepete eklendi.`, `${displayName} added to cart.`),
        action: { label: L('Sepete git', 'Go to cart'), href: '/cart' },
      })
    } catch {
      addToast({
        type: 'error',
        title: t('errorTitle'),
        description: t('addError'),
      })
    }
  }

  const handleIncrease = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (maxQty != null && productQty >= maxQty) {
      addToast({
        type: 'info',
        title: t('stockLimit'),
        description: t('stockLimitDesc', { maxQty }),
      })
      return
    }
    updateQuantity(cartId, quantity + 1)
  }

  const handleDecrease = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (quantity > 1) {
      updateQuantity(cartId, quantity - 1)
    } else {
      updateQuantity(cartId, 0)
      addToast({
        type: 'success',
        title: t('removed'),
        description: `${displayName} sepetten kaldırıldı.`,
      })
    }
  }

  // Akü / batarya: sepete eklenmez, ürün sayfasındaki iletişim kutusuna gider (lib/shipping/battery.ts)
  if (isContactOnlyProduct(product)) {
    return (
      <Button asChild variant="outline" size={size} className={className}>
        <Link href={`/products/${product.id}`}>{L('İletişime geç', 'Contact us')}</Link>
      </Button>
    )
  }

  if (outOfStock) {
    return (
      <Button
        variant={variant}
        size={size}
        className={`cursor-not-allowed opacity-70 ${className}`}
        disabled
        aria-disabled="true"
        aria-label={t('outOfStock')}
      >
        <ShoppingCart className="w-4 h-4 mr-2 opacity-60" />
        {t('outOfStock')}
      </Button>
    )
  }

  if (isInCart && showQuantitySelector) {
    const isSm = size === 'sm'
    const isLg = size === 'lg'
    const iconClass = isLg ? 'w-4 h-4' : isSm ? 'w-3 h-3' : 'w-3.5 h-3.5'
    return (
      <div
        className={`flex items-center w-full max-w-full rounded-md overflow-hidden bg-brand hover:bg-brand-hover transition-colors ${className}`}
      >
        <button
          type="button"
          onClick={handleDecrease}
          disabled={effectiveDisabled}
          className="flex items-center justify-center shrink-0 w-9 sm:w-10 h-full min-h-0 text-brand-foreground hover:bg-white/15 active:bg-white/20 touch-manipulation min-w-[36px] disabled:opacity-50 disabled:pointer-events-none"
          aria-label={t('decreaseQty')}
        >
          <Minus className={iconClass} />
        </button>
        <span className="flex-1 flex items-center justify-center min-w-0 font-semibold text-brand-foreground text-sm tabular-nums bg-white/15 h-full min-h-0">
          {quantity}
        </span>
        <button
          type="button"
          onClick={handleIncrease}
          disabled={effectiveDisabled}
          className="flex items-center justify-center shrink-0 w-9 sm:w-10 h-full min-h-0 text-brand-foreground hover:bg-white/15 active:bg-white/20 touch-manipulation min-w-[36px] disabled:opacity-50 disabled:pointer-events-none"
          aria-label={t('increaseQty')}
        >
          <Plus className={iconClass} />
        </button>
      </div>
    )
  }

  const handleClick = isInCart && !showQuantitySelector ? handleIncrease : handleAddToCart

  return (
    <Button
      onClick={handleClick}
      variant={variant}
      size={size}
      className={`${variant === 'default' ? 'bg-brand hover:bg-brand-hover' : ''} ${className}`}
      disabled={effectiveDisabled}
    >
      <ShoppingCart className="w-4 h-4 mr-2" />
      {t('addToCart')}
    </Button>
  )
}

