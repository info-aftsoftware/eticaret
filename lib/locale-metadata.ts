import type { Metadata } from 'next'

/**
 * Sekme başlığı ve meta açıklaması ziyaretçinin dilinde.
 * Türkçe meta veri (kanonik URL, anahtar kelimeler, çerezsiz gelen arama motorlarının gördüğü metin) aynen kalır;
 * yalnızca İngilizce seçili (NEXT_LOCALE=en) ziyaretçide başlık, açıklama ve paylaşım (Open Graph / Twitter)
 * başlıkları İngilizcesiyle değiştirilir.
 */
export type EnglishMeta = {
  title: string | { default: string; template: string }
  description?: string
  /** Open Graph / Twitter başlığı; verilmezse "<başlık> | Voltekno" */
  shareTitle?: string
  /** Open Graph / Twitter açıklaması; verilmezse description */
  shareDescription?: string
}

export function englishMetadata(tr: Metadata, en: EnglishMeta): Metadata {
  const shareTitle = en.shareTitle ?? `${typeof en.title === 'string' ? en.title : en.title.default} | Voltekno`
  const shareDescription = en.shareDescription ?? en.description
  const share = <T extends object>(m: T): T => ({ ...m, title: shareTitle, ...(shareDescription && { description: shareDescription }) })
  const og = tr.openGraph ? share(tr.openGraph) : undefined
  return {
    ...tr,
    title: en.title,
    ...(en.description && { description: en.description }),
    ...(og && { openGraph: 'locale' in og && og.locale ? { ...og, locale: 'en_US' } : og }),
    ...(tr.twitter && { twitter: share(tr.twitter) }),
  }
}

/** generateMetadata içinde: İngilizce ziyaretçiye çevrilmiş, diğerlerine Türkçe meta veri */
export async function localizedMetadata(tr: Metadata, en: EnglishMeta): Promise<Metadata> {
  let locale = 'tr'
  try {
    // Dinamik içe aktarma: saf englishMetadata birim testlerinde next-intl sunucu ortamı gerekmesin
    const { getLocale } = await import('next-intl/server')
    locale = await getLocale()
  } catch {
    locale = 'tr'
  }
  return locale === 'en' ? englishMetadata(tr, en) : tr
}
