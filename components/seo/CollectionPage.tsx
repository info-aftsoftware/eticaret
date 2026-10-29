/**
 * Ürün türü ve marka sayfalarının ortak düzeni (sunucuda çizilir; Google ilk HTML'de her şeyi görür).
 * Sıra: kırıntı yolu → H1 + giriş → katalogdan özet (ürün sayısı, markalar/türler, başlangıç fiyatı) → ürünler →
 * alım rehberi (H2'ler) → sık sorulan sorular → ilgili bağlantılar. Görünür kırıntı yolu ile JSON-LD aynı yolu verir.
 */
import Link from 'next/link'
import type { ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'
import { PAGE_CONTAINER } from '@/lib/page-container'
import { ProductCard } from '@/components/ProductCard'
import type { StorefrontProduct } from '@/lib/discounts'
import { jsonLdHtml } from '@/lib/seo/json-ld'

export type Crumb = { name: string; href: string }
export type LinkItem = { label: string; href: string; note?: string }

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://voltekno.com').replace(/\/$/, '')
export const absUrl = (path: string) => `${SITE_URL}${path}`

export function CollectionPage({
  crumbs,
  h1,
  intro,
  facts,
  products,
  sections = [],
  faq = [],
  linkGroups = [],
  jsonLd,
  en = false,
}: {
  crumbs: Crumb[]
  h1: string
  intro: ReactNode
  facts: ReactNode
  products: StorefrontProduct[]
  sections?: { heading: string; body: string }[]
  faq?: { q: string; a: string }[]
  linkGroups?: { title: string; items: LinkItem[] }[]
  jsonLd: object[]
  /** İngilizce arayüz: çerçeve etiketleri İngilizce, Türkçe katalog içeriği lang="tr" ile işaretlenir */
  en?: boolean
}) {
  const contentLang = en ? 'tr' : undefined
  return (
    <div className="bg-white">
      {jsonLd.map((data, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdHtml(data) }} />
      ))}
      <div className={`${PAGE_CONTAINER} py-6 sm:py-8`}>
        <nav aria-label={en ? 'Breadcrumb' : 'Kırıntı yolu'} className="mb-4">
          <ol className="flex flex-wrap items-center gap-1.5 text-[13px] text-[#5d6e80]">
            {crumbs.map((c, i) => (
              <li key={c.href} className="flex items-center gap-1.5">
                {i > 0 && <ChevronRight className="h-3.5 w-3.5" aria-hidden />}
                {i === crumbs.length - 1 ? (
                  <span aria-current="page" className="font-medium text-[#121926]">{c.name}</span>
                ) : (
                  <Link href={c.href} className="hover:text-[#0b2540] hover:underline underline-offset-2">{c.name}</Link>
                )}
              </li>
            ))}
          </ol>
        </nav>

        <header className="max-w-3xl" lang={contentLang}>
          <h1 className="text-[26px] sm:text-[32px] font-bold leading-tight text-[#121926]">{h1}</h1>
          <div className="mt-3 text-[15px] leading-relaxed text-[#3b4a5a]">{intro}</div>
          <div className="mt-3 text-[13.5px] leading-relaxed text-[#5d6e80]">{facts}</div>
        </header>

        <section aria-label={en ? 'Products' : 'Ürünler'} className="mt-7">
          <ul className="grid grid-cols-1 min-[420px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
            {products.map((p, i) => (
              <li key={p.id} className="min-w-0">
                <ProductCard
                  priority={i < 4}
                  product={p}
                  oldPrice={p.oldPrice}
                  discount={p.discount}
                  sku={p.sku}
                  stock={p.stock}
                  isVariantProduct={p.isVariantProduct}
                />
              </li>
            ))}
          </ul>
        </section>

        {(sections.length > 0 || faq.length > 0) && (
          <div className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="max-w-3xl space-y-8" lang={contentLang}>
              {sections.map((s) => (
                <section key={s.heading}>
                  <h2 className="text-[20px] font-semibold text-[#121926]">{s.heading}</h2>
                  {s.body.split('\n\n').map((para, i) => (
                    <p key={i} className="mt-2.5 text-[15px] leading-relaxed text-[#3b4a5a]">{para}</p>
                  ))}
                </section>
              ))}
              {faq.length > 0 && (
                <section>
                  <h2 className="text-[20px] font-semibold text-[#121926]">{en ? 'Frequently asked questions' : 'Sık sorulan sorular'}</h2>
                  <div className="mt-3 divide-y divide-[#eef1f5] border-y border-[#eef1f5]">
                    {faq.map((f) => (
                      <div key={f.q} className="py-4">
                        <h3 className="text-[15.5px] font-semibold text-[#121926]">{f.q}</h3>
                        <p className="mt-1.5 text-[15px] leading-relaxed text-[#3b4a5a]">{f.a}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
            {linkGroups.length > 0 && (
              <aside className="space-y-6">
                {linkGroups.map((g) => (
                  <nav key={g.title} aria-label={g.title} className="rounded-xl border border-[#e6ebf1] p-5">
                    <h2 className="text-[15px] font-semibold text-[#121926]">{g.title}</h2>
                    <ul className="mt-3 space-y-2">
                      {g.items.map((it) => (
                        <li key={it.href}>
                          <Link href={it.href} className="text-[14px] text-[#0b2540] hover:underline underline-offset-2">{it.label}</Link>
                          {it.note && <span className="text-[13px] text-[#5d6e80]"> · {it.note}</span>}
                        </li>
                      ))}
                    </ul>
                  </nav>
                ))}
              </aside>
            )}
          </div>
        )}
        {sections.length === 0 && faq.length === 0 && linkGroups.length > 0 && (
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {linkGroups.map((g) => (
              <nav key={g.title} aria-label={g.title} className="rounded-xl border border-[#e6ebf1] p-5">
                <h2 className="text-[15px] font-semibold text-[#121926]">{g.title}</h2>
                <ul className="mt-3 space-y-2">
                  {g.items.map((it) => (
                    <li key={it.href}>
                      <Link href={it.href} className="text-[14px] text-[#0b2540] hover:underline underline-offset-2">{it.label}</Link>
                      {it.note && <span className="text-[13px] text-[#5d6e80]"> · {it.note}</span>}
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/** Ortak JSON-LD: kırıntı yolu + koleksiyon sayfası (tüm ürünler ItemList olarak) */
export function collectionJsonLd(crumbs: Crumb[], name: string, description: string, path: string, products: StorefrontProduct[]) {
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: crumbs.map((c, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: c.name,
        ...(i < crumbs.length - 1 ? { item: absUrl(c.href) } : {}),
      })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name,
      description,
      url: absUrl(path),
      inLanguage: 'tr',
      isPartOf: { '@id': `${SITE_URL}/#website` },
      mainEntity: {
        '@type': 'ItemList',
        numberOfItems: products.length,
        itemListElement: products.map((p, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          url: absUrl(`/products/${p.id}`),
          name: p.name,
        })),
      },
    },
  ]
}

const tl = new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 })
export const fmtTL = (n: number) => tl.format(n)
