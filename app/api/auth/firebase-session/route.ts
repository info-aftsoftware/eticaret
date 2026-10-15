export const dynamic = 'force-dynamic'

/**
 * Firebase ID token → Backend JWT (auth bridge).
 * Giriş/kayıt sonrası frontend bu endpoint'i çağırır; dönen JWT ile Tekliflerim ve Admin API kullanılır.
 * Body: { token: string } (Firebase ID token)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAdminAuth, getAdminFirestore, isFirebaseAdminConfigured } from '@/lib/firebaseAdminServer'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET
const JWT_EXPIRY = '7d'

/**
 * Firestore users/{uid} profilinden customerNo oku.
 * Rol bilinçli olarak OKUNMAZ: kullanıcı kendi Firestore belgesine yazabildiği için oradaki `role`
 * güvenilir değildir. Yetki için tek kaynak Prisma `User.role` alanıdır.
 */
async function getFirestoreProfile(uid: string): Promise<{ customerNo?: string }> {
  const db = getAdminFirestore()
  if (!db) return {}
  try {
    const snap = await db.doc(`users/${uid}`).get()
    const data = snap?.data()
    const customerNo = typeof data?.customerNo === 'string' ? data.customerNo : undefined
    return { customerNo }
  } catch {
    return {}
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!isFirebaseAdminConfigured()) {
      return NextResponse.json(
        { error: 'Firebase Admin yapılandırılmamış. Tekliflerim/Admin için FIREBASE_ADMIN_* ve JWT_SECRET tanımlayın.' },
        { status: 503 }
      )
    }

    const body = await request.json()
    const idToken = typeof body?.token === 'string' ? body.token.trim() : null

    if (!idToken) {
      return NextResponse.json({ error: 'token gerekli' }, { status: 400 })
    }

    const auth = getAdminAuth()
    if (!auth) {
      return NextResponse.json({ error: 'Firebase Admin başlatılamadı' }, { status: 503 })
    }

    const decoded = await auth.verifyIdToken(idToken)
    const uid = decoded.uid
    const email = decoded.email || ''
    const name = (decoded.name as string) || (email ? email.split('@')[0] : 'Kullanıcı')

    const firestoreProfile = await getFirestoreProfile(uid)

    let user = await prisma.user.findUnique({
      where: { id: uid },
    })

    if (!user) {
      user = await prisma.user.create({
        data: {
          id: uid,
          email: email.toLowerCase() || `firebase-${uid}@placeholder.local`,
          name,
          role: 'customer',
          emailVerified: decoded.email_verified ?? false,
          customerNo: firestoreProfile.customerNo ?? undefined,
        },
      })
    } else {
      const updateData: { email?: string; name?: string; emailVerified?: boolean; customerNo?: string } = {
        email: email ? email.toLowerCase() : user.email,
        name: user.name || name,
        emailVerified: decoded.email_verified ?? user.emailVerified,
      }
      if (firestoreProfile.customerNo && !user.customerNo) updateData.customerNo = firestoreProfile.customerNo
      if (user.customerNo && !firestoreProfile.customerNo) {
        const db = getAdminFirestore()
        if (db) {
          try {
            await db.doc(`users/${uid}`).set({ customerNo: user.customerNo }, { merge: true })
          } catch {}
        }
      }
      await prisma.user.update({
        where: { id: uid },
        data: updateData,
      })
      user = await prisma.user.findUnique({ where: { id: uid } }) as typeof user
    }

    if (!JWT_SECRET) {
      return NextResponse.json({ error: 'Sunucu yapılandırma hatası.' }, { status: 503 })
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY }
    )

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        emailVerified: user.emailVerified,
      },
      expiresIn: JWT_EXPIRY,
    })
  } catch (err: any) {
    if (err?.code === 'auth/id-token-expired' || err?.code === 'auth/argument-error') {
      return NextResponse.json({ error: 'Geçersiz veya süresi dolmuş token' }, { status: 401 })
    }
    console.error('Firebase session error:', err)
    return NextResponse.json({ error: 'Oturum alınamadı' }, { status: 500 })
  }
}
