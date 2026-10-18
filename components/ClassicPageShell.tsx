'use client'

import React from 'react'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { useL } from '@/lib/i18n-inline'

export interface BreadcrumbItem {
  label: string
  href?: string
}

interface ClassicPageShellProps {
  /** Breadcrumb: Ana Sayfa > ... > Son */
  breadcrumbs?: BreadcrumbItem[]
  /** Sayfa başlığı (h1) */
  title?: string
  /** Başlık altı kısa açıklama */
  description?: string
  children: React.ReactNode
  /** İçerik arka planı */
  className?: string
  /** Başlık bölümünü gizle (sadece breadcrumb) */
  noTitle?: boolean
  /** Sayfa kendi görünür h1'ini çiziyorsa ekran okuyucu için gizli h1 eklenmez (sayfada tek h1) */
  pageHasOwnH1?: boolean
}

/**
 * Modern sayfa kabuğu: breadcrumb, başlık, container. Slate/white profesyonel stil.
 */
export function ClassicPageShell({
  breadcrumbs = [],
  title,
  description,
  children,
  className = '',
  noTitle = false,
  pageHasOwnH1 = false,
}: ClassicPageShellProps) {
  const L = useL()
  return (
    <div className={`min-h-screen bg-slate-50 pb-safe w-full max-w-full min-w-0 overflow-x-hidden ${className}`}>
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 md:px-8 lg:px-8 pt-5 pb-4 md:pt-6 md:pb-5 min-w-0">
          {breadcrumbs.length > 0 && (
            <nav className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-500 mb-2 min-h-[44px] items-center" aria-label="Breadcrumb">
              <Link href="/" className="py-2 -my-2 px-1 hover:text-slate-900 transition-colors touch-manipulation">
                {L('Ana Sayfa', 'Home')}
              </Link>
              {breadcrumbs.map((item, i) => (
                <React.Fragment key={i}>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                  {item.href ? (
                    <Link href={item.href} className="py-2 hover:text-slate-900 transition-colors touch-manipulation">
                      {item.label}
                    </Link>
                  ) : (
                    <span className="text-slate-900 font-semibold py-2">{item.label}</span>
                  )}
                </React.Fragment>
              ))}
            </nav>
          )}
          {/* Görünür başlık yoksa ekran okuyucular için sayfa başlığı (her sayfada tek h1) */}
          {(noTitle || !title) && !pageHasOwnH1 && breadcrumbs.length > 0 && (
            <h1 className="sr-only">{breadcrumbs[breadcrumbs.length - 1].label}</h1>
          )}
          {!noTitle && (title || description) && (
            <div className="mt-1 md:mt-2">
              {title && (
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
                  {title}
                </h1>
              )}
              {description && (
                <p className="mt-1 text-sm text-slate-600 md:text-base">{description}</p>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="container mx-auto max-w-7xl px-4 sm:px-6 md:px-8 lg:px-8 py-6 sm:py-8 md:py-10 min-w-0">
        {children}
      </div>
    </div>
  )
}
