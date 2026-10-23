'use client'

/**
 * Açık ödeme yöntemleri (madde 2): footer rozetleri ve SSS kart ödemesini yalnız gerçekten açıkken anlatsın.
 * Kaynak /api/payments/methods (banka sanal POS bilgileri girilince card: true). Sayfa başına tek istek.
 */
import { useEffect, useState } from 'react'

export type PaymentMethods = { bankTransfer: boolean; card: boolean }

let request: Promise<PaymentMethods> | null = null

function loadMethods(): Promise<PaymentMethods> {
  if (!request) {
    request = fetch('/api/payments/methods')
      .then((r) => (r.ok ? r.json() : { bankTransfer: true, card: false }))
      .catch(() => ({ bankTransfer: true, card: false }))
  }
  return request
}

/** Yüklenene kadar kart kapalı varsayılır (açık olmayan yöntem bir an bile anlatılmasın) */
export function usePaymentMethods(): PaymentMethods {
  const [methods, setMethods] = useState<PaymentMethods>({ bankTransfer: true, card: false })
  useEffect(() => {
    let alive = true
    void loadMethods().then((m) => alive && setMethods({ bankTransfer: m.bankTransfer !== false, card: m.card === true }))
    return () => {
      alive = false
    }
  }, [])
  return methods
}
