import { ShieldCheck, Lock } from 'lucide-react'
import { useL } from '@/lib/i18n-inline'

/**
 * Kabul edilen kartlar ve güvenlik rozetleri (banka sanal POS başvurusunda istenir).
 * Görseller yerine sade metin/SVG rozetler — marka dosyası gerekmez, koyu/açık zeminde okunur.
 */
export function PaymentBadges({ className = '' }: { className?: string }) {
  const L = useL()
  const box = 'inline-flex h-7 items-center justify-center rounded bg-white px-2 shadow-sm'
  return (
    <ul className={`flex flex-wrap items-center gap-2 ${className}`} aria-label={L('Kabul edilen kartlar ve ödeme güvenliği', 'Accepted cards and payment security')}>
      <li className={box} title="Visa">
        <span className="text-[13px] font-extrabold italic tracking-tight text-[#1a1f71]">VISA</span>
      </li>
      <li className={box} title="Mastercard">
        <svg width="30" height="18" viewBox="0 0 30 18" aria-hidden>
          <circle cx="11" cy="9" r="8" fill="#eb001b" />
          <circle cx="19" cy="9" r="8" fill="#f79e1b" fillOpacity="0.9" />
        </svg>
        <span className="sr-only">Mastercard</span>
      </li>
      <li className={box} title="Troy">
        <span className="text-[13px] font-bold lowercase text-[#00a3b4]">troy</span>
      </li>
      <li className={`${box} gap-1 text-[11px] font-semibold text-slate-700`}>
        <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" aria-hidden />
        3D Secure
      </li>
      <li className={`${box} gap-1 text-[11px] font-semibold text-slate-700`}>
        <Lock className="h-3.5 w-3.5 text-emerald-600" aria-hidden />
        256-bit SSL
      </li>
    </ul>
  )
}
