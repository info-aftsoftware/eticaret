/**
 * Ürün açıklamasındaki "Ad – özellik · özellik · özellik. Detaylar Voltekno'da." kalıbından öne çıkan maddeleri ayıklar;
 * kalıp yoksa teknik tablonun ilk 4 satırını kullanır. Ürün sayfasındaki "Öne çıkan özellikler" listesi ve
 * ürün meta açıklaması aynı kaynaktan beslenir.
 */
export function keyHighlights(description?: string, specs?: Record<string, string> | null): string[] {
  const d = description ?? ''
  const dash = d.indexOf(' – ')
  if (dash > -1) {
    const parts = d
      .slice(dash + 3)
      .split(' · ')
      // son maddeden "Detaylar Voltekno'da." / "Details at Voltekno." gibi kapanış cümlesini at
      .map((s, i, arr) => (i === arr.length - 1 ? s.split(/\.\s+/)[0] : s).replace(/\.$/, '').trim())
      .filter(Boolean)
    if (parts.length >= 2) return parts.slice(0, 5)
  }
  if (specs) return Object.entries(specs).slice(0, 4).map(([k, v]) => `${k}: ${v}`)
  return []
}

/**
 * Ürüne özgü meta description (~155 karakter): ad + sığdığı kadar öne çıkan özellik + fiyat cümlesi.
 * Kalıp kapanış cümleleri ("Detaylar Voltekno'da") yerine sayfaya özgü veri kullanır (Google: programatik ama sayfaya özgü).
 */
export function productMetaDescription(opts: {
  name: string
  highlights: string[]
  /** KDV dahil biçimlenmiş fiyat (ör. "₺16.233,60"); yoksa teklif cümlesi */
  priceText?: string | null
  /** Varyantlı üründe en düşük varyant fiyatı ("Başlangıç fiyatı") */
  fromPrice?: boolean
  bankDiscountRate?: number
  max?: number
}): string {
  const max = opts.max ?? 158
  const tail = opts.priceText
    ? // Türkçe ek uyumu sayıya göre değiştiği için ('den/'dan) fiyat ekli kullanılmaz
      ` ${opts.fromPrice ? 'Başlangıç fiyatı' : 'KDV dahil fiyat'}: ${opts.priceText}${opts.fromPrice ? ' (KDV dahil)' : ''}${opts.bankDiscountRate ? `, havale/EFT ile %${opts.bankDiscountRate} indirim` : ''}.`
    : ' Fiyat için teklif alın.'
  // Virgülden sonraki maddeler küçük harfle başlar; kısaltmalar (PWM, MPPT, LCD…) olduğu gibi kalır
  const highlights = opts.highlights.map((h, i) =>
    i > 0 && /^[A-ZÇĞİÖŞÜ][a-zçğıöşü]/.test(h) ? h.charAt(0).toLocaleLowerCase('tr') + h.slice(1) : h,
  )
  let text = opts.name
  const picked: string[] = []
  for (const h of highlights) {
    const next = `${opts.name}: ${[...picked, h].join(', ')}.`
    if ((next + tail).length > max) break
    picked.push(h)
  }
  text = picked.length ? `${opts.name}: ${picked.join(', ')}.` : `${opts.name}.`
  const full = text + tail
  if (full.length <= max) return full
  // Ad tek başına çok uzunsa kelime sınırında kısalt
  const cut = full.slice(0, max - 1)
  return cut.slice(0, cut.lastIndexOf(' ')).replace(/[,:;]$/, '') + '…'
}
