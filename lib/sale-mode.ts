/**
 * Ürünün satış biçimi (lib/catalog/products.json → saleMode; kaynak scripts/data/extra-products.json):
 *  - 'quote'  : fiyat gösterilmez, sepete eklenemez; ürün sayfasında "Teklif alın" (WhatsApp, telefon, e-posta, form).
 *               Sunucu sipariş ve kupon fiyatlamasında reddeder (lib/shipping/battery.ts → isContactOnlyProduct).
 *  - 'install': satın alınır; kurulum ve nakliye fiyata dahil değildir, kargo ücretine girmez (desi.json [0,0,0,1]),
 *               siparişten sonra müşteriyle iletişime geçilir (AFT şarj istasyonları).
 */
export type SaleMode = 'quote' | 'install'

type WithSaleMode = { saleMode?: string | null } | null | undefined

export const isQuoteOnly = (p: WithSaleMode) => p?.saleMode === 'quote'
export const isInstallShipping = (p: WithSaleMode) => p?.saleMode === 'install'

export const INSTALL_NOTE_TR = 'Kurulum ve nakliye fiyata dahil değildir; siparişinizden sonra sizinle iletişime geçeriz.'
export const INSTALL_NOTE_EN = 'Installation and delivery are not included in the price; we will contact you after your order.'
