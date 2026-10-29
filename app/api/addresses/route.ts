export const dynamic = 'force-dynamic'

/**
 * Adresler API - Firestore proxy (tek kaynak: users/{uid}/addresses).
 * Profil ve checkout client tarafında doğrudan Firestore kullanır; bu API aynı veri kaynağına proxy sağlar.
 */

import { NextRequest, NextResponse } from 'next/server'
import { isValidTrPhone } from '@/lib/checkout-validation'
import jwt from 'jsonwebtoken'
import { getAdminFirestore, isFirebaseAdminConfigured } from '@/lib/firebaseAdminServer'

function getUserIdFromToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')
  if (!token) return null
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET ?? '', { algorithms: ['HS256'] }) as { userId?: string }
    return decoded.userId ?? null
  } catch {
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromToken(request)
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    if (!isFirebaseAdminConfigured()) {
      return NextResponse.json(
        { success: false, error: 'Firebase Admin yapılandırılmamış' },
        { status: 503 }
      )
    }

    const db = getAdminFirestore()
    if (!db) {
      return NextResponse.json(
        { success: false, error: 'Firestore kullanılamıyor' },
        { status: 503 }
      )
    }

    const snap = await db.collection('users').doc(userId).collection('addresses').get()
    const addresses = snap.docs.map((d) => {
      const data = d.data()
      return { id: d.id, ...data }
    })
    addresses.sort((a: any, b: any) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0))

    return NextResponse.json({ success: true, addresses })
  } catch (error) {
    console.error('Error fetching addresses:', error)
    return NextResponse.json({ success: false, error: 'Bir hata oluştu' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromToken(request)
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      title = '',
      name = '',
      phone = '',
      addressLine = '',
      city = '',
      district = '',
      postalCode = '',
      country = 'Türkiye',
      isDefault = false,
    } = body

    if (!isValidTrPhone(String(phone))) {
      return NextResponse.json({ success: false, error: 'Geçerli bir telefon numarası girin (11 hane, örn. 0532 123 45 67).' }, { status: 400 })
    }

    if (!isFirebaseAdminConfigured()) {
      return NextResponse.json(
        { success: false, error: 'Firebase Admin yapılandırılmamış' },
        { status: 503 }
      )
    }

    const db = getAdminFirestore()
    if (!db) {
      return NextResponse.json(
        { success: false, error: 'Firestore kullanılamıyor' },
        { status: 503 }
      )
    }

    const colRef = db.collection('users').doc(userId).collection('addresses')

    if (isDefault) {
      const existing = await colRef.where('isDefault', '==', true).get()
      const batch = db.batch()
      existing.docs.forEach((d) => batch.update(d.ref, { isDefault: false }))
      await batch.commit()
    }

    const docRef = await colRef.add({
      title,
      name,
      phone,
      addressLine,
      city,
      district,
      postalCode,
      country,
      isDefault,
    })

    const created = await docRef.get()
    const address = { id: created.id, ...created.data() }

    return NextResponse.json({ success: true, address })
  } catch (error) {
    console.error('Error creating address:', error)
    return NextResponse.json({ success: false, error: 'Bir hata oluştu' }, { status: 500 })
  }
}

