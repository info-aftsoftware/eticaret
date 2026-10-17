'use client'

import React from 'react'
import { MailCheck } from 'lucide-react'
import { Pill } from './ui'

export type CustomerRow = {
  key: string
  type: 'registered' | 'guest'
  userId: string | null
  customerNo: string | null
  name: string
  email: string | null
  phone: string | null
  city: string | null
  registeredAt: string | null
  emailVerified: boolean | null
  orderCount: number
  paidOrderCount: number
  paidTotal: number
  lastOrderAt: string | null
  firstOrderAt: string | null
  marketingConsent: 'commercial' | 'newsletter' | null
}

export function ConsentPill({ value }: { value: CustomerRow['marketingConsent'] }) {
  if (value === 'commercial') return <Pill tone="green"><MailCheck className="w-3 h-3" />Ticari ileti izni</Pill>
  if (value === 'newsletter') return <Pill tone="blue"><MailCheck className="w-3 h-3" />Bülten abonesi</Pill>
  return <span className="text-xs text-[#9aa8b6]">İzin yok</span>
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toLocaleUpperCase('tr-TR'))
    .join('')
}

export function Avatar({ name, guest }: { name: string; guest?: boolean }) {
  return (
    <span className={guest ? 'w-9 h-9 rounded-full bg-[#f1f4f8] text-[#6b7c8f] text-xs font-semibold flex items-center justify-center shrink-0' : 'w-9 h-9 rounded-full bg-[#0b2540] text-white text-xs font-semibold flex items-center justify-center shrink-0'}>
      {initials(name) || '?'}
    </span>
  )
}

