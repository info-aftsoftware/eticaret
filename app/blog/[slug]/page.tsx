import React from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { ArrowLeft, Clock, Tag, ArrowRight } from 'lucide-react'
import { getLocale } from 'next-intl/server'
import { BLOG_POSTS, blogDateIso, type BlogPost } from '@/lib/blog-posts'
import { BLOG_POSTS_EN } from '@/lib/blog-posts-en'
import { localizedMetadata } from '@/lib/locale-metadata'
import { PRODUCT_TYPES } from '@/lib/seo/product-types'
import { localizeType, typeHref } from '@/lib/seo/taxonomy'

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://voltekno.com').replace(/\/$/, '')

const BLOG_CONTENT = BLOG_POSTS

function renderContent(content: string) {
  const lines = content.trim().split('\n')
  const elements: React.ReactNode[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i].trim()

    if (!line) { i++; continue }

    if (line.startsWith('### ')) {
      elements.push(
        <h3 key={i} className="text-lg font-bold text-slate-900 mt-8 mb-3 leading-snug">
          {line.replace('### ', '')}
        </h3>
      )
    } else if (line.startsWith('## ')) {
      elements.push(
        <h2 key={i} className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-10 mb-4 leading-snug">
          {line.replace('## ', '')}
        </h2>
      )
    } else if (line.startsWith('**') && line.endsWith('**')) {
      elements.push(
        <p key={i} className="font-bold text-slate-800 mt-5 mb-1">
          {line.replace(/\*\*/g, '')}
        </p>
      )
    } else if (line.startsWith('- ')) {
      const listItems: string[] = []
      while (i < lines.length && lines[i].trim().startsWith('- ')) {
        listItems.push(lines[i].trim().replace('- ', ''))
        i++
      }
      elements.push(
        <ul key={`ul-${i}`} className="list-disc list-inside space-y-1.5 text-slate-600 text-sm sm:text-base my-3 pl-2">
          {listItems.map((item, j) => (
            <li key={j} dangerouslySetInnerHTML={{ __html: item.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
          ))}
        </ul>
      )
      continue
    } else if (/^\d+\./.test(line)) {
      const listItems: string[] = []
      while (i < lines.length && /^\d+\./.test(lines[i].trim())) {
        listItems.push(lines[i].trim().replace(/^\d+\.\s*/, ''))
        i++
      }
      elements.push(
        <ol key={`ol-${i}`} className="list-decimal list-inside space-y-1.5 text-slate-600 text-sm sm:text-base my-3 pl-2">
          {listItems.map((item, j) => (
            <li key={j} dangerouslySetInnerHTML={{ __html: item.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
          ))}
        </ol>
      )
      continue
    } else if (line.startsWith('|')) {
      const tableLines: string[] = []
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        tableLines.push(lines[i].trim())
        i++
      }
      const headers = tableLines[0].split('|').filter(Boolean).map(h => h.trim())
      const rows = tableLines.slice(2).map(row => row.split('|').filter(Boolean).map(c => c.trim()))
      elements.push(
        <div key={`table-${i}`} className="overflow-x-auto my-6 rounded-xl border border-slate-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {headers.map((h, j) => (
                  <th key={j} className="text-left px-4 py-3 font-bold text-slate-700 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, j) => (
                <tr key={j} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                  {row.map((cell, k) => (
                    <td key={k} className="px-4 py-3 text-slate-600" dangerouslySetInnerHTML={{ __html: cell.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
      continue
    } else {
      elements.push(
        <p key={i} className="text-slate-600 text-sm sm:text-base leading-relaxed my-3"
          dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}
        />
      )
    }
    i++
  }

  return elements
}

/** Yazı, ziyaretçinin dilinde (İngilizcesi lib/blog-posts-en.ts; slug, kategori adresi ve yayın tarihi ortak) */
function localizedPost(slug: string, post: BlogPost, locale: string): BlogPost {
  const en = locale === 'en' ? BLOG_POSTS_EN[slug] : undefined
  return en ? { ...post, ...en } : post
}

export async function generateStaticParams() {
  return Object.keys(BLOG_CONTENT).map((slug) => ({ slug }))
}

export async function generateMetadata(props: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const params = await props.params;
  const post = BLOG_CONTENT[params.slug]
  if (!post) return { title: 'Yazı Bulunamadı' }
  const en = BLOG_POSTS_EN[params.slug]
  const trMetadata: Metadata = {
    title: `${post.title} | Voltekno Blog`,
    description: post.desc,
    alternates: { canonical: `/blog/${params.slug}` },
    openGraph: { type: 'article', title: post.title, description: post.desc, url: `/blog/${params.slug}` },
  }
  if (!en) return trMetadata
  return localizedMetadata(trMetadata, { title: `${en.title} | Voltekno Blog`, description: en.desc, shareTitle: en.title })
}

export default async function BlogPostPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const source = BLOG_CONTENT[params.slug]
  if (!source) notFound()

  const locale = await getLocale()
  const L = (tr: string, en: string) => (locale === 'en' ? en : tr)
  const post = localizedPost(params.slug, source, locale)

  const otherPosts = Object.entries(BLOG_CONTENT)
    .filter(([slug]) => slug !== params.slug)
    .slice(0, 3)
    .map(([slug, p]) => [slug, localizedPost(slug, p, locale)] as const)

  // Yazının konusuyla ilgili ürün türü sayfaları (lib/seo/product-types.ts → blog alanı)
  const relatedTypes = PRODUCT_TYPES.filter((t) => t.blog.includes(params.slug)).map((t) => localizeType(t, locale))
  const published = blogDateIso(source.date)
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE_URL}/blog/${params.slug}` },
      headline: post.title,
      description: post.desc,
      ...(published && { datePublished: `${published}T09:00:00+03:00`, dateModified: `${published}T09:00:00+03:00` }),
      author: { '@type': 'Organization', name: 'Voltekno', url: `${SITE_URL}/hakkimizda` },
      publisher: { '@id': `${SITE_URL}/#organization` },
      inLanguage: locale === 'en' ? 'en' : 'tr',
      articleSection: post.category,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: L('Ana Sayfa', 'Home'), item: `${SITE_URL}/` },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE_URL}/blog` },
        { '@type': 'ListItem', position: 3, name: post.title },
      ],
    },
  ]

  return (
    <div className="min-h-full bg-white">
      {jsonLd.map((d, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(d) }} />
      ))}
      {/* Hero */}
      <div className="bg-[#f5f7fa] border-b border-[#e6ebf1] pt-12 pb-14 px-4 mt-5 lg:mt-7">
        <div className="container mx-auto max-w-3xl">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-[#3b4a5a] hover:text-[#0b2540] text-sm mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Blog
          </Link>
          <div className="flex items-center gap-3 mb-5">
            <span className="text-xs font-bold uppercase tracking-widest bg-white border border-[#e6ebf1] text-[#0b2540] rounded-lg px-3 py-1.5">
              {post.category}
            </span>
            <span className="flex items-center gap-1 text-xs text-[#5d6e80]">
              <Clock className="w-3.5 h-3.5" /> {L(`${post.readTime} okuma`, `${post.readTime} read`)}
            </span>
            <span className="text-xs text-[#5d6e80]">{post.date}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#121926] leading-tight mb-4">
            {post.title}
          </h1>
          <p className="text-[#5d6e80] text-base leading-relaxed max-w-2xl">
            {post.desc}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="py-12 px-4">
        <div className="container mx-auto max-w-3xl">
          <article className="prose-custom">
            {renderContent(post.content)}
          </article>

          {/* CTA */}
          <div className="mt-14 rounded-2xl border border-brand/20 bg-brand/5 p-8 text-center">
            <h3 className="text-xl font-extrabold text-slate-900 mb-2">
              {L('Bu konuda ürün arıyor musunuz?', 'Looking for products on this topic?')}
            </h3>
            <p className="text-slate-500 text-sm mb-5">
              {L('Voltekno\'da 340+ ürün stokta. Hızlı teslimat, 2 yıl garanti.', '340+ products in stock at Voltekno. Fast delivery, 2-year warranty.')}
            </p>
            {relatedTypes.length > 0 && (
              <ul className="mb-5 flex flex-wrap justify-center gap-2">
                {relatedTypes.map((t) => (
                  <li key={t.slug}>
                    <Link href={typeHref(t.category)} className="inline-flex rounded-full border border-slate-300 bg-white px-3.5 py-1.5 text-sm font-medium text-slate-700 hover:border-slate-500">
                      {t.h1}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/products"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand hover:bg-brand-hover text-white font-bold px-6 py-3 text-sm transition-colors"
              >
                {L('Ürünleri İncele', 'Browse Products')} <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/ges"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold px-6 py-3 text-sm transition-colors"
              >
                {L('Teklif Al', 'Get a Quote')}
              </Link>
            </div>
          </div>

          {/* Other posts */}
          {otherPosts.length > 0 && (
            <div className="mt-14">
              <h3 className="text-lg font-extrabold text-slate-900 mb-5">{L('Diğer Yazılar', 'Other Articles')}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {otherPosts.map(([slug, p]) => (
                  <Link
                    key={slug}
                    href={`/blog/${slug}`}
                    className="group block rounded-xl border border-slate-200 p-4 hover:border-brand/40 hover:shadow-md transition-all"
                  >
                    <span className="text-[10px] font-bold uppercase tracking-widest text-brand mb-2 block">{p.category}</span>
                    <h4 className="text-sm font-bold text-slate-800 group-hover:text-brand transition-colors line-clamp-2 leading-snug mb-1">
                      {p.title}
                    </h4>
                    <span className="flex items-center gap-1 text-[11px] text-slate-400">
                      <Clock className="w-3 h-3" /> {p.readTime}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
