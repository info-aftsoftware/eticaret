export const dynamic = 'force-dynamic'

/**
 * Resmi kur (TCMB) – TRY bazlı. Saatlik önbellek.
 * Ürün fiyatlandırmasıyla aynı kaynak (lib/fx-rates): TCMB today.xml → open.er-api.com → import anındaki kur.
 */

import { NextResponse } from 'next/server'
import { getTryRates } from '@/lib/fx-rates'

const CACHE_MAX_AGE = 60 * 60 // 1 saat (saniye)

export type ExchangeRatesResponse = {
  base: 'TRY'
  /** 1 TRY = x USD/EUR */
  rates: { TRY: number; USD: number; EUR: number }
  updatedAt: string
}

export async function GET() {
  const tr = await getTryRates()
  const body: ExchangeRatesResponse = {
    base: 'TRY',
    rates: { TRY: 1, USD: 1 / tr.USD, EUR: 1 / tr.EUR },
    updatedAt: tr.updatedAt,
  }
  const live = tr.source !== 'snapshot'
  return NextResponse.json(body, {
    headers: {
      'Cache-Control': live ? `public, s-maxage=${CACHE_MAX_AGE}, stale-while-revalidate=3600` : 'public, s-maxage=60',
    },
  })
}
