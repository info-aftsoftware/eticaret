'use client'

import React, { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Mail, Phone, MapPin, ShoppingBag, UserRound, Wallet, CalendarClock, Receipt } from 'lucide-react'
import { fmtTRY } from '@/lib/format'
import { EmptyState, PageHeader, Panel, PanelHeader, Pill, Spinner, fmtDate, fmtDateTime } from '@/components/admin/ui'
import { Avatar, ConsentPill, type CustomerRow } from '@/components/admin/customer-bits'
import { ORDER_STATUS_TONE, PAYMENT_STATUS_TONE, methodLabel, paymentLabel, statusLabel } from '@/components/admin/order-meta'

type Detail = CustomerRow & {
  averageOrder: number
  addresses: { id: string; title: string; name: string; phone: string; addressLine: string; district: string; city: string; isDefault: boolean }[]
  orders: { id: string; orderNo: string; createdAt: string; total: number; status: string; paymentStatus: string; paymentMethod: string | null; name: string; city: string }[]
}

function Stat({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: React.ReactNode }) {
  return (
    <Panel className="p-4">
      <div className="flex items-center gap-2 text-[12px] text-[#5d6e80]">
        <Icon className="w-4 h-4" />
        {label}
      </div>
      <p className="text-lg font-bold text-[#121926] mt-1 tabular-nums">{value}</p>
    </Panel>
  )
}

function CustomerDetail() {
  const key = useSearchParams().get('key') || ''
  const [data, setData] = useState<Detail | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!key) {
      setError('Müşteri seçilmedi.')
      return
    }
    setData(null)
    setError(null)
    fetch(`/api/admin/customers/${encodeURIComponent(key)}`, { credentials: 'include', cache: 'no-store' })
      .then(async (r) => {
        const json = await r.json().catch(() => null)
        if (!r.ok) throw new Error(json?.error || 'Müşteri alınamadı')
        setData(json)
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Müşteri alınamadı'))
  }, [key])

  if (error) {
    return (
      <div className="space-y-5">
        <PageHeader title="Müşteri" back={{ href: '/admin/musteriler', label: 'Müşteriler' }} />
        <Panel>
          <EmptyState icon={UserRound} title={error} />
        </Panel>
      </div>
    )
  }
  if (!data) return <Spinner />

  return (
    <div className="space-y-5">
      <PageHeader
        back={{ href: '/admin/musteriler', label: 'Müşteriler' }}
        title={
          <span className="flex items-center gap-3">
            <Avatar name={data.name} guest={data.type === 'guest'} />
            <span className="min-w-0 truncate">{data.name}</span>
          </span>
        }
        description={
          data.type === 'registered'
            ? `Üye${data.customerNo ? ` · ${data.customerNo}` : ''}${data.registeredAt ? ` · ${fmtDate(data.registeredAt)} tarihinde kayıt oldu` : ''}`
            : 'Misafir müşteri (üye değil) · siparişler e-posta adresine göre gruplanmıştır'
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat icon={ShoppingBag} label="Sipariş" value={`${data.orderCount}${data.orderCount !== data.paidOrderCount ? ` (${data.paidOrderCount} ödendi)` : ''}`} />
        <Stat icon={Wallet} label="Ödenen toplam" value={fmtTRY(data.paidTotal)} />
        <Stat icon={Receipt} label="Ortalama sepet" value={data.averageOrder ? fmtTRY(data.averageOrder) : '—'} />
        <Stat icon={CalendarClock} label="Son sipariş" value={data.lastOrderAt ? fmtDate(data.lastOrderAt) : '—'} />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5">
          <Panel>
            <PanelHeader title="İletişim" icon={UserRound} />
            <dl className="p-4 sm:p-5 space-y-3 text-[13px]">
              <div className="flex items-start gap-2.5">
                <Mail className="w-4 h-4 text-[#9aa8b6] mt-0.5 shrink-0" />
                {data.email ? <a href={`mailto:${data.email}`} className="text-[#0b2540] hover:underline break-all">{data.email}</a> : <span className="text-[#9aa8b6]">E-posta yok</span>}
                {data.type === 'registered' && data.emailVerified !== null && (
                  <Pill tone={data.emailVerified ? 'green' : 'amber'} className="ml-auto">{data.emailVerified ? 'Doğrulandı' : 'Doğrulanmadı'}</Pill>
                )}
              </div>
              <div className="flex items-start gap-2.5">
                <Phone className="w-4 h-4 text-[#9aa8b6] mt-0.5 shrink-0" />
                {data.phone ? <a href={`tel:${data.phone}`} className="text-[#20384e] hover:underline">{data.phone}</a> : <span className="text-[#9aa8b6]">—</span>}
              </div>
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#9aa8b6] mt-0.5 shrink-0" />
                <span className="text-[#20384e]">{data.city ?? '—'}</span>
              </div>
              <div className="pt-2 border-t border-[#eef2f6]">
                <p className="text-xs text-[#5d6e80] mb-1">Pazarlama izni</p>
                <ConsentPill value={data.marketingConsent} />
              </div>
            </dl>
          </Panel>

          {data.addresses.length > 0 && (
            <Panel>
              <PanelHeader title="Kayıtlı adresler" icon={MapPin} />
              <ul className="divide-y divide-[#eef2f6]">
                {data.addresses.map((a) => (
                  <li key={a.id} className="px-4 sm:px-5 py-3 text-[13px]">
                    <p className="font-medium text-[#121926] flex items-center gap-2">
                      {a.title}
                      {a.isDefault && <Pill tone="navy">Varsayılan</Pill>}
                    </p>
                    <p className="text-[#20384e]">{a.name} · {a.phone}</p>
                    <p className="text-[#5d6e80]">{a.addressLine}, {a.district} / {a.city}</p>
                  </li>
                ))}
              </ul>
            </Panel>
          )}
        </div>

        <Panel className="lg:col-span-2 overflow-hidden h-fit">
          <PanelHeader title="Siparişler" description={`${data.orders.length} sipariş`} icon={ShoppingBag} />
          {data.orders.length === 0 ? (
            <EmptyState icon={ShoppingBag} title="Bu müşterinin siparişi yok" />
          ) : (
            <ul className="divide-y divide-[#eef2f6]">
              {data.orders.map((o) => (
                <li key={o.id}>
                  <Link href={`/admin/orders/${o.id}`} className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-4 px-4 sm:px-5 py-3 hover:bg-[#fafbfd]">
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-[13px] font-semibold text-[#0b2540]">{o.orderNo}</p>
                      <p className="text-xs text-[#5d6e80]">{fmtDateTime(o.createdAt)} · {methodLabel(o.paymentMethod)} · {o.city}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Pill tone={ORDER_STATUS_TONE[o.status] ?? 'slate'} dot>{statusLabel(o.status)}</Pill>
                      <Pill tone={PAYMENT_STATUS_TONE[o.paymentStatus] ?? 'slate'}>{paymentLabel(o.paymentStatus)}</Pill>
                    </div>
                    <span className="text-sm font-semibold tabular-nums text-[#121926] sm:w-28 sm:text-right">{fmtTRY(o.total)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  )
}

export default function AdminCustomerDetailPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <CustomerDetail />
    </Suspense>
  )
}
