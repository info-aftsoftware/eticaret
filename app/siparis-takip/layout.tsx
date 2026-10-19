import type { Metadata } from 'next'
import { getLocale } from 'next-intl/server'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  return {
    title: locale === 'en' ? 'Order Tracking' : 'Sipariş Takibi',
    description: 'Sipariş numaranız, e-posta adresiniz ve telefonunuzla siparişinizin durumunu ve kargo bilgisini görüntüleyin.',
    alternates: { canonical: '/siparis-takip' },
  }
}

export default function OrderTrackingLayout({ children }: { children: React.ReactNode }) {
  return children
}
