'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useCartStore, type CartItem } from '@/lib/store/useCartStore'
import { ClassicPageShell } from '@/components/ClassicPageShell'
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Heart,
  Info,
  Lock,
  Minus,
  Package,
  Plus,
  Shield,
  ShoppingBag,
  Tag,
  Trash2,
  Truck,
  X,
} from 'lucide-react'
import { fmtPrice } from '@/lib/format'
import { useCurrencyStore } from '@/lib/store/useCurrencyStore'
import { useExchangeRates } from '@/lib/useExchangeRates'
import { useAuthStore } from '@/lib/store/useAuthStore'
import { useTranslations } from 'next-intl'
import { CartRelatedProducts } from '@/components/CartRelatedProducts'
import { LegalDocumentDialog } from '@/components/LegalDocumentDialog'
import { trackViewCart, cartItemToGa } from '@/lib/analytics'
import type { LegalSlug } from '@/lib/legal/documents'
import { computeOrderTotals, grossPrice, BANK_TRANSFER_DISCOUNT_RATE, VAT_RATE } from '@/lib/store-config'
import { cartLogistics, shippingFeeFor } from '@/lib/shipping/fee'
import { useL } from '@/lib/i18n-inline'
import { DeliveryEstimate } from '@/components/DeliveryEstimate'
import { useCartValidation, type CartLineStatus } from '@/lib/useCartValidation'

const productIdOf = (item: CartItem, status?: CartLineStatus) => status?.productId ?? item.productId ?? item.id

