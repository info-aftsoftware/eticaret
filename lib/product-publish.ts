/**
 * Panelde eklenen ürünü yayına alma koşulları (A08). Taslak kaydedilirken eksik alan serbesttir;
 * yayına alırken (ve yayındaki ürün kaydedilirken) bu liste boş olmalıdır. Sunucu ve düzenleyici aynı kuralı kullanır.
 */

export type PublishCheckProduct = {
  name?: string | null
  category?: string | null
  price?: number | null
  basePrice?: number | null
  priceCurrency?: string | null
  image?: string | null
  images?: string[] | null
  variants?: { label?: string; price?: number | null }[] | null
  saleMode?: string | null
  desi?: number | null
  weightKg?: number | null
}

/** Yayına engel eksikler (Türkçe, kullanıcıya gösterilir); boşsa yayına alınabilir */
export function publishProblems(p: PublishCheckProduct): string[] {
  const out: string[] = []
  const quote = p.saleMode === 'quote'
  if (!p.name?.trim() || p.name === 'İsimsiz ürün') out.push('Ürün adı')
  if (!p.category?.trim() || p.category === 'Genel') out.push('Kategori')
  if (!quote) {
    const fx = p.priceCurrency === 'USD' || p.priceCurrency === 'EUR'
    const priced = fx ? (p.basePrice ?? 0) > 0 : (p.price ?? 0) > 0
    if (!priced) out.push('Fiyat')
    if (p.variants?.some((v) => !((v.price ?? 0) > 0))) out.push('Varyant fiyatları')
  }
  if (!p.image && !p.images?.length) out.push('En az bir görsel')
  // Kargoyla gönderilen ürünün desisi ve ağırlığı olmalı (kurulumlu ve teklifli ürün kargoya girmez)
  if (!quote && p.saleMode !== 'install') {
    if (!((p.desi ?? 0) > 0) || !((p.weightKg ?? 0) > 0)) out.push('Kargo bilgisi (koli ölçüsü ve ağırlık)')
  }
  return out
}
