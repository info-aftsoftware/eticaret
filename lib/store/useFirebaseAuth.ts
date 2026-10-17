/**
 * Firebase Auth + Firestore profile.
 * Static hosting uyumlu: /api/auth/* çağrısı yok.
 * Login/Register/Logout tamamen Firebase Auth üzerinden çalışır.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendEmailVerification,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User as FirebaseUser,
} from 'firebase/auth'
import { getAuth } from '@/lib/firebase/config'
import { getUserProfile, setUserProfile } from '@/lib/firebase/firestore'
import { isFirebaseConfigured } from '@/lib/firebase/config'
import { authErrorCode, authErrorMessage } from '@/lib/auth-errors'

export interface User {
  id: string
  email: string
  name: string
  phone?: string
  role: 'customer' | 'admin'
  emailVerified: boolean
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  rememberMe: boolean
  authReady: boolean
  login: (email: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; error?: string }>
  register: (email: string, password: string, name: string, phone?: string) => Promise<{ success: boolean; error?: string; message?: string; verificationSent?: boolean }>
  /** Google ile giriş/kayıt. İlk girişte Firestore profili register ile aynı şekilde oluşturulur. */
  loginWithGoogle: () => Promise<{ success: boolean; isNewUser?: boolean; error?: string; code?: string }>
  logout: () => void
  setUser: (user: User | null) => void
  setToken: (token: string | null) => void
  refreshUserProfile: (uid: string) => Promise<void>
}

function mapFirebaseUser(fb: FirebaseUser, profile: { name: string; phone?: string; role?: string } | null): User {
  return {
    id: fb.uid,
    email: fb.email || '',
    name: profile?.name ?? fb.displayName ?? '',
    phone: profile?.phone,
    role: (profile?.role as 'customer' | 'admin') ?? 'customer',
    emailVerified: fb.emailVerified ?? false,
  }
}

