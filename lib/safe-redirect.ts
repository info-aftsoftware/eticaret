/**
 * Giriş/kayıt sonrası `?redirect=` için yalnızca site içi yollar.
 * "//site.com" ve "/\site.com" tarayıcıda başka siteye gider (açık yönlendirme) — reddedilir.
 * Tarayıcılar URL'deki sekme/satır sonu gibi kontrol karakterlerini atar ("/\t/site.com" → "//site.com"),
 * bu yüzden kontrol karakterli hedefler de reddedilir ve sonuç ayrıca aynı köke çözümlenerek doğrulanır.
 */
export function safeRedirect(target: string | null | undefined, fallback = '/profile'): string {
  if (!target || !target.startsWith('/')) return fallback
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001f\u007f]/.test(target)) return fallback
  if (target.startsWith('//') || target.startsWith('/\\')) return fallback
  try {
    const base = 'https://site.invalid'
    const resolved = new URL(target, base)
    if (resolved.origin !== base) return fallback
  } catch {
    return fallback
  }
  return target
}
