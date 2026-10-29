import { getRequestConfig } from 'next-intl/server'
import { cookies, headers } from 'next/headers'

const LOCALE_COOKIE = 'NEXT_LOCALE'

/**
 * Sayfalarda dil adresten gelir (middleware: /en/... → x-locale: en). API uçları dile göre ayrılmadığı için onlarda
 * sayfanın bıraktığı NEXT_LOCALE çerezi okunur (ör. arama sonuçları, sipariş e-postasının dili).
 */
export default getRequestConfig(async () => {
  let locale: 'tr' | 'en' = 'tr'
  try {
    if (process.env.STATIC_EXPORT !== 'true') {
      const fromPath = (await headers()).get('x-locale')
      const value = fromPath ?? (await cookies()).get(LOCALE_COOKIE)?.value
      locale = value === 'en' ? 'en' : 'tr'
    }
  } catch {
    locale = 'tr'
  }
  const validLocale = locale === 'en' ? 'en' : 'tr'

  let messages: Record<string, unknown> = {}
  try {
    messages = (await import(`../messages/${validLocale}.json`)).default
  } catch {
    try {
      messages = (await import(`../messages/tr.json`)).default
    } catch {
      messages = {}
    }
  }

  return {
    locale: validLocale,
    messages,
    timeZone: 'Europe/Istanbul',
  }
})
