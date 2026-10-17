import { redirect } from 'next/navigation'

/** Eski "Ürün Düzenleme" sayfası — tek ürün yöneticisine yönlenir (?id=... → düzenleme sayfası). */
export default async function AdminKatalogRedirect({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams
  redirect(id ? `/admin/products/duzenle?id=${encodeURIComponent(id)}` : '/admin/products')
}
