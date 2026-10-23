/**
 * Ürün kataloğu – ana sayfa, liste, kategori, sepet ve ürün detay sayfalarında kullanılır.
 *
 * Kaynak: lib/catalog/products.json (ikas Excel'inden `python scripts/import-ikas-excel.py <xlsx>` ile üretilir).
 * Uzun HTML açıklamalar istemci paketine girmemesi için ayrı dosyadadır (lib/catalog/descriptions.json, yalnızca sunucu).
 *
 * Fiyatlar: Excel'de USD veya EUR (KDV hariç). `basePrice` + `priceCurrency` asıl fiyattır;
 * `price` TL karşılığıdır. JSON'daki TL değeri lib/catalog/fx-snapshot.json kuruyla hesaplanmıştır,
 * sunucu tarafında (lib/catalog-merge.ts) TCMB güncel kuruyla yeniden hesaplanır.
 */

import type { SaleMode } from '@/lib/sale-mode'
import catalog from './catalog/products.json'
import { CATEGORY_GROUPS } from './categories'
import { isTechnicallyCompatible } from './compat'

export type PriceCurrency = 'TRY' | 'USD' | 'EUR'

export interface ProductVariant {
  key: string
  label: string
  /** TL, KDV hariç */
  price: number
  /** Döviz cinsinden fiyat (priceCurrency) */
  basePrice?: number
  sku?: string
  /** Varyantın stoğu: yalnızca ürün "varyantlar ayrı stoklanır" ise dolu (lib/variant-stock.ts) */
  stock?: number
  specifications?: Record<string, string>
  /** Kargo: ölçüler (cm, U×G×Y), ağırlık (kg) ve desi = max(hacim/3000, kg) yukarı yuvarlanmış */
  dimensionsCm?: number[]
  weightKg?: number
  desi?: number
  /** Ölçü/ağırlık kaynağı: description (ürün açıklaması) | package | product | series (üretici kaynağı araştırması) */
  desiSource?: string
}

export interface MockProduct {
  id: string
  sku: string
  name: string
  /** Kısa açıklama (liste kartları, meta description) */
  description: string
  /** TL, KDV hariç */
  price: number
  /** Döviz cinsinden fiyat; priceCurrency ile birlikte TL fiyatın kaynağıdır */
  basePrice?: number
  priceCurrency?: PriceCurrency
  oldPrice?: number
  discount?: number
  rating?: number
  reviews?: number
  image?: string
  category: string
  stock: number
  featured: boolean
  isVariantProduct: boolean
  /** Varyantlar ayrı stoklanıyor (stock = varyant toplamı); panelden açılır (lib/variant-stock.ts) */
  variantStock?: boolean
  /** Etkin fiyatlandırma modu: fx dövize bağlı (basePrice × kur), fixed sabit TL (lib/catalog-merge.ts) */
  priceMode?: 'fx' | 'fixed'
  tags?: string[]
  /** SEO başlığı (<title>) */
  metaTitle?: string
  /** SEO ve satış odaklı kısa slogan */
  slogan?: string
  /** Detay sayfası "Açıklama" sekmesinde gösterilen uzun metin */
  fullDescription?: string
  /** Detay sayfasında HTML olarak gösterilen açıklama (yalnızca tek ürün API'si / sayfası doldurur) */
  descriptionHtml?: string
  /** Öne çıkan özellikler listesi (madde işaretli) */
  features?: string[]
  /** Garanti metni */
  warranty?: string
  /** Model / kapasite bilgisi */
  models?: string
  /** Teknik özellikler key-value (detay sayfası Teknik Özellikler sekmesi) */
  specifications?: Record<string, string>
  /** Ürün markası */
  brand?: string
  /** Detay sayfası galerisi (yoksa product.image kullanılır) */
  images?: string[]
  /** Varyant bazlı galeri (indeks variants sırasıyla eşleşir) */
  imagesByVariant?: string[][]
  /** Ürün seçenekleri (model); sepette ayrı kalem, fiyat seçeneğe göre */
  variants?: ProductVariant[]
  /** Açıklama sekmesinde açılır/kapanır (accordion) bölümler */
  descriptionSections?: { title: string; content: string }[]
  /** Aynı değere sahip ürünler detay sayfasında "Diğer seçenekler" olarak listelenir */
  productFamilyKey?: string
  /** Varyantlı ürünlerde sayfa açıldığında seçili olacak varyant key */
  defaultVariantKey?: string
  /** Kargo bilgisi (varyantlı üründe varsayılan varyantınki; varyant bazlısı variants[].desi) */
  dimensionsCm?: number[]
  weightKg?: number
  desi?: number
  desiSource?: string
  /** Satış biçimi: 'quote' teklifle satılır (fiyat yok), 'install' kurulum ve nakliye ayrıca (lib/sale-mode.ts) */
  saleMode?: SaleMode
  /** Lojistik panelden tanımlandı (A07): desi/kg ürün düzeyindeki değerlerden, desi.json yerine (lib/shipping/fee panelLineLogistics) */
  logisticsSource?: 'panel'
  /** Koli sayısı (panel lojistiği; desi ve ağırlık koli başına girilir) */
  packageCount?: number
  /** Yayın durumu: 'draft' panelde hazırlanıyor, vitrinde görünmez (A08) */
  status?: 'draft'
  /** Satışa kapalı (ürün grubu kapatıldı veya grup silinirken kapatıldı): nedeni; vitrinde stoksuz görünür, sipariş reddedilir */
  salesClosed?: string
}

