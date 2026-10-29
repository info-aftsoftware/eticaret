/** Kart ödemesi tamamlanmadığında müşteriye gösterilen sabit mesajlar (iptal sayfası ?reason=) */
export const POS_FAIL_MESSAGES = {
  declined: 'Bankanız ödemeyi onaylamadı (kart limiti, bakiye, kart bilgisi veya güvenlik kontrolü). Farklı bir kartla deneyebilir veya Havale/EFT seçebilirsiniz.',
  '3d': '3D Secure doğrulaması tamamlanmadı (SMS şifresi girilmedi veya hatalı). Tekrar deneyebilirsiniz.',
  verify: 'Ödeme yanıtı doğrulanamadı. Kartınızdan çekim yapıldıysa lütfen bizimle iletişime geçin.',
  amount: 'Ödeme tutarı doğrulanamadı. Siparişiniz kontrol ediliyor; ekibimiz sizinle iletişime geçecek.',
  paid_cancelled: 'Ödemeniz bankadan onaylandı ancak bu sipariş daha önce iptal edilmişti. Ücret iadesi için ekibimiz sizinle iletişime geçecek.',
  server: 'Ödeme sonucu işlenirken bir hata oluştu. Kartınızdan çekim yapıldıysa lütfen bizimle iletişime geçin.',
  review: 'Ödemeniz alındı ve ödeme kuruluşunun güvenlik incelemesinde. Siparişiniz beklemede; inceleme tamamlanınca size bilgi vereceğiz, yeniden ödeme yapmayın.',
} as const

export type PosFailCode = keyof typeof POS_FAIL_MESSAGES

const POS_FAIL_MESSAGES_EN: Record<PosFailCode, string> = {
  declined: 'Your bank declined the payment (card limit, balance, card details or a security check). You can try another card or choose bank transfer (EFT).',
  '3d': '3D Secure verification was not completed (SMS code not entered or incorrect). You can try again.',
  verify: 'The payment response could not be verified. If your card was charged, please contact us.',
  amount: 'The payment amount could not be verified. Your order is being reviewed; our team will contact you.',
  paid_cancelled: 'Your bank approved the payment, but this order had already been cancelled. Our team will contact you about the refund.',
  server: 'An error occurred while processing the payment result. If your card was charged, please contact us.',
  review: 'Your payment was received and is under the payment provider\'s security review. Your order is on hold; we will let you know when the review is complete. Please do not pay again.',
}

export function posFailMessage(code: string | null, locale: string = 'tr'): string | null {
  if (!code || !(code in POS_FAIL_MESSAGES)) return null
  const k = code as PosFailCode
  return locale === 'en' ? POS_FAIL_MESSAGES_EN[k] : POS_FAIL_MESSAGES[k]
}