function CartLine({
  item,
  status,
  priceChange,
  productQty,
  formatPrice,
}: {
  item: CartItem
  status?: CartLineStatus
  priceChange?: { from: number; to: number }
  productQty: number
  formatPrice: (n: number) => string
}) {
  const L = useL()
  const removeItem = useCartStore((s) => s.removeItem)
  const updateQuantity = useCartStore((s) => s.updateQuantity)
  const [draft, setDraft] = useState(String(item.quantity))
  const [imgError, setImgError] = useState(false)
  useEffect(() => setDraft(String(item.quantity)), [item.quantity])

  const max = status?.stock ?? item.maxQuantity
  // Bu kalemin alabileceği en fazla adet (aynı ürünün diğer seçenekleri stoğu paylaşır)
  const lineMax = max != null ? Math.max(0, max - (productQty - item.quantity)) : undefined
  const atMax = lineMax != null && item.quantity >= lineMax
  const unavailable = status && !status.available
  const href = `/products/${productIdOf(item, status)}`
  const needsVariant = unavailable && /seçenek/i.test(status?.error ?? '')
  const canFixQty = unavailable && !needsVariant && lineMax != null && lineMax > 0 && item.quantity > lineMax

  const commitDraft = () => {
    const n = parseInt(draft, 10)
    if (!Number.isFinite(n) || n < 1) {
      setDraft(String(item.quantity))
      return
    }
    updateQuantity(item.id, lineMax != null ? Math.min(n, Math.max(1, lineMax)) : n)
    if (lineMax != null && n > lineMax) setDraft(String(Math.max(1, lineMax)))
  }

  return (
    <li className={`py-4 first:pt-0 last:pb-0 ${unavailable ? 'opacity-100' : ''}`}>
      <div className="flex gap-3 sm:gap-4">
        <Link
          href={href}
          className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#e6ebf1] bg-white sm:h-24 sm:w-24"
        >
          {item.image && !imgError ? (
            <Image src={item.image} alt={item.name || L('Ürün', 'Product')} fill sizes="96px" className="object-contain p-1.5" onError={() => setImgError(true)} />
          ) : (
            <Package className="h-8 w-8 text-slate-300" />
          )}
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <Link href={href} className="line-clamp-2 text-sm font-semibold leading-snug text-[#121926] hover:text-[#0b2540] hover:underline sm:text-[15px]">
                {item.name || L('Ürün', 'Product')}
              </Link>
              <p className="mt-1 text-xs text-[#5d6e80]">
                {formatPrice(grossPrice(item.price))} {L('/ adet', '/ unit')} <span className="text-[#9aa8b6]">· {L('KDV dahil', 'incl. VAT')}</span>
              </p>
              {status?.campaign && <p className="mt-0.5 text-xs font-medium text-[#b42318]">{status.campaign}</p>}
              {item.isCustom && (
                <span className="mt-1 inline-block rounded bg-[#0b2540] px-1.5 py-0.5 text-[10px] font-semibold text-white">{L('Özel konfigürasyon', 'Custom configuration')}</span>
              )}
            </div>
            <button
              type="button"
              onClick={() => removeItem(item.id)}
              className="-mr-1 -mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#5d6e80] transition-colors hover:bg-red-50 hover:text-[#b42318] touch-manipulation"
              aria-label={L(`${item.name} sepetten kaldır`, `Remove ${item.name} from cart`)}
              title={L('Sepetten kaldır', 'Remove from cart')}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center rounded-lg border border-[#d3d9e1] bg-white">
              <button
                type="button"
                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                className="flex h-10 w-10 items-center justify-center text-[#20384e] transition-colors hover:bg-[#f5f7fa] disabled:opacity-40 touch-manipulation sm:h-9 sm:w-9"
                aria-label={L('Miktarı azalt', 'Decrease quantity')}
                disabled={item.quantity <= 1}
              >
                <Minus className="h-4 w-4" />
              </button>
              <input
                type="number"
                inputMode="numeric"
                min={1}
                max={lineMax || undefined}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={commitDraft}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
                }}
                className="h-10 w-14 !min-h-0 border-x border-[#e6ebf1] bg-transparent !px-1 !py-0 text-center text-sm font-semibold tabular-nums text-[#121926] [appearance:textfield] focus:outline-none sm:h-9 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                aria-label={L(`${item.name} adedi`, `${item.name} quantity`)}
              />
              <button
                type="button"
                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                className="flex h-10 w-10 items-center justify-center text-[#20384e] transition-colors hover:bg-[#f5f7fa] disabled:opacity-40 touch-manipulation sm:h-9 sm:w-9"
                aria-label={L('Miktarı artır', 'Increase quantity')}
                disabled={atMax}
                title={atMax ? L(`Stokta ${max} adet var`, `Only ${max} in stock`) : undefined}
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <div className="text-right">
              <p className="text-base font-bold tabular-nums text-[#121926]">{formatPrice(grossPrice(item.price * item.quantity))}</p>
              <p className="text-[11px] text-[#5d6e80]">{L('KDV dahil', 'incl. VAT')}</p>
              {max != null && max > 0 && max <= 5 && !unavailable && <p className="text-[11px] font-semibold text-amber-700">{L(`Son ${max} adet`, `Only ${max} left`)}</p>}
            </div>
          </div>

          {priceChange && !unavailable && (
            <p className="mt-2 flex items-start gap-1.5 rounded-md bg-[#eef4fb] px-2.5 py-1.5 text-xs text-[#20384e]">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
              <span>
                {L('Fiyat güncellendi:', 'Price updated:')} <span className="line-through">{formatPrice(priceChange.from)}</span> → <strong>{formatPrice(priceChange.to)}</strong>
              </span>
            </p>
          )}

          {unavailable && (
            <div role="alert" className="mt-2 rounded-md border border-red-200 bg-red-50 px-2.5 py-2 text-xs text-red-900">
              <p className="flex items-start gap-1.5">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                <span>{status?.error ?? L('Bu ürün şu anda satılamıyor.', 'This product is currently unavailable.')}</span>
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-x-4 pl-5">
                {canFixQty && (
                  <button type="button" onClick={() => updateQuantity(item.id, lineMax!)} className="inline-flex min-h-8 items-center font-semibold underline underline-offset-2">
                    {L(`Adedi ${lineMax} yap`, `Set quantity to ${lineMax}`)}
                  </button>
                )}
                {needsVariant && (
                  <Link href={href} className="inline-flex min-h-8 items-center font-semibold underline underline-offset-2">
                    {L('Seçenek seç', 'Select an option')}
                  </Link>
                )}
                <button type="button" onClick={() => removeItem(item.id)} className="inline-flex min-h-8 items-center font-semibold underline underline-offset-2">
                  {L('Sepetten çıkar', 'Remove from cart')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </li>
  )
}

export default function CartPage() {
  const router = useRouter()
  const t = useTranslations('cart')
  const L = useL()
  const currency = useCurrencyStore((s) => s.currency)
  const { rates } = useExchangeRates()
  const formatPrice = (amount: number) => fmtPrice(amount, currency, rates?.rates ?? null)
  const { items, clearCart, getTotalPrice, getTotalItems, _hasHydrated } = useCartStore()
  const { isAuthenticated } = useAuthStore()
  const { status, priceChanges, blocking } = useCartValidation()
  const [couponCode, setCouponCode] = useState('')
  const [couponDiscount, setCouponDiscount] = useState(0)
  const [couponError, setCouponError] = useState('')
  const [couponBusy, setCouponBusy] = useState(false)
  const storedCouponCode = useCartStore((s) => s.couponCode)
  const setStoredCouponCode = useCartStore((s) => s.setCouponCode)
  const [contractsAccepted, setContractsAccepted] = useState(false)
  const [privacyAccepted, setPrivacyAccepted] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [contractErrors, setContractErrors] = useState<{ contracts: boolean; privacy: boolean; kvkk: boolean }>({
    contracts: false,
    privacy: false,
    kvkk: false,
  })
  const [showModal, setShowModal] = useState<'sales' | 'privacy' | 'kvkk' | null>(null)
  const [confirmClear, setConfirmClear] = useState(false)
  const MODAL_DOCS: Record<'sales' | 'privacy' | 'kvkk', LegalSlug> = {
    sales: 'mesafeli-satis-sozlesmesi',
    privacy: 'gizlilik-ve-cerez-politikasi',
    kvkk: 'kvkk',
  }
  const [pageReady, setPageReady] = useState(false)

  // GA4: sepet görüntüleme (sepet yüklendikten sonra bir kez)
  const viewCartSent = React.useRef(false)
  useEffect(() => {
    if (!_hasHydrated || viewCartSent.current || items.length === 0) return
    viewCartSent.current = true
    void trackViewCart(items.map(cartItemToGa))
  }, [_hasHydrated, items])

  useEffect(() => {
    const timer = setTimeout(() => setPageReady(true), 250)
    return () => clearTimeout(timer)
  }, [])

  // Sunucuyla aynı hesaplayıcı; ödeme yöntemi ödeme adımında seçildiği için havale indirimi burada uygulanmaz
  const logistics = useMemo(() => cartLogistics(items), [items])
  const shippingDesi = logistics.desi
  const { subtotal, tax, shipping, total } = computeOrderTotals({ subtotal: getTotalPrice(), couponDiscount, shippingFee: shippingFeeFor(logistics) })

  /** Kupon sunucuda doğrulanır (ödeme sırasında aynı hesaplayıcı kullanılır). */
  const applyCoupon = useCallback(async (rawCode: string) => {
    const code = rawCode.trim()
    if (!code) return
    setCouponError('')
    setCouponBusy(true)
    try {
      const res = await fetch('/api/coupons/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, items: items.map((i) => ({ id: i.id, quantity: i.quantity })) }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.success) {
        setCouponDiscount(0)
        setStoredCouponCode(null)
        setCouponError(data?.error || L('Kupon kontrol edilemedi.', 'The coupon could not be verified.'))
        return
      }
      setCouponDiscount(Number(data.discount) || 0)
      setStoredCouponCode(data.couponCode)
    } catch {
      setCouponDiscount(0)
      setCouponError(L('Kupon kontrol edilemedi.', 'The coupon could not be verified.'))
    } finally {
      setCouponBusy(false)
    }
  }, [items, setStoredCouponCode, L])

  const removeCoupon = () => {
    setCouponDiscount(0)
    setStoredCouponCode(null)
    setCouponCode('')
    setCouponError('')
  }

  // Kayıtlı kupon varsa sepet değiştikçe indirimi sunucudan yeniden hesapla
  useEffect(() => {
    if (!_hasHydrated || !storedCouponCode || items.length === 0) return
    setCouponCode((prev) => prev || storedCouponCode)
    applyCoupon(storedCouponCode)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [_hasHydrated, items])

  const hasContractErrors = contractErrors.contracts || contractErrors.privacy || contractErrors.kvkk
  const hasBlocking = blocking.length > 0

  const handleCheckoutClick = () => {
    if (hasBlocking) return
    const nextErrors = {
      contracts: !contractsAccepted,
      privacy: !privacyAccepted,
      kvkk: !termsAccepted,
    }

    setContractErrors(nextErrors)

    if (nextErrors.contracts || nextErrors.privacy || nextErrors.kvkk) {
      return
    }

    router.push('/checkout')
  }

  const productQtyOf = (item: CartItem) => {
    const pid = productIdOf(item, status[item.id])
    return items.filter((i) => productIdOf(i, status[i.id]) === pid).reduce((n, i) => n + i.quantity, 0)
  }

  if (!pageReady && !_hasHydrated) {
    return (
      <ClassicPageShell breadcrumbs={[{ label: t('title') }]} title={t('title')} description="">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]" aria-busy="true">
          <div className="h-64 animate-pulse rounded-xl border border-[#e6ebf1] bg-white" />
          <div className="h-80 animate-pulse rounded-xl border border-[#e6ebf1] bg-white" />
        </div>
      </ClassicPageShell>
    )
  }

  if (items.length === 0) {
    return (
      <ClassicPageShell breadcrumbs={[{ label: t('title') }]} title={t('title')} noTitle>
        <div className="mx-auto flex max-w-lg flex-col items-center py-10 text-center sm:py-16">
          <span className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#f1f4f8]">
            <ShoppingBag className="h-9 w-9 text-[#0b2540]" />
          </span>
          <h2 className="text-xl font-bold text-[#121926] sm:text-2xl">{t('emptyTitle')}</h2>
          <p className="mt-2 text-sm leading-relaxed text-[#5d6e80] sm:text-base">
            {L('Güneş paneli, inverter, akü ve aksesuarlarda aradığınızı keşfedin. B2B ve proje siparişleri için', 'Discover what you need in solar panels, inverters, batteries and accessories. For B2B and project orders,')}{' '}
            <Link href="/contact" className="inline !min-h-0 !min-w-0 p-0 text-left font-semibold text-[#0b2540] underline-offset-2 hover:underline">
              {L('bize ulaşın', 'contact us')}
            </Link>
            .
          </p>
          <div className="mt-7 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Link
              href="/products"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[#0b2540] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#12335a]"
            >
              {t('goToProducts')}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/favorites"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-[#d3d9e1] bg-white px-6 text-sm font-semibold text-[#20384e] transition-colors hover:border-[#0b2540]"
            >
              <Heart className="h-4 w-4" />
              {L('Favorilerim', 'My Favorites')}
            </Link>
          </div>
        </div>
      </ClassicPageShell>
    )
  }

  const checkboxClass = (err: boolean) =>
    `mt-0.5 h-5 w-5 shrink-0 rounded border-[#d3d9e1] text-[#0b2540] focus:ring-2 focus:ring-[#0b2540]/30 ${err ? 'border-red-400' : ''}`

  return (
    <ClassicPageShell breadcrumbs={[{ label: t('title') }]} title={t('title')} description={`${getTotalItems()} ${t('itemsCount')}`}>
      <div className="grid min-w-0 max-w-full grid-cols-1 gap-5 pb-safe lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-8">
        <div className="min-w-0 space-y-5">
          {/* Kargo: sepetin desisine göre fiyat listesinden */}
          <div className="flex items-start gap-3 rounded-xl border border-[#e6ebf1] bg-white p-4 text-sm">
            <Truck className="mt-0.5 h-5 w-5 shrink-0 text-[#0b2540]" aria-hidden />
            <p className="text-[#20384e]">
              {L('Kargo ücreti sepetinizin hacim/ağırlığına göre hesaplanır:', 'Shipping is calculated from your cart volume/weight:')} <strong className="text-[#121926]">{shippingDesi} desi</strong> ·{' '}
              <strong className="text-[#121926] tabular-nums">{formatPrice(shipping)}</strong> <span className="text-[#5d6e80]">{L('(vergiler dahil)', '(incl. taxes)')}</span>
            </p>
          </div>

          <section className="rounded-xl border border-[#e6ebf1] bg-white" aria-labelledby="cart-items-heading">
            <div className="flex items-center justify-between gap-3 border-b border-[#f1f4f8] px-4 py-3 sm:px-5">
              <h2 id="cart-items-heading" className="text-base font-semibold text-[#121926]">
                {L('Ürünler', 'Products')} <span className="font-normal text-[#5d6e80]">({getTotalItems()})</span>
              </h2>
              {confirmClear ? (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-[#5d6e80]">{L('Sepet boşaltılsın mı?', 'Empty the cart?')}</span>
                  <button type="button" onClick={() => { clearCart(); setConfirmClear(false) }} className="rounded-md bg-[#b42318] px-2.5 py-1.5 font-semibold text-white">
                    {L('Evet', 'Yes')}
                  </button>
                  <button type="button" onClick={() => setConfirmClear(false)} className="rounded-md border border-[#d3d9e1] px-2.5 py-1.5 font-semibold text-[#20384e]">
                    {L('Vazgeç', 'Cancel')}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmClear(true)}
                  className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium text-[#5d6e80] transition-colors hover:bg-red-50 hover:text-[#b42318]"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  {t('clearCart')}
                </button>
              )}
            </div>
            {Object.keys(priceChanges).length > 0 && (
              <p role="status" className="mx-4 mt-4 flex items-start gap-2 rounded-lg border border-[#cfe0f2] bg-[#eef4fb] p-3 text-sm text-[#20384e] sm:mx-5">
                <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                {L('Bazı ürünlerin fiyatı güncellendi (kampanya veya fiyat değişikliği). Tutarlar güncel fiyatlarla gösteriliyor.', 'Prices of some items have been updated (promotion or price change). Amounts are shown at current prices.')}
              </p>
            )}
            <ul className="divide-y divide-[#f1f4f8] px-4 py-4 sm:px-5">
              {items.map((item) => (
                <CartLine
                  key={item.id}
                  item={item}
                  status={status[item.id]}
                  priceChange={priceChanges[item.id]}
                  productQty={productQtyOf(item)}
                  formatPrice={formatPrice}
                />
              ))}
            </ul>
          </section>

          <Link
            href="/products"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#0b2540] underline-offset-2 hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            {L('Alışverişe devam et', 'Continue shopping')}
          </Link>

          {/* Tamamlayıcı / Birlikte alınan ürünler */}
          <CartRelatedProducts
            cartItemIds={items.map((i) => i.id)}
            cartCategories={[...new Set(items.map((i) => i.category).filter((c): c is string => !!c))]}
          />
        </div>

        <aside className="min-w-0">
          <div className="rounded-xl border border-[#e6ebf1] bg-white p-4 sm:p-5 lg:sticky lg:top-24">
            <h2 className="text-base font-semibold text-[#121926]">{L('Sipariş özeti', 'Order summary')}</h2>

            <dl className="mt-4 space-y-2.5 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-[#5d6e80]">{L('Ara toplam', 'Subtotal')}</dt>
                <dd className="font-medium tabular-nums text-[#121926]">{formatPrice(subtotal)}</dd>
              </div>
              {couponDiscount > 0 && (
                <div className="flex justify-between gap-3 text-emerald-700">
                  <dt>{L('Kupon indirimi', 'Coupon discount')}</dt>
                  <dd className="font-medium tabular-nums">-{formatPrice(couponDiscount)}</dd>
                </div>
              )}
              <div className="flex justify-between gap-3">
                <dt className="text-[#5d6e80]">{L(`KDV (%${VAT_RATE})`, `VAT (${VAT_RATE}%)`)}</dt>
                <dd className="font-medium tabular-nums text-[#121926]">{formatPrice(tax)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-[#5d6e80]">{L('Kargo', 'Shipping')}</dt>
                <dd className="font-medium tabular-nums text-[#121926]">
                  {formatPrice(shipping)}
                </dd>
              </div>
            </dl>

            <div className="mt-4 flex items-baseline justify-between gap-3 border-t border-[#e6ebf1] pt-4">
              <span className="text-base font-semibold text-[#121926]">{L('Toplam', 'Total')}</span>
              <span className="text-xl font-bold tabular-nums text-[#121926]">{formatPrice(total)}</span>
            </div>
            <p className="mt-1 text-xs text-[#5d6e80]">
              {L('Havale/EFT ile ödemede ara toplam üzerinden', 'Pay by Bank Transfer (EFT) and get')} <strong className="text-emerald-700">{L(`%${BANK_TRANSFER_DISCOUNT_RATE} indirim`, `${BANK_TRANSFER_DISCOUNT_RATE}% off`)}</strong>{L('.', ' the subtotal.')}
            </p>

            {/* Kupon */}
            <div className="mt-5">
              {storedCouponCode && couponDiscount > 0 ? (
                <div className="flex items-center justify-between gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm">
                  <span className="flex items-center gap-2 font-medium text-emerald-800">
                    <Tag className="h-4 w-4" aria-hidden />
                    {storedCouponCode}
                  </span>
                  <button type="button" onClick={removeCoupon} className="inline-flex h-7 w-7 items-center justify-center rounded-md text-emerald-800 hover:bg-emerald-100" aria-label={L('Kuponu kaldır', 'Remove coupon')}>
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    applyCoupon(couponCode)
                  }}
                >
                  <label htmlFor="coupon" className="mb-1.5 block text-xs font-medium text-[#20384e]">
                    {L('Kupon kodu', 'Coupon code')}
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="coupon"
                      placeholder={L('Kodunuzu girin', 'Enter your code')}
                      value={couponCode}
                      onChange={(e) => {
                        setCouponCode(e.target.value)
                        setCouponError('')
                      }}
                      className="h-10 min-w-0 flex-1 rounded-lg border border-[#d3d9e1] px-3 text-sm uppercase placeholder:normal-case focus:border-[#0b2540] focus:outline-none focus:ring-2 focus:ring-[#0b2540]/15"
                    />
                    <button
                      type="submit"
                      disabled={!couponCode.trim() || couponBusy}
                      className="h-10 shrink-0 rounded-lg border border-[#0b2540] px-4 text-sm font-semibold text-[#0b2540] transition-colors hover:bg-[#0b2540] hover:text-white disabled:opacity-50"
                    >
                      {L('Uygula', 'Apply')}
                    </button>
                  </div>
                  {couponError && <p className="mt-1.5 text-xs text-[#b42318]">{couponError}</p>}
                </form>
              )}
            </div>

            <DeliveryEstimate className="mt-5" />

            {/* Sözleşme ve şartlar */}
            <fieldset className={`mt-5 space-y-1 rounded-lg border p-3 transition-colors ${hasContractErrors ? 'border-red-200 bg-red-50/70' : 'border-[#e6ebf1] bg-[#f5f7fa]'}`}>
              <legend className="sr-only">{L('Sözleşme ve şartlar', 'Agreements and terms')}</legend>
              <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-[#20384e]">
                <Shield className="h-3.5 w-3.5" aria-hidden />
                {L('Sözleşme ve şartlar', 'Agreements and terms')}
              </p>
              <label className="flex cursor-pointer items-start gap-2.5 py-1.5 touch-manipulation">
                <input
                  type="checkbox"
                  checked={contractsAccepted}
                  onChange={(e) => {
                    setContractsAccepted(e.target.checked)
                    setContractErrors((prev) => ({ ...prev, contracts: false }))
                  }}
                  className={checkboxClass(contractErrors.contracts)}
                />
                <span className="text-xs leading-relaxed text-[#20384e]">
                  {L('', 'I have read and accept the ')}
                  <button type="button" onClick={(e) => { e.preventDefault(); setShowModal('sales') }} className="inline !min-h-0 !min-w-0 p-0 text-left font-semibold text-[#0b2540] underline-offset-2 hover:underline">{L('Mesafeli Satış Sözleşmesi', 'Distance Sales Agreement')}</button>
                  {L("'ni okudum ve kabul ediyorum.", '.')}
                </span>
              </label>
              <label className="flex cursor-pointer items-start gap-2.5 py-1.5 touch-manipulation">
                <input
                  type="checkbox"
                  checked={privacyAccepted}
                  onChange={(e) => {
                    setPrivacyAccepted(e.target.checked)
                    setContractErrors((prev) => ({ ...prev, privacy: false }))
                  }}
                  className={checkboxClass(contractErrors.privacy)}
                />
                <span className="text-xs leading-relaxed text-[#20384e]">
                  {L('', 'I have read the ')}
                  <button type="button" onClick={(e) => { e.preventDefault(); setShowModal('privacy') }} className="inline !min-h-0 !min-w-0 p-0 text-left font-semibold text-[#0b2540] underline-offset-2 hover:underline">{L('Gizlilik ve Çerez Politikası', 'Privacy and Cookie Policy')}</button>
                  {L("'nı okudum.", '.')}
                </span>
              </label>
              <label className="flex cursor-pointer items-start gap-2.5 py-1.5 touch-manipulation">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => {
                    setTermsAccepted(e.target.checked)
                    setContractErrors((prev) => ({ ...prev, kvkk: false }))
                  }}
                  className={checkboxClass(contractErrors.kvkk)}
                />
                <span className="text-xs leading-relaxed text-[#20384e]">
                  {L('', 'I have read the ')}
                  <button type="button" onClick={(e) => { e.preventDefault(); setShowModal('kvkk') }} className="inline !min-h-0 !min-w-0 p-0 text-left font-semibold text-[#0b2540] underline-offset-2 hover:underline">{L('KVKK Aydınlatma Metni', 'KVKK Privacy Notice')}</button>
                  {L("'ni okudum, kişisel verilerimin işlenmesi hakkında bilgilendirildim.", ' and have been informed about the processing of my personal data.')}
                </span>
              </label>
              {hasContractErrors && (
                <p role="alert" className="pt-1 text-xs font-medium text-[#b42318]">{L('Devam etmek için tüm onayları işaretleyin.', 'Please tick all boxes to continue.')}</p>
              )}
            </fieldset>

            {hasBlocking && (
              <p role="alert" className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-900">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                {L(
                  `Devam etmek için uyarı olan ${blocking.length > 1 ? `${blocking.length} ürünü` : 'ürünü'} düzenleyin veya sepetten çıkarın.`,
                  blocking.length > 1
                    ? `To continue, update or remove the ${blocking.length} flagged items from your cart.`
                    : 'To continue, update or remove the flagged item from your cart.'
                )}
              </p>
            )}

            <button
              type="button"
              onClick={handleCheckoutClick}
              disabled={hasBlocking}
              className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#f5b400] text-[15px] font-bold text-[#111] transition-colors hover:bg-[#e0a500] disabled:cursor-not-allowed disabled:opacity-50 touch-manipulation"
            >
              {t('checkout')}
              <ArrowRight className="h-4 w-4" />
            </button>

            {!isAuthenticated && (
              <p className="mt-3 text-center text-xs text-[#5d6e80]">
                {L('Üye olmadan da sipariş verebilirsiniz.', 'You can order without an account.')}{' '}
                <Link href="/login?redirect=/cart" className="inline !min-h-0 !min-w-0 p-0 text-left font-semibold text-[#0b2540] underline-offset-2 hover:underline">
                  {L('Giriş yapın', 'Sign in')}
                </Link>
                {L(', sepetiniz hesabınıza taşınsın.', ' to save your cart to your account.')}
              </p>
            )}

            <p className="mt-4 flex items-center justify-center gap-1.5 border-t border-[#f1f4f8] pt-4 text-xs text-[#5d6e80]">
              <Lock className="h-3.5 w-3.5" aria-hidden />
              {L('Güvenli ödeme · Kişisel verileriniz korunur', 'Secure payment · Your personal data is protected')}
            </p>
          </div>
        </aside>
      </div>

      {/* Sözleşme penceresi: metinler lib/legal/documents.json (voltekno.com ile aynı) */}
      <LegalDocumentDialog slug={showModal ? MODAL_DOCS[showModal] : null} onClose={() => setShowModal(null)} />
    </ClassicPageShell>
  )
}
