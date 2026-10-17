'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AlertCircle, Loader2, Package, Search, ShieldCheck, Truck } from 'lucide-react'
import { ClassicPageShell } from '@/components/ClassicPageShell'
import { useAuthStore } from '@/lib/store/useAuthStore'
import { formatTrPhone, isValidEmail, isValidTrPhone } from '@/lib/checkout-validation'

const inputCls =
  'h-12 w-full rounded-lg border border-[#d3d9e1] bg-white px-3.5 text-base text-[#121926] placeholder:text-[#8a99a8] outline-none focus:border-[#0b2540] focus:ring-2 focus:ring-[#0b2540]/15'

/**
 * Sipariş takibi: sipariş no + e-posta + telefon (POST gövdesinde; URL'ye kişisel veri yazılmaz).
 * Doğrulanınca bilgiler bu sekmede saklanır ve sipariş sayfası (/orders/[no]) siparişi otomatik açar.
 */
export default function OrderTrackingPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  const [orderNo, setOrderNo] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const no = orderNo.trim().toUpperCase().replace(/\s+/g, '')
    if (!/^ORD-\d{4}-\d+$/.test(no)) return setError('Sipariş numarası ORD-2026-00001 biçiminde olmalıdır.')
    if (!isValidEmail(email)) return setError('Geçerli bir e-posta adresi girin.')
    if (!isValidTrPhone(phone)) return setError('Telefon numarasını 5xx xxx xx xx biçiminde girin.')
    setLoading(true)
    try {
      const creds = { email: email.trim(), phone: phone.trim() }
      const res = await fetch(`/api/orders/by-no/${encodeURIComponent(no)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(creds),
      })
      if (!res.ok) {
        setError(res.status === 429 ? 'Çok fazla deneme yaptınız. Lütfen biraz sonra tekrar deneyin.' : 'Bu bilgilerle eşleşen sipariş bulunamadı. Bilgileri sipariş onay e-postanızdakiyle karşılaştırın.')
        return
      }
      try {
        sessionStorage.setItem('order-lookup', JSON.stringify({ orderNo: no, ...creds }))
      } catch {}
      router.push(`/orders/${encodeURIComponent(no)}`)
    } catch {
      setError('Sipariş sorgulanamadı. Lütfen tekrar deneyin.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ClassicPageShell breadcrumbs={[{ label: 'Sipariş Takibi' }]} title="Sipariş Takibi" description="Siparişinizin durumunu, kargo bilgisini ve faturasını görüntüleyin.">
      <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-[minmax(0,1fr)_280px]">
        <div className="rounded-xl border border-[#e6ebf1] bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)] sm:p-7">
          <div className="mb-5 flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f1f4f8]">
              <Search className="h-5 w-5 text-[#0b2540]" aria-hidden />
            </span>
            <div>
              <h2 className="text-base font-semibold text-[#121926]">Siparişimi sorgula</h2>
              <p className="text-sm text-[#6b7c8f]">Üyelik gerekmez.</p>
            </div>
          </div>
          <form onSubmit={submit} className="space-y-4" noValidate>
            <div>
              <label htmlFor="orderNo" className="mb-1.5 block text-sm font-medium text-[#20384e]">Sipariş numarası</label>
              <input id="orderNo" required value={orderNo} onChange={(e) => setOrderNo(e.target.value)} placeholder="ORD-2026-00001" autoComplete="off" autoCapitalize="characters" className={`${inputCls} font-mono uppercase`} />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-[#20384e]">E-posta</label>
                <input id="email" type="email" inputMode="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" className={inputCls} />
              </div>
              <div>
                <label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-[#20384e]">Telefon</label>
                <input id="phone" type="tel" inputMode="tel" required value={phone} onChange={(e) => setPhone(formatTrPhone(e.target.value))} placeholder="5xx xxx xx xx" autoComplete="tel-national" className={inputCls} />
              </div>
            </div>
            {error && (
              <p role="alert" className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />{error}
              </p>
            )}
            <button
              type="submit"
              disabled={loading || !orderNo || !email || !phone}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#0b2540] px-5 text-[15px] font-semibold text-white hover:bg-[#12335a] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden />Sorgulanıyor…</> : 'Siparişimi göster'}
            </button>
          </form>
          <p className="mt-5 text-[13px] text-[#6b7c8f]">
            Sipariş numaranız sipariş onay e-postanızda yer alır.{' '}
            {isAuthenticated ? (
              <Link href="/profile?tab=orders" className="font-medium text-[#0b2540] underline-offset-2 hover:underline">Tüm siparişlerim →</Link>
            ) : (
              <>Üye iseniz <Link href="/login?redirect=/profile?tab=orders" className="font-medium text-[#0b2540] underline-offset-2 hover:underline">giriş yaparak</Link> tüm siparişlerinizi görebilirsiniz.</>
            )}
          </p>
        </div>

        <ul className="space-y-3 text-sm">
          {[
            { icon: Package, title: 'Sipariş durumu', text: 'Ödeme, hazırlık ve kargo adımlarını tarihleriyle görün.' },
            { icon: Truck, title: 'Kargo takibi', text: 'Kargoya verildiğinde takip numarası ve kargo firması bağlantısı burada.' },
            { icon: ShieldCheck, title: 'Güvenli erişim', text: 'Siparişiniz yalnızca e-posta ve telefon birlikte eşleşirse gösterilir.' },
          ].map((i) => (
            <li key={i.title} className="flex gap-3 rounded-xl border border-[#e6ebf1] bg-white p-4">
              <i.icon className="mt-0.5 h-5 w-5 shrink-0 text-[#0b2540]" aria-hidden />
              <div>
                <p className="font-semibold text-[#121926]">{i.title}</p>
                <p className="text-[13px] text-[#6b7c8f]">{i.text}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </ClassicPageShell>
  )
}
