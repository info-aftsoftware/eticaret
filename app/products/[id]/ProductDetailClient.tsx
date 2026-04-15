'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Package, ChevronRight, Minus, Plus, ShoppingCart, Zap, Send, ZoomIn, X, ChevronLeft, ShieldCheck, Truck, Headphones, RotateCcw } from 'lucide-react'
import { fmtPrice } from '@/lib/format'
import { useCurrencyStore } from '@/lib/store/useCurrencyStore'
import { useExchangeRates } from '@/lib/useExchangeRates'
import { useCartStore } from '@/lib/store/useCartStore'
import { useToast } from '@/components/ui/toast'
import { FavoriteButton } from '@/components/FavoriteButton'
import { mockProducts, COMPLEMENTARY_BY_CATEGORY } from '@/lib/products-mock'
import { CATEGORY_GROUPS, getCategoryKey, getGroupIdForCategory } from '@/lib/categories'
import { ProductCard } from '@/components/ProductCard'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { ProductPageShell } from '@/components/ProductPageShell'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { ProductReviews } from '@/components/ProductReviews'
import { ProductQA } from '@/components/ProductQA'

const mockProductsMap: Record<string, (typeof mockProducts)[number]> = {}
mockProducts.forEach((p) => { mockProductsMap[p.id] = p })

/** fullDescription içinde bu başlıklar varsa akordiyon bölümüne çevrilir */
const DESCRIPTION_SECTION_HEADINGS = [
  'Alüminyum Kasa, Güvenli Kullanım',
  'Akıllı Gövde Tasarımı',
  'Mobil Uygulama Desteği',
  'Taşıma Kolaylığı',
  'Modüler ve Esnek Şarj Seçenekleri',
  'Yüksek Koruma ve Dayanıklılık',
  'Kaliteli ve Güvenli Kullanım',
  'Kullanım Alanları',
  'Kimler İçin Uygun?',
  'Uyumlu Modeller',
]

function parseDescriptionSections(text: string): { intro: string; sections: { title: string; content: string }[] } {
  const headingPattern = new RegExp(
    `\n\\s*(${DESCRIPTION_SECTION_HEADINGS.map((h) => h.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\s*\n`,
    'i'
  )
  const parts = text.split(headingPattern)
  if (parts.length <= 1) return { intro: text.trim(), sections: [] }
  const intro = parts[0].trim()
  const sections: { title: string; content: string }[] = []
  for (let i = 1; i < parts.length - 1; i += 2) {
    const title = parts[i].trim()
    const content = parts[i + 1].trim()
    if (title && content) sections.push({ title, content })
  }
  return { intro, sections }
}

type Props = { initialProduct?: (typeof mockProducts)[number] | null; productId?: string }

