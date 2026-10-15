import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { LegalPage, legalMetadata } from '@/components/LegalPage'
import { LEGAL_SLUGS, type LegalSlug } from '@/lib/legal/documents'

// voltekno.com ile aynı adresler: /pages/mesafeli-satis-sozlesmesi, /pages/kvkk, ...
export const dynamicParams = false

export function generateStaticParams() {
  return LEGAL_SLUGS.map((slug) => ({ slug }))
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const { slug } = params
  return (LEGAL_SLUGS as readonly string[]).includes(slug) ? legalMetadata(slug as LegalSlug) : {}
}

export default function Page({ params }: { params: { slug: string } }) {
  const { slug } = params
  if (!(LEGAL_SLUGS as readonly string[]).includes(slug)) notFound()
  return <LegalPage slug={slug as LegalSlug} />
}
