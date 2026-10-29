'use client'

import React, { useState } from 'react'
import Link from '@/lib/i18n/navigation'
import { FileText } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { COOKIE_CONSENT_KEY } from '@/components/CookieConsent'
import { SELLER } from '@/lib/legal/company'
import { legalHref, type LegalSlug } from '@/lib/legal/documents'
import { useL } from '@/lib/i18n-inline'

/**
 * Hesap > Ayarlar: gizlilik ve belgeler. Yasal metinler, çerez tercihlerini yeniden seçme ve KVKK md. 11
 * kapsamındaki başvuru yolu. Siparişe ait sözleşme/fatura PDF'leri sipariş detay sayfasından indirilir.
 */
export function PrivacyDocumentsCard() {
  const L = useL()
  const [cookieReset, setCookieReset] = useState(false)

  const docs: { slug: LegalSlug; tr: string; en: string }[] = [
    { slug: 'kvkk', tr: 'KVKK Aydınlatma Metni', en: 'KVKK Privacy Notice' },
    { slug: 'gizlilik-ve-cerez-politikasi', tr: 'Gizlilik ve Çerez Politikası', en: 'Privacy and Cookie Policy' },
    { slug: 'acik-riza-metni', tr: 'Açık Rıza Metni', en: 'Explicit Consent Text' },
    { slug: 'ticari-elektronik-ileti-onayi', tr: 'Ticari Elektronik İleti Onayı', en: 'Commercial Electronic Message Consent' },
    { slug: 'uyelik-ve-kullanim-kosullari', tr: 'Üyelik ve Kullanım Koşulları', en: 'Membership and Terms of Use' },
    { slug: 'mesafeli-satis-sozlesmesi', tr: 'Mesafeli Satış Sözleşmesi', en: 'Distance Sales Agreement' },
    { slug: 'on-bilgilendirme-formu', tr: 'Ön Bilgilendirme Formu', en: 'Preliminary Information Form' },
    { slug: 'iade-ve-cayma-kosullari', tr: 'İade ve Cayma Koşulları', en: 'Returns and Withdrawal Terms' },
  ]

  const resetCookies = () => {
    try {
      localStorage.removeItem(COOKIE_CONSENT_KEY)
    } catch {}
    setCookieReset(true)
    // Çerez bandı sayfa yüklenince tercih yoksa görünür
    window.location.reload()
  }

  const kvkkMail = `mailto:${SELLER.email}?subject=${encodeURIComponent(L('KVKK Başvurusu', 'KVKK data protection request'))}`

  return (
    <Card className="classic-card rounded-lg">
      <CardHeader>
        <CardTitle>
          {L('Gizlilik ve Belgeler', 'Privacy and Documents')}
        </CardTitle>
        <p className="text-sm text-ink-muted">
          {L(
            'Sipariş sözleşmelerinizi ve faturalarınızı her siparişin detay sayfasından indirebilirsiniz. Yasal metinlerin güncel hâli aşağıdadır.',
            'You can download the contract and invoice for each order from its details page. The current legal texts are listed below.'
          )}
        </p>
      </CardHeader>
      <CardContent className="space-y-5 text-sm">
        <ul className="grid gap-2 sm:grid-cols-2">
          {docs.map((d) => (
            <li key={d.slug}>
              <Link href={legalHref(d.slug)} className="inline-flex items-center gap-2 text-brand hover:underline">
                <FileText className="h-4 w-4 shrink-0" aria-hidden />
                {L(d.tr, d.en)}
              </Link>
            </li>
          ))}
        </ul>

        <div className="space-y-2 border-t border-palette pt-4">
          <p className="font-medium text-ink">{L('Çerez tercihleri', 'Cookie preferences')}</p>
          <p className="text-ink-muted">
            {L('Analitik ve pazarlama çerezleri için verdiğiniz tercihi yeniden seçebilirsiniz.', 'You can choose your analytics and marketing cookie preference again.')}
          </p>
          <Button type="button" variant="outline" onClick={resetCookies} disabled={cookieReset}>
            {L('Çerez tercihlerimi yeniden seç', 'Choose my cookie preferences again')}
          </Button>
        </div>

        <div className="space-y-2 border-t border-palette pt-4">
          <p className="font-medium text-ink">{L('Kişisel verilerinizle ilgili haklarınız', 'Your rights regarding your personal data')}</p>
          <p className="text-ink-muted">
            {L(
              'KVKK 11. madde kapsamında verilerinize erişme, düzeltme, silinmesini veya aktarılmasını isteme haklarınız için bize e-posta ya da KEP ile başvurabilirsiniz. Hesabınızı aşağıdan kendiniz de silebilirsiniz.',
              'Under Article 11 of the KVKK you may request access to, correction, deletion or transfer of your data by email or registered e-mail (KEP). You can also delete your account yourself below.'
            )}
          </p>
          <p className="flex flex-wrap gap-x-4 gap-y-1">
            <a href={kvkkMail} className="text-brand hover:underline">{SELLER.email}</a>
            <span className="text-ink-muted">KEP: {SELLER.kep}</span>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
