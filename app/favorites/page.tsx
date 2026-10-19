'use client'

import React from 'react'
import { ClassicPageShell } from '@/components/ClassicPageShell'
import { FavoritesGrid } from '@/components/FavoritesGrid'
import { useFavorites } from '@/lib/useFavorites'
import { useL } from '@/lib/i18n-inline'

/** Favoriler: üyelerde hesapta (Firestore), misafirlerde bu cihazda saklanır — giriş zorunlu değil. */
export default function FavoritesPage() {
  const L = useL()
  const { ids, ready } = useFavorites()
  const count = ready ? ids.length : 0
  return (
    <ClassicPageShell
      breadcrumbs={[{ label: L('Favorilerim', 'My Favorites') }]}
      title={L('Favorilerim', 'My Favorites')}
      description={count > 0 ? L(`${count} ürün`, `${count} ${count === 1 ? 'item' : 'items'}`) : L('Beğendiğiniz ürünleri burada saklayın.', 'Keep the products you like here.')}
    >
      <FavoritesGrid />
    </ClassicPageShell>
  )
}
