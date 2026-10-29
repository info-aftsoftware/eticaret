/**
 * Marka sayfaları (/marka/<slug>). `name` katalogdaki product.brand değeriyle birebir aynıdır.
 * `about` yalnızca doğrulanabilir genel bilgi içerir; ürün türleri, sayılar ve fiyatlar sayfada katalogdan üretilir.
 */
export type BrandSeo = { slug: string; name: string; about?: string; aboutEn?: string }

export const BRANDS: BrandSeo[] = [
  {
    slug: 'tommatech',
    name: 'TommaTech',
    about: 'TommaTech, güneş paneli, inverter, lityum akü, ısı pompası ve elektrikli araç şarj ürünleri sunan bir Türk enerji markasıdır.',
    aboutEn: 'TommaTech is a Turkish energy brand offering solar panels, inverters, lithium batteries, heat pumps and EV charging products.',
  },
  {
    slug: 'victron',
    name: 'Victron',
    about: 'Hollanda merkezli Victron Energy; inverter ve şarj cihazları, MPPT şarj kontrol cihazları, akü izleme ve GX iletişim ürünleriyle off-grid, karavan ve tekne enerji sistemlerinde yaygın olarak kullanılır.',
    aboutEn: 'Netherlands-based Victron Energy is widely used in off-grid, RV and marine energy systems, with its inverters and chargers, MPPT charge controllers, battery monitors and GX communication products.',
  },
  {
    slug: 'deye',
    name: 'Deye',
    about: 'Deye, çatı ve ticari güneş enerjisi santrallerinde kullanılan hibrit ve on-grid inverterler üreten bir inverter markasıdır.',
    aboutEn: 'Deye is an inverter manufacturer producing hybrid and on-grid inverters for rooftop and commercial solar power plants.',
  },
  {
    slug: 'frecon',
    name: 'Frecon',
    about: 'Frecon, frekans invertörleri ve güneş enerjisiyle çalışan pompa sürücüleri üreten bir markadır; ürünleri tarımsal sulamada dalgıç ve yüzey pompalarını doğrudan panelden çalıştırmak için kullanılır.',
    aboutEn: 'Frecon manufactures frequency inverters and solar-powered pump drives, used in agricultural irrigation to run submersible and surface pumps directly from solar panels.',
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
