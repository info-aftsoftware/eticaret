import React from 'react'
import { Text, Section, Link } from '@react-email/components'
import { EmailLayout, CtaButton, s } from './order/shared'

interface PasswordResetEmailProps {
  name: string
  resetUrl: string
}

/** Şifre sıfırlama bağlantısı (bağlantı doğrudan /reset-password sayfasına gider). */
export default function PasswordResetEmail({ name, resetUrl }: PasswordResetEmailProps) {
  return (
    <EmailLayout
      preview="Şifre sıfırlama talebiniz — yeni şifrenizi belirleyin"
      title="Şifre Sıfırlama"
      subtitle="Hesabınız için şifre sıfırlama talebi aldık"
    >
      <Text style={s.p}>Merhaba {name || 'Değerli Müşterimiz'},</Text>
      <Text style={s.p}>
        Hesabınız için şifre sıfırlama talebinde bulunuldu. Yeni şifrenizi belirlemek için aşağıdaki düğmeye tıklayın.
      </Text>
      <CtaButton href={resetUrl}>Yeni Şifre Belirle</CtaButton>
      <Section style={s.box}>
        <Text style={s.row}>Düğme çalışmıyorsa aşağıdaki bağlantıyı tarayıcınıza yapıştırın:</Text>
        <Text style={{ ...s.note, wordBreak: 'break-all' as const }}>
          <Link href={resetUrl} style={s.link}>{resetUrl}</Link>
        </Text>
      </Section>
      <Section style={s.boxAmber}>
        <Text style={s.row}>
          Bu talebi siz yapmadıysanız bu e-postayı dikkate almayın; şifreniz değişmez. Bağlantı güvenlik nedeniyle
          yaklaşık 1 saat geçerlidir ve yalnızca bir kez kullanılabilir.
        </Text>
      </Section>
    </EmailLayout>
  )
}
