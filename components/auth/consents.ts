/**
 * Üyelik onay kayıtları (zaman damgalı) — kayıt formu ve ilk Google girişi aynı yapıyı yazar.
 */
import { setUserProfile } from '@/lib/firebase/firestore'
import { getLegalDocument } from '@/lib/legal/documents'

export async function saveSignupConsents(uid: string, acceptMarketing: boolean): Promise<void> {
  const now = new Date().toISOString()
  await setUserProfile(uid, {
    consents: {
      membershipTerms: { accepted: true, at: now, version: getLegalDocument('uyelik-ve-kullanim-kosullari')?.updated ?? null },
      kvkkInformed: { at: now, version: getLegalDocument('kvkk')?.updated ?? null },
      commercialMessages: { accepted: acceptMarketing, at: now, channels: acceptMarketing ? ['email', 'sms'] : [] },
    },
  })
  await saveMarketingConsent(acceptMarketing, 'kayit')
}

/**
 * Ticari ileti iznini sunucudaki izin defterine yazar (İYS ispatı: tarih, kaynak, IP). Oturum gerekir.
 * Başarısız olursa false döner; çağıran tekrar denemeyi önerebilir.
 */
export async function saveMarketingConsent(accepted: boolean, source: 'kayit' | 'hesap'): Promise<boolean> {
  try {
    const { getAuth } = await import('@/lib/firebase/config')
    const token = await getAuth().currentUser?.getIdToken()
    if (!token) return false
    const res = await fetch('/api/account/consent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ accepted, source }),
    })
    return res.ok
  } catch {
    return false
  }
}
