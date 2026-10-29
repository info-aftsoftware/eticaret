/**
 * GTIN / barkod (EAN-13, UPC-A, EAN-8, GTIN-14). Google Merchant ve ürün şeması yalnız geçerli GTIN ister: uzunluk
 * 8, 12, 13 ya da 14 rakam ve son basamak GS1 kontrol basamağı. Boşluk ve tire yok sayılır.
 * Mağazanın iç kodu (SKU, ör. TOMMAT-…) GTIN değildir; barkod yalnız tedarikçiden/üründen gelir.
 */

const LENGTHS = new Set([8, 12, 13, 14])

/** GS1 kontrol basamağı doğru mu (sağdan ikinci basamaktan başlayarak 3, 1, 3, 1… ağırlıkları) */
function checkDigitOk(digits: string): boolean {
  let sum = 0
  for (let i = digits.length - 2, w = 3; i >= 0; i--, w = w === 3 ? 1 : 3) sum += Number(digits[i]) * w
  return (10 - (sum % 10)) % 10 === Number(digits[digits.length - 1])
}

/** Geçerli GTIN'i yalnız rakamlarla döner; boş, hatalı uzunluk ya da kontrol basamağı yanlışsa null */
export function normalizeGtin(raw: unknown): string | null {
  if (typeof raw !== 'string' && typeof raw !== 'number') return null
  const digits = String(raw).replace(/[\s-]/g, '')
  if (!/^\d+$/.test(digits) || !LENGTHS.has(digits.length) || /^0+$/.test(digits)) return null
  return checkDigitOk(digits) ? digits : null
}

/** Panel için hata metni; boş değer geçerlidir (barkod isteğe bağlı) */
export function gtinProblem(raw: unknown): string | null {
  if (raw == null || String(raw).trim() === '') return null
  const digits = String(raw).replace(/[\s-]/g, '')
  if (!/^\d+$/.test(digits)) return 'Barkod yalnız rakamlardan oluşmalı'
  if (!LENGTHS.has(digits.length)) return 'Barkod 8, 12, 13 ya da 14 haneli olmalı (EAN-13 genellikle 13 hane)'
  return normalizeGtin(digits) ? null : 'Barkodun son hanesi (kontrol basamağı) tutmuyor; rakamları kontrol edin'
}

/** Excel "Barkod Listesi" gibi birden çok barkod içeren hücreden ilk geçerli GTIN */
export function firstValidGtin(cell: unknown): string | null {
  if (cell == null) return null
  for (const part of String(cell).split(/[;,|\n]+/)) {
    const g = normalizeGtin(part.trim())
    if (g) return g
  }
  return null
}
