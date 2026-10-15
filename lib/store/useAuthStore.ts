/**
 * Auth store: Firebase tabanlı (kayıt, giriş, çıkış).
 * Profil ve adresler Firestore'da; her girişte kullanılır.
 */

export { useFirebaseAuthStore as useAuthStore, getAuthToken } from './useFirebaseAuth'
export type { User } from './useFirebaseAuth'
