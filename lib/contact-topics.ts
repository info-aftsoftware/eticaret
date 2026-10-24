/**
 * İletişim formu talep türleri (madde 17): ürün teklifi, proje (GES) teklifi ve teknik destek ayrı etiketlenir;
 * ürün sayfası ve kullanım alanı sayfaları formu ürün/konu bilgisiyle açar (/contact?talep=urun&urun=<id>).
 * GES projesi için ayrıntılı form /ges sayfasındadır; "proje" seçilince oraya yönlendirme gösterilir. Saf modül.
 */

export const CONTACT_TOPICS = [
  { id: 'urun', tr: 'Ürün teklifi', en: 'Product quote' },
  { id: 'proje', tr: 'Proje / GES teklifi', en: 'Project / solar quote' },
  { id: 'destek', tr: 'Teknik destek', en: 'Technical support' },
  { id: 'siparis', tr: 'Sipariş ve kargo', en: 'Order and shipping' },
  { id: 'diger', tr: 'Diğer', en: 'Other' },
] as const

export type ContactTopicId = (typeof CONTACT_TOPICS)[number]['id']

export function isContactTopic(v: unknown): v is ContactTopicId {
  return CONTACT_TOPICS.some((t) => t.id === v)
}

export function topicLabel(id: ContactTopicId, en = false): string {
  const t = CONTACT_TOPICS.find((x) => x.id === id)!
  return en ? t.en : t.tr
}

/** Formdan gidecek konu: talep türü önde ("Ürün teklifi: AFT 5,4 kWh batarya"), panelde süzülebilsin */
export function composeSubject(topic: ContactTopicId | '', subject: string): string {
  const s = subject.trim()
  if (!topic) return s
  const label = topicLabel(topic)
  return s.toLocaleLowerCase('tr').startsWith(label.toLocaleLowerCase('tr')) ? s : `${label}: ${s}`
}

/** Ürünle açılan formun hazır konu ve mesajı */
export function productPrefill(product: { name: string; sku?: string | null }, en = false): { subject: string; message: string } {
  const ref = product.sku ? `${product.name} (${product.sku})` : product.name
  return en
    ? { subject: product.name, message: `Product: ${ref}\nQuantity: \nDelivery city: \n` }
    : { subject: product.name, message: `Ürün: ${ref}\nAdet: \nTeslimat ili: \n` }
}

export function contactHref(topic: ContactTopicId, opts: { productId?: string; subject?: string } = {}): string {
  const q = new URLSearchParams({ talep: topic })
  if (opts.productId) q.set('urun', opts.productId)
  if (opts.subject) q.set('konu', opts.subject)
  return `/contact?${q.toString()}`
}
