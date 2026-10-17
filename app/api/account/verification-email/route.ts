export const dynamic = 'force-dynamic'

/**
 * Oturum açık, e-postası doğrulanmamış kullanıcıya markalı doğrulama e-postası gönderir.
 * Bağlantı: Firebase Admin ile üretilen oobCode → <site>/verify-email?mode=verifyEmail&oobCode=…
 * (Firebase Console'da özel işlem URL'si ayarlamaya gerek kalmaz.)
 * 503/502 dönerse istemci Firebase'in kendi doğrulama e-postasına (sendEmailVerification) düşer.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getAdminAuth } from '@/lib/firebaseAdminServer'
import { isRateLimited } from '@/lib/rate-limit'
import { sendEmailVerificationMessage } from '@/lib/notifications'
import { siteOrigin, verifyBearer, oobCodeFromLink, inCooldown, clearCooldown } from '../_shared'

const COOLDOWN_MS = 55_000

export async function POST(request: NextRequest) {
  if (isRateLimited(request, 'verify-email-send', 10, 10 * 60_000)) {
    return NextResponse.json({ success: false, error: 'Çok fazla istek. Lütfen biraz sonra tekrar deneyin.' }, { status: 429 })
  }
  const auth = getAdminAuth()
  if (!auth) return NextResponse.json({ success: false, error: 'Sunucu yapılandırılmamış.' }, { status: 503 })

  const decoded = await verifyBearer(request)
  if (!decoded) return NextResponse.json({ success: false, error: 'Giriş yapmanız gerekiyor.' }, { status: 401 })
  if (!decoded.email) return NextResponse.json({ success: false, error: 'Hesapta e-posta adresi yok.' }, { status: 400 })

  try {
    // Token eski olabilir: güncel durumu Firebase'den oku
    const record = await auth.getUser(decoded.uid)
    if (record.emailVerified) return NextResponse.json({ success: true, alreadyVerified: true })

    const key = `verify:${decoded.uid}`
    if (inCooldown(key, COOLDOWN_MS)) {
      return NextResponse.json(
        { success: false, error: 'Doğrulama e-postası az önce gönderildi. Lütfen bir dakika sonra tekrar deneyin.' },
        { status: 429 }
      )
    }

    const email = record.email || decoded.email
    const link = await auth.generateEmailVerificationLink(email)
    const oobCode = oobCodeFromLink(link)
    const verificationUrl = oobCode
      ? `${siteOrigin(request)}/verify-email?mode=verifyEmail&oobCode=${encodeURIComponent(oobCode)}`
      : link
    const sent = await sendEmailVerificationMessage({
      email,
      name: record.displayName || (decoded.name as string | undefined) || '',
      verificationUrl,
    })
    if (!sent) {
      clearCooldown(key)
      return NextResponse.json({ success: false, error: 'E-posta gönderilemedi.' }, { status: 502 })
    }
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('Verification email error:', e)
    return NextResponse.json({ success: false, error: 'E-posta gönderilemedi.' }, { status: 503 })
  }
}
