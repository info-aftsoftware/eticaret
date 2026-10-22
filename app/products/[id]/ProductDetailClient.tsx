'use client'

import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { trackViewItem } from '@/lib/analytics'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Package, ChevronRight, Minus, Plus, ShoppingCart, ZoomIn, X, ChevronLeft } from 'lucide-react'
import { fmtPrice } from '@/lib/format'
import { BANK_TRANSFER_DISCOUNT_RATE, bankTransferGrossPrice, grossPrice } from '@/lib/store-config'
import { useCurrencyStore } from '@/lib/store/useCurrencyStore'
import { useExchangeRates } from '@/lib/useExchangeRates'
import { useCartStore } from '@/lib/store/useCartStore'
import { useToast } from '@/components/ui/toast'
import { FavoriteButton } from '@/components/FavoriteButton'
import { StockAlertForm } from '@/components/StockAlertForm'
import { DeliveryEstimate } from '@/components/DeliveryEstimate'
import { BatteryContactBox } from '@/components/BatteryContactBox'
import { isContactOnlyProduct } from '@/lib/shipping/battery'
import { CompareButton } from '@/components/CompareButton'
import { mockProducts, COMPLEMENTARY_BY_CATEGORY, getComplementaryIds, type MockProduct } from '@/lib/products-mock'
import { CATEGORY_GROUPS, getCategoryKey, getGroupIdForCategory } from '@/lib/categories'
import { ProductCard } from '@/components/ProductCard'
import { useLocale, useTranslations } from 'next-intl'
import { localizeProduct, localizeSpecs, productName, textLang, toCatalogLocale } from '@/lib/catalog-en'
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
import { useL } from '@/lib/i18n-inline'
import { categoryHref } from '@/lib/seo/type-paths'
import { brandHref } from '@/lib/seo/brands'

const mockProductsMap: Record<string, MockProduct> = {}
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

type Props = { initialProduct?: MockProduct | null; productId?: string }

