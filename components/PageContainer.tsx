'use client'

import React from 'react'
import { usePathname } from '@/lib/i18n/navigation'
import { PAGE_CONTAINER } from '@/lib/page-container'

/**
 * Sayfa içerik kabı: tüm sayfalar header/hero ile aynı kenarları kullanır.
 * Tam genişlik sayfalar (ana sayfa, ürün/kategori listeleri, blog, paketler, hakkımızda) kendi kaplarını kurar.
 */
const FULLWIDTH_PREFIXES = ['/products', '/category', '/blog', '/paketler', '/hakkimizda']

const isFullwidth = (p: string) => p === '/' || FULLWIDTH_PREFIXES.some((x) => p === x || p.startsWith(x + '/'))

export function PageContainer({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? ''
  if (isFullwidth(pathname)) {
    return <div className="w-full min-w-0 overflow-x-hidden">{children}</div>
  }
  return <div className={`${PAGE_CONTAINER} overflow-x-hidden pt-5 pb-4 lg:pt-7 lg:pb-8`}>{children}</div>
}
