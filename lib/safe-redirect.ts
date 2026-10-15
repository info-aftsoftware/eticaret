/**
 * Giriş/kayıt sonrası `?redirect=` için yalnızca site içi yollar.
 * "//site.com" ve "/\site.com" tarayıcıda başka siteye gider (açık yönlendirme) — reddedilir.
 */
export function safeRedirect(target: string | null | undefined, fallback = '/profile'): string {
  if (!target || !target.startsWith('/')) return fallback
  if (target.startsWith('//') || target.startsWith('/\\')) return fallback
  return target
}
