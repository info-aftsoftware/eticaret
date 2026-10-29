import type { Metadata } from 'next'
import { BreadcrumbJsonLd } from '@/components/seo/BreadcrumbJsonLd'
import { getLocale } from 'next-intl/server'
import { withLocaleAlternates } from '@/lib/i18n/alternates'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  return withLocaleAlternates({
    title: locale === 'en' ? 'Order Tracking' : 'Sipariş Takibi',
    description:
      locale === 'en'
        ? 'View your order status and shipping details with your order number, email address and phone number.'
        : 'Sipariş numaranız, e-posta adresiniz ve telefonunuzla siparişinizin durumunu ve kargo bilgisini görüntüleyin.',
    alternates: { canonical: '/siparis-takip' },
  }, locale === 'en' ? 'en' : 'tr')
}

export default function OrderTrackingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <BreadcrumbJsonLd items={[{ name: 'Sipariş Takibi' }]} />
      {children}
    </>
  )
}
