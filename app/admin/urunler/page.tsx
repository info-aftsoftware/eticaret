import { redirect } from 'next/navigation'

/** Eski "Stok Yönetimi" sayfası — stok artık Ürünler & Stok listesinde satır içi düzenlenir. */
export default function AdminUrunlerRedirect() {
  redirect('/admin/products')
}
