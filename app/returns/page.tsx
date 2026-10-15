import { LegalPage, legalMetadata } from '@/components/LegalPage'

// Eski adres: içerik /pages/iade-ve-cayma-kosullari ile aynı (canonical oraya işaret eder)
export const metadata = legalMetadata('iade-ve-cayma-kosullari')

export default function Page() {
  return <LegalPage slug="iade-ve-cayma-kosullari" />
}
