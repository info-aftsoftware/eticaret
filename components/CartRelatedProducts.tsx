'use client'

import React, { useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ShoppingCart, Plus, Star, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useCartStore } from '@/lib/store/useCartStore'
import { mockProducts, COMPLEMENTARY_BY_CATEGORY, PLACEHOLDER_PRODUCT_IDS } from '@/lib/products-mock'
import { fmtPrice } from '@/lib/format'
import { useCurrencyStore } from '@/lib/store/useCurrencyStore'
import { useExchangeRates } from '@/lib/useExchangeRates'

interface CartRelatedProductsProps {
  cartItemIds: string[]
  cartCategories: string[]
}

export function CartRelatedProducts({ cartItemIds, cartCategories }: CartRelatedProductsProps) {
  const currency = useCurrencyStore((s) => s.currency)
  const { rates } = useExchangeRates()
  const formatPrice = (amount: number) => fmtPrice(amount, currency, rates?.rates ?? null)
  const addItem = useCartStore((s) => s.addItem)

  // Sepetteki kategorilere göre tamamlayıcı ürün ID'lerini topla
  const { relatedProducts, sectionTitle, sectionDesc } = useMemo(() => {
    const collectedIds = new Set<string>()
    let title = 'Bunları alanlar şunları da aldı'
    let desc = ''

    // Her kategori için COMPLEMENTARY_BY_CATEGORY'den ID'leri topla
    for (const cat of cartCategories) {
      const entry = COMPLEMENTARY_BY_CATEGORY[cat]
      if (entry) {
        entry.productIds.forEach((id) => collectedIds.add(id))
        if (!desc && entry.description) {
          title = entry.title || title
          desc = entry.description
        }
      }
    }

    // Eğer hiç COMPLEMENTARY yoksa kategori bazlı benzer ürünler göster
    if (collectedIds.size === 0) {
      // Sepetteki ürünlerle aynı kategorideki farklı ürünleri öner
      const targetCategories = new Set(cartCategories)
      mockProducts
        .filter(
          (p) =>
            targetCategories.has(p.category) &&
            !cartItemIds.includes(p.id) &&
            !PLACEHOLDER_PRODUCT_IDS.includes(p.id) &&
            p.stock > 0
        )
        .slice(0, 6)
        .forEach((p) => collectedIds.add(p.id))
      title = 'Benzer ürünler'
      desc = 'Aynı kategorideki diğer ürünleri inceleyebilirsiniz.'
    }

    // ID'leri ürün objelerine dönüştür, sepette olanları ve placeholder'ları çıkar
    const products = Array.from(collectedIds)
      .filter((id) => !cartItemIds.includes(id) && !PLACEHOLDER_PRODUCT_IDS.includes(id))
      .map((id) => mockProducts.find((p) => p.id === id))
      .filter((p): p is NonNullable<typeof p> => !!p && p.stock > 0)
      .slice(0, 6)

    return { relatedProducts: products, sectionTitle: title, sectionDesc: desc }
  }, [cartItemIds, cartCategories])

  if (relatedProducts.length === 0) return null

  return (
    <div className="mt-2">
      {/* Başlık */}
      <div className="flex items-center gap-2 mb-1">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center">
            <Zap className="w-4 h-4 text-amber-500" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base">{sectionTitle}</h3>
            {sectionDesc && (
              <p className="text-xs text-slate-500 mt-0.5 leading-snug">{sectionDesc}</p>
            )}
          </div>
        </div>
      </div>

      {/* Ürün grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
        {relatedProducts.map((product) => (
          <div
            key={product.id}
            className="group flex gap-3 bg-white rounded-xl border border-slate-200 p-3 hover:border-brand/40 hover:shadow-sm transition-all"
          >
            {/* Görsel */}
            <Link
              href={`/products/${product.id}`}
              className="relative w-20 h-20 rounded-lg bg-slate-50 flex-shrink-0 overflow-hidden border border-slate-100"
            >
              {product.image ? (
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  sizes="80px"
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ShoppingCart className="w-6 h-6 text-slate-300" />
                </div>
              )}
              {product.discount && (
                <Badge className="absolute top-1 left-1 text-[10px] px-1 py-0 bg-red-500 text-white border-0 h-4">
                  -{product.discount}%
                </Badge>
              )}
            </Link>

            {/* Bilgi */}
            <div className="flex-1 min-w-0 flex flex-col justify-between">
              <div>
                <Link
                  href={`/products/${product.id}`}
                  className="text-sm font-medium text-slate-800 line-clamp-2 leading-snug hover:text-brand transition-colors"
                >
                  {product.name}
                </Link>
                <div className="flex items-center gap-1 mt-1">
                  {product.brand && (
                    <span className="text-[11px] text-slate-400">{product.brand}</span>
                  )}
                  {product.rating && (
                    <>
                      <span className="text-slate-300 text-[10px]">·</span>
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                      <span className="text-[11px] text-slate-500">{product.rating}</span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between mt-2 gap-2">
                <div>
                  <div className="font-bold text-slate-900 text-sm">{formatPrice(product.price)}</div>
                  {product.oldPrice && (
                    <div className="text-[11px] text-slate-400 line-through">{formatPrice(product.oldPrice)}</div>
                  )}
                </div>
                {product.variants?.length ? (
                  // Varyantlı ürün sepete taban id ile eklenemez; seçenek ürün sayfasında seçilir
                  <Button asChild size="sm" variant="outline" className="h-8 px-2.5 rounded-lg border-brand/30 text-xs font-semibold hover:bg-brand hover:text-white hover:border-brand transition-colors flex-shrink-0">
                    <Link href={`/products/${product.id}`}>Seç</Link>
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={product.stock <= 0}
                    className="h-8 w-8 p-0 rounded-lg border-brand/30 hover:bg-brand hover:text-white hover:border-brand transition-colors flex-shrink-0"
                    onClick={() =>
                      addItem({
                        id: product.id,
                        productId: product.id,
                        maxQuantity: product.stock,
                        name: product.name,
                        price: product.price,
                        quantity: 1,
                        image: product.image,
                        category: product.category,
                        description: product.description,
                      })
                    }
                    aria-label={`${product.name} sepete ekle`}
                    title="Sepete ekle"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
