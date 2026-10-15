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

import catalog from './catalog/products.json'

export type PriceCurrency = 'TRY' | 'USD' | 'EUR'

export interface ProductVariant {
  key: string
  label: string
  /** TL, KDV hariç */
  price: number
  /** Döviz cinsinden fiyat (priceCurrency) */
  basePrice?: number
  sku?: string
  specifications?: Record<string, string>
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
}

/** Eksik ürün görselleri için placeholder */
export const PLACEHOLDER_PRODUCT_IMAGE = '/images/products/placeholder.png'

/** Sitede gizlenecek ürün id'leri (gerekirse doldurulur) */
export const PLACEHOLDER_PRODUCT_IDS: string[] = []

export const mockProducts: MockProduct[] = catalog as MockProduct[]

/** Kategoriye göre tamamlayıcı ürün kategorileri (detay sayfası "Uyumlu Ürünler" ve öneriler) */
const COMPLEMENTARY_CATEGORIES: Record<string, { title: string; description: string; categories: string[] }> = {
  Panel: {
    title: 'Bu ürünle birlikte alın',
    description: 'Güneş panelinizi şarj kontrol cihazı, inverter ve lityum batarya ile eksiksiz bir sisteme dönüştürün.',
    categories: ['MPPT/PWM', 'İnverter', 'Lityum Batarya', 'Güç ve Veri Kabloları'],
  },
  'İnverter': {
    title: 'Birlikte alınanlar',
    description: 'İnverterinizi batarya, güneş paneli ve bağlantı ekipmanlarıyla tamamlayabilirsiniz.',
    categories: ['Lityum Batarya', 'Panel', 'Güç ve Veri Kabloları', 'Sistem Bileşenleri'],
  },
  'Lityum Batarya': {
    title: 'Birlikte alınanlar',
    description: 'Bataryanızı inverter, şarj kontrol cihazı ve sistem bileşenleriyle birlikte kullanın.',
    categories: ['İnverter', 'MPPT/PWM', 'Sistem Bileşenleri', 'AC/DC Şarj'],
  },
  'Kurşun/Jel Akü': {
    title: 'Birlikte alınanlar',
    description: 'Akünüzü uygun şarj cihazı, şarj kontrol cihazı ve inverter ile tamamlayın.',
    categories: ['AC/DC Şarj', 'MPPT/PWM', 'İnverter'],
  },
  'MPPT/PWM': {
    title: 'Birlikte alınanlar',
    description: 'Şarj kontrol cihazınızı güneş paneli ve akü/batarya ile eksiksiz bir sisteme dönüştürün.',
    categories: ['Panel', 'Lityum Batarya', 'Kurşun/Jel Akü'],
  },
  'Solar Pompa/Sürücü': {
    title: 'Birlikte alınanlar',
    description: 'Solar pompa sürücünüz için güneş paneli ve bağlantı kablolarını inceleyin.',
    categories: ['Panel', 'Güç ve Veri Kabloları'],
  },
  'Türbin ve Aksesuar': {
    title: 'Birlikte alınanlar',
    description: 'Rüzgar türbininizi şarj kontrol cihazı, batarya ve inverter ile tamamlayın.',
    categories: ['MPPT/PWM', 'Lityum Batarya', 'İnverter'],
  },
  'AC/DC Şarj': {
    title: 'Birlikte alınanlar',
    description: 'Şarj cihazınıza uygun akü ve bataryaları inceleyin.',
    categories: ['Lityum Batarya', 'Kurşun/Jel Akü'],
  },
  'Sistem Bileşenleri': {
    title: 'Birlikte alınanlar',
    description: 'Sisteminizi inverter, batarya ve kablolama ürünleriyle tamamlayın.',
    categories: ['İnverter', 'Lityum Batarya', 'Güç ve Veri Kabloları'],
  },
}

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

/** Kategoriye göre tamamlayıcı ürünler – tek şablon için (başlık, açıklama, ürün ID listesi; isteğe bağlı banner) */
export const COMPLEMENTARY_BY_CATEGORY: Record<string, { title: string; description: string; productIds: string[]; banner?: string }> =
  Object.fromEntries(
    Object.entries(COMPLEMENTARY_CATEGORIES).map(([category, c]) => [
      category,
      { title: c.title, description: c.description, productIds: pickComplementaryIds(c.categories) },
    ])
  )
