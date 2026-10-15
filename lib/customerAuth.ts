/**
 * Müşteri (customer) kimlik doğrulama.
 * İstemci `Authorization: Bearer <token>` gönderir. Token iki türden biri olabilir:
 *  1) Backend JWT (firebase-session / login sonrası, JWT_SECRET ile imzalı)
 *  2) Firebase ID token (useFirebaseAuth store'u doğrudan bunu kullanır) — firebase-admin ile doğrulanır
 * Firebase kullanıcısı Prisma'da yoksa oluşturulur (Order.userId FK için).
 */

import { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'
import { getAdminAuth } from '@/lib/firebaseAdminServer'

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

  const auth = getAdminAuth()
  if (!auth) return null
  try {
    const decoded = await auth.verifyIdToken(token)
    const email = decoded.email?.toLowerCase() ?? null
    const emailVerified = decoded.email_verified ?? false
    const name = (decoded.name as string | undefined) || (email ? email.split('@')[0] : 'Müşteri')

    const existing = await prisma.user.findUnique({ where: { id: decoded.uid }, select: { id: true } })
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