export const useFirebaseAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      rememberMe: false,
      authReady: false,

      login: async (email: string, password: string, rememberMe: boolean = false) => {
        if (!isFirebaseConfigured) {
          return { success: false, error: 'Firebase yapılandırılmamış.' }
        }
        try {
          const auth = getAuth()
          // "Beni hatırla": işaretliyse oturum tarayıcı kapansa da sürer, değilse tarayıcı oturumu bitince kapanır
          await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence)
          const cred = await signInWithEmailAndPassword(auth, email.trim(), password)
          // Static hosting: Firebase ID token'ı doğrudan kullan (backend session yok)
          const firebaseToken = await cred.user.getIdToken()
          const profile = await getUserProfile(cred.user.uid)
          const user = mapFirebaseUser(cred.user, profile)
          set({
            user,
            token: firebaseToken,
            isAuthenticated: true,
            rememberMe,
          })
          return { success: true }
        } catch (err) {
          return { success: false, error: authErrorMessage(err, 'Giriş yapılamadı. Lütfen tekrar deneyin.') }
        }
      },

      register: async (email: string, password: string, name: string, phone?: string) => {
        if (!isFirebaseConfigured) {
          return { success: false, error: 'Firebase yapılandırılmamış.' }
        }
        try {
          const auth = getAuth()
          await setPersistence(auth, browserLocalPersistence)
          const cred = await createUserWithEmailAndPassword(auth, email.trim(), password)
          await setUserProfile(cred.user.uid, {
            email: cred.user.email || email,
            name,
            phone,
            role: 'customer',
          })
          // Static hosting: Firebase ID token'ı doğrudan kullan
          const firebaseToken = await cred.user.getIdToken()
          const user: User = {
            id: cred.user.uid,
            email: cred.user.email || email,
            name,
            phone,
            role: 'customer',
            emailVerified: false,
          }
          set({
            user,
            token: firebaseToken,
            isAuthenticated: true,
            rememberMe: true,
          })
          // Doğrulama e-postası: hatası kaydı engellemez (profilden / doğrulama sayfasından tekrar gönderilebilir)
          const verification = await sendVerificationEmail().catch(() => ({ success: false }))
          return { success: true, message: 'Hesabınız oluşturuldu.', verificationSent: verification.success }
        } catch (err) {
          return { success: false, error: authErrorMessage(err, 'Kayıt tamamlanamadı. Lütfen tekrar deneyin.') }
        }
      },

      loginWithGoogle: async () => {
        if (!isFirebaseConfigured) {
          return { success: false, error: 'Firebase yapılandırılmamış.' }
        }
        try {
          const auth = getAuth()
          await setPersistence(auth, browserLocalPersistence)
          const provider = new GoogleAuthProvider()
          provider.setCustomParameters({ prompt: 'select_account' })
          const cred = await signInWithPopup(auth, provider)
          let profile = await getUserProfile(cred.user.uid)
          const isNewUser = !profile
          if (!profile) {
            const data = {
              email: cred.user.email || '',
              name: cred.user.displayName || (cred.user.email ? cred.user.email.split('@')[0] : ''),
              phone: cred.user.phoneNumber || undefined,
              role: 'customer' as const,
            }
            await setUserProfile(cred.user.uid, data)
            profile = { ...data, createdAt: { seconds: 0, nanoseconds: 0 } }
          }
          const firebaseToken = await cred.user.getIdToken()
          set({
            user: mapFirebaseUser(cred.user, profile),
            token: firebaseToken,
            isAuthenticated: true,
            rememberMe: true,
          })
          return { success: true, isNewUser }
        } catch (err) {
          return {
            success: false,
            code: authErrorCode(err),
            error: authErrorMessage(err, 'Google ile giriş yapılamadı. Lütfen tekrar deneyin.'),
          }
        }
      },

      logout: () => {
        if (isFirebaseConfigured && typeof window !== 'undefined') {
          try { firebaseSignOut(getAuth()) } catch (e) { console.error('Logout error:', e) }
        }
        set({ user: null, token: null, isAuthenticated: false, rememberMe: false })
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('auth-token')
          sessionStorage.removeItem('auth-user')
        }
      },

      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setToken: (token) => set({ token }),

      refreshUserProfile: async (uid: string) => {
        const profile = await getUserProfile(uid)
        if (!profile) return
        set((s) => ({
          user: s.user
            ? { ...s.user, name: profile.name, phone: profile.phone, role: (profile.role as any) ?? s.user.role }
            : null,
        }))
      },
    }),
    {
      name: 'auth-storage',
      // authReady kalıcı değil: her sayfa yüklemesinde Firebase dinleyicisi oturumu doğrulayana kadar false
      partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated, rememberMe: state.rememberMe }),
    }
  )
)

// Firebase Auth state listener — static hosting uyumlu, backend session yok
if (typeof window !== 'undefined' && isFirebaseConfigured) {
  try {
    const auth = getAuth()
    onAuthStateChanged(auth, async (fbUser) => {
      try {
        if (fbUser) {
          const firebaseToken = await fbUser.getIdToken()
          const profile = await getUserProfile(fbUser.uid)
          const user = mapFirebaseUser(fbUser, profile)
          useFirebaseAuthStore.setState({
            user,
            token: firebaseToken,
            isAuthenticated: true,
            authReady: true,
          })
        } else {
          useFirebaseAuthStore.setState({
            user: null,
            token: null,
            isAuthenticated: false,
            authReady: true,
          })
        }
      } catch (error) {
        console.error('Auth state change error:', error)
        useFirebaseAuthStore.setState({ authReady: true })
      }
    })
  } catch {
    useFirebaseAuthStore.setState({ authReady: true })
  }
} else {
  useFirebaseAuthStore.setState({ authReady: true })
}

/**
 * API istekleri için geçerli Firebase ID token'ı. Firebase SDK süresi dolmuş token'ı otomatik yeniler
 * (store'da saklanan token 1 saat sonra geçersizleşir). Oturum yoksa null.
 */
