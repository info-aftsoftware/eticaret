import { BreadcrumbJsonLd } from '@/components/seo/BreadcrumbJsonLd'

/** Kırıntı yolu şeması (BreadcrumbList); sayfa sunucu bileşeni ama düzeni yoktu */
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <BreadcrumbJsonLd items={[{ name: 'Sık Sorulan Sorular' }]} />
      {children}
    </>
  )
}
