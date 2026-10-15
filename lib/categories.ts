/**
 * Ürün kategorileri – filtre, URL ve çeviri anahtarları için tek kaynak.
 * Yapı, ikas ürün Excel'indeki "Ana Kategori > Alt Kategori" hiyerarşisini birebir izler:
 * grup = ana kategori (URL: /category/<id>), categoryValues = product.category değerleri (alt kategori).
 *
 * Yeni bir Excel kategorisi eklenirse: buraya grup/değer, messages/tr.json + en.json (header) içine
 * çeviri anahtarları ve gerekirse app/category/[id]/category-meta.ts içine SEO metni eklenir.
 */

export const CATEGORY_GROUPS = [
  {
    id: 'gunes-paneli',
    labelKey: 'catGroupSolarPanel', // Güneş Paneli
    navLabelKey: 'catGroupSolarPanel',
    categoryValues: ['Panel'],
  },
  {
    id: 'inverter-ve-guc-elektronigi',
    labelKey: 'catGroupInverterPower', // İnverter ve Güç Elektroniği
    navLabelKey: 'catNavInverter',
    categoryValues: ['İnverter'],
  },
  {
    id: 'enerji-depolama',
    labelKey: 'catGroupEnergyStorage', // Enerji Depolama
    navLabelKey: 'catGroupEnergyStorage',
    categoryValues: ['Lityum Batarya', 'Taşınabilir Güç İstasyonu'],
  },
  {
    id: 'solar-sarj-kontrol',
    labelKey: 'catGroupSolarChargeControl', // Solar Şarj Kontrol
    navLabelKey: 'catNavChargeControl',
    categoryValues: ['MPPT/PWM'],
  },
  {
    id: 'pompa-ve-surucu',
    labelKey: 'catGroupPumpDrive', // Pompa ve Sürücü
    navLabelKey: 'catNavSolarPump',
    categoryValues: ['Solar Pompa/Sürücü'],
  },
  {
    // Excel'de "Pompa ve Sürücü" altında duran ısı pompaları import sırasında buraya taşınır (scripts/import-ikas-excel.py)
    id: 'isi-pompasi',
    labelKey: 'catGroupHeatPump', // Isı Pompası
    categoryValues: ['Isı Pompası'],
  },
  {
    id: 'akuler',
    labelKey: 'catGroupBatteries', // Aküler
    categoryValues: ['Kurşun/Jel Akü'],
  },
  {
    id: 'ruzgar-enerjisi',
    labelKey: 'catGroupWindEnergy', // Rüzgar Enerjisi
    categoryValues: ['Türbin ve Aksesuar'],
  },
  {
    id: 'sarj-cihazlari',
    labelKey: 'catGroupChargers', // Şarj Cihazları
    categoryValues: ['AC/DC Şarj'],
  },
  {
    id: 'elektrikli-arac-sarj',
    labelKey: 'catGroupEVCharging', // Elektrikli Araç Şarj
    categoryValues: ['İstasyon ve Aksesuar'],
  },
  {
    id: 'kablolar-ve-baglanti',
    labelKey: 'catGroupCables', // Kablolar ve Bağlantı
    categoryValues: ['Güç ve Veri Kabloları'],
  },
  {
    id: 'aksesuar-ve-koruma',
    labelKey: 'catGroupAccessories', // Aksesuar ve Koruma
    categoryValues: ['Sistem Bileşenleri', 'İzleme ve Kontrol'],
  },
  {
    id: 'diger',
    labelKey: 'catGroupOther', // Diğer
    categoryValues: ['Genel'],
  },
] as const

export type CategoryGroupId = (typeof CATEGORY_GROUPS)[number]['id']

/** Masaüstü üst menüde ayrı açılır menü olarak gösterilen grup sayısı; kalanlar "Diğer Kategoriler" altında toplanır. */
export const HEADER_NAV_GROUP_COUNT = 5

/** Eski kategori URL'leri → yeni grup (SEO için kalıcı yönlendirme) */
export const LEGACY_CATEGORY_REDIRECTS: Record<string, CategoryGroupId | null> = {
  'elektrikli-arac-sarj-urunleri': 'elektrikli-arac-sarj',
  'ev-sarj': 'elektrikli-arac-sarj',
  'ev-sarj-istasyonlari': 'elektrikli-arac-sarj',
  'ev-sarj-kablolari': 'elektrikli-arac-sarj',
  'ev-sarj-aksesuarlari': 'elektrikli-arac-sarj',
  'batarya-depolama': 'enerji-depolama',
  'enerji-depolama-sistemleri': 'enerji-depolama',
  'enerji-yonetimi': 'aksesuar-ve-koruma',
  inverterler: 'inverter-ve-guc-elektronigi',
  'akilli-enerji': 'inverter-ve-guc-elektronigi',
  'gunes-enerjisi': 'gunes-paneli',
  'gunes-panelleri': 'gunes-paneli',
  // Isı pompaları Excel'de "Pompa ve Sürücü > Solar Pompa/Sürücü" altında
  'isi-pompasi-hvac': 'isi-pompasi',
  'isi-pompalari': 'isi-pompasi',
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

const CATEGORY_KEYS: Record<string, string> = {
  Panel: 'catSolarPanel',
  'İnverter': 'catInverter',
  'Lityum Batarya': 'catLithiumBattery',
  'MPPT/PWM': 'catMpptPwm',
  'Solar Pompa/Sürücü': 'catSolarPumpDrive',
  'Kurşun/Jel Akü': 'catLeadGelBattery',
  'Türbin ve Aksesuar': 'catTurbineAccessories',
  'AC/DC Şarj': 'catAcDcCharger',
  'İstasyon ve Aksesuar': 'catEVStationAccessories',
  'Güç ve Veri Kabloları': 'catPowerDataCables',
  'Sistem Bileşenleri': 'catSystemComponents',
  Genel: 'catGeneral',
  'Isı Pompası': 'catHeatPump',
  'Taşınabilir Güç İstasyonu': 'catPortablePowerStation',
  'İzleme ve Kontrol': 'catMonitoringControl',
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
