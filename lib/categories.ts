/**
 * Ürün kategorileri – filtre, URL, menü ve çeviri anahtarları için tek kaynak.
 * Yapı gunesenerjisistemi.com menüsünü izler: ana kategori (grup, URL: /category/<id>) > alt kategori
 * (product.category değeri) > marka (filtre: /products?category=<alt>&brand=<marka>).
 * Ürünler alt kategorilere import sırasında ürün adı/markasına göre atanır (scripts/import-ikas-excel.py → classify_category).
 *
 * Yeni alt kategori eklenirse: buraya değer + CATEGORY_KEYS, messages/tr.json + en.json (header) çevirisi,
 * gerekirse app/category/[id]/category-meta.ts SEO metni ve import scriptindeki kural.
 */

export const CATEGORY_GROUPS = [
  {
    id: 'solar-aku',
    labelKey: 'catGroupSolarBattery', // Solar Akü
    categoryValues: ['Lityum Akü', 'Jel Akü', 'Batarya Yönetimi ve Aksesuar', 'Taşınabilir Güç İstasyonu'],
  },
  {
    id: 'solar-inverter',
    labelKey: 'catGroupSolarInverter', // Solar İnverter
    categoryValues: [
      'Tam Sinüs MPPT Akıllı İnverter',
      'Hibrit İnverter',
      'On-Grid İnverter',
      'Tam Sinüs İnverter',
      'Şarjlı Tam Sinüs İnverter',
      'Modifiye Sinüs İnverter',
      'Solar Pompa Sürücüsü',
      'Solar Sürücü Aksesuarı',
      'İnverter Aksesuarı',
    ],
  },
  {
    id: 'gunes-paneli',
    labelKey: 'catGroupSolarPanel', // Güneş Paneli
    categoryValues: ['TopCon Güneş Paneli', 'Monokristal Güneş Paneli', 'Esnek ve Katlanabilir Panel'],
  },
  {
    id: 'solar-sarj-kontrol',
    labelKey: 'catGroupSolarChargeControl', // Solar Şarj Kontrol Cihazı
    navLabelKey: 'catNavChargeControl', // üst menüde kısa: Şarj Kontrol
    categoryValues: ['MPPT Şarj Kontrol Cihazı', 'PWM Şarj Kontrol Cihazı', 'Akü Şarj Cihazı', 'Şarj Kontrol Aksesuarı'],
  },
  {
    // Bağlantı ekipmanı ve aksesuar tek grupta (eski /category/aksesuar buraya yönlenir)
    id: 'solar-baglanti-ekipmani',
    labelKey: 'catGroupSolarConnection', // Bağlantı Ekipmanı ve Aksesuar
    navLabelKey: 'catNavConnection', // üst menüde kısa: Bağlantı ve Aksesuar
    categoryValues: ['Solar Transfer Switch', 'Sigorta ve Dağıtım', 'Kablo ve Konnektör', 'İzleme ve Kontrol'],
  },
  {
    id: 'ruzgar-enerjisi',
    labelKey: 'catGroupWindEnergy', // Rüzgar Enerjisi
    categoryValues: ['Rüzgar Türbini', 'Rüzgar Türbini Aksesuarı', 'Rüzgar Şarj Kontrol Cihazı'],
  },
  {
    id: 'isi-pompasi',
    labelKey: 'catGroupHeatPump', // Isı Pompası
    categoryValues: ['Isı Pompası'],
  },
  {
    id: 'elektrikli-arac-sarj',
    labelKey: 'catGroupEVCharging', // Elektrikli Araç Şarj
    categoryValues: ['Elektrikli Araç Şarj İstasyonu', 'Şarj İstasyonu Aksesuarı'],
  },
  {
    // Sınıflandırılamayan ürünler için (normalde boş; menüde ürünü olmayan grup gizlenir)
    id: 'diger',
    labelKey: 'catGroupOther', // Diğer
    categoryValues: ['Genel'],
  },
] as const

export type CategoryGroupId = (typeof CATEGORY_GROUPS)[number]['id']

/** Masaüstü üst menüde ayrı açılır menü olarak gösterilen grup sayısı; kalanlar "Diğer Kategoriler" altında toplanır. */
export const HEADER_NAV_GROUP_COUNT = 6

/** Eski kategori URL'leri → yeni grup (SEO için kalıcı yönlendirme; null = tüm ürünler) */
export const LEGACY_CATEGORY_REDIRECTS: Record<string, CategoryGroupId | null> = {
  // 15.10.2026 Excel yapısı
  'inverter-ve-guc-elektronigi': 'solar-inverter',
  'enerji-depolama': 'solar-aku',
  akuler: 'solar-aku',
  'pompa-ve-surucu': 'solar-inverter',
  'sarj-cihazlari': 'solar-sarj-kontrol',
  'kablolar-ve-baglanti': 'solar-baglanti-ekipmani',
  'aksesuar-ve-koruma': 'solar-baglanti-ekipmani',
  aksesuar: 'solar-baglanti-ekipmani',
  // Eski katalog
  'elektrikli-arac-sarj-urunleri': 'elektrikli-arac-sarj',
  'ev-sarj': 'elektrikli-arac-sarj',
  'ev-sarj-istasyonlari': 'elektrikli-arac-sarj',
  'ev-sarj-kablolari': 'elektrikli-arac-sarj',
  'ev-sarj-aksesuarlari': 'elektrikli-arac-sarj',
  'batarya-depolama': 'solar-aku',
  'enerji-depolama-sistemleri': 'solar-aku',
  'enerji-yonetimi': 'solar-baglanti-ekipmani',
  inverterler: 'solar-inverter',
  'akilli-enerji': 'solar-inverter',
  'gunes-enerjisi': 'gunes-paneli',
  'gunes-panelleri': 'gunes-paneli',
  'isi-pompasi-hvac': 'isi-pompasi',
  'isi-pompalari': 'isi-pompasi',
}

