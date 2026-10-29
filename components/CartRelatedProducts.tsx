'use client'

import React, { useMemo } from 'react'
import Image from 'next/image'
import Link from '@/lib/i18n/navigation'
import { ShoppingCart, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useCartStore } from '@/lib/store/useCartStore'
import { mockProducts, COMPLEMENTARY_BY_CATEGORY, PLACEHOLDER_PRODUCT_IDS } from '@/lib/products-mock'
import { fmtPrice } from '@/lib/format'
import { useCurrencyStore } from '@/lib/store/useCurrencyStore'
import { useExchangeRates } from '@/lib/useExchangeRates'
import { useL } from '@/lib/i18n-inline'
import { isContactOnlyProduct } from '@/lib/shipping/battery'
import { grossPrice } from '@/lib/store-config'
import { useLocale } from 'next-intl'
import { localizeProduct, toCatalogLocale } from '@/lib/catalog-en'

interface CartRelatedProductsProps {
  cartItemIds: string[]
  cartCategories: string[]
}

export function CartRelatedProducts({ cartItemIds, cartCategories }: CartRelatedProductsProps) {
  const L = useL()
  const catalogLocale = toCatalogLocale(useLocale())
  const currency = useCurrencyStore((s) => s.currency)
  const numberLocale = useLocale()
  const { rates } = useExchangeRates()
  const formatPrice = (amount: number) => fmtPrice(amount, currency, rates?.rates ?? null, numberLocale)
  const addItem = useCartStore((s) => s.addItem)

  // Sepetteki kategorilere göre tamamlayıcı ürün ID'lerini topla
  const { relatedProducts, sectionTitle, sectionDesc } = useMemo(() => {
    const collectedIds = new Set<string>()
    let title = L('Bunları alanlar şunları da aldı', 'Customers who bought these also bought')
    let desc = ''

    // Her kategori için COMPLEMENTARY_BY_CATEGORY'den ID'leri topla
    for (const cat of cartCategories) {
      const entry = COMPLEMENTARY_BY_CATEGORY[cat]
      if (entry) {
        entry.productIds.forEach((id) => collectedIds.add(id))
        if (!desc && entry.description) {
          title = entry.title ? L(entry.title, entry.en?.title ?? entry.title) : title
          desc = L(entry.description, entry.en?.description ?? entry.description)
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
      title = L('Benzer ürünler', 'Similar products')
      desc = L('Aynı kategorideki diğer ürünleri inceleyebilirsiniz.', 'Explore other products in the same category.')
    }

    // ID'leri ürün objelerine dönüştür, sepette olanları ve placeholder'ları çıkar
    const products = Array.from(collectedIds)
      .filter((id) => !cartItemIds.includes(id) && !PLACEHOLDER_PRODUCT_IDS.includes(id))
      .map((id) => mockProducts.find((p) => p.id === id))
      .filter((p): p is NonNullable<typeof p> => !!p && p.stock > 0)
      .slice(0, 6)

    return { relatedProducts: products, sectionTitle: title, sectionDesc: desc }
  }, [cartItemIds, cartCategories, L])

  if (relatedProducts.length === 0) return null

  return (
    <div className="mt-2">
      {/* Başlık */}
      <div className="flex items-center gap-2 mb-1">
        <div className="flex items-center gap-2">
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
        {relatedProducts.map((rawProduct) => localizeProduct(rawProduct, catalogLocale)).map((product) => (
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
                  <div className="font-bold text-slate-900 text-sm">{formatPrice(grossPrice(product.price))} <span className="text-[10px] font-normal text-slate-500">KDV dahil</span></div>
                  {product.oldPrice && (
                    <div className="text-[11px] text-slate-400 line-through">{formatPrice(grossPrice(product.oldPrice))}</div>
                  )}
                </div>
                {(() => {
                  // Tüm önerilerde aynı buton: varyantlı üründe varsayılan seçenek (ürün sayfasındakiyle aynı) eklenir
                  const v = product.variants?.find((x) => x.key === product.defaultVariantKey) ?? product.variants?.[0]
                  const soldOut = product.stock <= 0
                  // Akü / batarya sepete eklenmez (lib/shipping/battery.ts)
                  if (isContactOnlyProduct(product)) {
                    return (
                      <Link href={`/products/${product.id}`} className="h-8 px-3 inline-flex items-center rounded-md border border-[#d3d9e1] text-[#0b2540] text-xs font-semibold flex-shrink-0 hover:bg-[#f5f7fa]">
                        {L('İletişime geç', 'Contact us')}
                      </Link>
                    )
                  }
                  return (
                    <Button
                      size="sm"
                      disabled={soldOut}
                      className="h-8 px-3 rounded-md bg-[#0b2540] hover:bg-[#12335a] text-white text-xs font-semibold flex-shrink-0 disabled:opacity-50"
                      onClick={() =>
                        addItem({
                          id: v ? `${product.id}-${v.key}` : product.id,
                          productId: product.id,
                          maxQuantity: product.stock,
                          name: v ? `${product.name} (${v.label})` : product.name,
                          price: v ? v.price : product.price,
                          quantity: 1,
                          image: product.image,
                          category: product.category,
                          description: product.description,
                        })
                      }
                      aria-label={L(`${product.name} sepete ekle`, `Add ${product.name} to cart`)}
                    >
                      <ShoppingCart className="w-3.5 h-3.5 mr-1.5" aria-hidden />
                      {soldOut ? L('Tükendi', 'Sold out') : L('Sepete ekle', 'Add to Cart')}
                    </Button>
                  )
                })()}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
