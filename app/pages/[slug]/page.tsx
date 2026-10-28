import type { Metadata } from 'next'
import { BreadcrumbJsonLd } from '@/components/seo/BreadcrumbJsonLd'
import { notFound } from 'next/navigation'
import { LegalPage, legalMetadata } from '@/components/LegalPage'
import { LEGAL_SLUGS, getLegalDocument, type LegalSlug } from '@/lib/legal/documents'

// voltekno.com ile aynı adresler: /pages/mesafeli-satis-sozlesmesi, /pages/kvkk, ...
export const dynamicParams = false

export function generateStaticParams() {
  return LEGAL_SLUGS.map((slug) => ({ slug }))
}

export async function generateMetadata(props: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const params = await props.params;
  const { slug } = params
  return (LEGAL_SLUGS as readonly string[]).includes(slug) ? legalMetadata(slug as LegalSlug) : {}
}

export default async function Page(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const { slug } = params
  if (!(LEGAL_SLUGS as readonly string[]).includes(slug)) notFound()
  return (
    <>
      <BreadcrumbJsonLd items={[{ name: getLegalDocument(slug as LegalSlug)?.title ?? slug }]} />
      <LegalPage slug={slug as LegalSlug} />
    </>
  )
}
