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
}
