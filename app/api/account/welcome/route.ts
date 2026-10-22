export const dynamic = 'force-dynamic'

/**
 * Hoş geldiniz e-postası — kullanıcı başına yalnızca bir kez.
 * Tekillik: Firestore users/{uid}.welcomeEmailSentAt alanı bir transaction içinde kontrol edilip yazılır
 * (eşzamanlı iki istekte yalnızca biri gönderir). Alan profil belgesinde durduğu için KVKK hesap silme
 * akışı (users/{uid} recursiveDelete) ile birlikte silinir; Prisma şeması değişmez.
 * Yalnızca yeni hesaplar (son 7 gün) için gönderilir; eski üyelere geriye dönük e-posta gitmez.
 */
import { NextRequest, NextResponse } from 'next/server'
import { FieldValue } from 'firebase-admin/firestore'
import { getAdminAuth, getAdminFirestore } from '@/lib/firebaseAdminServer'
import { isRateLimited } from '@/lib/rate-limit'
import { sendWelcomeEmail } from '@/lib/notifications'
import { siteOrigin, verifyBearer, requestLocale } from '../_shared'

const NEW_ACCOUNT_WINDOW_MS = 7 * 24 * 60 * 60 * 1000

export async function POST(request: NextRequest) {
  if (isRateLimited(request, 'welcome-email', 10, 10 * 60_000)) {
    return NextResponse.json({ success: false, error: 'Çok fazla istek.' }, { status: 429 })
  }
  const auth = getAdminAuth()
  const db = getAdminFirestore()
  if (!auth || !db) return NextResponse.json({ success: false, error: 'Sunucu yapılandırılmamış.' }, { status: 503 })

  const decoded = await verifyBearer(request)
  if (!decoded) return NextResponse.json({ success: false, error: 'Giriş yapmanız gerekiyor.' }, { status: 401 })

  try {
    const record = await auth.getUser(decoded.uid)
    if (!record.email) return NextResponse.json({ success: true, skipped: 'no-email' })
    const createdAt = Date.parse(record.metadata.creationTime)
    if (!Number.isFinite(createdAt) || Date.now() - createdAt > NEW_ACCOUNT_WINDOW_MS) {
      return NextResponse.json({ success: true, skipped: 'not-new' })
    }

    const ref = db.doc(`users/${decoded.uid}`)
    const claimed = await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref)
      if (snap.exists && snap.get('welcomeEmailSentAt')) return false
      tx.set(ref, { welcomeEmailSentAt: FieldValue.serverTimestamp() }, { merge: true })
      return true
    })
    if (!claimed) return NextResponse.json({ success: true, skipped: 'already-sent' })

    const profile = (await ref.get()).data() ?? {}
    const sent = await sendWelcomeEmail({
      email: record.email,
      name: (profile.name as string) || record.displayName || '',
      siteUrl: siteOrigin(request),
      emailVerified: record.emailVerified,
      locale: requestLocale(request),
    })
    if (!sent) {
      // Gönderilemediyse işareti geri al; sonraki istekte yeniden denenebilsin
      await ref.update({ welcomeEmailSentAt: FieldValue.delete() }).catch(() => {})
      return NextResponse.json({ success: false, error: 'E-posta gönderilemedi.' }, { status: 502 })
    }
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('Welcome email error:', e)
    return NextResponse.json({ success: false, error: 'E-posta gönderilemedi.' }, { status: 500 })
  }
}
