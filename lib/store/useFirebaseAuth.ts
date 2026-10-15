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
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User as FirebaseUser,
} from 'firebase/auth'
import { getAuth } from '@/lib/firebase/config'
import { getUserProfile, setUserProfile } from '@/lib/firebase/firestore'
import { isFirebaseConfigured } from '@/lib/firebase/config'

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
  register: (email: string, password: string, name: string, phone?: string) => Promise<{ success: boolean; error?: string; message?: string }>
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
          const cred = await signInWithEmailAndPassword(auth, email, password)
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
        } catch (err: any) {
          const code = err?.code || ''
          const message =
            code === 'auth/user-not-found' || code === 'auth/invalid-credential' || code === 'auth/wrong-password'
              ? 'E-posta veya şifre hatalı.'
              : code === 'auth/invalid-email'
                ? 'Geçersiz e-posta.'
                : err?.message || 'Giriş başarısız.'
          return { success: false, error: message }
        }
      },

      register: async (email: string, password: string, name: string, phone?: string) => {
        if (!isFirebaseConfigured) {
          return { success: false, error: 'Firebase yapılandırılmamış.' }
        }
        try {
          const auth = getAuth()
          const cred = await createUserWithEmailAndPassword(auth, email, password)
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
          return { success: true, message: 'Hesabınız oluşturuldu.' }
        } catch (err: any) {
          const code = err?.code || ''
          const message =
            code === 'auth/email-already-in-use'
              ? 'Bu e-posta adresi zaten kullanılıyor.'
              : code === 'auth/weak-password'
                ? 'Şifre en az 6 karakter olmalıdır.'
                : err?.message || 'Kayıt başarısız.'
          return { success: false, error: message }
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
    const current = getAuth().currentUser
    if (!current) return useFirebaseAuthStore.getState().token
    const token = await current.getIdToken()
    if (token !== useFirebaseAuthStore.getState().token) useFirebaseAuthStore.setState({ token })
    return token
  } catch {
    return null
  }
}
