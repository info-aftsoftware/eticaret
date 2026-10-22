/**
 * Marka sayfaları (/marka/<slug>). `name` katalogdaki product.brand değeriyle birebir aynıdır.
 * `about` yalnızca doğrulanabilir genel bilgi içerir; ürün türleri, sayılar ve fiyatlar sayfada katalogdan üretilir.
 */
export type BrandSeo = { slug: string; name: string; about?: string }

export const BRANDS: BrandSeo[] = [
  {
    slug: 'tommatech',
    name: 'TommaTech',
    about: 'TommaTech, güneş paneli, inverter, lityum akü, ısı pompası ve elektrikli araç şarj ürünleri sunan bir Türk enerji markasıdır.',
  },
  {
    slug: 'victron',
    name: 'Victron',
    about: 'Hollanda merkezli Victron Energy; inverter ve şarj cihazları, MPPT şarj kontrol cihazları, akü izleme ve GX iletişim ürünleriyle off-grid, karavan ve tekne enerji sistemlerinde yaygın olarak kullanılır.',
  },
  {
    slug: 'deye',
    name: 'Deye',
    about: 'Deye, çatı ve ticari güneş enerjisi santrallerinde kullanılan hibrit ve on-grid inverterler üreten bir inverter markasıdır.',
  },
  {
    slug: 'frecon',
    name: 'Frecon',
    about: 'Frecon, frekans invertörleri ve güneş enerjisiyle çalışan pompa sürücüleri üreten bir markadır; ürünleri tarımsal sulamada dalgıç ve yüzey pompalarını doğrudan panelden çalıştırmak için kullanılır.',
  },
  { slug: 'havensis', name: 'Havensis' },
  { slug: 'aft-power', name: 'AFT Power' },
  { slug: 'istabreeze', name: 'İstabreeze' },
  { slug: 'electrozirve', name: 'Electrozirve' },
  { slug: 'apex', name: 'Apex' },
  { slug: 'exelon', name: 'Exelon' },
  { slug: 'altech', name: 'Altech' },
  { slug: 'np-power', name: 'NP Power' },
  { slug: 'alpex', name: 'Alpex' },
  { slug: 'mexxsun', name: 'Mexxsun' },
]

const BY_NAME = new Map(BRANDS.map((b) => [b.name.toLocaleLowerCase('tr'), b]))
const BY_SLUG = new Map(BRANDS.map((b) => [b.slug, b]))

export const brandBySlug = (slug: string) => BY_SLUG.get(slug)
export const brandByName = (name?: string | null) => (name ? BY_NAME.get(name.toLocaleLowerCase('tr')) : undefined)
/** Marka sayfası adresi; tanımlı değilse ürün listesinin marka filtresi */
export const brandHref = (name: string) => {
  const b = brandByName(name)
  return b ? `/marka/${b.slug}` : `/products?brand=${encodeURIComponent(name)}`
}
