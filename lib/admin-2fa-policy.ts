/**
 * Ana yönetici şifresi (ADMIN_TOKEN) girişinin kuralı (A12). Kişisel hesaplarda iki adımlı doğrulama açıldıktan sonra
 * ana şifre bu korumayı aşan bir arka kapı olmasın:
 *  - ADMIN_MASTER_LOGIN=off: ana şifre girişi tamamen kapalı (kişisel hesaplara geçiş bitince önerilen).
 *  - ADMIN_TOTP_SECRET tanımlı: ana şifre + doğrulama kodu.
 *  - Tanımlı değil ve 2FA'lı en az bir Sahip hesabı var: ana şifre tek başına giriş açmaz
 *    (acil durumda ADMIN_MASTER_LOGIN=allow ile bilinçli olarak açılır; girişler işlem kaydına yazılır).
 * Saf modül (birim testli).
 */

export type MasterLoginMode = 'off' | 'allow' | undefined

export function masterLoginPolicy(opts: { mode?: string | null; hasMasterTotp: boolean; ownersWith2fa: number }): { allowed: boolean; reason?: string } {
  const mode = opts.mode?.trim().toLowerCase()
  if (mode === 'off') {
    return { allowed: false, reason: 'Ana yönetici şifresiyle giriş kapatıldı. Kişisel hesabınızın e-posta adresi ve şifresiyle girin.' }
  }
  if (opts.hasMasterTotp || mode === 'allow') return { allowed: true }
  if (opts.ownersWith2fa > 0) {
    return {
      allowed: false,
      reason: 'İki adımlı doğrulaması açık bir Sahip hesabı var; ana şifre tek başına giriş açmaz. Sahip hesabınızın e-postası, şifresi ve doğrulama koduyla girin.',
    }
  }
  return { allowed: true }
}
