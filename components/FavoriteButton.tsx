'use client'

import React, { useEffect, useState } from 'react'
import { Heart } from 'lucide-react'
import { useToast } from '@/components/ui/toast'
import { useFavorites } from '@/lib/useFavorites'

interface FavoriteButtonProps {
  productId: string
  productName?: string
  className?: string
}

/** Ürün sayfası favori butonu — ürün kartı ve favoriler sayfasıyla aynı durumu kullanır (lib/useFavorites). */
export function FavoriteButton({ productId, className = '' }: FavoriteButtonProps) {
  const { isFavorite, toggle } = useFavorites()
  const { addToast } = useToast()
  const [mounted, setMounted] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => setMounted(true), [])
  const active = mounted && isFavorite(productId)

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (busy) return
    setBusy(true)
    try {
      const added = await toggle(productId)
      addToast({
        type: 'success',
        variant: 'snackbar',
        title: added ? 'Favorilere eklendi' : 'Favorilerden çıkarıldı',
        action: added ? { label: 'Favorilere git', href: '/favorites' } : undefined,
        duration: 4000,
      })
    } catch {
      addToast({ type: 'error', title: 'Favori kaydedilemedi', description: 'Lütfen tekrar deneyin.' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={busy}
      aria-pressed={active}
      aria-label={active ? 'Favorilerden çıkar' : 'Favorilere ekle'}
      title={active ? 'Favorilerden çıkar' : 'Favorilere ekle'}
      className={`relative z-30 inline-flex h-9 w-9 items-center justify-center rounded-full border transition-colors touch-manipulation disabled:opacity-60 ${
        active
          ? 'border-[#f5b400] bg-[#f5b400] text-[#111]'
          : 'border-[#e6ebf1] bg-white text-[#5d6e80] hover:border-[#0b2540] hover:text-[#0b2540]'
      } ${className}`}
    >
      <Heart className={`h-4 w-4 ${active ? 'fill-current' : ''}`} />
    </button>
  )
}
