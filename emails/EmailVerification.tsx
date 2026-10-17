import React from 'react'
import { Text, Section, Link } from '@react-email/components'
import { EmailLayout, CtaButton, s } from './order/shared'

interface EmailVerificationProps {
  name: string
  verificationUrl: string
}

/** E-posta doğrulama bağlantısı (bağlantı doğrudan /verify-email sayfasına gider). */
export function EmailVerification({ name, verificationUrl }: EmailVerificationProps) {
  return (
    <EmailLayout
      preview="E-posta adresinizi doğrulayın — hesabınızı tamamlamak için tek adım kaldı"
      title="E-posta Adresinizi Doğrulayın"
      subtitle="Hesabınızı tamamlamak için tek adım kaldı"
    >
      <Text style={s.p}>Merhaba {name || 'Değerli Müşterimiz'},</Text>
      <Text style={s.p}>
        Üyeliğiniz için teşekkür ederiz. Hesabınızın güvenliği ve sipariş bildirimlerinin size ulaşması için lütfen
        aşağıdaki düğmeye tıklayarak e-posta adresinizi doğrulayın.
      </Text>
      <CtaButton href={verificationUrl}>E-posta Adresimi Doğrula</CtaButton>
      <Section style={s.box}>
        <Text style={s.row}>Düğme çalışmıyorsa aşağıdaki bağlantıyı tarayıcınıza yapıştırın:</Text>
        <Text style={{ ...s.note, wordBreak: 'break-all' as const }}>
          <Link href={verificationUrl} style={s.link}>{verificationUrl}</Link>
        </Text>
      </Section>
      <Text style={s.note}>
        Doğrulama bağlantısı güvenlik nedeniyle sınırlı süre geçerlidir. Süresi dolarsa hesabınıza giriş yapıp
        &quot;Doğrulama e-postasını tekrar gönder&quot; seçeneğiyle yenisini isteyebilirsiniz. Bu üyeliği siz
        oluşturmadıysanız bu e-postayı dikkate almayın.
      </Text>
    </EmailLayout>
  )
}

export default EmailVerification
