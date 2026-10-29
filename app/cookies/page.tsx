import { LegalPage, legalMetadata } from '@/components/LegalPage'

// Eski adres: içerik /pages/gizlilik-ve-cerez-politikasi ile aynı (canonical oraya işaret eder)
export function generateMetadata() {
  return legalMetadata('gizlilik-ve-cerez-politikasi')
}

export default function Page() {
  return <LegalPage slug="gizlilik-ve-cerez-politikasi" />
}
