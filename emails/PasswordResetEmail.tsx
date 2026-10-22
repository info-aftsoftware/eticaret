import React from 'react'
import { Text, Section, Link } from '@react-email/components'
import { EmailLayout, CtaButton, s, tx, type EmailLocale } from './order/shared'

interface PasswordResetEmailProps {
  name: string
  resetUrl: string
  /** İsteğin site dili (NEXT_LOCALE); varsayılan tr */
  locale?: EmailLocale
}

export const passwordResetSubject = (locale?: EmailLocale) =>
  tx(locale)('Şifre sıfırlama talebiniz - Voltekno', 'Your password reset request - Voltekno')

/** Şifre sıfırlama bağlantısı (bağlantı doğrudan /reset-password sayfasına gider). */
export default function PasswordResetEmail({ name, resetUrl, locale }: PasswordResetEmailProps) {
  const L = tx(locale)
  return (
    <EmailLayout
      locale={locale}
      preview={L('Şifre sıfırlama talebiniz — yeni şifrenizi belirleyin', 'Your password reset request — set a new password')}
      title={L('Şifre Sıfırlama', 'Password Reset')}
      subtitle={L('Hesabınız için şifre sıfırlama talebi aldık', 'We received a password reset request for your account')}
    >
      <Text style={s.p}>{L('Merhaba', 'Hello')} {name || L('Değerli Müşterimiz', 'Valued Customer')},</Text>
      <Text style={s.p}>
        {L(
          'Hesabınız için şifre sıfırlama talebinde bulunuldu. Yeni şifrenizi belirlemek için aşağıdaki düğmeye tıklayın.',
          'A password reset was requested for your account. Click the button below to set a new password.'
        )}
      </Text>
      <CtaButton href={resetUrl}>{L('Yeni Şifre Belirle', 'Set New Password')}</CtaButton>
      <Section style={s.box}>
        <Text style={s.row}>
          {L('Düğme çalışmıyorsa aşağıdaki bağlantıyı tarayıcınıza yapıştırın:', 'If the button doesn’t work, paste the link below into your browser:')}
        </Text>
        <Text style={{ ...s.note, wordBreak: 'break-all' as const }}>
          <Link href={resetUrl} style={s.link}>{resetUrl}</Link>
        </Text>
      </Section>
      <Section style={s.boxAmber}>
        <Text style={s.row}>
          {L(
            'Bu talebi siz yapmadıysanız bu e-postayı dikkate almayın; şifreniz değişmez. Bağlantı güvenlik nedeniyle yaklaşık 1 saat geçerlidir ve yalnızca bir kez kullanılabilir.',
            'If you did not make this request, please ignore this email; your password will not change. For security reasons the link is valid for about 1 hour and can be used only once.'
          )}
        </Text>
      </Section>
    </EmailLayout>
  )
}
