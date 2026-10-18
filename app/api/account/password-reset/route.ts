export const dynamic = 'force-dynamic'

/**
 * Şifre sıfırlama e-postası (markalı). Bağlantı: Firebase Admin oobCode → <site>/reset-password?mode=resetPassword&oobCode=…
 * Hesap olup olmadığı yanıttan anlaşılmaz (e-posta numaralandırmaya karşı): kayıtlı değilse de success döner.
 * 503 dönerse istemci Firebase'in kendi e-postasına (sendPasswordResetEmail) düşer.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getAdminAuth, adminProjectMatchesClient } from '@/lib/firebaseAdminServer'
import { isRateLimited } from '@/lib/rate-limit'
import { sendPasswordResetMessage } from '@/lib/notifications'
import { siteOrigin, oobCodeFromLink, inCooldown, clearCooldown } from '../_shared'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export async function POST(request: NextRequest) {
  if (isRateLimited(request, 'password-reset', 5, 15 * 60_000)) {
    return NextResponse.json({ success: false, error: 'Çok fazla deneme yapıldı. Lütfen birkaç dakika sonra tekrar deneyin.' }, { status: 429 })
  }
  const auth = adminProjectMatchesClient() ? getAdminAuth() : null
  if (!auth) return NextResponse.json({ success: false, error: 'Sunucu yapılandırılmamış.' }, { status: 503 })

  const body = await request.json().catch(() => null)
  const email = String(body?.email ?? '').trim().toLowerCase()
  if (!EMAIL_RE.test(email) || email.length > 254) {
    return NextResponse.json({ success: false, error: 'Geçerli bir e-posta adresi girin.' }, { status: 400 })
  }

  const key = `reset:${email}`
  // Aynı adrese dakikada en fazla bir e-posta (yanıt yine success: numaralandırma/taciz önlemi)
  if (inCooldown(key, 60_000)) return NextResponse.json({ success: true })

  let user
  try {
    user = await auth.getUserByEmail(email)
  } catch (e) {
    if ((e as { code?: string })?.code === 'auth/user-not-found') return NextResponse.json({ success: true })
    clearCooldown(key)
    console.error('Password reset lookup error:', e)
    return NextResponse.json({ success: false, error: 'Şu anda işlem yapılamıyor.' }, { status: 503 })
  }

  try {
    const link = await auth.generatePasswordResetLink(email)
    const oobCode = oobCodeFromLink(link)
    const resetUrl = oobCode
      ? `${siteOrigin(request)}/reset-password?mode=resetPassword&oobCode=${encodeURIComponent(oobCode)}`
      : link
    const sent = await sendPasswordResetMessage({ email, name: user.displayName || '', resetUrl })
    if (!sent) {
      clearCooldown(key)
      return NextResponse.json({ success: false, error: 'E-posta gönderilemedi.' }, { status: 503 })
    }
    return NextResponse.json({ success: true })
  } catch (e) {
    clearCooldown(key)
    console.error('Password reset email error:', e)
    return NextResponse.json({ success: false, error: 'E-posta gönderilemedi.' }, { status: 503 })
  }
}
