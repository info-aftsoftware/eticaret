import React from 'react'
import { Text } from '@react-email/components'
import { EmailLayout, CtaButton, s, tx, type EmailLocale } from './order/shared'

export const backInStockSubject = (productName: string, locale?: EmailLocale) =>
  `${productName} ${tx(locale)('yeniden stokta', 'is back in stock')}`

/** "Stok gelince haber ver" talebi: ürün stoğa girdi (lib/stock-alerts). Dil, talebin verildiği site dili. */
export default function BackInStockEmail({ productName, productUrl, locale }: {
  productName: string
  productUrl: string
  locale?: EmailLocale
}) {
  const L = tx(locale)
  return (
    <EmailLayout
      locale={locale}
      preview={backInStockSubject(productName, locale)}
      title={L('Beklediğiniz ürün stokta', 'The product you were waiting for is in stock')}
      subtitle={productName}
    >
      <Text style={s.p}>{L('Merhaba,', 'Hello,')}</Text>
      {locale === 'en' ? (
        <Text style={s.p}>
          <strong>{productName}</strong>, which you asked us to notify you about, is back in stock. Stock may be limited,
          so we recommend placing your order soon.
        </Text>
      ) : (
        <Text style={s.p}>
          Haber vermemizi istediğiniz <strong>{productName}</strong> yeniden stoklarımızda. Stoklar sınırlı olabileceği için
          siparişinizi gecikmeden verebilirsiniz.
        </Text>
      )}
      <CtaButton href={productUrl}>{L('Ürüne Git', 'View Product')}</CtaButton>
      <Text style={s.note}>
        {L(
          'Bu e-postayı, ürün sayfasında “Stok gelince haber ver” talebiniz üzerine yalnızca bir kez gönderiyoruz.',
          'We send this email only once, following your “Notify me when in stock” request on the product page.'
        )}
      </Text>
    </EmailLayout>
  )
}
