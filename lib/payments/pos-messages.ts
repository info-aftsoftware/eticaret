/** Kart ödemesi tamamlanmadığında müşteriye gösterilen sabit mesajlar (iptal sayfası ?reason=) */
export const POS_FAIL_MESSAGES = {
  declined: 'Bankanız ödemeyi onaylamadı (kart limiti, bakiye, kart bilgisi veya güvenlik kontrolü). Farklı bir kartla deneyebilir veya Havale/EFT seçebilirsiniz.',
  '3d': '3D Secure doğrulaması tamamlanmadı (SMS şifresi girilmedi veya hatalı). Tekrar deneyebilirsiniz.',
  verify: 'Ödeme yanıtı doğrulanamadı. Kartınızdan çekim yapıldıysa lütfen bizimle iletişime geçin.',
  amount: 'Ödeme tutarı doğrulanamadı. Siparişiniz kontrol ediliyor; ekibimiz sizinle iletişime geçecek.',
  paid_cancelled: 'Ödemeniz bankadan onaylandı ancak bu sipariş daha önce iptal edilmişti. Ücret iadesi için ekibimiz sizinle iletişime geçecek.',
  server: 'Ödeme sonucu işlenirken bir hata oluştu. Kartınızdan çekim yapıldıysa lütfen bizimle iletişime geçin.',
} as const

export type PosFailCode = keyof typeof POS_FAIL_MESSAGES

export function posFailMessage(code: string | null): string | null {
  return code && code in POS_FAIL_MESSAGES ? POS_FAIL_MESSAGES[code as PosFailCode] : null
}
