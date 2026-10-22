import type { Metadata } from 'next'
import { localizedMetadata } from '@/lib/locale-metadata'

const trMetadata: Metadata = {
  title: 'Tüm Kategoriler | Ürün Kategorileri',
  description: 'Güneş paneli, solar akü, inverter, şarj kontrol, ısı pompası, rüzgar türbini ve EV şarj kategorilerindeki tüm ürün türleri.',
  alternates: { canonical: '/categories' },
}

/** Türkçe meta veri (kanonik, SEO) değişmez; İngilizce seçili ziyaretçide başlık ve açıklama İngilizce */
export function generateMetadata(): Promise<Metadata> {
  return localizedMetadata(trMetadata, {
    title: 'All Categories | Product Categories',
    description: 'Browse products in the charging station, battery, solar energy and inverter categories.',
  })
}

export default function CategoriesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
