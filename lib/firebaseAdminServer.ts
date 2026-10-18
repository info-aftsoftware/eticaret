/**
 * Firebase Admin SDK - sadece sunucu tarafında.
 * FIREBASE_ADMIN_* env dolu ise token doğrulama, JWT bridge ve Firestore okuma için kullanılır.
 */

import { getApps, getApp, initializeApp, cert, type App } from 'firebase-admin/app'
import { getAuth, type Auth } from 'firebase-admin/auth'
import { getFirestore, type Firestore } from 'firebase-admin/firestore'

let adminAuth: Auth | null = null

function getAdminApp(): App | null {
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY

  if (!projectId || !clientEmail || !privateKey) return null

  if (getApps().length) return getApp() as App

  try {
    const key = privateKey.replace(/\\n/g, '\n')
    return initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey: key,
      }),
    })
  } catch {
    return null
  }
}

export function getAdminAuth(): Auth | null {
  if (adminAuth) return adminAuth
  const app = getAdminApp()
  if (!app) return null
  adminAuth = getAuth(app)
  return adminAuth
}

/**
 * Sunucu Admin SDK'sı ile istemcinin Firebase projesi aynı mı? Farklıysa (proje taşıması yarım kaldıysa)
 * kullanıcı arama, token doğrulama ve e-posta işlem bağlantıları yanlış projeye gider; bu uçlar 503 dönüp
 * istemcinin Firebase'in kendi e-postasına düşmesini sağlamalıdır.
 */
export function adminProjectMatchesClient(): boolean {
  const admin = process.env.FIREBASE_ADMIN_PROJECT_ID
  const client = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  if (!admin || !client) return true
  if (admin === client) return true
  if (!projectMismatchLogged) {
    projectMismatchLogged = true
    console.error(`[firebase-admin] Admin SDK projesi "${admin}", istemci projesi "${client}". FIREBASE_ADMIN_* değişkenlerini istemci projesinin servis hesabıyla güncelleyin (FIREBASE_SETUP.md, adım 6).`)
  }
  return false
}
let projectMismatchLogged = false

export function isFirebaseAdminConfigured(): boolean {
  return Boolean(
    process.env.FIREBASE_ADMIN_PROJECT_ID &&
    process.env.FIREBASE_ADMIN_CLIENT_EMAIL &&
    process.env.FIREBASE_ADMIN_PRIVATE_KEY
  )
}

let adminFirestore: Firestore | null = null

export function getAdminFirestore(): Firestore | null {
  if (adminFirestore) return adminFirestore
  const app = getAdminApp()
  if (!app) return null
  adminFirestore = getFirestore(app)
  return adminFirestore
}
