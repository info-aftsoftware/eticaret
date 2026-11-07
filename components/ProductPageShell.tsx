'use client'

import React from 'react'
import { PAGE_CONTAINER } from '@/lib/page-container'

interface ProductPageShellProps {
    children: React.ReactNode
    hero?: React.ReactNode
    breadcrumbs?: React.ReactNode
    showSidebar?: boolean
}

/**
 * Ürün ve kategori sayfaları için ortak shell: hero, breadcrumbs ve içerik alanı.
 * Kenarlar header/hero ile aynı (PAGE_CONTAINER). Breadcrumb tek satırdır: font yüklenince satır sayısı
 * değişip içeriği kaydırmasın (CLS).
 */
export function ProductPageShell({
    children,
    hero,
    breadcrumbs,
}: ProductPageShellProps) {
    return (
        <div className="min-h-screen min-h-[100dvh] bg-slate-50 flex flex-col w-full max-w-full min-w-0 overflow-x-hidden pt-0 mt-0">
            {hero && (
                <section className="w-full shrink-0 min-w-0">
                    {hero}
                </section>
            )}

            {breadcrumbs && (
                <div className="bg-white border-b border-slate-200 h-11 md:h-[52px] flex items-center shadow-sm shrink-0 px-safe mt-0">
                    <div className={`${PAGE_CONTAINER} overflow-hidden whitespace-nowrap`}>
                        {breadcrumbs}
                    </div>
                </div>
            )}

            <div className="flex-1 w-full max-w-full min-w-0 overflow-x-hidden pb-safe relative z-0">
                <div className={`${PAGE_CONTAINER} pt-4 sm:pt-6 md:pt-8 pb-16 sm:pb-20 md:pb-24 bg-slate-50`}>
                    <div className="min-w-0 max-w-full overflow-x-hidden w-full">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    )
}
