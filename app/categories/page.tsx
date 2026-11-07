'use client'

import React from 'react'
import Link from '@/lib/i18n/navigation'
import { useTranslations } from 'next-intl'
import { ChevronRight } from 'lucide-react'
import { CATEGORY_GROUPS } from '@/lib/categories'
import { mockProducts } from '@/lib/products-mock'

export default function CategoriesPage() {
  const tHeader = useTranslations('header')
  const tHome = useTranslations('home')

  return (
    <div className="min-h-screen bg-surface pb-safe w-full max-w-full min-w-0 overflow-x-hidden">
      <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-8 py-8 md:py-12 max-w-7xl min-w-0">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-ink mb-2">
            {tHome('allCategoriesTitle')}
          </h1>
          <p className="text-ink-muted">
            {tHome('allCategoriesDesc')}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {CATEGORY_GROUPS.map((group) => ({
            group,
            count: mockProducts.filter((p) => (group.categoryValues as readonly string[]).includes(p.category)).length,
          })).filter(({ count }) => count > 0).map(({ group, count }) => {
            const label = tHeader(group.labelKey)
            return (
              <Link
                key={group.id}
                href={`/category/${group.id}`}
                className="group flex items-center gap-4 p-4 sm:p-5 rounded-2xl border border-palette bg-surface-elevated hover:border-brand/30 hover:shadow-md transition-all"
              >
                <div className="min-w-0 flex-1">
                  <h2 className="font-semibold text-ink truncate group-hover:text-brand transition-colors">
                    {label}
                  </h2>
                  <p className="text-sm text-ink-muted">
                    {tHome('productCount', { count })}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 shrink-0 text-ink-muted group-hover:text-brand transition-colors" />
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
