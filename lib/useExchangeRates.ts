'use client'

import { useState, useEffect, useCallback } from 'react'
import fxSnapshot from '@/lib/catalog/fx-snapshot.json'

const REFETCH_INTERVAL_MS = 60 * 60 * 1000 // 1 saat

/** Ürün import'u sırasındaki TCMB kuru (1 TRY = x USD/EUR) */
const DEFAULT_RATES: ExchangeRates = {
  base: 'TRY',
  rates: { TRY: 1, USD: 1 / fxSnapshot.USD, EUR: 1 / fxSnapshot.EUR },
  updatedAt: new Date(`${fxSnapshot.date}T00:00:00+03:00`).toISOString(),
}

function isValidRates(data: unknown): data is ExchangeRates {
  const r = (data as ExchangeRates | null)?.rates
  return !!r && r.USD > 0 && r.EUR > 0
}

export type ExchangeRates = {
  base: 'TRY'
  rates: { TRY: number; USD: number; EUR: number }
  updatedAt: string
}

function trySetRates(
  setRates: (r: ExchangeRates | null) => void,
  setError: (e: boolean) => void,
  data: ExchangeRates
) {
  setRates(data)
  setError(false)
}

export function useExchangeRates(): { rates: ExchangeRates | null; loading: boolean; error: boolean } {
  const [rates, setRates] = useState<ExchangeRates | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const fetchRates = useCallback(() => {
    // Önce sunucu kuru (TCMB; ürün fiyatlandırmasıyla aynı kaynak).
    // Static hosting'de API yok: ücretsiz döviz API'si (CORS destekler), sonra public JSON, en son import anındaki kur.
    fetch('/api/exchange-rates')
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data: ExchangeRates) => (isValidRates(data) ? trySetRates(setRates, setError, data) : Promise.reject()))
      .catch(() =>
        fetch('https://api.exchangerate-api.com/v4/latest/TRY')
          .then((res) => (res.ok ? res.json() : Promise.reject()))
          .then((data: { rates: Record<string, number> }) => {
            const usd = data.rates?.USD ?? DEFAULT_RATES.rates.USD
            const eur = data.rates?.EUR ?? DEFAULT_RATES.rates.EUR
            trySetRates(setRates, setError, {
              base: 'TRY',
              rates: { TRY: 1, USD: usd, EUR: eur },
              updatedAt: new Date().toISOString(),
            })
          })
      )
      .catch(() =>
        fetch('/data/exchange-rates.json')
          .then((res) => (res.ok ? res.json() : Promise.reject()))
          .then((data: ExchangeRates) => trySetRates(setRates, setError, isValidRates(data) ? data : DEFAULT_RATES))
          .catch(() => trySetRates(setRates, setError, DEFAULT_RATES))
      )
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetchRates()
    const interval = setInterval(fetchRates, REFETCH_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [fetchRates])

  return { rates, loading, error }
}