export default function ProductDetailClient({ initialProduct, productId: productIdProp }: Props = {}) {
  const params = useParams()
  const productId = (productIdProp ?? params?.id) as string
  const [rawProduct, setProduct] = useState<MockProduct | null>(initialProduct ?? null)
  const locale = toCatalogLocale(useLocale())
  // Sunucu/API İngilizce gönderir; yedek (koddaki katalog) Türkçe ürün de burada çevrilir
  const product = React.useMemo(() => (rawProduct ? localizeProduct(rawProduct, locale) : null), [rawProduct, locale])
  const [loading, setLoading] = useState(!initialProduct)
  const currency = useCurrencyStore((s) => s.currency)
  const { rates } = useExchangeRates()
  const formatPrice = (amount: number) => fmtPrice(amount, currency, rates?.rates ?? null)
  const tHeader = useTranslations('header')
  const tProduct = useTranslations('productDetail')
  const tCart = useTranslations('addToCart')
  const tCommon = useTranslations('common')
  const L = useL()
  const addItem = useCartStore((s) => s.addItem)
  const updateQuantity = useCartStore((s) => s.updateQuantity)
  const [cartMounted, setCartMounted] = useState(false)
  useEffect(() => setCartMounted(true), [])
  const { addToast } = useToast()
  const router = useRouter()
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  // Lightbox açıkken sayfa kaymasın; Esc ile kapanır
  useEffect(() => {
    if (!lightboxOpen) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setLightboxOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [lightboxOpen])
  /** Varyantlı ürünlerde seçilen seçenek (model/kapasite); yoksa ilk varyant veya null */
  const [selectedVariant, setSelectedVariant] = useState<{ key: string; label: string; price: number; sku?: string; specifications?: Record<string, string> } | null>(null)
  const [selectedIndex, setSelectedIndex] = useState(0)

  useEffect(() => {
    if (!productId) return
    // Sunucu ürünü hazır gönderdiyse sayfa iskelete dönmeden arka planda tazelenir (stok/kampanya)
    if (!initialProduct) setLoading(true)
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
      })
      .catch(() => {
        const data = mockProductsMap[productId] ?? null
        setProduct(data)
        const initialVariant =
          data?.defaultVariantKey && data.variants?.length
            ? data.variants.find((v) => v.key === data.defaultVariantKey) ?? data.variants[0]
            : data?.variants?.[0] ?? null
        setSelectedVariant(initialVariant)
      })
      .finally(() => setLoading(false))
  }, [productId, initialProduct])

  /** Varyant seçiliyse ve üründe imagesByVariant varsa o varyantın görselleri; yoksa product.images */
  const effectiveVariant =
    (selectedVariant && product?.variants?.find((v) => v.key === selectedVariant.key)) ?? selectedVariant ?? product?.variants?.[0] ?? null
  /** Sepet adedi doğrudan sepetten okunur (varyant değişince / başka sayfada eklenince doğru kalır) */
  const cartLineId = product ? (effectiveVariant ? `${product.id}-${effectiveVariant.key}` : product.id) : ''
  const cartQty = useCartStore((s) => (cartMounted ? s.items.find((i) => i.id === cartLineId)?.quantity ?? 0 : 0))
  // Varyantlar ürün stoğunu paylaşır
  const productCartQty = useCartStore((s) =>
    cartMounted && product
      ? s.items.filter((i) => (i.productId ?? i.id) === product.id || i.id === cartLineId).reduce((n, i) => n + i.quantity, 0)
      : 0
  )
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

  // GA4: ürün görüntüleme (ürün başına bir kez)
  const viewedProductId = React.useRef<string | null>(null)
  useEffect(() => {
    if (!product || viewedProductId.current === product.id) return
    viewedProductId.current = product.id
    void trackViewItem({ item_id: product.id, item_name: product.name, price: grossPrice(product.price), ...(product.category ? { item_category: product.category } : {}) })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.id])

  /** Önerilen ürünler: en az 4–5 adet; önce tamamlayıcı/kategori, eksikse genel listeden tamamlanır */
  const MIN_RECOMMENDED = 5
  const recommendedProducts = React.useMemo(() => {
    if (!product) return []
    const complementaryIds = getComplementaryIds(product).filter((id) => mockProductsMap[id])
    let ids = complementaryIds.length > 0
      ? complementaryIds
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
      .filter(Boolean) as MockProduct[]
  }, [product?.id, product?.category, product?.brand])

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
  // Akü / batarya: kargo kısıtları kontrol edilene kadar çevrim içi satılmaz, iletişim kutusu gösterilir
  const contactOnly = isContactOnlyProduct(product)
  const isLowStock = stock > 0 && stock <= 5

  /** Seçili seçeneği 1 adet sepete ekler (stok sınırı aşılırsa eklemez); eklendiyse true */
  const addCurrentToCart = (silent = false): boolean => {
    if (outOfStock) return false
    const displayName = effectiveVariant ? `${product.name} (${effectiveVariant.label})` : product.name
    const added = addItem({
      id: cartLineId,
      productId: product.id,
      maxQuantity: stock,
      name: displayName,
      description: product.description,
      price: effectiveVariant ? effectiveVariant.price : product.price,
      image: images[0] ?? product.image,
      category: product.category,
      quantity: 1,
    })
    if (added <= 0) {
      addToast({ type: 'info', title: tCart('stockLimit'), description: tCart('stockLimitDesc', { maxQty: stock }) })
      return false
    }
    if (!silent) addToast({ type: 'success', title: tCart('addedToCart'), description: L(`${displayName} sepete eklendi.`, `${displayName} added to cart.`), action: { label: L('Sepete git', 'Go to cart'), href: '/cart' } })
    return true
  }

  return (
    <ProductPageShell
      breadcrumbs={
        <nav aria-label={L('Sayfa konumu', 'Breadcrumb')} className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 flex-nowrap min-w-0 [&>a]:shrink-0 [&>svg]:shrink-0">
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
              <Link href={categoryHref(product.category)} className="hover:text-brand transition-colors">{categoryLabel}</Link>
            </>
          )}
          <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 text-slate-300 shrink-0" />
          <span className="text-slate-900 font-medium min-w-0 truncate">{product.name}</span>
        </nav>
      }
    >
      {/* Mobilde ikinci kart çerçevesi yok: sayfa kenar boşluğu yeterli */}
      <div className="bg-white sm:rounded-3xl sm:border sm:border-slate-200 sm:shadow-sm overflow-hidden min-w-0 overflow-x-hidden">
        <div className="py-4 sm:p-6 md:p-8 lg:p-12">
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

              {/* Lightbox: body'ye portal — sayfa kapsayıcısının içinde kalınca mobilde başlığın ve breadcrumb'ın altında kalıp kayıyordu */}
              {lightboxOpen && images.length > 0 && createPortal(
                <div
                  className="fixed inset-0 z-[1000] bg-black/90 flex items-center justify-center p-4 pt-16 pb-14"
                  role="dialog"
                  aria-modal="true"
                  aria-label={product.name}
                  onClick={() => setLightboxOpen(false)}
                >
                  <button
                    className="absolute top-3 right-3 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition-colors"
                    onClick={() => setLightboxOpen(false)}
                    aria-label={L('Kapat', 'Close')}
                  >
                    <X className="w-6 h-6" />
                  </button>
                  {images.length > 1 && (
                    <>
                      <button
                        className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-10 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-3 transition-colors"
                        onClick={(e) => { e.stopPropagation(); setLightboxIndex((i) => (i - 1 + images.length) % images.length) }}
                        aria-label={L('Önceki', 'Previous')}
                      >
                        <ChevronLeft className="w-6 h-6" />
                      </button>
                      <button
                        className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-10 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-3 transition-colors"
                        onClick={(e) => { e.stopPropagation(); setLightboxIndex((i) => (i + 1) % images.length) }}
                        aria-label={L('Sonraki', 'Next')}
                      >
                        <ChevronRight className="w-6 h-6" />
                      </button>
                    </>
                  )}
                  <div
                    className="relative w-full max-w-3xl max-h-full aspect-square"
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
                    <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1">
                      {images.map((_, i) => (
                        <button
                          key={i}
                          onClick={(e) => { e.stopPropagation(); setLightboxIndex(i) }}
                          aria-label={`${i + 1} / ${images.length}`}
                          aria-current={i === lightboxIndex ? 'true' : undefined}
                          className="p-2 min-h-0 min-w-0 flex items-center justify-center"
                        >
                          <span className={`block w-2 h-2 rounded-full transition-all ${i === lightboxIndex ? 'bg-white scale-125' : 'bg-white/40 hover:bg-white/70'}`} />
                        </button>
                      ))}
                    </div>
                  )}
                </div>,
                document.body
              )}
              {images.length > 1 && (
                <ul className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:thin]" aria-label={tProduct('otherImages')}>
                  {images.map((src, index) => (
                    <li key={src + index} className="shrink-0">
                      <button
                        type="button"
                        onClick={() => setSelectedIndex(index)}
                        aria-label={L(`${index + 1}. görsel`, `Image ${index + 1}`)}
                        aria-current={selectedIndex === index ? 'true' : undefined}
                        className={`relative block w-[72px] h-[72px] sm:w-20 sm:h-20 rounded-lg overflow-hidden border bg-white transition-colors ${selectedIndex === index
                          ? 'border-[#0b2540] ring-1 ring-[#0b2540]'
                          : 'border-[#e6ebf1] hover:border-[#8a99a8]'
                          }`}
                      >
                        <Image src={src} alt="" fill className="object-contain p-1.5" sizes="80px" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="flex flex-col min-w-0">
              {/* Üst satır: marka + favori / karşılaştır */}
              <div className="flex items-center justify-between gap-3 mb-3">
                {product.brand ? (
                  <Link
                    href={brandHref(product.brand)}
                    className="text-[13px] font-bold uppercase tracking-[0.08em] text-[#0b2540] hover:underline underline-offset-2"
                  >
                    {product.brand}
                  </Link>
                ) : <span />}
                <div className="flex items-center gap-2 shrink-0">
                  <FavoriteButton productId={product.id} />
                  <CompareButton productId={product.id} productName={product.name} />
                </div>
              </div>

              <h1 className="text-xl sm:text-2xl font-bold text-[#121926] tracking-tight leading-snug">{product.name}</h1>

              {/* Varyant seçimi */}
              {product.variants && product.variants.length > 0 && (
                <div className="mt-5">
                  <p className="text-[13px] font-semibold text-[#20384e] mb-2">{tProduct('modelCapacity')}</p>
                  <div className="grid grid-cols-1 min-[480px]:grid-cols-2 gap-2">
                    {product.variants.map((v) => {
                      const selected = (selectedVariant ?? product.variants?.[0])?.key === v.key
                      return (
                        <button
                          key={v.key}
                          type="button"
                          onClick={() => setSelectedVariant(v)}
                          aria-pressed={selected}
                          className={`rounded-lg border px-3.5 py-2.5 text-left transition-colors ${selected
                            ? 'border-[#0b2540] bg-[#f5f7fa] ring-1 ring-[#0b2540]'
                            : 'border-[#d3d9e1] bg-white hover:border-[#8a99a8]'
                            }`}
                        >
                          <span className="block text-[13.5px] font-medium text-[#121926] leading-snug">{v.label}</span>
                          <span className="block text-[12.5px] text-[#5d6e80] mt-0.5 tabular-nums">{formatPrice(v.price)}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Fiyat */}
              {(() => {
                const sp = product as typeof product & { oldPrice?: number; discount?: number; campaign?: { name: string; endsAt: string | null } }
                const price = effectiveVariant ? effectiveVariant.price : product.price
                const old = sp.campaign && sp.oldPrice
                  ? (effectiveVariant && sp.discount ? effectiveVariant.price / (1 - sp.discount / 100) : sp.oldPrice)
                  : null
                return (
                  <div className="mt-5">
                    {old && (
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-[15px] text-[#8a99a8] line-through tabular-nums">{formatPrice(old)}</span>
                        {!!sp.discount && <span className="rounded bg-[#d6262c] px-1.5 py-0.5 text-[11.5px] font-bold text-white">%{sp.discount}</span>}
                        <span className="text-[12.5px] text-[#5d6e80]">
                          {sp.campaign!.name}
                          {sp.campaign!.endsAt && ` · ${new Date(sp.campaign!.endsAt).toLocaleDateString(L('tr-TR', 'en-GB'), { day: '2-digit', month: 'long' })}${L(' tarihine kadar', '')}`}
                        </span>
                      </div>
                    )}
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <span className="text-[28px] sm:text-[32px] font-extrabold text-[#121926] tracking-tight tabular-nums">{formatPrice(price)}</span>
                      <span className="text-[13px] text-[#5d6e80]">
                        {L('KDV dahil', 'incl. VAT')} <span className="tabular-nums">{formatPrice(grossPrice(price))}</span>
                      </span>
                    </div>
                  </div>
                )
              })()}

              {/* Kısa bilgi tablosu */}
              <dl className="mt-5 border-y border-[#eef1f5] py-4 grid grid-cols-[112px_1fr] gap-y-2.5 text-[13.5px]">
                {product.category && categoryLabel && (
                  <>
                    <dt className="text-[#5d6e80]">{L('Kategori', 'Category')}</dt>
                    <dd>
                      <Link href={categoryHref(product.category)} className="text-[#0b2540] font-medium hover:underline underline-offset-2">
                        {categoryLabel}
                      </Link>
                    </dd>
                  </>
                )}
                {(effectiveVariant?.sku || product.sku) && (
                  <>
                    <dt className="text-[#5d6e80]">{L('Stok kodu', 'SKU')}</dt>
                    <dd className="text-[#121926] font-medium break-all">{effectiveVariant?.sku || product.sku}</dd>
                  </>
                )}
                <dt className="text-[#5d6e80]">{L('Stok', 'Stock')}</dt>
                <dd className={`font-semibold ${outOfStock ? 'text-[#d6262c]' : isLowStock ? 'text-amber-700' : 'text-emerald-700'}`}>
                  {outOfStock ? tProduct('soldOut') : isLowStock ? tProduct('lowStock', { stock }) : tProduct('inStock')}
                </dd>
                {!outOfStock && (
                  <>
                    <dt className="text-[#5d6e80]">{L('Havale/EFT', 'Bank transfer')}</dt>
                    <dd className="text-[#121926]">
                      <span className="font-semibold tabular-nums">
                        {formatPrice(bankTransferGrossPrice(effectiveVariant ? effectiveVariant.price : product.price))}
                      </span>
                      <span className="text-[#5d6e80]"> {L(`KDV dahil · %${BANK_TRANSFER_DISCOUNT_RATE} indirimli`, `incl. VAT · ${BANK_TRANSFER_DISCOUNT_RATE}% off`)}</span>
                    </dd>
                    <dt className="text-[#5d6e80]">{contactOnly ? L('Kargo', 'Shipping') : L('Teslimat', 'Delivery')}</dt>
                    <dd>{contactOnly ? <span className="font-medium text-[#0b2540]">{L('Kargo ve nakliye için iletişime geçin', 'Contact us for shipping')}</span> : <DeliveryEstimate compact />}</dd>
                  </>
                )}
              </dl>

              {outOfStock && <div className="mt-5"><StockAlertForm productId={product.id} /></div>}

              {/* Sepet butonları (akü / bataryada yerine iletişim kutusu) */}
              {contactOnly ? (
                <BatteryContactBox className="mt-5" productName={product.name} sku={effectiveVariant?.sku || product.sku} />
              ) : (
              <div className="mt-5 grid grid-cols-2 gap-2.5">
                {cartQty === 0 ? (
                  <Button
                    disabled={outOfStock}
                    onClick={() => addCurrentToCart()}
                    className="rounded-lg h-12 px-4 bg-[#0b2540] hover:bg-[#12335a] text-white font-semibold text-[15px] disabled:opacity-60 disabled:pointer-events-none flex items-center justify-center"
                  >
                    <ShoppingCart className="w-[18px] h-[18px] mr-2 shrink-0" aria-hidden />
                    {outOfStock ? tCart('outOfStock') : tCart('addToCart')}
                  </Button>
                ) : (
                  <div className="flex items-center h-12 rounded-lg border border-[#0b2540] overflow-hidden">
                    <button
                      type="button"
                      onClick={() => updateQuantity(cartLineId, cartQty - 1)}
                      className="flex items-center justify-center h-full w-12 text-[#0b2540] hover:bg-[#f1f4f8] transition-colors touch-manipulation"
                      aria-label={tCart('decreaseQty')}
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="flex-1 text-center text-[#0b2540] font-bold tabular-nums select-none" aria-live="polite">
                      {cartQty}<span className="sr-only">{L(' adet sepette', ' in cart')}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (productCartQty >= stock) {
                          addToast({ type: 'info', title: tCart('stockLimit'), description: tCart('stockLimitDesc', { maxQty: stock }) })
                          return
                        }
                        updateQuantity(cartLineId, cartQty + 1)
                      }}
                      aria-disabled={productCartQty >= stock}
                      className={`flex items-center justify-center h-full w-12 text-[#0b2540] transition-colors touch-manipulation ${productCartQty >= stock ? 'opacity-40' : 'hover:bg-[#f1f4f8]'}`}
                      aria-label={tCart('increaseQty')}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                )}
                <Button
                  disabled={outOfStock}
                  onClick={() => {
                    if (outOfStock) return
                    // Sepette zaten varsa adet değişmez; yoksa 1 adet eklenir
                    if (cartQty === 0 && !addCurrentToCart(true)) return
                    router.push('/cart')
                  }}
                  className="rounded-lg h-12 px-4 bg-[#f5b400] hover:bg-[#e0a500] text-[#111111] font-semibold text-[15px] disabled:opacity-60 disabled:pointer-events-none flex items-center justify-center"
                >
                  {outOfStock ? tCart('outOfStock') : tProduct('buyNow')}
                </Button>
              </div>
              )}

              {/* Uyumlu ürünler (eski "Bu ürün size uygun mu?" alanının yerinde) */}
              {(() => {
                const complementary = product.category ? COMPLEMENTARY_BY_CATEGORY[product.category] : undefined
                if (!complementary) return null
                const compatProducts = getComplementaryIds(product)
                  .filter((id) => mockProductsMap[id])
                  .slice(0, 4)
                  .map((id) => mockProductsMap[id])
                  .filter(Boolean) as MockProduct[]
                if (compatProducts.length === 0) return null
                return (
                  <section className="mt-7" aria-labelledby="compat-heading">
                    <h2 id="compat-heading" className="text-[15px] font-bold text-[#121926] mb-1">{L('Uyumlu ürünler', 'Compatible products')}</h2>
                    {complementary.banner && <p className="text-[12.5px] text-[#5d6e80] leading-relaxed mb-3">{complementary.banner}</p>}
                    <ul className="mt-3 divide-y divide-[#eef1f5] border border-[#e6ebf1] rounded-lg">
                      {compatProducts.map((p) => (
                        <li key={p.id}>
                          <Link href={`/products/${p.id}`} className="flex items-center gap-3 p-2.5 hover:bg-[#f7f8fa] transition-colors group">
                            <span className="relative w-12 h-12 shrink-0 rounded-md bg-white border border-[#eef1f5] overflow-hidden">
                              {(p.images?.[0] ?? p.image) ? (
                                <Image src={(p.images?.[0] ?? p.image)!} alt="" fill sizes="48px" className="object-contain p-1" />
                              ) : (
                                <Package className="w-5 h-5 text-slate-300 m-auto" aria-hidden />
                              )}
                            </span>
                            <span className="min-w-0 flex-1 text-[13px] font-medium text-[#20384e] line-clamp-2 leading-snug group-hover:text-[#0b2540]">{productName(p, locale)}</span>
                            <span className="shrink-0 text-[13px] font-semibold text-[#121926] tabular-nums">{formatPrice(p.price)}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </section>
                )
              })()}
            </div>
          </div>

          {/* Ürün Açıklamaları: sol = teknik tablo, sağ = akordiyon. Varyant seçiliyse o varyantın özellikleri gösterilir. */}
          {(() => {
            const displaySpecs = localizeSpecs(effectiveVariant?.specifications ?? product.specifications, locale)
            // HTML açıklama teknik tabloları zaten içerir; aynı bilgi iki kez gösterilmesin (özellikler karşılaştırma ve filtrede kullanılır)
            const hasSpecs = !product.descriptionHtml && !!displaySpecs && Object.keys(displaySpecs).length > 0
            return (hasSpecs ||
              product.descriptionHtml ||
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
                    {product.descriptionHtml ? (
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 mb-3">{tProduct('descriptions')}</h3>
                        {/* Excel'den (ikas) gelen HTML; import sırasında temizlenir (scripts/import-ikas-excel.py) */}
                        <div
                          className="product-description-html"
                          dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}
                        />
                      </div>
                    ) : (() => {
                      const rawDescription = product.fullDescription || product.description || ''
                      const hasExplicitSections = product.descriptionSections && product.descriptionSections.length > 0
                      const sections = hasExplicitSections
                        ? product.descriptionSections!
                        : parseDescriptionSections(rawDescription).sections
                      const intro = hasExplicitSections
                        ? rawDescription
                        : parseDescriptionSections(rawDescription).intro
                      const showAsAccordion = sections.length > 0
                      // Panelde yazılan uzun açıklama / bölümler yalnızca Türkçe; katalog kısa açıklaması çevrilmiş olabilir
                      const descLang =
                        locale === 'en' && (product.fullDescription || hasExplicitSections)
                          ? 'tr'
                          : textLang(rawProduct?.description, product.description, locale)

                      return (
                        <>
                          {(rawDescription || showAsAccordion) && (
                            <div>
                              <h3 className="text-sm font-bold text-slate-900 mb-3">{tProduct('descriptions')}</h3>
                              {showAsAccordion && intro ? (
                                <p lang={descLang} className="text-slate-600 text-sm leading-relaxed whitespace-pre-line mb-4">{intro}</p>
                              ) : !showAsAccordion && rawDescription ? (
                                <div lang={descLang} className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">
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
                            <Accordion type="multiple" className="w-full" lang={descLang}>
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
                        <ul lang={locale === 'en' ? 'tr' : undefined} className="list-disc list-inside text-slate-600 text-sm leading-relaxed space-y-1">
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
                className="flex gap-4 overflow-x-auto scroll-smooth scrollbar-thin-h pb-6 snap-x snap-mandatory -mx-4 px-4 scroll-px-4 sm:-mx-6 sm:px-6 sm:scroll-px-6 md:mx-0 md:px-0 md:scroll-px-0"
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
