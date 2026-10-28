/**
 * Kırıntı yolu şeması (BreadcrumbList) — sayfada görünen kırıntıyla aynı yol: Ana Sayfa › … › sayfa.
 * Son öğenin adresi verilmez (Google: isteğe bağlı). Sunucu bileşeni; ham HTML'de yer alır.
 */
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://voltekno.com').replace(/\/$/, '')

export type Crumb = { name: string; path?: string }

export function BreadcrumbJsonLd({ items }: { items: Crumb[] }) {
  const all: Crumb[] = [{ name: 'Ana Sayfa', path: '/' }, ...items]
  const data = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: all.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      ...(c.path && i < all.length - 1 ? { item: `${SITE_URL}${c.path === '/' ? '/' : c.path}` } : {}),
    })),
  }
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
}
