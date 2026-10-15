/**
 * Satıcı (firma) bilgileri — tek kaynak.
 * Kaynak: voltekno.com yasal metinleri ve iletişim sayfası (Ön Bilgilendirme Formu, 02.10.2026).
 * Footer, yasal metinler, sözleşme PDF'i, e-postalar ve yapılandırılmış veri (JSON-LD) buradan okur.
 */

export const SELLER = {
  brand: 'Voltekno',
  legalName: 'AFET TEKNOLOJİLERİ TİCARET VE SANAYİ LİMİTED ŞİRKETİ',
  shortLegalName: 'AFET TEKNOLOJİLERİ TİC. VE SAN. LTD. ŞTİ.',
  address: 'Çaydaçıra Mah. Prof. Dr. Nuri Orhan Bul. No:5 İç Kapı No:17 Merkez/ELAZIĞ',
  city: 'Elazığ',
  district: 'Merkez',
  country: 'Türkiye',
  mersisNo: '0009188272600001',
  taxOffice: 'Hazar Vergi Dairesi',
  taxNo: '0091882726',
  phone: '+90 551 829 16 13',
  phoneHref: 'tel:+905518291613',
  /** WhatsApp (aynı numara) — wa.me bağlantısı için ülke kodlu, boşluksuz */
  whatsapp: '905518291613',
  email: 'info@voltekno.com',
  /** Fatura üst bilgisinde yer alan şirket e-postası */
  invoiceEmail: 'info@afetteknolojileri.com',
  kep: 'afetteknoloji@hs01.kep.tr',
  website: 'www.voltekno.com',
} as const
