import React from 'react'
import { Text, Section, Link } from '@react-email/components'
import { EmailLayout, CtaButton, s, tx, type EmailLocale } from './order/shared'

interface WelcomeEmailProps {
  name: string
  siteUrl: string
  /** Doğrulanmamışsa doğrulama hatırlatması gösterilir */
  emailVerified: boolean
  /** Kayıt sırasındaki site dili (NEXT_LOCALE); varsayılan tr */
  locale?: EmailLocale
}

export const welcomeEmailSubject = (locale?: EmailLocale) => tx(locale)('Voltekno’ya hoş geldiniz', 'Welcome to Voltekno')

/** Kayıt sonrası hoş geldiniz e-postası (kullanıcı başına bir kez). */
export default function WelcomeEmail({ name, siteUrl, emailVerified, locale }: WelcomeEmailProps) {
  const base = siteUrl.replace(/\/$/, '')
  const L = tx(locale)
  const account = <Link href={`${base}/profile`} style={s.link}>{L('hesabım', 'My Account')}</Link>
  return (
    <EmailLayout
      locale={locale}
      preview={L(
        'Üyeliğiniz oluşturuldu — güneş enerjisi ve enerji depolama ürünlerinde güvenilir adresiniz',
        'Your account has been created — your trusted source for solar and energy storage products'
      )}
      title={L('Hoş Geldiniz!', 'Welcome!')}
      subtitle={L('Üyeliğiniz başarıyla oluşturuldu', 'Your account has been created successfully')}
    >
      <Text style={s.p}>{L('Merhaba', 'Hello')} {name || L('Değerli Müşterimiz', 'Valued Customer')},</Text>
      <Text style={s.p}>
        {L(
          'Voltekno ailesine katıldığınız için teşekkür ederiz. Hesabınızla siparişlerinizi ve kargo durumunu takip edebilir, adreslerinizi ve fatura bilgilerinizi kaydederek bir sonraki alışverişinizi hızlandırabilirsiniz.',
          'Thank you for joining Voltekno. With your account you can track your orders and shipments, and save your addresses and billing details to check out faster next time.'
        )}
      </Text>

      {!emailVerified && (
        <Section style={s.boxAmber}>
          <Text style={s.boxTitle}>{L('E-posta adresinizi doğrulamayı unutmayın', 'Don’t forget to verify your email address')}</Text>
          {locale === 'en' ? (
            <Text style={s.row}>
              We have also sent you a verification email. Once verified, orders you placed as a guest will also appear in
              your account. If it hasn’t arrived, you can request a new one from the {account} page.
            </Text>
          ) : (
            <Text style={s.row}>
              Size ayrıca bir doğrulama e-postası gönderdik. Doğrulama sonrası, üye olmadan verdiğiniz siparişler de
              hesabınızda görünür. E-posta ulaşmadıysa {account} sayfasından yeniden isteyebilirsiniz.
            </Text>
          )}
        </Section>
      )}

      <Section style={s.boxBlue}>
        <Text style={s.boxTitle}>{L('Hesabınızla neler yapabilirsiniz?', 'What you can do with your account')}</Text>
        <Text style={s.row}>• {L('Siparişlerinizi ve kargo takibini tek ekrandan izleyin', 'Follow your orders and shipment tracking in one place')}</Text>
        <Text style={s.row}>• {L('Teslimat ve fatura adreslerinizi kaydedin', 'Save your delivery and billing addresses')}</Text>
        <Text style={s.row}>• {L('Beğendiğiniz ürünleri favorilere ekleyin', 'Add the products you like to your favorites')}</Text>
        <Text style={s.row}>• {L('GES projeleriniz için hızlı teklif isteyin', 'Request quick quotes for your solar projects')}</Text>
      </Section>

      <CtaButton href={`${base}/products`}>{L('Alışverişe Başla', 'Start Shopping')}</CtaButton>

      {locale === 'en' ? (
        <Text style={s.note}>
          You can update your account details on the {account} page. If you did not create this account, please let us know.
        </Text>
      ) : (
        <Text style={s.note}>
          Hesap bilgilerinizi {account} sayfasından güncelleyebilirsiniz. Bu üyeliği siz oluşturmadıysanız lütfen bize bildirin.
        </Text>
      )}
    </EmailLayout>
  )
}
