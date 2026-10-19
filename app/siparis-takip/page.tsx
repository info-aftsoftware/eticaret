'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AlertCircle, Loader2, Package, ShieldCheck, Truck } from 'lucide-react'
import { ClassicPageShell } from '@/components/ClassicPageShell'
import { useAuthStore } from '@/lib/store/useAuthStore'
import { formatTrPhone, isValidEmail, isValidTrPhone } from '@/lib/checkout-validation'
import { useL } from '@/lib/i18n-inline'

const inputCls =
  'h-12 w-full rounded-lg border border-[#d3d9e1] bg-white px-3.5 text-base text-[#121926] placeholder:text-[#8a99a8] outline-none focus:border-[#0b2540] focus:ring-2 focus:ring-[#0b2540]/15'

/**
 * Sipariş takibi: sipariş no + e-posta + telefon (POST gövdesinde; URL'ye kişisel veri yazılmaz).
 * Doğrulanınca bilgiler bu sekmede saklanır ve sipariş sayfası (/orders/[no]) siparişi otomatik açar.
 */
export default function OrderTrackingPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  const L = useL()
  const [orderNo, setOrderNo] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const no = orderNo.trim().toUpperCase().replace(/\s+/g, '')
    if (!/^ORD-\d{4}-\d+$/.test(no)) return setError(L('Sipariş numarası ORD-2026-00001 biçiminde olmalıdır.', 'The order number must be in the format ORD-2026-00001.'))
    if (!isValidEmail(email)) return setError(L('Geçerli bir e-posta adresi girin.', 'Enter a valid email address.'))
    if (!isValidTrPhone(phone)) return setError(L('Telefon numarasını 5xx xxx xx xx biçiminde girin.', 'Enter the phone number in the format 5xx xxx xx xx.'))
    setLoading(true)
    try {
      const creds = { email: email.trim(), phone: phone.trim() }
      const res = await fetch(`/api/orders/by-no/${encodeURIComponent(no)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(creds),
      })
      if (!res.ok) {
        setError(res.status === 429 ? L('Çok fazla deneme yaptınız. Lütfen biraz sonra tekrar deneyin.', 'Too many attempts. Please try again in a moment.') : L('Bu bilgilerle eşleşen sipariş bulunamadı. Bilgileri sipariş onay e-postanızdakiyle karşılaştırın.', 'No order matches these details. Please check them against your order confirmation email.'))
        return
      }
      try {
        sessionStorage.setItem('order-lookup', JSON.stringify({ orderNo: no, ...creds }))
      } catch {}
      router.push(`/orders/${encodeURIComponent(no)}`)
    } catch {
      setError(L('Sipariş sorgulanamadı. Lütfen tekrar deneyin.', 'The order could not be looked up. Please try again.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <ClassicPageShell breadcrumbs={[{ label: L('Sipariş Takibi', 'Order Tracking') }]} title={L('Sipariş Takibi', 'Order Tracking')} description={L('Siparişinizin durumunu, kargo bilgisini ve faturasını görüntüleyin.', 'View your order status, shipping details and invoice.')}>
      <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-[minmax(0,1fr)_280px]">
        <div className="rounded-xl border border-[#e6ebf1] bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)] sm:p-7">
          <div className="mb-5 flex items-center gap-3">
            <div>
              <h2 className="text-base font-semibold text-[#121926]">{L('Siparişimi sorgula', 'Look up my order')}</h2>
              <p className="text-sm text-[#5d6e80]">{L('Üyelik gerekmez.', 'No account needed.')}</p>
            </div>
          </div>
          <form onSubmit={submit} className="space-y-4" noValidate>
            <div>
              <label htmlFor="orderNo" className="mb-1.5 block text-sm font-medium text-[#20384e]">{L('Sipariş numarası', 'Order number')}</label>
              <input id="orderNo" required value={orderNo} onChange={(e) => setOrderNo(e.target.value)} placeholder="ORD-2026-00001" autoComplete="off" autoCapitalize="characters" className={`${inputCls} font-mono uppercase`} />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-[#20384e]">{L('E-posta', 'Email')}</label>
                <input id="email" type="email" inputMode="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" className={inputCls} />
              </div>
              <div>
                <label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-[#20384e]">{L('Telefon', 'Phone')}</label>
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
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden />{L('Sorgulanıyor…', 'Searching…')}</> : L('Siparişimi göster', 'Show my order')}
            </button>
          </form>
          <p className="mt-5 text-[13px] text-[#5d6e80]">
            {L('Sipariş numaranız sipariş onay e-postanızda yer alır.', 'Your order number is in your order confirmation email.')}{' '}
            {isAuthenticated ? (
              <Link href="/profile?tab=orders" className="font-medium text-[#0b2540] underline-offset-2 hover:underline">{L('Tüm siparişlerim →', 'All my orders →')}</Link>
            ) : (
              <>{L('Üye iseniz', 'If you have an account,')} <Link href="/login?redirect=/profile?tab=orders" className="font-medium text-[#0b2540] underline-offset-2 hover:underline">{L('giriş yaparak', 'sign in')}</Link> {L('tüm siparişlerinizi görebilirsiniz.', 'to see all your orders.')}</>
            )}
          </p>
        </div>

        <ul className="space-y-3 text-sm">
          {[
            { icon: Package, title: L('Sipariş durumu', 'Order status'), text: L('Ödeme, hazırlık ve kargo adımlarını tarihleriyle görün.', 'See the payment, preparation and shipping steps with dates.') },
            { icon: Truck, title: L('Kargo takibi', 'Shipment tracking'), text: L('Kargoya verildiğinde takip numarası ve kargo firması bağlantısı burada.', 'Once shipped, the tracking number and carrier link appear here.') },
            { icon: ShieldCheck, title: L('Güvenli erişim', 'Secure access'), text: L('Siparişiniz yalnızca e-posta ve telefon birlikte eşleşirse gösterilir.', 'Your order is shown only if both the email and phone number match.') },
          ].map((i) => (
            <li key={i.title} className="flex gap-3 rounded-xl border border-[#e6ebf1] bg-white p-4">
              <i.icon className="mt-0.5 h-5 w-5 shrink-0 text-[#0b2540]" aria-hidden />
              <div>
                <p className="font-semibold text-[#121926]">{i.title}</p>
                <p className="text-[13px] text-[#5d6e80]">{i.text}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </ClassicPageShell>
  )
}
