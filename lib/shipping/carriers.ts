/**
 * Shipping Carriers Adapter Interface
 * Türkiye kargo firmaları: takip linkleri (Yurtiçi, MNG, Sürat, Aras, UPS, PTT).
 * Admin panelinde kargo firması seçimi ve müşteri e-postasındaki takip linki buradan gelir.
 */

export interface Carrier {
  id: string
  name: string
  trackingUrl: (trackingNumber: string) => string
  calculateCost?: (weight: number, volume: number, from: string, to: string) => Promise<number>
  createShipment?: (data: any) => Promise<{ trackingNumber: string; labelUrl?: string }>
}

export const carriers: Record<string, Carrier> = {
  yurtici: {
    id: 'yurtici',
    name: 'Yurtiçi Kargo',
    trackingUrl: (trackingNumber) => `https://www.yurticikargo.com/tr/online-servisler/gonderi-sorgula?code=${trackingNumber}`,
  },
  mng: {
    id: 'mng',
    name: 'MNG Kargo',
    trackingUrl: (trackingNumber) => `https://www.mngkargo.com.tr/gonderi-takip/?takipNo=${encodeURIComponent(trackingNumber)}`,
  },
  surat: {
    id: 'surat',
    name: 'Sürat Kargo',
    trackingUrl: (trackingNumber) => `https://www.suratkargo.com.tr/KargoTakip/?kargotakipno=${encodeURIComponent(trackingNumber)}`,
  },
  aras: {
    id: 'aras',
    name: 'Aras Kargo',
    trackingUrl: (trackingNumber) => `https://www.araskargo.com.tr/tr/takip/${trackingNumber}`,
  },
  ups: {
    id: 'ups',
    name: 'UPS',
    trackingUrl: (trackingNumber) => `https://www.ups.com/track?tracknum=${trackingNumber}`,
  },
  ptt: {
    id: 'ptt',
    name: 'PTT Kargo',
    trackingUrl: (trackingNumber) => `https://gonderitakip.ptt.gov.tr/Track?code=${trackingNumber}`,
  },
}

export function getCarrier(carrierId: string): Carrier | undefined {
  return carriers[carrierId]
}

export function getAllCarriers(): Carrier[] {
  return Object.values(carriers)
}