/** Eksik ürün görselleri için placeholder */
export const PLACEHOLDER_PRODUCT_IMAGE = '/images/products/placeholder.png'

/** Sitede gizlenecek ürün id'leri (gerekirse doldurulur) */
export const PLACEHOLDER_PRODUCT_IDS: string[] = []

export const mockProducts: MockProduct[] = catalog as MockProduct[]

/** Ana kategoriye göre tamamlayıcı alt kategoriler (detay sayfası "Uyumlu Ürünler" ve öneriler) */
type ComplementaryText = { title: string; description: string }
const COMPLEMENTARY_BY_GROUP: Record<string, ComplementaryText & { categories: string[]; en: ComplementaryText }> = {
  'gunes-paneli': {
    en: { title: 'Buy together', description: 'Turn your solar panel into a complete system with a charge controller, inverter and lithium battery.' },
    title: 'Bu ürünle birlikte alın',
    description: 'Güneş panelinizi şarj kontrol cihazı, inverter ve lityum akü ile eksiksiz bir sisteme dönüştürün.',
    categories: ['MPPT Şarj Kontrol Cihazı', 'Tam Sinüs MPPT Akıllı İnverter', 'Lityum Akü', 'Kablo ve Konnektör'],
  },
  'solar-inverter': {
    en: { title: 'Frequently bought together', description: 'Complete your inverter with batteries, solar panels and connection equipment.' },
    title: 'Birlikte alınanlar',
    description: 'İnverterinizi akü, güneş paneli ve bağlantı ekipmanlarıyla tamamlayabilirsiniz.',
    categories: ['Lityum Akü', 'TopCon Güneş Paneli', 'Sigorta ve Dağıtım', 'İnverter Aksesuarı'],
  },
  'solar-aku': {
    en: { title: 'Frequently bought together', description: 'Use your battery with an inverter, charge controller and battery management equipment.' },
    title: 'Birlikte alınanlar',
    description: 'Akünüzü inverter, şarj kontrol cihazı ve batarya yönetim ekipmanlarıyla birlikte kullanın.',
    categories: ['Tam Sinüs MPPT Akıllı İnverter', 'MPPT Şarj Kontrol Cihazı', 'Batarya Yönetimi ve Aksesuar', 'Akü Şarj Cihazı'],
  },
  'solar-sarj-kontrol': {
    en: { title: 'Frequently bought together', description: 'Turn your charge controller into a complete system with a solar panel and battery.' },
    title: 'Birlikte alınanlar',
    description: 'Şarj kontrol cihazınızı güneş paneli ve akü ile eksiksiz bir sisteme dönüştürün.',
    categories: ['TopCon Güneş Paneli', 'Lityum Akü', 'Jel Akü', 'Şarj Kontrol Aksesuarı'],
  },
  'solar-baglanti-ekipmani': {
    en: { title: 'Frequently bought together', description: 'Use connection equipment together with inverters, batteries and monitoring products.' },
    title: 'Birlikte alınanlar',
    description: 'Bağlantı ekipmanlarını inverter, akü ve izleme ürünleriyle birlikte kullanın.',
    categories: ['Tam Sinüs MPPT Akıllı İnverter', 'Lityum Akü', 'MPPT Şarj Kontrol Cihazı', 'Batarya Yönetimi ve Aksesuar'],
  },
  'ruzgar-enerjisi': {
    en: { title: 'Frequently bought together', description: 'Complete your wind turbine with a charge controller, battery and inverter.' },
    title: 'Birlikte alınanlar',
    description: 'Rüzgar türbininizi şarj kontrol cihazı, akü ve inverter ile tamamlayın.',
    categories: ['Rüzgar Şarj Kontrol Cihazı', 'Rüzgar Türbini Aksesuarı', 'Lityum Akü', 'Tam Sinüs İnverter'],
  },
  'isi-pompasi': {
    en: { title: 'Frequently bought together', description: 'Lower running costs by powering your heat pump with solar panels and an inverter.' },
    title: 'Birlikte alınanlar',
    description: 'Isı pompanızı güneş paneli ve inverter ile besleyerek işletme maliyetini düşürebilirsiniz.',
    categories: ['TopCon Güneş Paneli', 'On-Grid İnverter', 'Hibrit İnverter'],
  },
  'elektrikli-arac-sarj': {
    en: { title: 'Frequently bought together', description: 'Complete your charging station with accessories and a solar energy system.' },
    title: 'Birlikte alınanlar',
    description: 'Şarj istasyonunuzu aksesuarları ve güneş enerjisi sistemiyle tamamlayın.',
    categories: ['Şarj İstasyonu Aksesuarı', 'TopCon Güneş Paneli', 'Hibrit İnverter'],
  },
}

