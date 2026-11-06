/**
 * Kişiye özel verilerin cihazda kalmaması: çıkışta (veya oturum düşünce) tarayıcıda tutulan kişisel izler silinir.
 * Ortak kullanılan bir bilgisayarda sonraki kişi önceki hesabın ad/e-posta/telefonunu, sipariş sorgu bilgilerini
 * veya karşılaştırma listesini görmesin. Hesap verileri (sipariş, favori, adres) sunucuda/Firestore'da hesaba bağlıdır.
 * Üyenin sepeti sahibinin uid'siyle saklanır ve başka hesapta/misafirde gösterilmez (lib/store/useCartStore).
 */

const LOCAL_KEYS = [
  // Eski sürümlerin form taslağı (ad, e-posta, telefon, il): artık yazılmıyor, kalıntısı silinir
  'site_contact_draft',
  'compare-storage',
  'guest-favorites',
  'voltekno_verify_sent_at',
]

const SESSION_KEYS = ['order-lookup', 'register-prefill', 'last-order', 'favorite-after-login', 'auth-token', 'auth-user']

export function clearPersonalDeviceData(): void {
  if (typeof window === 'undefined') return
  for (const key of LOCAL_KEYS) {
    try {
      localStorage.removeItem(key)
    } catch {}
  }
  for (const key of SESSION_KEYS) {
    try {
      sessionStorage.removeItem(key)
    } catch {}
  }
}

/** Kişisel bilgi içeren eski form taslağını siler (sayfa açılışında çağrılır) */
export function dropLegacyContactDraft(): void {
  try {
    localStorage.removeItem('site_contact_draft')
  } catch {}
}
