import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sipariş Takibi',
  description: 'Sipariş numaranız, e-posta adresiniz ve telefonunuzla siparişinizin durumunu ve kargo bilgisini görüntüleyin.',
}

export default function OrderTrackingLayout({ children }: { children: React.ReactNode }) {
  return children
}
