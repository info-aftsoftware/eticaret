'use client'

import React, { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { BANK_ACCOUNTS, BANK_ACCOUNT_HOLDER } from '@/lib/store-config'

/** Havale/EFT şirket hesapları — IBAN kopyalama düğmesiyle (ödeme sonrası ve sipariş sayfası). */
export function BankAccountsList({ className = '' }: { className?: string }) {
  const [copied, setCopied] = useState<string | null>(null)
  const copy = async (iban: string) => {
    try {
      await navigator.clipboard.writeText(iban.replace(/\s/g, ''))
      setCopied(iban)
      setTimeout(() => setCopied((c) => (c === iban ? null : c)), 2000)
    } catch {}
  }
  return (
    <div className={`space-y-2 ${className}`}>
      <p className="text-sm"><span className="font-medium">Hesap sahibi:</span> {BANK_ACCOUNT_HOLDER}</p>
      {BANK_ACCOUNTS.map((a) => (
        <div key={a.iban} className="rounded-lg border border-amber-200 bg-white p-3">
          <p className="text-sm font-semibold text-amber-900">{a.bank}</p>
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-sm font-bold tracking-wide break-all text-amber-900">{a.iban}</span>
            <button
              type="button"
              onClick={() => copy(a.iban)}
              className="shrink-0 inline-flex items-center gap-1 rounded-md border border-amber-300 px-2 py-1.5 text-xs font-medium text-amber-900 hover:bg-amber-100 min-h-[32px]"
              aria-label={`${a.bank} IBAN'ını kopyala`}
            >
              {copied === a.iban ? <Check className="w-3.5 h-3.5" aria-hidden /> : <Copy className="w-3.5 h-3.5" aria-hidden />}
              {copied === a.iban ? 'Kopyalandı' : 'Kopyala'}
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
