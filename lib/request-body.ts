/**
 * Açık formlarda JSON gövdesi boyut sınırıyla okunur: büyük gövdelerle veritabanının şişirilmesine karşı.
 * Sınır aşılırsa ya da gövde JSON değilse null döner (çağıran 413/400 verir).
 */
export async function readJsonLimited(request: Request, maxBytes: number): Promise<Record<string, unknown> | null> {
  const declared = Number(request.headers.get('content-length') ?? '0')
  if (declared > maxBytes) return null
  const text = await request.text()
  if (new TextEncoder().encode(text).length > maxBytes) return null
  try {
    const body = JSON.parse(text)
    return body && typeof body === 'object' && !Array.isArray(body) ? (body as Record<string, unknown>) : null
  } catch {
    return null
  }
}

/** Kısaltılmış, boşsa undefined metin */
export const shortText = (v: unknown, max = 500): string | undefined =>
  typeof v === 'string' ? v.trim().slice(0, max) || undefined : undefined

/** Yalnız http(s) adresi, en fazla 1000 karakter */
export const httpUrl = (v: unknown): string | undefined => {
  const s = shortText(v, 1000)
  return s && /^https?:\/\/[^\s<>"]+$/i.test(s) ? s : undefined
}
