export const dynamic = 'force-dynamic'

/**
 * KVKK — üyelik hesabını silme.
 * Silinenler: Firebase Auth hesabı, Firestore profil + adresler + favoriler, Prisma kullanıcı kaydı (adres/favori/sepet),
 * bülten aboneliği. Siparişler ve faturalar yasal saklama süresi (VUK/TTK) boyunca tutulur; hesapla bağlantıları kaldırılır.
 * Güvenlik: Firebase ID token son 5 dakika içinde şifreyle yeniden doğrulanarak alınmış olmalı (auth_time).
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { adminProjectMatchesClient, getAdminAuth, getAdminFirestore } from '@/lib/firebaseAdminServer'
import { verifyFirebaseIdToken } from '@/lib/firebase-id-token'
import { isRateLimited } from '@/lib/rate-limit'

const RECENT_LOGIN_SECONDS = 5 * 60

export async function DELETE(request: NextRequest) {
  if (isRateLimited(request, 'account-delete', 5, 10 * 60_000)) {
    return NextResponse.json({ success: false, error: 'Çok fazla istek.' }, { status: 429 })
  }
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/, '')
  if (!token) return NextResponse.json({ success: false, error: 'Giriş yapmanız gerekiyor.' }, { status: 401 })

  const auth = adminProjectMatchesClient() ? getAdminAuth() : null
  const db = auth ? getAdminFirestore() : null
  if (!auth || !db) {
    // Servis hesabı yokken: oturum Google açık anahtarlarıyla doğrulanır, sunucudaki veriler silinir;
    // Firebase hesabı ve kullanıcının kendi Firestore verileri tarayıcıda silinir (istemci SDK, yeni girişle izinli).
    const decoded = await verifyFirebaseIdToken(token)
    if (!decoded) return NextResponse.json({ success: false, error: 'Oturum doğrulanamadı.' }, { status: 401 })
    if (!decoded.auth_time || Date.now() / 1000 - decoded.auth_time > RECENT_LOGIN_SECONDS) {
      return NextResponse.json({ success: false, error: 'Güvenliğiniz için şifrenizi yeniden girip tekrar deneyin.' }, { status: 401 })
    }
    try {
      await prisma.user.deleteMany({ where: { id: decoded.uid } })
      console.log(`Account data deleted (KVKK request, client completes auth deletion): ${decoded.uid}`)
      return NextResponse.json({ success: true, clientDelete: true })
    } catch (e) {
      console.error('Account delete error:', e)
      return NextResponse.json({ success: false, error: 'Hesap silinemedi. Lütfen bizimle iletişime geçin.' }, { status: 500 })
    }
  }

  let uid: string
  let email: string | null
  try {
    const decoded = await auth.verifyIdToken(token, true)
    if (Date.now() / 1000 - decoded.auth_time > RECENT_LOGIN_SECONDS) {
      return NextResponse.json(
        { success: false, error: 'Güvenliğiniz için şifrenizi yeniden girip tekrar deneyin.' },
        { status: 401 }
      )
    }
    uid = decoded.uid
    email = decoded.email?.toLowerCase() ?? null
  } catch {
    return NextResponse.json({ success: false, error: 'Oturum doğrulanamadı.' }, { status: 401 })
  }

  try {
    // 1) Prisma: siparişler kalır (onDelete: SetNull), adres/favori/sepet silinir (Cascade)
    await prisma.user.deleteMany({ where: { id: uid } })

    // 2) Firestore: profil ve tüm alt koleksiyonlar; bülten aboneliği
    await db.recursiveDelete(db.doc(`users/${uid}`))
    if (email) {
      const subs = await db.collection('newsletter').where('email', '==', email).get()
      await Promise.all(subs.docs.map((d) => d.ref.delete()))
    }

    // 3) Firebase Auth hesabı (en son: başarısız olursa kullanıcı tekrar deneyebilir)
    await auth.deleteUser(uid)

    console.log(`Account deleted (KVKK request): ${uid}`)
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('Account delete error:', e)
    return NextResponse.json({ success: false, error: 'Hesap silinemedi. Lütfen bizimle iletişime geçin.' }, { status: 500 })
  }
}
