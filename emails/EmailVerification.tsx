import React from 'react'
import { Text, Section, Link } from '@react-email/components'
import { EmailLayout, CtaButton, s, tx, type EmailLocale } from './order/shared'

interface EmailVerificationProps {
  name: string
  verificationUrl: string
  /** İsteğin site dili (NEXT_LOCALE); varsayılan tr */
  locale?: EmailLocale
}

export const emailVerificationSubject = (locale?: EmailLocale) =>
  tx(locale)('E-posta adresinizi doğrulayın - Voltekno', 'Verify your email address - Voltekno')

/** E-posta doğrulama bağlantısı (bağlantı doğrudan /verify-email sayfasına gider). */
export function EmailVerification({ name, verificationUrl, locale }: EmailVerificationProps) {
  const L = tx(locale)
  return (
    <EmailLayout
      locale={locale}
      preview={L(
        'E-posta adresinizi doğrulayın — hesabınızı tamamlamak için tek adım kaldı',
        'Verify your email address — one step left to complete your account'
      )}
      title={L('E-posta Adresinizi Doğrulayın', 'Verify Your Email Address')}
      subtitle={L('Hesabınızı tamamlamak için tek adım kaldı', 'One step left to complete your account')}
    >
      <Text style={s.p}>{L('Merhaba', 'Hello')} {name || L('Değerli Müşterimiz', 'Valued Customer')},</Text>
      <Text style={s.p}>
        {L(
          'Üyeliğiniz için teşekkür ederiz. Hesabınızın güvenliği ve sipariş bildirimlerinin size ulaşması için lütfen aşağıdaki düğmeye tıklayarak e-posta adresinizi doğrulayın.',
          'Thank you for signing up. To keep your account secure and make sure order notifications reach you, please verify your email address by clicking the button below.'
        )}
      </Text>
      <CtaButton href={verificationUrl}>{L('E-posta Adresimi Doğrula', 'Verify My Email Address')}</CtaButton>
      <Section style={s.box}>
        <Text style={s.row}>
          {L('Düğme çalışmıyorsa aşağıdaki bağlantıyı tarayıcınıza yapıştırın:', 'If the button doesn’t work, paste the link below into your browser:')}
        </Text>
        <Text style={{ ...s.note, wordBreak: 'break-all' as const }}>
          <Link href={verificationUrl} style={s.link}>{verificationUrl}</Link>
        </Text>
      </Section>
      <Text style={s.note}>
        {L(
          'Doğrulama bağlantısı güvenlik nedeniyle sınırlı süre geçerlidir. Süresi dolarsa hesabınıza giriş yapıp "Doğrulama e-postasını tekrar gönder" seçeneğiyle yenisini isteyebilirsiniz. Bu üyeliği siz oluşturmadıysanız bu e-postayı dikkate almayın.',
          'For security reasons the verification link is valid for a limited time. If it expires, sign in to your account and use "Resend verification email" to request a new one. If you did not create this account, please ignore this email.'
        )}
      </Text>
    </EmailLayout>
  )
}

export default EmailVerification
