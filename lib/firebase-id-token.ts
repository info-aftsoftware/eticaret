/**
 * Firebase ID token doğrulaması — Admin SDK (servis hesabı) gerekmeden.
 * Firebase belgelerindeki "üçüncü taraf JWT kütüphanesiyle doğrulama" yöntemi: Google'ın açık anahtarlarıyla
 * RS256 imza, aud = proje kimliği, iss = https://securetoken.google.com/<proje>, süre ve auth_time kontrolü.
 *
 * Admin SDK yapılandırılmışsa ve istemciyle aynı projedeyse firebase-admin tercih edilir (iptal edilmiş oturum
 * kontrolü gibi ek özellikler için). Admin anahtarı eksik ya da başka projeye aitse bu doğrulama kullanılır;
 * böylece üye siparişleri, "Siparişlerim" ve sipariş sahipliği servis hesabı anahtarı beklenmeden çalışır.
 */
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose'
import { adminProjectMatchesClient, getAdminAuth } from '@/lib/firebaseAdminServer'

const JWKS_URL = 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'
let jwks: ReturnType<typeof createRemoteJWKSet> | null = null

export type FirebaseIdToken = {
  uid: string
  email?: string
  email_verified?: boolean
  name?: string
  admin?: boolean
}

async function verifyWithPublicKeys(token: string): Promise<FirebaseIdToken | null> {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  if (!projectId) return null
  jwks ??= createRemoteJWKSet(new URL(JWKS_URL), { cacheMaxAge: 6 * 3_600_000 })
  try {
    const { payload } = await jwtVerify(token, jwks, {
      algorithms: ['RS256'],
      audience: projectId,
      issuer: `https://securetoken.google.com/${projectId}`,
    })
    const p = payload as JWTPayload & { email?: string; email_verified?: boolean; name?: string; admin?: boolean; auth_time?: number }
    if (!p.sub || typeof p.sub !== 'string') return null
    if (typeof p.auth_time === 'number' && p.auth_time * 1000 > Date.now() + 60_000) return null
    return { uid: p.sub, email: p.email, email_verified: p.email_verified, name: p.name, admin: p.admin }
  } catch {
    return null
  }
}

/** Firebase ID token'ını doğrular; geçersizse null. */
export async function verifyFirebaseIdToken(token: string): Promise<FirebaseIdToken | null> {
  const auth = adminProjectMatchesClient() ? getAdminAuth() : null
  if (auth) {
    try {
      const d = await auth.verifyIdToken(token)
      return { uid: d.uid, email: d.email, email_verified: d.email_verified, name: d.name as string | undefined, admin: d.admin === true }
    } catch {
      return null
    }
  }
  return verifyWithPublicKeys(token)
}
