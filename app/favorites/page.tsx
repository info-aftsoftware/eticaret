'use client'

import React from 'react'
import { ClassicPageShell } from '@/components/ClassicPageShell'
import { FavoritesGrid } from '@/components/FavoritesGrid'
import { useFavorites } from '@/lib/useFavorites'

/** Favoriler: üyelerde hesapta (Firestore), misafirlerde bu cihazda saklanır — giriş zorunlu değil. */
export default function FavoritesPage() {
  const { ids, ready } = useFavorites()
  const count = ready ? ids.length : 0
  return (
    <ClassicPageShell
      breadcrumbs={[{ label: 'Favorilerim' }]}
      title="Favorilerim"
      description={count > 0 ? `${count} ürün` : 'Beğendiğiniz ürünleri burada saklayın.'}
    >
      <FavoritesGrid />
    </ClassicPageShell>
  )
}
