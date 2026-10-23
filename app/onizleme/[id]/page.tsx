/**
 * Ürün önizlemesi (A08): taslak ürün vitrindeki ürün sayfasıyla aynı görünümde yalnız yöneticiye gösterilir.
 * Yönetici oturumu yoksa 404. Arama motorlarına kapalı; sepete ekleme sunucuda reddedilir (ürün yayında değil).
 */
import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { isAdminSessionCookie } from '@/lib/adminAuth'
import { getStorefrontProductById } from '@/lib/discounts'
import ProductDetailClient from '@/app/products/[id]/ProductDetailClient'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'Ürün önizlemesi', robots: { index: false, follow: false } }

export default async function ProductPreviewPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  if (!(await isAdminSessionCookie((await cookies()).get('admin_session')?.value))) notFound()
  const product = await getStorefrontProductById(id, { includeDraft: true })
  if (!product) notFound()
  const draft = product.status === 'draft'
  return (
    <>
      <div role="status" className={`sticky top-0 z-50 px-4 py-2 text-center text-[13px] font-medium ${draft ? 'bg-[#fffbeb] text-[#7a5a00] border-b border-[#f5dc85]' : 'bg-[#f5f7fa] text-[#20384e] border-b border-[#e6ebf1]'}`}>
        {draft ? 'Önizleme: bu ürün taslak, müşteriler göremez ve satın alamaz.' : 'Önizleme: bu ürün yayında.'}{' '}
        <a href={`/admin/products/duzenle?id=${encodeURIComponent(id)}`} className="underline">Düzenleyiciye dön</a>
      </div>
      <ProductDetailClient initialProduct={product} productId={id} />
    </>
  )
}
