/**
 * Admin panelinde ürün, stok, görsel veya kampanya değiştiğinde vitrinin önbelleğe alınmış sayfalarını tazeler.
 * Ürün sayfaları zaman bazlı yeniden doğrulanır (revalidate); bu çağrı beklemeden yeni veriyle üretilmelerini sağlar.
 * Hata vitrini etkilemez: yalnızca loglanır (ör. build sırasında veya istek bağlamı dışında çağrılırsa).
 */
import { revalidatePath } from 'next/cache'

export function revalidateStorefront(): void {
  try {
    revalidatePath('/products/[id]', 'page')
    revalidatePath('/category/[id]', 'page')
    revalidatePath('/paketler/[slug]', 'page')
    revalidatePath('/products')
    revalidatePath('/')
    revalidatePath('/feed/google-merchant.xml')
    revalidatePath('/sitemap.xml')
  } catch (e) {
    console.error('Storefront revalidate error:', e)
  }
}
