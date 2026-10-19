'use client'

import React, { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { BANK_ACCOUNTS, BANK_ACCOUNT_HOLDER } from '@/lib/store-config'
import { useL } from '@/lib/i18n-inline'

/** label: düğmenin tam erişilebilir adı (çağıran tarafta çevrilmiş olarak gelir) */
function CopyButton({ value, label }: { value: string; label: string }) {
  const L = useL()
  const [done, setDone] = useState(false)
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value)
          setDone(true)
          setTimeout(() => setDone(false), 2000)
        } catch {}
      }}
      className="inline-flex h-8 shrink-0 items-center gap-1 rounded-md border border-[#d3d9e1] bg-white px-2.5 text-xs font-medium text-[#20384e] hover:bg-[#f5f7fa]"
      aria-label={label}
    >
      {done ? <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden /> : <Copy className="h-3.5 w-3.5" aria-hidden />}
      {done ? L('Kopyalandı', 'Copied') : L('Kopyala', 'Copy')}
    </button>
  )
}

/** Havale/EFT ödeme bilgileri: tutar, açıklama (sipariş no), son tarih ve IBAN'lar (kopyalanabilir). */
export function BankTransferDetails({ orderNo, amount, dueDate }: { orderNo: string; amount?: string | null; dueDate?: string | null }) {
  const L = useL()
  return (
    <div className="space-y-3">
      <dl className="grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-[#e6ebf1] bg-[#e6ebf1] sm:grid-cols-2">
        {amount && (
          <div className="bg-white px-4 py-3">
            <dt className="text-xs text-[#5d6e80]">{L('Ödenecek tutar', 'Amount due')}</dt>
            <dd className="mt-0.5 text-lg font-bold text-[#0b2540] tabular-nums">{amount}</dd>
          </div>
        )}
        {dueDate && (
          <div className="bg-white px-4 py-3">
            <dt className="text-xs text-[#5d6e80]">{L('Son ödeme tarihi', 'Payment due date')}</dt>
            <dd className="mt-0.5 text-[15px] font-semibold text-[#121926]">{dueDate}</dd>
          </div>
        )}
        <div className="bg-white px-4 py-3 sm:col-span-2">
          <dt className="text-xs text-[#5d6e80]">{L('Açıklama', 'Payment reference')}</dt>
          <dd className="mt-0.5 flex items-center justify-between gap-2">
            <span className="whitespace-nowrap font-mono text-[15px] font-semibold text-[#121926]">{orderNo}</span>
            <CopyButton value={orderNo} label={L('Sipariş numarasını kopyala', 'Copy order number')} />
          </dd>
        </div>
      </dl>
      <p className="text-[13px] text-[#5d6e80]">{L('Alıcı:', 'Recipient:')} <span className="font-medium text-[#20384e]">{BANK_ACCOUNT_HOLDER}</span></p>
      <ul className="space-y-2">
        {BANK_ACCOUNTS.map((a) => (
          <li key={a.iban} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#e6ebf1] bg-white px-4 py-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#121926]">{a.bank}</p>
              <p className="break-all font-mono text-[13px] tracking-wide text-[#20384e] sm:text-sm">{a.iban}</p>
            </div>
            <CopyButton value={a.iban.replace(/\s/g, '')} label={L(`${a.bank} IBAN'ını kopyala`, `Copy ${a.bank} IBAN`)} />
          </li>
        ))}
      </ul>
    </div>
  )
}
