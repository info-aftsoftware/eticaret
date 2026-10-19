import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Tüm Kategoriler | Ürün Kategorileri',
  description: 'Güneş paneli, solar akü, inverter, şarj kontrol, ısı pompası, rüzgar türbini ve EV şarj kategorilerindeki tüm ürün türleri.',
  alternates: { canonical: '/categories' },
}

export default function CategoriesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