export async function getAuthToken(): Promise<string | null> {
  if (typeof window === 'undefined' || !isFirebaseConfigured) return null
  try {
    const auth = getAuth()
    // Sayfa yeni açıldıysa Firebase oturumu geri yükleyene kadar bekle (eski token'a düşmemek için)
    await auth.authStateReady()
    const current = auth.currentUser
    if (!current) return useFirebaseAuthStore.getState().token
    const token = await current.getIdToken()
    if (token !== useFirebaseAuthStore.getState().token) useFirebaseAuthStore.setState({ token })
    return token
  } catch {
    return null
  }
}

/** Oturum açık kullanıcı için kimlik doğrulamalı JSON isteği (taze ID token ile). */
async function authedPost(path: string, body?: unknown): Promise<Response | null> {
  const token = await getAuthToken()
  if (!token) return null
  return fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: body ? JSON.stringify(body) : undefined,
  })
}

/**
 * Doğrulama e-postası gönderir. Önce sunucu (markalı e-posta, bağlantı doğrudan /verify-email sayfasına);
 * sunucu kullanılamazsa Firebase'in kendi e-postası (sendEmailVerification, dönüş adresi /verify-email).
 */
export async function sendVerificationEmail(): Promise<{ success: boolean; alreadyVerified?: boolean; error?: string }> {
  if (typeof window === 'undefined' || !isFirebaseConfigured) return { success: false, error: 'Firebase yapılandırılmamış.' }
  const auth = getAuth()
  await auth.authStateReady()
  const current = auth.currentUser
  if (!current) return { success: false, error: 'Oturum bulunamadı. Lütfen giriş yapın.' }
  if (current.emailVerified) return { success: true, alreadyVerified: true }

  try {
    const res = await authedPost('/api/account/verification-email')
    if (res) {
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.success) return { success: true, alreadyVerified: !!data.alreadyVerified }
      if (res.status === 429) return { success: false, error: data.error || 'Çok fazla istek. Lütfen biraz sonra tekrar deneyin.' }
    }
  } catch {
    // sunucuya ulaşılamadı → Firebase e-postasına düş
  }

  try {
    await sendEmailVerification(current, { url: `${window.location.origin}/verify-email`, handleCodeInApp: false })
    return { success: true }
  } catch (err) {
    const code = authErrorCode(err)
    // Dönüş adresi Firebase'de yetkili alan adı değilse varsayılan (dönüşsüz) e-postayı gönder
    if (code === 'auth/unauthorized-continue-uri' || code === 'auth/invalid-continue-uri') {
      try {
        await sendEmailVerification(current)
        return { success: true }
      } catch (e) {
        return { success: false, error: authErrorMessage(e) }
      }
    }
    return { success: false, error: authErrorMessage(err) }
  }
}

/**
 * Kullanıcıyı Firebase'den yeniden okur; e-posta doğrulandıysa ID token'ı yeniler (email_verified claim'i
 * sunucuya — örn. misafir siparişlerinin hesaba bağlanması — hemen yansısın diye) ve store'u günceller.
 */
export async function refreshEmailVerified(): Promise<boolean> {
  if (typeof window === 'undefined' || !isFirebaseConfigured) return false
  const auth = getAuth()
  try {
    await auth.authStateReady()
    const current = auth.currentUser
    if (!current) return false
    await current.reload()
    if (!current.emailVerified) return false
    const token = await current.getIdToken(true)
    useFirebaseAuthStore.setState((s) => ({ token, user: s.user ? { ...s.user, emailVerified: true } : s.user }))
    return true
  } catch {
    return false
  }
}

/** Hoş geldiniz e-postası (sunucuda kullanıcı başına bir kez gönderilir). Hata kullanıcı akışını etkilemez. */
export async function requestWelcomeEmail(): Promise<void> {
  try {
    await authedPost('/api/account/welcome')
  } catch {
    // sessiz
  }
}
