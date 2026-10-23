/**
 * E-posta gönderim hatalarının sınıflandırılması (A10): test/ayrılmış alan adına giden ileti altyapı arızası sayılmaz,
 * SMTP hataları nedeni ve yeniden denenip denenemeyeceğiyle birlikte kayda yazılır. Saf modül (birim testli).
 */

/** RFC 2606 / 6761 ayrılmış alan adları ve sitenin yer tutucu adresleri: gerçek alıcı değildir, gönderilmez */
const TEST_DOMAINS = /(^|\.)(example\.(com|org|net)|test|invalid|localhost|example|placeholder\.local)$/i

export function isTestRecipient(email: string | null | undefined): boolean {
  const domain = String(email ?? '').split('@')[1]?.trim()
  return !!domain && TEST_DOMAINS.test(domain)
}

export const TEST_RECIPIENT_ERROR = 'TEST_RECIPIENT'

export type EmailFailure = { reason: string; retryable: boolean; infrastructure: boolean }

/** Gönderim hatasını kullanıcıya gösterilecek Türkçe nedene çevirir */
export function classifyEmailFailure(error: string | null | undefined, to?: string | null): EmailFailure {
  const e = String(error ?? '')
  if (e === TEST_RECIPIENT_ERROR || isTestRecipient(to)) {
    return { reason: 'test adresi (gerçek alıcı değil, gönderilmedi; altyapı hatası değildir)', retryable: false, infrastructure: false }
  }
  if (/invalid email/i.test(e)) return { reason: 'alıcı adresi geçersiz', retryable: false, infrastructure: false }
  if (/not configured|no email service/i.test(e)) return { reason: 'e-posta servisi (SMTP) yapılandırılmamış', retryable: true, infrastructure: true }
  if (/authentication|auth|535/i.test(e)) return { reason: 'SMTP kimlik doğrulaması başarısız (kullanıcı adı/şifre)', retryable: true, infrastructure: true }
  if (/timeout/i.test(e)) return { reason: 'SMTP zaman aşımı', retryable: true, infrastructure: true }
  if (/connection|ECONNREFUSED|ENOTFOUND|EAI_AGAIN/i.test(e)) return { reason: 'SMTP sunucusuna bağlanılamadı', retryable: true, infrastructure: true }
  if (/\b55[0-4]\b|mailbox|recipient|rejected|does not exist/i.test(e)) return { reason: 'alıcı sunucusu reddetti (adres yok veya kabul etmiyor)', retryable: false, infrastructure: false }
  if (/sender|from address|relay|\b553\b/i.test(e)) return { reason: 'gönderen adresi kabul edilmedi (alan adı yetkisi)', retryable: true, infrastructure: true }
  return { reason: e ? `bilinmeyen hata: ${e.slice(0, 120)}` : 'bilinmeyen hata', retryable: true, infrastructure: true }
}
