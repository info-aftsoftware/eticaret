/**
 * Müşteri (customer) kimlik doğrulama.
 * İstemci `Authorization: Bearer <token>` gönderir. Token iki türden biri olabilir:
 *  1) Backend JWT (firebase-session / login sonrası, JWT_SECRET ile imzalı)
 *  2) Firebase ID token (useFirebaseAuth store'u doğrudan bunu kullanır) — lib/firebase-id-token ile doğrulanır
 *     (firebase-admin varsa o, yoksa Google açık anahtarları)
 * Firebase kullanıcısı Prisma'da yoksa oluşturulur (Order.userId FK için).
 */

import { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'
import { verifyFirebaseIdToken } from '@/lib/firebase-id-token'

const JWT_SECRET = process.env.JWT_SECRET ?? ''

export type AuthenticatedCustomer = {
  userId: string
  email: string | null
  emailVerified: boolean
}

function bearer(request: NextRequest): string | null {
  const header = request.headers.get('authorization')
  if (!header?.startsWith('Bearer ')) return null
  return header.slice(7).trim() || null
}

/**
 * Backend JWT ile gelen istekten userId döner (yalnızca backend JWT; Firebase token'ı tanımaz).
 * Yeni kodda getCustomerFromRequest kullanın.
 */
export function getUserIdFromRequest(request: NextRequest): string | null {
  const token = bearer(request)
  if (!token || !JWT_SECRET) return null
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId?: string }
    return decoded.userId ?? null
  } catch {
    return null
  }
}

/** Backend JWT veya Firebase ID token ile doğrulanmış müşteri; yoksa null. */
export async function getCustomerFromRequest(request: NextRequest): Promise<AuthenticatedCustomer | null> {
  const token = bearer(request)
  if (!token) return null

  if (JWT_SECRET) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId?: string; email?: string }
      if (decoded.userId) {
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: { id: true, email: true, emailVerified: true },
        })
        if (user) return { userId: user.id, email: user.email, emailVerified: user.emailVerified }
      }
    } catch {
      // backend JWT değil → Firebase ID token olarak dene
    }
  }

  try {
    const decoded = await verifyFirebaseIdToken(token)
    if (!decoded) return null
    // Admin panelinin Firebase kimliği (özel token, admin claim'i) müşteri hesabı sayılmaz
    if (decoded.uid === 'admin-panel-user' || decoded.admin === true) return null
    const email = decoded.email?.toLowerCase() ?? null
    const emailVerified = decoded.email_verified ?? false
    const name = decoded.name || (email ? email.split('@')[0] : 'Müşteri')

    const existing = await prisma.user.findUnique({ where: { id: decoded.uid }, select: { id: true, emailVerified: true } })
    if (existing && emailVerified && !existing.emailVerified) {
      // E-posta sonradan doğrulandı (Firebase) → Prisma kaydını eşitle
      await prisma.user.update({ where: { id: decoded.uid }, data: { emailVerified: true } }).catch(() => {})
    }
    if (!existing) {
      // Aynı e-postayla başka bir Prisma kaydı varsa (eski e-posta/şifre hesabı) e-postayı çakıştırma
      const emailTaken = email ? await prisma.user.findUnique({ where: { email }, select: { id: true } }) : null
      await prisma.user.create({
        data: {
          id: decoded.uid,
          email: emailTaken || !email ? `firebase-${decoded.uid}@placeholder.local` : email,
          name,
          role: 'customer',
          emailVerified,
        },
      })
    }
    return { userId: decoded.uid, email, emailVerified }
  } catch {
    return null
  }
}
