/** U+2028 / U+2029: JSON'da geçerli, eski JavaScript ayrıştırıcılarında satır sonu sayılan karakterler */
const LINE_SEPARATORS = new RegExp(`[${String.fromCharCode(0x2028)}${String.fromCharCode(0x2029)}]`, 'g')

/**
 * <script type="application/ld+json"> içeriği. JSON.stringify "<" karakterine dokunmaz; panelde yazılan bir ürün
 * adındaki "</script>" betik etiketini kapatıp sayfaya kod sokabilir. <, >, & ve satır ayırıcıları \u kaçışıyla
 * yazılır: JSON olarak aynı değer, HTML olarak etiket açamaz.
 */
export function jsonLdHtml(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(LINE_SEPARATORS, (c) => `\\u${c.charCodeAt(0).toString(16)}`)
}