/** Alt kategori (product.category) → tamamlayıcı ayarı; kendi alt kategorisi listeden çıkarılır. */
const COMPLEMENTARY_CATEGORIES: Record<string, ComplementaryText & { categories: string[]; en: ComplementaryText }> =
  Object.fromEntries(
    CATEGORY_GROUPS.flatMap((g) => {
      const config = COMPLEMENTARY_BY_GROUP[g.id]
      if (!config) return []
      return g.categoryValues.map((value) => [value, { ...config, categories: config.categories.filter((c) => c !== value) }])
    })
  )

/** Tamamlayıcı kategorilerden sırayla (her kategoriden birer) en fazla 8 ürün seçer */
function pickComplementaryIds(categories: string[]): string[] {
  const pools = categories.map((c) => mockProducts.filter((p) => p.category === c && p.image !== PLACEHOLDER_PRODUCT_IMAGE))
  const ids: string[] = []
  for (let i = 0; ids.length < 8 && pools.some((pool) => pool.length > i); i++) {
    for (const pool of pools) {
      if (pool[i] && ids.length < 8) ids.push(pool[i].id)
    }
  }
  return ids
}

/**
 * Ürüne özel tamamlayıcı ürünler: kategorinin tamamlayıcı kategorilerinden, önce aynı markanın ürünleri
 * (ör. Victron inverter → Victron batarya), sonra diğer markalar; her kategoriden sırayla, en fazla 8.
 */
export function getComplementaryIds(product: Pick<MockProduct, 'id' | 'category' | 'brand' | 'name'> & Partial<Pick<MockProduct, 'specifications' | 'variants'>>): string[] {
  const config = COMPLEMENTARY_CATEGORIES[product.category]
  if (!config) return []
  const pools = config.categories.map((c) => {
    // Teknik uyum (madde 6): DC sistem ürünlerinde voltaj sınıfı kesişmeli (lib/compat)
    const inCategory = mockProducts.filter((p) => p.category === c && p.id !== product.id && p.image !== PLACEHOLDER_PRODUCT_IMAGE && isTechnicallyCompatible(product, p))
    return [...inCategory.filter((p) => p.brand === product.brand), ...inCategory.filter((p) => p.brand !== product.brand)]
  })
  const ids: string[] = []
  for (let i = 0; ids.length < 8 && pools.some((pool) => pool.length > i); i++) {
    for (const pool of pools) {
      if (pool[i] && ids.length < 8) ids.push(pool[i].id)
    }
  }
  return ids
}

/** Kategoriye göre tamamlayıcı ürünler – tek şablon için (başlık, açıklama, ürün ID listesi; isteğe bağlı banner) */
export const COMPLEMENTARY_BY_CATEGORY: Record<string, ComplementaryText & { productIds: string[]; banner?: string; en: ComplementaryText }> =
  Object.fromEntries(
    Object.entries(COMPLEMENTARY_CATEGORIES).map(([category, c]) => [
      category,
      { title: c.title, description: c.description, en: c.en, productIds: pickComplementaryIds(c.categories) },
    ])
  )
