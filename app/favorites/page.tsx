'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Heart, 
  ShoppingCart, 
  Package,
  Trash2,
  ArrowLeft,
  Loader2
} from 'lucide-react'
import { useCartStore } from '@/lib/store/useCartStore'
import { useAuthStore } from '@/lib/store/useAuthStore'
import { useToast } from '@/components/ui/toast'
import { fmtPrice } from '@/lib/format'
import { useCurrencyStore } from '@/lib/store/useCurrencyStore'
import { useExchangeRates } from '@/lib/useExchangeRates'
import { useRouter } from 'next/navigation'
import { AddToCartButton } from '@/components/AddToCartButton'
import { ClassicPageShell } from '@/components/ClassicPageShell'
import { getFavorites, removeFavorite as removeFavoriteFirestore } from '@/lib/firebase/firestore'
import { getCategoryKey } from '@/lib/categories'
import { useTranslations } from 'next-intl'

interface FavoriteProduct {
  id: string
  favoriteId: string
  name: string
  description?: string
  price: number
  image?: string
  category?: string
  stock?: number
  slug?: string
  createdAt: string
  /** Ürün katalogdan kaldırılmış (eski katalog) */
  unavailable?: boolean
}

export default function FavoritesPage() {
  const router = useRouter()
  const tHeader = useTranslations('header')
  const currency = useCurrencyStore((s) => s.currency)
  const { rates } = useExchangeRates()
  const formatPrice = (amount: number) => fmtPrice(amount, currency, rates?.rates ?? null)
  const { isAuthenticated, user } = useAuthStore()
  const { addToast } = useToast()
  const [favorites, setFavorites] = useState<FavoriteProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [removing, setRemoving] = useState<string | null>(null)

  const fetchFavorites = useCallback(async () => {
    if (!user?.id) {
      setFavorites([])
      return
    }
    try {
      setLoading(true)
      const list = await getFavorites(user.id)
      if (list.length === 0) {
        setFavorites([])
        return
      }
      // Statik hosting: ürün bilgileri mock data'dan alınır (API yok)
      const { mockProducts } = await import('@/lib/products-mock')
      const enriched = list.map((f) => {
        const product = mockProducts.find((p: any) => p.id === f.productId || p.slug === f.productId)
        if (product) {
          return {
            id: f.productId,
            favoriteId: f.productId,
            name: product.name || `Ürün #${f.productId}`,
            description: (product as any).description || '',
            price: (product as any).price || 0,
            image: (product as any).image || (product as any).images?.[0]?.url || null,
            category: (product as any).category || '',
            stock: undefined,
            slug: (product as any).slug || f.productId,
            createdAt: '',
          }
        }
        // Katalogdan kaldırılmış ürün: adres eski ürün yönlendirmesiyle yeni ürüne/kategoriye gider
        return {
          id: f.productId,
          favoriteId: f.productId,
          name: 'Bu ürün artık satışta değil',
          price: 0,
          createdAt: '',
          unavailable: true,
        }
      })
      setFavorites(enriched)
    } catch (error) {
      console.error('Favoriler yüklenirken hata:', error)
      addToast({ type: 'error', title: 'Hata', description: 'Favoriler yüklenirken bir hata oluştu.' })
      setFavorites([])
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.push('/login?redirect=/favorites')
      return
    }
    fetchFavorites()
  }, [isAuthenticated, user, router, fetchFavorites])

  const removeFavorite = async (favoriteId: string, productId: string) => {
    if (!user?.id) return
    try {
      setRemoving(favoriteId)
      await removeFavoriteFirestore(user.id, productId)
      setFavorites((prev) => prev.filter((f) => f.favoriteId !== favoriteId))
      addToast({ type: 'success', title: 'Favoriden Çıkarıldı', description: 'Ürün favorilerinizden çıkarıldı.' })
    } catch (error) {
      console.error('Favoriden çıkarma hatası:', error)
      addToast({ type: 'error', title: 'Hata', description: 'Ürün favorilerden çıkarılırken bir hata oluştu.' })
    } finally {
      setRemoving(null)
    }
  }

  const handleAddToCart = (product: FavoriteProduct) => {
    try {
      const { addItem } = useCartStore.getState()
      addItem({
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        image: product.image,
        category: product.category,
      })
      addToast({
        type: 'success',
        title: 'Sepete Eklendi',
        description: `${product.name} sepete başarıyla eklendi.`,
      })
    } catch (error) {
      console.error('Sepete ekleme hatası:', error)
      addToast({
        type: 'error',
        title: 'Hata',
        description: 'Ürün sepete eklenirken bir hata oluştu.',
      })
    }
  }

  if (!isAuthenticated && !loading) {
    return (
      <ClassicPageShell breadcrumbs={[{ label: 'Favorilerim' }]} noTitle>
        <div className="flex justify-center py-12">
          <Card className="max-w-md w-full classic-card rounded-lg overflow-hidden">
            <CardContent className="p-10 text-center">
              <div className="w-20 h-20 rounded-lg bg-brand-light flex items-center justify-center mx-auto mb-6">
                <Heart className="w-10 h-10 text-brand" />
              </div>
              <h2 className="text-xl font-bold text-ink mb-2 uppercase tracking-tight">Favorilerinize Erişmek İçin</h2>
              <p className="text-ink-muted mb-8 leading-relaxed text-sm">
                Favorilerinize ürün ekleyebilmek ve yönetebilmek için lütfen giriş yapın.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="btn-classic-primary rounded-lg min-h-[48px] w-full sm:w-auto touch-manipulation">
                  <Link href="/login?redirect=/favorites">Giriş Yap</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="rounded-lg font-bold border-2 border-palette uppercase text-sm min-h-[48px] w-full sm:w-auto touch-manipulation">
                  <Link href="/register?redirect=/favorites">Kayıt Ol</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </ClassicPageShell>
    )
  }

  if (loading) {
    return (
      <ClassicPageShell breadcrumbs={[{ label: 'Favorilerim' }]} noTitle>
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-brand animate-spin mx-auto mb-4" />
            <p className="text-ink-muted font-medium">Favoriler yükleniyor...</p>
          </div>
        </div>
      </ClassicPageShell>
    )
  }

  return (
    <ClassicPageShell
      breadcrumbs={[{ label: 'Favorilerim' }]}
      title="Favorilerim"
      description={favorites.length === 0 ? 'Henüz favori ürününüz yok' : `${favorites.length} favori ürün`}
    >
      {favorites.length === 0 ? (
        <div className="flex justify-center py-12">
          <Card className="max-w-lg w-full classic-card rounded-lg overflow-hidden">
            <CardContent className="py-20 text-center">
              <div className="w-24 h-24 rounded-lg bg-brand-light flex items-center justify-center mx-auto mb-6">
                <Heart className="w-12 h-12 text-brand" />
              </div>
              <h3 className="text-xl font-bold text-ink mb-2 uppercase tracking-tight">Henüz favori yok</h3>
              <p className="text-ink-muted mb-8 max-w-md mx-auto leading-relaxed text-sm">
                Beğendiğiniz ürünleri favorilerinize ekleyin, daha sonra kolayca bulun.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="btn-classic-primary rounded-lg min-h-[48px] w-full sm:w-auto touch-manipulation">
                  <Link href="/products" className="flex items-center justify-center gap-2">
                    <Package className="w-5 h-5" />
                    Ürünlere Göz At
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="rounded-lg font-bold border-2 border-palette uppercase text-sm min-h-[48px] w-full sm:w-auto touch-manipulation">
                  <Link href="/" className="flex items-center justify-center gap-2">
                    <ArrowLeft className="w-5 h-5" />
                    Ana Sayfaya Dön
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {favorites.map((product) => (
            <Card key={product.favoriteId} className="classic-card rounded-lg flex flex-col overflow-hidden">
                <div className="relative">
                  <Link href={`/products/${product.id}`}>
                    <div className="w-full h-48 bg-surface rounded-t-lg overflow-hidden flex items-center justify-center relative">
                      {product.image ? (
                        <Image
                          src={product.image}
                          alt={product.name}
                          width={300}
                          height={200}
                          className="object-cover w-full h-full relative z-0"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                          }}
                        />
                      ) : (
                        <Package className="w-16 h-16 text-ink-muted z-0 pointer-events-none" />
                      )}
                    </div>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2 bg-white/90 hover:bg-white shadow-md z-30 min-h-[44px] min-w-[44px] p-0 touch-manipulation"
                    onClick={() => removeFavorite(product.favoriteId, product.id)}
                    disabled={removing === product.favoriteId}
                  >
                    {removing === product.favoriteId ? (
                      <Loader2 className="w-4 h-4 animate-spin text-brand" />
                    ) : (
                      <Heart className="w-4 h-4 text-brand fill-brand" />
                    )}
                  </Button>
                </div>

                <CardHeader className="flex-1">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <CardTitle className="text-lg line-clamp-2 flex-1">
                      <Link href={product.slug ? `/products/${product.slug}` : `/products/${product.id}`} className="hover:text-brand">
                        {product.name}
                      </Link>
                    </CardTitle>
                  </div>
                  {product.description && (
                    <CardDescription className="line-clamp-2 text-sm">
                      {product.description}
                    </CardDescription>
                  )}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {product.category && (
                      <Badge variant="secondary" className="text-xs">
                        {getCategoryKey(product.category) ? tHeader(getCategoryKey(product.category)!) : product.category}
                      </Badge>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="pt-0 pb-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="text-2xl font-bold text-ink">
                        {product.unavailable ? (
                          <span className="text-sm font-medium text-ink-muted">Favorilerinizden kaldırabilirsiniz</span>
                        ) : product.price > 0 ? formatPrice(product.price) : 'Fiyat bilgisi yok'}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      asChild
                      variant="outline"
                      className="flex-1 min-h-[44px] touch-manipulation"
                    >
                      <Link href={product.slug ? `/products/${product.slug}` : `/products/${product.id}`} className="flex items-center justify-center">
                        Detaylar
                      </Link>
                    </Button>
                    <div className="flex-1 min-h-[44px] flex">
                      <AddToCartButton
                        product={{
                          id: product.id,
                          name: product.name,
                          description: product.description,
                          price: product.price,
                          image: product.image,
                          category: product.category
                        }}
                        className="w-full min-h-[44px] touch-manipulation"
                        disabled={!product.price}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
    </ClassicPageShell>
  )
}

