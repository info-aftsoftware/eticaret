/**
 * Mağaza ayarları ve sipariş toplamı hesaplama — tek kaynak.
 * Hem istemci (sepet, ödeme sayfası) hem sunucu (sipariş oluşturma, e-postalar) bu dosyayı kullanır;
 * böylece ekranda gösterilen tutar ile tahsil edilen tutar her zaman aynıdır.
 */

export const VAT_RATE = 20
/** Havale/EFT ile ödemede ara toplam üzerinden uygulanan indirim oranı (%) */
export const BANK_TRANSFER_DISCOUNT_RATE = 3
/** Havale/EFT siparişlerinde ödemenin beklendiği süre (gün) */
export const BANK_TRANSFER_PAYMENT_DAYS = 3

/** Havale/EFT hesap sahibi (şirket hesapları) */
export const BANK_ACCOUNT_HOLDER = 'AFET TEKNOLOJİLERİ TİC. VE SAN. LTD. ŞTİ.'

/** Havale/EFT için şirket hesapları (IBAN'lar kontrol hanesiyle doğrulandı) */
export const BANK_ACCOUNTS = [
  { bank: 'Ziraat Bankası', iban: 'TR37 0001 0001 8697 8290 8650 01' },
  { bank: 'Türkiye Finans', iban: 'TR05 0020 6000 2505 7595 1700 03' },
] as const

export const STORE_CONTACT = {
  name: 'Voltekno',
  email: 'info@voltekno.com',
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://voltekno.com',
} as const

export type CheckoutPaymentMethod = 'bank_transfer' | 'card'

export type OrderTotals = {
  subtotal: number
  couponDiscount: number
  paymentDiscount: number
  /** couponDiscount + paymentDiscount */
  discount: number
  /** KDV matrahı: ara toplam - indirimler */
  taxableAmount: number
  tax: number
  shipping: number
  total: number
}

export const round2 = (n: number) => Math.round(n * 100) / 100

/** KDV dahil fiyat (mağaza fiyatları KDV hariç tutulur) */
export const grossPrice = (net: number) => round2(net * (1 + VAT_RATE / 100))

/** Havale/EFT ile ödemede KDV dahil fiyat (indirim KDV matrahından düşülür; computeOrderTotals ile aynı kural) */
export const bankTransferGrossPrice = (net: number) => round2(net * (1 - BANK_TRANSFER_DISCOUNT_RATE / 100) * (1 + VAT_RATE / 100))

/**
 * İndirimler KDV matrahından düşülür (faturada doğru KDV için):
 *   matrah = ara toplam − kupon − havale indirimi
 *   toplam = matrah + KDV + kargo
 * Kargo: sepetin desisine göre fiyat listesinden (lib/shipping.ts → shippingFeeFor); çağıran hesaplayıp verir.
 */
export function computeOrderTotals(input: {
  subtotal: number
  couponDiscount?: number
  paymentMethod?: CheckoutPaymentMethod | null
  /** Vergiler dahil kargo ücreti (lib/shipping.ts → shippingFeeFor(cartLogistics(...))) */
  shippingFee: number
}): OrderTotals {
  const subtotal = round2(Math.max(0, input.subtotal))
  const couponDiscount = round2(Math.min(Math.max(0, input.couponDiscount ?? 0), subtotal))
  const paymentDiscount = input.paymentMethod === 'bank_transfer'
    ? round2((subtotal * BANK_TRANSFER_DISCOUNT_RATE) / 100)
    : 0
  const discount = round2(Math.min(couponDiscount + paymentDiscount, subtotal))
  const taxableAmount = round2(subtotal - discount)
  const tax = round2((taxableAmount * VAT_RATE) / 100)
  const shipping = subtotal === 0 ? 0 : round2(Math.max(0, input.shippingFee))
  const total = round2(taxableAmount + tax + shipping)
  return { subtotal, couponDiscount, paymentDiscount, discount, taxableAmount, tax, shipping, total }
}

