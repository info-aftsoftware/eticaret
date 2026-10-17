/**
 * Shipping Carriers Adapter Interface
 * Türkiye kargo firmaları: takip linkleri (Yurtiçi, Aras, MNG/DHL eCommerce, Sürat, PTT, UPS, DHL Express).
 * Admin panelinde kargo firması seçimi, müşteri e-postası ve sipariş sayfasındaki takip linki buradan gelir.
 * Biçimler 18.10.2026'da firmaların canlı takip sayfalarında doğrulandı.
 */

export interface Carrier {
  id: string
  name: string
  /** Takip sayfası; numara URL'ye eklenir (kodlanarak). PTT gibi derin link desteklemeyenlerde ana sayfa. */
  trackingUrl: (trackingNumber: string) => string
  /** Takip sayfası numarayı otomatik sorgulamıyorsa müşteriye gösterilecek kısa açıklama */
  trackingHint?: string
  calculateCost?: (weight: number, volume: number, from: string, to: string) => Promise<number>
  createShipment?: (data: any) => Promise<{ trackingNumber: string; labelUrl?: string }>
}

const enc = (n: string) => encodeURIComponent(n.trim())

export const carriers: Record<string, Carrier> = {
  yurtici: {
    id: 'yurtici',
    name: 'Yurtiçi Kargo',
    trackingUrl: (n) => `https://www.yurticikargo.com/tr/online-servisler/gonderi-sorgula?code=${enc(n)}`,
  },
  aras: {
    id: 'aras',
    name: 'Aras Kargo',
    trackingUrl: (n) => `https://kargotakip.araskargo.com.tr/mainpage.aspx?code=${enc(n)}`,
  },
  mng: {
    // MNG Kargo artık DHL eCommerce Türkiye; eski mngkargo.com.tr linkleri numarayı kaybediyor
    id: 'mng',
    name: 'MNG Kargo (DHL eCommerce)',
    trackingUrl: (n) => `https://kargotakip.dhlecommerce.com.tr/?takipNo=${enc(n)}`,
    trackingHint: 'Takip numaranız sayfada hazır gelir; güvenlik kodunu girerek sorgulayın.',
  },
  surat: {
    id: 'surat',
    name: 'Sürat Kargo',
    trackingUrl: (n) => `https://www.suratkargo.com.tr/KargoTakip/?kargotakipno=${enc(n)}`,
  },
  ptt: {
    // PTT'nin yeni sitesi URL'den takip numarası almıyor
    id: 'ptt',
    name: 'PTT Kargo',
    trackingUrl: () => 'https://www.ptt.gov.tr/',
    trackingHint: 'Açılan sayfadaki "Gönderi Takip" alanına takip numaranızı yapıştırın.',
  },
  ups: {
    id: 'ups',
    name: 'UPS',
    trackingUrl: (n) => `https://www.ups.com/track?loc=tr_TR&tracknum=${enc(n)}`,
  },
  dhl: {
    id: 'dhl',
    name: 'DHL Express',
    trackingUrl: (n) => `https://www.dhl.com/tr-tr/home/tracking.html?tracking-id=${enc(n)}&submit=1`,
  },
}

export function getCarrier(carrierId: string): Carrier | undefined {
  return carriers[carrierId]
}

export function getAllCarriers(): Carrier[] {
  return Object.values(carriers)
}