export default function ProductDetailClient({ initialProduct, productId: productIdProp }: Props = {}) {
  const params = useParams()
  const productId = (productIdProp ?? params?.id) as string
  const [product, setProduct] = useState<(typeof mockProducts)[number] | null>(initialProduct ?? null)
  const [loading, setLoading] = useState(!initialProduct)
  const currency = useCurrencyStore((s) => s.currency)
  const { rates } = useExchangeRates()
  const formatPrice = (amount: number) => fmtPrice(amount, currency, rates?.rates ?? null)
  const tHeader = useTranslations('header')
  const tProduct = useTranslations('productDetail')
  const tCart = useTranslations('addToCart')
  const tCommon = useTranslations('common')
  const { addItem, removeItem, updateQuantity } = useCartStore()
  const { addToast } = useToast()
  const router = useRouter()
  const [quantity, setQuantity] = useState(1)
  const [cartQty, setCartQty] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  /** Varyantlı ürünlerde seçilen seçenek (model/kapasite); yoksa ilk varyant veya null */
  const [selectedVariant, setSelectedVariant] = useState<{ key: string; label: string; price: number; sku?: string; specifications?: Record<string, string> } | null>(null)
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  })
  const [contactSubmitting, setContactSubmitting] = useState(false)
  const [contactSent, setContactSent] = useState(false)
  const [contactFormOpen, setContactFormOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)

  useEffect(() => {
    if (!productId) return
    setLoading(true)
    fetch(`/api/products/${productId}`)
      .then((res) => res.ok ? res.json() : null)
      .then((fetched) => {
        const data = fetched ?? mockProductsMap[productId] ?? null
        setProduct(data)
        const initialVariant =
          data?.defaultVariantKey && data.variants?.length
            ? data.variants.find((v: { key: string }) => v.key === data.defaultVariantKey) ?? data.variants[0]
            : data?.variants?.[0] ?? null
        setSelectedVariant(initialVariant)
        const st = typeof data?.stock === 'number' ? data.stock : 0
        setQuantity(st > 0 ? 1 : 0)
      })
      .catch(() => {
        const data = mockProductsMap[productId] ?? null
        setProduct(data)
        const initialVariant =
          data?.defaultVariantKey && data.variants?.length
            ? data.variants.find((v) => v.key === data.defaultVariantKey) ?? data.variants[0]
            : data?.variants?.[0] ?? null
        setSelectedVariant(initialVariant)
        const st = typeof data?.stock === 'number' ? data.stock : 0
        setQuantity(st > 0 ? 1 : 0)
      })
      .finally(() => setLoading(false))
  }, [productId])

  /** Varyant seçiliyse ve üründe imagesByVariant varsa o varyantın görselleri; yoksa product.images */
  const effectiveVariant = selectedVariant ?? product?.variants?.[0] ?? null
  const images = React.useMemo(() => {
    if (!product) return []
    if (product.imagesByVariant && effectiveVariant && product.variants?.length) {
      const variantIndex = product.variants.findIndex((v) => v.key === effectiveVariant.key)
      if (variantIndex >= 0 && product.imagesByVariant[variantIndex]?.length) {
        return product.imagesByVariant[variantIndex] as string[]
      }
    }
    return (product.images ?? [product.image]).filter(Boolean) as string[]
  }, [product, effectiveVariant])

  useEffect(() => {
    setSelectedIndex(0)
  }, [productId, effectiveVariant?.key])

  /** Birleşik kablo sayfasında sadece diğer metreler (aynı seri, farklı uzunluk = farklı ürün). SKU listesi değil kart gösterilecek. */
  const isMergedCableProduct = product?.category === 'Araç Şarj Kabloları' && product?.id.startsWith('hims-22kw-tip2-') && product?.id.endsWith('-elektrikli-arac-sarj-kablosu')
  const otherLengthProducts = React.useMemo(() => {
    if (!isMergedCableProduct || !product) return []
    return mockProducts.filter(
      (p) =>
        p.id !== product.id &&
        p.category === 'Araç Şarj Kabloları' &&
        p.id.startsWith('hims-22kw-tip2-') &&
        p.id.endsWith('-elektrikli-arac-sarj-kablosu')
    )
  }, [product?.id, isMergedCableProduct])

  /** Diğer seri varyantları (kablo dışı ürünlerde kullanılır; kart olarak gösterilir) */
  const getEMEFFamilyKey = (p: (typeof mockProducts)[number]) =>
    p.sku?.match(/^EMEF-[A-Z0-9]{4}/)?.[0] ?? ((p as { productFamilyKey?: string }).productFamilyKey?.startsWith?.('EMEF-') ? (p as { productFamilyKey?: string }).productFamilyKey! : null)
  const familyVariants = React.useMemo(() => {
    if (isMergedCableProduct || !product) return []
    const fk = getEMEFFamilyKey(product)
    if (!fk) return []
    return mockProducts.filter((p) => p.id !== product.id && getEMEFFamilyKey(p) === fk)
  }, [product?.id, product?.sku, (product as { productFamilyKey?: string } | null)?.productFamilyKey, isMergedCableProduct])

  /** Önerilen ürünler: en az 4–5 adet; önce tamamlayıcı/kategori, eksikse genel listeden tamamlanır */
  const MIN_RECOMMENDED = 5
  const recommendedProducts = React.useMemo(() => {
    if (!product) return []
    const complementary = product.category ? COMPLEMENTARY_BY_CATEGORY[product.category] : undefined
    let ids = complementary
      ? complementary.productIds.filter((id) => id !== product.id && mockProductsMap[id])
      : mockProducts
        .filter((p) => p.category === product.category && p.id !== product.id)
        .slice(0, Math.max(MIN_RECOMMENDED, 8))
        .map((p) => p.id)
    ids = ids.slice(0, 8)
    if (ids.length < MIN_RECOMMENDED) {
      const extra = mockProducts
        .filter((p) => p.id !== product.id && !ids.includes(p.id))
        .slice(0, MIN_RECOMMENDED - ids.length)
        .map((p) => p.id)
      ids = [...ids, ...extra]
    }
    return ids
      .map((id) => mockProductsMap[id])
      .filter(Boolean) as (typeof mockProducts)[number][]
  }, [product?.id, product?.category])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
          </div>
          <p className="text-sm text-slate-500 font-medium">{tCommon('loading')}</p>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="max-w-sm w-full text-center space-y-4">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white border border-slate-200 shadow-sm mx-auto">
            <Package className="w-8 h-8 text-slate-400" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900 mb-1">{tProduct('notFound')}</h2>
          <p className="text-sm text-slate-500 font-medium">{tProduct('notFoundDesc')}</p>
          <Button asChild variant="outline" className="rounded-xl border-slate-200">
            <Link href="/products" className="flex items-center">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {tProduct('backToProducts')}
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  const categoryKey = product.category ? getCategoryKey(product.category) : undefined
  const categoryLabel = product.category ? (categoryKey ? tHeader(categoryKey) : product.category) : ''
  const breadcrumbGroupId = product.category ? getGroupIdForCategory(product.category) : null
  const breadcrumbGroup = breadcrumbGroupId ? CATEGORY_GROUPS.find((g) => g.id === breadcrumbGroupId) : null
  const breadcrumbGroupLabel = breadcrumbGroup
    ? tHeader(breadcrumbGroup.labelKey)
    : ''
  const mainImage = images[selectedIndex] ?? images[0]
  /** Stok: varyant yoksa ürün stoku, varyantlı ürünlerde şimdilik ürün stoku kullanılıyor */
  const stock = typeof product.stock === 'number' ? product.stock : 0
  const outOfStock = stock === 0
  const isLowStock = stock > 0 && stock <= 5
  const maxQuantity = Math.max(1, stock)
  const displayQuantity = outOfStock ? 0 : Math.min(quantity, maxQuantity)

  return (
    <ProductPageShell
      breadcrumbs={
        <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 flex-wrap py-1">
          <Link href="/" className="hover:text-brand transition-colors">{tCommon('home')}</Link>
          <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 text-slate-300 shrink-0" />
          <Link href="/products" className="hover:text-brand transition-colors">{tCommon('products')}</Link>
          {breadcrumbGroup && breadcrumbGroupLabel && (
            <>
              <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 text-slate-300 shrink-0" />
              <Link href={`/category/${breadcrumbGroupId}`} className="hover:text-brand transition-colors">{breadcrumbGroupLabel}</Link>
            </>
          )}
          {product.category && categoryLabel && (
            <>
              <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 text-slate-300 shrink-0" />
              <Link href={`/products?category=${encodeURIComponent(product.category)}`} className="hover:text-brand transition-colors">{categoryLabel}</Link>
            </>
          )}
          <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 text-slate-300 shrink-0" />
          <span className="text-slate-900 font-medium line-clamp-1">{product.name}</span>
        </div>
      }
    >
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden min-w-0 overflow-x-hidden">
        <div className="p-4 sm:p-6 md:p-8 lg:p-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-10 lg:gap-16">
            <div className="space-y-3">
              <div
                className="relative aspect-square overflow-hidden rounded-2xl bg-slate-50 group cursor-zoom-in p-4 sm:p-8 border border-slate-100"
                onClick={() => { if (mainImage) { setLightboxIndex(selectedIndex); setLightboxOpen(true) } }}
              >
                {mainImage ? (
                  <>
                    <div className="relative w-full h-full">
                      <Image
                        src={mainImage}
                        alt={product.name}
                        fill
                        className="object-contain object-center transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, 50vw"
                        priority
                      />
                    </div>
                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur-sm rounded-lg p-1.5 shadow-sm">
                      <ZoomIn className="w-4 h-4 text-slate-600" />
                    </div>
                  </>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Package className="w-20 h-20 text-slate-200" />
                  </div>
                )}
              </div>

              {/* Lightbox */}
              {lightboxOpen && images.length > 0 && (
                <div
                  className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
                  onClick={() => setLightboxOpen(false)}
                >
                  <button
                    className="absolute top-4 right-4 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition-colors"
                    onClick={() => setLightboxOpen(false)}
                    aria-label="Kapat"
                  >
                    <X className="w-6 h-6" />
                  </button>
                  {images.length > 1 && (
                    <>
                      <button
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-3 transition-colors"
                        onClick={(e) => { e.stopPropagation(); setLightboxIndex((i) => (i - 1 + images.length) % images.length) }}
                        aria-label="Önceki"
                      >
                        <ChevronLeft className="w-6 h-6" />
                      </button>
                      <button
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-3 transition-colors"
                        onClick={(e) => { e.stopPropagation(); setLightboxIndex((i) => (i + 1) % images.length) }}
                        aria-label="Sonraki"
                      >
                        <ChevronRight className="w-6 h-6" />
                      </button>
                    </>
                  )}
                  <div
                    className="relative w-full max-w-3xl max-h-[85vh] aspect-square"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Image
                      src={images[lightboxIndex]}
                      alt={`${product.name} ${lightboxIndex + 1}`}
                      fill
                      className="object-contain"
                      sizes="90vw"
                    />
                  </div>
                  {images.length > 1 && (
                    <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                      {images.map((_, i) => (
                        <button
                          key={i}
                          onClick={(e) => { e.stopPropagation(); setLightboxIndex(i) }}
                          className={`w-2 h-2 rounded-full transition-all ${i === lightboxIndex ? 'bg-white scale-125' : 'bg-white/40 hover:bg-white/70'}`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
              {images.length > 1 && (
                <div className="mt-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">{tProduct('otherImages')}</p>
                  <div className="product-gallery-pause rounded-2xl border border-slate-200 bg-slate-50/70 shadow-sm overflow-hidden py-4">
                    <div className="overflow-hidden">
                      <div className="flex gap-5 w-max animate-product-gallery">
                        {[...images, ...images, ...images].map((src, i) => {
                          const index = i % images.length
                          return (
                            <button
                              key={i}
                              type="button"
                              onClick={() => setSelectedIndex(index)}
                              className={`relative flex-shrink-0 w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand/40 focus:ring-offset-2 shadow-md hover:shadow-lg hover:scale-[1.02] ${selectedIndex === index
                                ? 'border-brand ring-2 ring-brand/30 ring-offset-2'
                                : 'border-white bg-white hover:border-slate-200'
                                }`}
                            >
                              <Image src={src} alt={`${product.name} ${index + 1}`} fill className="object-cover" sizes="112px" />
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                {product.brand && <p className="text-sm font-bold text-brand uppercase tracking-wider">{product.brand}</p>}
                {product.sku && (
                  <span className="text-xs font-semibold text-slate-600 border border-slate-200 px-3 py-1 rounded-lg bg-white">
                    {tProduct('productCode', { sku: product.sku })}
                  </span>
                )}
                <FavoriteButton productId={product.id} className="ml-auto sm:ml-0" />
              </div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 mb-3 tracking-tight leading-snug max-w-xl">{product.name}</h1>

              {product.variants && product.variants.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-semibold text-slate-700 mb-2">
                    {product.category === 'Araç Şarj Kabloları' && product.id.startsWith('hims-22kw-tip2-')
                      ? tProduct('color')
                      : product.category === 'Araç Şarj Kabloları'
                        ? tProduct('length')
                        : tProduct('modelCapacity')}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {product.variants.map((v) => (
                      <button
                        key={v.key}
                        type="button"
                        onClick={() => setSelectedVariant(v)}
                        className={`rounded-xl border-2 px-4 py-2.5 text-left text-sm font-medium transition-colors ${selectedVariant?.key === v.key
                          ? 'border-brand bg-brand/10 text-brand'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                          }`}
                      >
                        <span className="block">{v.label}</span>
                        <span className="text-xs text-slate-500 mt-0.5">{formatPrice(v.price)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {formatPrice(effectiveVariant ? effectiveVariant.price : product.price)}
              </p>
              <p className="text-sm text-slate-400 mb-3">
                {tProduct('priceWithVAT')} {formatPrice((effectiveVariant ? effectiveVariant.price : product.price) * 1.20)}
              </p>
              <div className="mb-6">
                {outOfStock ? (
                  <span className="inline-flex items-center rounded-lg bg-brand-light px-3 py-1.5 text-sm font-semibold text-brand border border-brand/20">
                    {tProduct('soldOut')}
                  </span>
                ) : isLowStock ? (
                  <span className="inline-flex items-center rounded-lg bg-amber-50 px-3 py-1.5 text-sm font-semibold text-amber-800 border border-amber-200">
                    {tProduct('lowStock', { stock })}
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-lg bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-700 border border-emerald-200">
                    {tProduct('inStock')}
                  </span>
                )}
              </div>

              <div className="flex gap-2 sm:gap-3 mb-6">
                {cartQty === 0 ? (
                  <Button
                    disabled={outOfStock}
                    onClick={() => {
                      if (outOfStock) return
                      const cartId = effectiveVariant ? `${product.id}-${effectiveVariant.key}` : product.id
                      const displayName = effectiveVariant ? `${product.name} (${effectiveVariant.label})` : product.name
                      const price = effectiveVariant ? effectiveVariant.price : product.price
                      addItem({ id: cartId, name: displayName, description: product.description, price, image: product.image, category: product.category, quantity: 1 })
                      setCartQty(1)
                    }}
                    className="flex-1 rounded-xl min-h-12 h-auto py-3 px-4 sm:px-5 bg-brand hover:bg-brand-hover text-white font-semibold text-sm sm:text-base disabled:opacity-60 disabled:pointer-events-none flex items-center justify-center"
                  >
                    <ShoppingCart className="w-4 h-4 mr-2 shrink-0" />
                    {outOfStock ? tCart('outOfStock') : tCart('addToCart')}
                  </Button>
                ) : (
                  <div className="flex-1 flex items-center h-[52px] rounded-xl border-2 border-brand bg-brand/5 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => {
                        const newQty = cartQty - 1
                        const cartId = effectiveVariant ? `${product.id}-${effectiveVariant.key}` : product.id
                        if (newQty === 0) {
                          removeItem(cartId)
                        } else {
                          updateQuantity(cartId, newQty)
                        }
                        setCartQty(newQty)
                      }}
                      className="flex items-center justify-center h-12 w-12 text-brand hover:bg-brand/10 transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="flex-1 flex items-center justify-center text-brand font-bold text-base tabular-nums select-none">
                      {cartQty}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const newQty = Math.min(cartQty + 1, maxQuantity)
                        const cartId = effectiveVariant ? `${product.id}-${effectiveVariant.key}` : product.id
                        updateQuantity(cartId, newQty)
                        setCartQty(newQty)
                      }}
                      className="flex items-center justify-center h-12 w-12 text-brand hover:bg-brand/10 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                )}
                <Button
                  disabled={outOfStock}
                  onClick={() => {
                    if (outOfStock) return
                    const cartId = effectiveVariant ? `${product.id}-${effectiveVariant.key}` : product.id
                    const displayName = effectiveVariant ? `${product.name} (${effectiveVariant.label})` : product.name
                    const price = effectiveVariant ? effectiveVariant.price : product.price
                    const qty = cartQty > 0 ? cartQty : 1
                    addItem({ id: cartId, name: displayName, description: product.description, price, image: product.image, category: product.category, quantity: qty })
                    router.push('/cart')
                  }}
                  variant="destructive"
                  className="flex-1 rounded-xl h-12 px-4 sm:px-5 font-semibold text-sm sm:text-base disabled:opacity-60 disabled:pointer-events-none flex items-center justify-center"
                >
                  <Zap className="w-4 h-4 mr-2 shrink-0" />
                  <span className="break-words">{outOfStock ? tCart('outOfStock') : tProduct('buyNow')}</span>
                </Button>
              </div>

              {/* Uyumlu ürünler */}
              {(() => {
                const complementary = product.category ? COMPLEMENTARY_BY_CATEGORY[product.category] : undefined
                if (!complementary) return null
                const compatProducts = complementary.productIds
                  .filter((id) => id !== product.id && mockProductsMap[id])
                  .slice(0, 4)
                  .map((id) => mockProductsMap[id])
                  .filter(Boolean) as (typeof mockProducts)[number][]
                if (compatProducts.length === 0) return null
                return (
                  <div className="mt-5 pt-5 border-t border-slate-200">
                    <p className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-3">Uyumlu Ürünler</p>
                    {complementary.banner && (
                      <div className="mb-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 leading-relaxed">
                        {complementary.banner}
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-2">
                      {compatProducts.map((p) => (
                        <Link
                          key={p.id}
                          href={`/products/${p.id}`}
                          className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl p-2 hover:border-brand hover:shadow-sm transition-all group"
                        >
                          <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
                            {(p.images?.[0] ?? p.image) ? (
                              <img
                                src={p.images?.[0] ?? p.image}
                                alt={p.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Package className="w-5 h-5 text-slate-300" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-slate-800 line-clamp-2 leading-tight group-hover:text-brand transition-colors">{p.name}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )
              })()}

              {/* Güven / servis mini blok */}
              <div className="mt-5 grid grid-cols-4 gap-1.5">
                <div className="flex flex-col items-center text-center gap-1 bg-emerald-50 border border-emerald-100 rounded-xl p-2">
                  <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <p className="text-[12px] font-bold text-slate-800 leading-tight">2 Yıl Garanti</p>
                </div>
                <div className="flex flex-col items-center text-center gap-1 bg-blue-50 border border-blue-100 rounded-xl p-2">
                  <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                    <Truck className="w-3.5 h-3.5 text-blue-600" />
                  </div>
                  <p className="text-[12px] font-bold text-slate-800 leading-tight">Hızlı Kargo</p>
                </div>
                <div className="flex flex-col items-center text-center gap-1 bg-brand/5 border border-brand/15 rounded-xl p-2">
                  <div className="w-7 h-7 rounded-full bg-brand/10 flex items-center justify-center shrink-0">
                    <Headphones className="w-3.5 h-3.5 text-brand" />
                  </div>
                  <p className="text-[12px] font-bold text-slate-800 leading-tight">Teknik Destek</p>
                </div>
                <div className="flex flex-col items-center text-center gap-1 bg-amber-50 border border-amber-100 rounded-xl p-2">
                  <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                    <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                  </div>
                  <p className="text-[12px] font-bold text-slate-800 leading-tight">14 Gün İade</p>
                </div>
              </div>

              {/* Görselin sağında: Bu ürün size uygun mu? – tıklanınca mini form açılır */}
              <div className="mt-6 pt-6 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setContactFormOpen((o) => !o)}
                  className="text-sm font-semibold text-brand hover:text-brand/80 transition-colors text-left flex items-center gap-2"
                >
                  {tProduct('suitableQuestion')}
                  <ChevronRight className={`w-4 h-4 transition-transform ${contactFormOpen ? 'rotate-90' : ''}`} />
                </button>
                <p className="text-slate-600 text-sm mt-1.5">{tProduct('suitableDesc')}</p>
                {contactFormOpen && (
                  <div className="mt-4">
                    {contactSent ? (
                      <p className="text-sm text-green-600 font-medium py-2">{tProduct('contactSent')}</p>
                    ) : (
                      <form
                        className="space-y-2.5"
                        onSubmit={async (e) => {
                          e.preventDefault()
                          if (contactSubmitting || !contactForm.name.trim() || !contactForm.email.trim() || !contactForm.phone.trim() || !contactForm.message.trim()) return
                          setContactSubmitting(true)
                          try {
                            const { collection, addDoc, serverTimestamp } = await import('firebase/firestore')
                            const { getDb } = await import('@/lib/firebase/config')
                            const db = getDb()
                            await addDoc(collection(db, 'contactMessages'), {
                              name: contactForm.name.trim(),
                              email: contactForm.email.trim(),
                              phone: contactForm.phone.trim(),
                              subject: tProduct('contactSubject'),
                              message: `[Ürün: ${product.name}]\n\n${contactForm.message.trim()}`,
                              productId: product.id,
                              createdAt: serverTimestamp(),
                              status: 'new',
                            })
                            setContactSent(true)
                            addToast({ type: 'success', title: tProduct('sentTitle'), description: tProduct('sentDesc') })
                          } catch {
                            addToast({ type: 'error', title: tCart('errorTitle'), description: tProduct('sendErrorDesc') })
                          } finally {
                            setContactSubmitting(false)
                          }
                        }}
                      >
                        <input
                          type="text"
                          placeholder={tProduct('contactNamePlaceholder')}
                          value={contactForm.name}
                          onChange={(e) => setContactForm((f) => ({ ...f, name: e.target.value }))}
                          className="w-full h-9 rounded-lg border border-slate-200 px-3 text-sm"
                          required
                        />
                        <input
                          type="email"
                          placeholder={tProduct('contactEmailPlaceholder')}
                          value={contactForm.email}
                          onChange={(e) => setContactForm((f) => ({ ...f, email: e.target.value }))}
                          className="w-full h-9 rounded-lg border border-slate-200 px-3 text-sm"
                          required
                        />
                        <input
                          type="tel"
                          placeholder={tProduct('contactPhonePlaceholder')}
                          value={contactForm.phone}
                          onChange={(e) => setContactForm((f) => ({ ...f, phone: e.target.value }))}
                          className="w-full h-9 rounded-lg border border-slate-200 px-3 text-sm"
                          required
                        />
                        <textarea
                          placeholder={tProduct('contactMessagePlaceholder')}
                          value={contactForm.message}
                          onChange={(e) => setContactForm((f) => ({ ...f, message: e.target.value }))}
                          className="w-full min-h-[60px] rounded-lg border border-slate-200 px-3 py-2 text-sm resize-y"
                          rows={2}
                          required
                        />
                        <Button type="submit" disabled={contactSubmitting} size="sm" className="w-full rounded-lg h-9 text-sm font-semibold">
                          {contactSubmitting ? tProduct('contactSending') : (
                            <>
                              <Send className="w-3.5 h-3.5 mr-1.5" />
                              {tProduct('contactSend')}
                            </>
                          )}
                        </Button>
                      </form>
                    )}
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* Ürün Açıklamaları: sol = teknik tablo, sağ = akordiyon. Varyant seçiliyse o varyantın özellikleri gösterilir. */}
          {(() => {
            const displaySpecs = effectiveVariant?.specifications ?? product.specifications
            const hasSpecs = displaySpecs && Object.keys(displaySpecs).length > 0
            return (hasSpecs ||
              product.fullDescription ||
              product.description ||
              (product.features && product.features.length > 0) ||
              (product.descriptionSections && product.descriptionSections.length > 0)) ? (
              <div className="mt-10 pt-8 border-t border-slate-200">
                <div
                  className={`grid gap-8 md:gap-10 ${hasSpecs ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'
                    }`}
                >
                  {/* Sol: Ürün Özellikleri tablosu */}
                  {hasSpecs && (
                    <div className="min-w-0 max-w-2xl">
                      <h3 className="text-sm font-bold text-slate-900 mb-3">{tProduct('specifications')}</h3>
                      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                        <dl className="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
                          {Object.entries(displaySpecs).map(([key, value], i) => (
                            <React.Fragment key={key}>
                              <dt
                                className={`py-3 px-4 text-sm font-medium text-slate-600 bg-slate-50/80 ${i > 0 ? 'border-t border-slate-100' : ''}`}
                                title={key}
                              >
                                {key}
                              </dt>
                              <dd
                                className={`py-3 px-4 text-sm text-slate-900 border-l border-slate-200 ${i > 0 ? 'border-t border-slate-100' : ''}`}
                                title={String(value)}
                              >
                                {value}
                              </dd>
                            </React.Fragment>
                          ))}
                        </dl>
                      </div>
                    </div>
                  )}
                  {/* Sağ: Ürün Açıklamaları = sağdaki yazının başlığı */}
                  <div className="min-w-0 flex-1 space-y-6">
                    {(() => {
                      const rawDescription = product.fullDescription || product.description || ''
                      const hasExplicitSections = product.descriptionSections && product.descriptionSections.length > 0
                      const sections = hasExplicitSections
                        ? product.descriptionSections!
                        : parseDescriptionSections(rawDescription).sections
                      const intro = hasExplicitSections
                        ? rawDescription
                        : parseDescriptionSections(rawDescription).intro
                      const showAsAccordion = sections.length > 0

                      return (
                        <>
                          {(rawDescription || showAsAccordion) && (
                            <div>
                              <h3 className="text-sm font-bold text-slate-900 mb-3">{tProduct('descriptions')}</h3>
                              {showAsAccordion && intro ? (
                                <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line mb-4">{intro}</p>
                              ) : !showAsAccordion && rawDescription ? (
                                <div className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">
                                  {(product.fullDescription || product.description)
                                    ?.split(/\n/)
                                    .map((line, i) => {
                                      const colonIdx = line.indexOf(':')
                                      if (colonIdx > 0 && colonIdx < 60) {
                                        return (
                                          <span key={i}>
                                            <strong className="text-slate-900 font-semibold">{line.slice(0, colonIdx + 1)}</strong>
                                            {line.slice(colonIdx + 1)}
                                            {'\n'}
                                          </span>
                                        )
                                      }
                                      return <span key={i}>{line}{'\n'}</span>
                                    })}
                                </div>
                              ) : null}
                            </div>
                          )}
                          {showAsAccordion && (
                            <Accordion type="multiple" className="w-full">
                              {sections.map((section, i) => (
                                <AccordionItem key={i} value={`section-${i}`}>
                                  <AccordionTrigger>{section.title}</AccordionTrigger>
                                  <AccordionContent>
                                    <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">
                                      {section.content}
                                    </p>
                                  </AccordionContent>
                                </AccordionItem>
                              ))}
                            </Accordion>
                          )}
                        </>
                      )
                    })()}
                    {/* Ürün İçeriği – her zaman görünür, akordiyon değil */}
                    {product.features && product.features.length > 0 && (
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 mb-2">{tProduct('contents')}</h3>
                        <ul className="list-disc list-inside text-slate-600 text-sm leading-relaxed space-y-1">
                          {product.features.map((f, i) => (
                            <li key={i}>{f}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : null
          })()}

          {/* Diğer uzunluklar: sadece birleşik kablo sayfalarında, farklı metreler ayrı ürün kartları olarak */}
          {otherLengthProducts.length > 0 && (
            <div className="mt-10 pt-8 border-t border-slate-200 min-w-0">
              <h2 className="text-lg font-bold text-slate-900 mb-2">{tProduct('otherLengths')}</h2>
              <p className="text-sm text-slate-600 mb-4">{tProduct('otherLengthsDesc')}</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4 min-w-0">
                {otherLengthProducts.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={{
                      id: p.id,
                      name: p.name,
                      description: p.description,
                      price: p.price,
                      image: p.images?.[0] ?? p.image,
                      category: p.category,
                      brand: p.brand,
                    }}
                    oldPrice={p.oldPrice}
                    discount={p.discount}
                    badges={p.tags}
                    sku={p.sku}
                    stock={p.stock}
                    isVariantProduct={p.isVariantProduct}
                    variant="compact"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Bu serinin diğer varyantları (kablo dışı): kart grid, SKU listesi yok */}
          {familyVariants.length > 0 && (
            <div className="mt-10 pt-8 border-t border-slate-200 min-w-0">
              <h2 className="text-lg font-bold text-slate-900 mb-2">{tProduct('otherVariantsInSeries')}</h2>
              <p className="text-sm text-slate-600 mb-4">{tProduct('otherVariantsInSeriesDesc')}</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4 min-w-0">
                {familyVariants.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={{
                      id: p.id,
                      name: p.name,
                      description: p.description,
                      price: p.price,
                      image: p.images?.[0] ?? p.image,
                      category: p.category,
                      brand: p.brand,
                    }}
                    oldPrice={p.oldPrice}
                    discount={p.discount}
                    badges={p.tags}
                    sku={p.sku}
                    stock={p.stock}
                    isVariantProduct={p.isVariantProduct}
                    variant="compact"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Önerilen Ürünler – her ürün sayfasında en az 1 sıra mutlaka gösterilir */}
          <div className="mt-10 pt-8 border-t border-slate-200 min-w-0">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-slate-900">{tProduct('recommended')}</h2>
              <div className="hidden sm:flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('recommended-scroll-container')
                    if (el) el.scrollBy({ left: -300, behavior: 'smooth' })
                  }}
                  className="flex items-center justify-center w-10 h-10 rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('recommended-scroll-container')
                    if (el) el.scrollBy({ left: 300, behavior: 'smooth' })
                  }}
                  className="flex items-center justify-center w-10 h-10 rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="relative group/recommended-scroll">
              <div
                id="recommended-scroll-container"
                className="flex gap-4 overflow-x-auto scroll-smooth scrollbar-thin-h pb-6 snap-x snap-mandatory -mx-4 px-4 sm:-mx-6 sm:px-6 md:mx-0 md:px-0"
              >
                {recommendedProducts.map((rec) => (
                  <div key={rec.id} className="flex-none w-[200px] sm:w-[220px] md:w-[240px] snap-start">
                    <ProductCard
                      product={{
                        id: rec.id,
                        name: rec.name,
                        description: rec.description,
                        price: rec.price,
                        image: rec.images?.[0] ?? rec.image,
                        category: rec.category,
                        brand: rec.brand,
                      }}
                      oldPrice={rec.oldPrice}
                      discount={rec.discount}
                      badges={rec.tags}
                      sku={rec.sku}
                      stock={rec.stock}
                      isVariantProduct={rec.isVariantProduct}
                      variant="compact"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Değerlendirmeler */}
          <ProductReviews productId={productId} />

          {/* Soru & Cevap */}
          <ProductQA productId={productId} productName={product.name} />

        </div>
      </div>
    </ProductPageShell>
  )
}
