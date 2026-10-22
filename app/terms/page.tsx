import { LegalPage, legalMetadata } from '@/components/LegalPage'

// Eski adres: içerik /pages/mesafeli-satis-sozlesmesi ile aynı (canonical oraya işaret eder)
export function generateMetadata() {
  return legalMetadata('mesafeli-satis-sozlesmesi')
}

export default function Page() {
  return <LegalPage slug="mesafeli-satis-sozlesmesi" />
}
