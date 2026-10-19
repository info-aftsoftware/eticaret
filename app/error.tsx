'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { ClassicPageShell } from '@/components/ClassicPageShell'
import { Button } from '@/components/ui/button'
import { RefreshCw, Home } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const t = useTranslations('error')

  useEffect(() => {
    console.error('Error boundary:', error)
  }, [error])

  return (
    <ClassicPageShell
      title={t('title')}
      description={t('description')}
    >
      <div className="py-12 text-center max-w-lg mx-auto">
        <p className="text-gray-600 mb-8">
          {t('hint')}
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button
            onClick={reset}
            className="btn-classic-primary rounded-lg inline-flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            {t('retry')}
          </Button>
          <Button asChild variant="outline" className="rounded-lg border-red-200 text-red-700 hover:bg-red-50">
            <Link href="/" className="inline-flex items-center gap-2">
              <Home className="w-4 h-4" />
              {t('home')}
            </Link>
          </Button>
        </div>
      </div>
    </ClassicPageShell>
  )
}
