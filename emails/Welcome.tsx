import React from 'react'
import { Text, Section, Link } from '@react-email/components'
import { EmailLayout, CtaButton, s } from './order/shared'

interface WelcomeEmailProps {
  name: string
  siteUrl: string
  /** Doğrulanmamışsa doğrulama hatırlatması gösterilir */
  emailVerified: boolean
}

export const WELCOME_EMAIL_SUBJECT = 'Voltekno’ya hoş geldiniz'

/** Kayıt sonrası hoş geldiniz e-postası (kullanıcı başına bir kez). */
export default function WelcomeEmail({ name, siteUrl, emailVerified }: WelcomeEmailProps) {
  const base = siteUrl.replace(/\/$/, '')
  return (
    <EmailLayout
      preview="Üyeliğiniz oluşturuldu — güneş enerjisi ve enerji depolama ürünlerinde güvenilir adresiniz"
      title="Hoş Geldiniz!"
      subtitle="Üyeliğiniz başarıyla oluşturuldu"
    >
      <Text style={s.p}>Merhaba {name || 'Değerli Müşterimiz'},</Text>
      <Text style={s.p}>
        Voltekno ailesine katıldığınız için teşekkür ederiz. Hesabınızla siparişlerinizi ve kargo durumunu takip
        edebilir, adreslerinizi ve fatura bilgilerinizi kaydederek bir sonraki alışverişinizi hızlandırabilirsiniz.
      </Text>

      {!emailVerified && (
        <Section style={s.boxAmber}>
          <Text style={s.boxTitle}>E-posta adresinizi doğrulamayı unutmayın</Text>
          <Text style={s.row}>
            Size ayrıca bir doğrulama e-postası gönderdik. Doğrulama sonrası, üye olmadan verdiğiniz siparişler de
            hesabınızda görünür. E-posta ulaşmadıysa{' '}
            <Link href={`${base}/profile`} style={s.link}>hesabım</Link> sayfasından yeniden isteyebilirsiniz.
          </Text>
        </Section>
      )}

      <Section style={s.boxBlue}>
        <Text style={s.boxTitle}>Hesabınızla neler yapabilirsiniz?</Text>
        <Text style={s.row}>• Siparişlerinizi ve kargo takibini tek ekrandan izleyin</Text>
        <Text style={s.row}>• Teslimat ve fatura adreslerinizi kaydedin</Text>
        <Text style={s.row}>• Beğendiğiniz ürünleri favorilere ekleyin</Text>
        <Text style={s.row}>• GES projeleriniz için hızlı teklif isteyin</Text>
      </Section>

      <CtaButton href={`${base}/products`}>Alışverişe Başla</CtaButton>

      <Text style={s.note}>
        Hesap bilgilerinizi <Link href={`${base}/profile`} style={s.link}>hesabım</Link> sayfasından
        güncelleyebilirsiniz. Bu üyeliği siz oluşturmadıysanız lütfen bize bildirin.
      </Text>
    </EmailLayout>
  )
}
