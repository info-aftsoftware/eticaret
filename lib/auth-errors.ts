/**
 * Firebase Auth hata kodlarını kullanıcıya gösterilecek Türkçe mesajlara çevirir.
 * Ham İngilizce Firebase mesajı hiçbir zaman kullanıcıya gösterilmez.
 */

const MESSAGES: Record<string, string> = {
  'auth/invalid-credential': 'E-posta adresi veya şifre hatalı.',
  'auth/wrong-password': 'E-posta adresi veya şifre hatalı.',
  'auth/user-not-found': 'E-posta adresi veya şifre hatalı.',
  'auth/invalid-login-credentials': 'E-posta adresi veya şifre hatalı.',
  'auth/invalid-email': 'Geçerli bir e-posta adresi girin.',
  'auth/missing-email': 'E-posta adresinizi girin.',
  'auth/missing-password': 'Şifrenizi girin.',
  'auth/email-already-in-use': 'Bu e-posta adresiyle kayıtlı bir hesap zaten var. Giriş yapabilir veya şifrenizi sıfırlayabilirsiniz.',
  'auth/weak-password': 'Şifre çok zayıf. En az 8 karakter; harf ve rakam içeren bir şifre seçin.',
  'auth/password-does-not-meet-requirements': 'Şifre güvenlik koşullarını karşılamıyor. Daha uzun ve harf/rakam içeren bir şifre seçin.',
  'auth/too-many-requests': 'Çok fazla deneme yapıldı. Lütfen birkaç dakika sonra tekrar deneyin.',
  'auth/user-disabled': 'Bu hesap devre dışı bırakılmış. Lütfen bizimle iletişime geçin.',
  'auth/network-request-failed': 'Bağlantı hatası. İnternet bağlantınızı kontrol edip tekrar deneyin.',
  'auth/operation-not-allowed': 'Bu giriş yöntemi şu anda kullanılamıyor.',
  'auth/popup-blocked': 'Açılır pencere engellendi. Tarayıcınızda bu site için açılır pencerelere izin verip tekrar deneyin.',
  'auth/popup-closed-by-user': 'Giriş penceresi kapatıldı.',
  'auth/cancelled-popup-request': 'Giriş penceresi kapatıldı.',
  'auth/unauthorized-domain': 'Bu alan adından Google ile giriş henüz etkin değil.',
  'auth/account-exists-with-different-credential': 'Bu e-posta adresi başka bir giriş yöntemiyle kayıtlı. Lütfen e-posta ve şifrenizle giriş yapın.',
  'auth/expired-action-code': 'Bağlantının süresi dolmuş. Lütfen yeni bir bağlantı isteyin.',
  'auth/invalid-action-code': 'Bağlantı geçersiz veya daha önce kullanılmış.',
  'auth/requires-recent-login': 'Güvenliğiniz için lütfen yeniden giriş yapın.',
  'auth/quota-exceeded': 'Şu anda çok fazla istek var. Lütfen daha sonra tekrar deneyin.',
  'auth/internal-error': 'Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.',
}

export function authErrorCode(err: unknown): string {
  return (err as { code?: string } | null)?.code ?? ''
}

export function authErrorMessage(err: unknown, fallback = 'Bir hata oluştu. Lütfen tekrar deneyin.'): string {
  return MESSAGES[authErrorCode(err)] ?? fallback
}

/** Şifre gücü: 0 (çok zayıf) – 4 (güçlü). Kayıtta öneri olarak gösterilir. */
export function passwordStrength(pw: string): { score: 0 | 1 | 2 | 3 | 4; label: string } {
  if (!pw) return { score: 0, label: '' }
  let score = 0
  if (pw.length >= 8) score++
  if (pw.length >= 12) score++
  if (/[a-zçğıöşü]/.test(pw) && /[A-ZÇĞİÖŞÜ]/.test(pw)) score++
  if (/\d/.test(pw)) score++
  if (/[^A-Za-z0-9çğıöşüÇĞİÖŞÜ]/.test(pw)) score++
  if (pw.length < 6) score = 0
  const s = Math.min(4, score) as 0 | 1 | 2 | 3 | 4
  const label = ['Çok zayıf', 'Zayıf', 'Orta', 'İyi', 'Güçlü'][s]
  return { score: s, label }
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