/**
 * Eski alt kategori değerleri (?category=...) → yeni alt kategori değeri veya grup id'si.
 * Eski linkler, reklamlar ve yer imleri boş/yanlış liste yerine doğru kategoriye düşer.
 */
export const LEGACY_SUBCATEGORY_MAP: Record<string, string> = {
  Panel: 'gunes-paneli',
  'İnverter': 'solar-inverter',
  'Lityum Batarya': 'Lityum Akü',
  'Kurşun/Jel Akü': 'Jel Akü',
  'MPPT/PWM': 'solar-sarj-kontrol',
  'Solar Pompa/Sürücü': 'Solar Pompa Sürücüsü',
  'Türbin ve Aksesuar': 'ruzgar-enerjisi',
  'AC/DC Şarj': 'Akü Şarj Cihazı',
  'Sistem Bileşenleri': 'solar-baglanti-ekipmani',
  'Güç ve Veri Kabloları': 'Kablo ve Konnektör',
}

/** Tüm kategori değerleri (static export / API yokken menü fallback için). */
export const ALL_CATEGORY_VALUES = CATEGORY_GROUPS.flatMap((g) => [...g.categoryValues])

/** Bir product.category değerinin hangi gruba ait olduğunu döndürür (URL ve sidebar filtre için). */
export function getGroupIdForCategory(category: string): CategoryGroupId | null {
  for (const group of CATEGORY_GROUPS) {
    if ((group.categoryValues as readonly string[]).includes(category)) return group.id
  }
  return null
}

/** Grup id'sine göre gruptaki tüm category değerlerini döndürür. */
export function getCategoryValuesByGroupId(groupId: string): string[] {
  const group = CATEGORY_GROUPS.find((g) => g.id === groupId)
  return group ? [...group.categoryValues] : []
}

/** Alt kategori değeri → çeviri anahtarı (messages/*.json "header") */
const CATEGORY_KEYS: Record<string, string> = {
  'Lityum Akü': 'catLithiumBattery',
  'Jel Akü': 'catGelBattery',
  'Batarya Yönetimi ve Aksesuar': 'catBatteryManagement',
  'Taşınabilir Güç İstasyonu': 'catPortablePowerStation',
  'Tam Sinüs MPPT Akıllı İnverter': 'catSmartMpptInverter',
  'Hibrit İnverter': 'catHybridInverter',
  'On-Grid İnverter': 'catOnGridInverter',
  'Tam Sinüs İnverter': 'catPureSineInverter',
  'Şarjlı Tam Sinüs İnverter': 'catChargerInverter',
  'Modifiye Sinüs İnverter': 'catModifiedSineInverter',
  'Solar Pompa Sürücüsü': 'catSolarPumpDrive',
  'Solar Sürücü Aksesuarı': 'catSolarDriveAccessory',
  'İnverter Aksesuarı': 'catInverterAccessory',
  'TopCon Güneş Paneli': 'catTopconPanel',
  'Monokristal Güneş Paneli': 'catMonoPanel',
  'Esnek ve Katlanabilir Panel': 'catFlexiblePanel',
  'MPPT Şarj Kontrol Cihazı': 'catMpptController',
  'PWM Şarj Kontrol Cihazı': 'catPwmController',
  'Akü Şarj Cihazı': 'catBatteryCharger',
  'Şarj Kontrol Aksesuarı': 'catControllerAccessory',
  'Solar Transfer Switch': 'catTransferSwitch',
  'Sigorta ve Dağıtım': 'catFuseDistribution',
  'Kablo ve Konnektör': 'catCableConnector',
  'İzleme ve Kontrol': 'catMonitoringControl',
  'Rüzgar Türbini': 'catWindTurbine',
  'Rüzgar Türbini Aksesuarı': 'catWindTurbineAccessory',
  'Rüzgar Şarj Kontrol Cihazı': 'catWindController',
  'Isı Pompası': 'catHeatPump',
  'Elektrikli Araç Şarj İstasyonu': 'catEVStation',
  'Şarj İstasyonu Aksesuarı': 'catEVStationAccessory',
  Genel: 'catGeneral',
}

function getCategoryKeyFromValue(value: string): string | undefined {
  return CATEGORY_KEYS[value]
}

/** Tekil kategori listesi – ürün detay sayfası breadcrumb/label için. */
export const PRODUCT_CATEGORIES = CATEGORY_GROUPS.flatMap((g) =>
  g.categoryValues.map((value) => ({ value, key: getCategoryKeyFromValue(value) }))
)

export type ProductCategoryValue = (typeof PRODUCT_CATEGORIES)[number]['value']

/** Kategori value (product.category) ile çeviri key'ini döndürür; bilinmeyen kategoride undefined (ham değer gösterilir). */
export function getCategoryKey(value: string): string | undefined {
  return getCategoryKeyFromValue(value)
}
