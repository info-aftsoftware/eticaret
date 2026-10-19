/**
 * Yönetim paneli kullanıcıları: roller, izinler, şifre özeti (scrypt) ve doğrulama uygulaması (TOTP) anahtarı.
 * Bağımlılık yok (node:crypto). Sunucu tarafı; istemciye yalnızca ADMIN_ROLES etiketleri gider.
 */
import crypto from 'crypto'

export const ADMIN_ROLES = {
  owner: { label: 'Sahip', description: 'Her şey ve kullanıcı yönetimi' },
  manager: { label: 'Yönetici', description: 'Kullanıcı yönetimi hariç her şey' },
  operator: { label: 'Sipariş operatörü', description: 'Siparişler, müşteriler, teklif istekleri, yorum ve sorular' },
  editor: { label: 'Katalog editörü', description: 'Ürünler, stok, kampanya ve kuponlar, yorum ve sorular' },
} as const
export type AdminRole = keyof typeof ADMIN_ROLES
export const isAdminRole = (r: unknown): r is AdminRole => typeof r === 'string' && r in ADMIN_ROLES

const ALL: AdminRole[] = ['owner', 'manager', 'operator', 'editor']
const OPS: AdminRole[] = ['owner', 'manager', 'operator']
const CATALOG: AdminRole[] = ['owner', 'manager', 'editor']
const MGMT: AdminRole[] = ['owner', 'manager']

/**
 * Yol öneki → okuma (GET/HEAD) ve yazma (diğer yöntemler) izinleri. En uzun eşleşen önek kazanır;
 * eşleşme yoksa yalnızca sahip ve yönetici. Panel sayfaları da aynı tabloyu kullanır (ADMIN_PAGE_API).
 */
const RULES: { prefix: string; read: AdminRole[]; write: AdminRole[] }[] = [
  { prefix: '/api/admin/users', read: ['owner'], write: ['owner'] },
  { prefix: '/api/admin/audit', read: MGMT, write: [] },
  { prefix: '/api/admin/system', read: MGMT, write: MGMT },
  { prefix: '/api/admin/me', read: ALL, write: ALL },
  { prefix: '/api/admin/account', read: ALL, write: ALL },
  { prefix: '/api/admin/firebase-token', read: ALL, write: ALL },
  { prefix: '/api/admin/orders', read: OPS, write: OPS },
  { prefix: '/api/admin/customers', read: OPS, write: OPS },
  { prefix: '/api/admin/ges-quotes', read: OPS, write: OPS },
  { prefix: '/api/admin/ges-verifications', read: OPS, write: OPS },
  { prefix: '/api/admin/contact', read: OPS, write: OPS },
  { prefix: '/api/admin/shipping', read: OPS, write: OPS },
  { prefix: '/api/admin/catalog', read: ALL, write: CATALOG },
  { prefix: '/api/admin/products', read: ALL, write: CATALOG },
  { prefix: '/api/admin/stok', read: ALL, write: CATALOG },
  { prefix: '/api/admin/stock-overrides', read: ALL, write: CATALOG },
  { prefix: '/api/admin/discounts', read: ALL, write: CATALOG },
  { prefix: '/api/admin/coupons', read: ALL, write: CATALOG },
  { prefix: '/api/admin/reviews', read: ALL, write: ALL },
  { prefix: '/api/admin/questions', read: ALL, write: ALL },
  { prefix: '/api/admin/stats', read: ALL, write: [] },
  { prefix: '/api/admin/live', read: ALL, write: [] },
  { prefix: '/api/admin/exports/orders', read: MGMT, write: [] },
  { prefix: '/api/admin/exports/subscribers', read: MGMT, write: [] },
  { prefix: '/api/admin/exports/catalog', read: CATALOG, write: [] },
  { prefix: '/api/admin/imports', read: CATALOG, write: CATALOG },
]

export function canAccess(role: AdminRole, pathname: string, method: string): boolean {
  const rule = RULES.filter((r) => pathname === r.prefix || pathname.startsWith(r.prefix + '/'))
    .sort((a, b) => b.prefix.length - a.prefix.length)[0]
  const read = method === 'GET' || method === 'HEAD'
  const allowed = rule ? (read ? rule.read : rule.write) : MGMT
  return allowed.includes(role)
}

/** Panel menüsü: sayfa → izin kontrolünde kullanılacak API yolu (menüde yalnızca okunabilenler gösterilir) */
export const ADMIN_PAGE_API: Record<string, string> = {
  '/admin': '/api/admin/stats',
  '/admin/orders': '/api/admin/orders',
  '/admin/musteriler': '/api/admin/customers',
  '/admin/indirimler': '/api/admin/discounts',
  '/admin/istatistikler': '/api/admin/stats',
  '/admin/products': '/api/admin/catalog',
  '/admin/yorumlar': '/api/admin/reviews',
  '/admin/sorular': '/api/admin/questions',
  '/admin/iletisim': '/api/admin/contact',
  '/admin/ges-teklifler': '/api/admin/ges-quotes',
  '/admin/kullanicilar': '/api/admin/users',
  '/admin/islem-kaydi': '/api/admin/audit',
  '/admin/sistem': '/api/admin/system',
  '/admin/hesabim': '/api/admin/account',
}

// --------------------------------------------------------------------------- şifre (scrypt)
const SCRYPT = { N: 16384, r: 8, p: 1, keylen: 64 }

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16)
  const hash = crypto.scryptSync(password, salt, SCRYPT.keylen, { N: SCRYPT.N, r: SCRYPT.r, p: SCRYPT.p })
  return `scrypt$${SCRYPT.N}$${SCRYPT.r}$${SCRYPT.p}$${salt.toString('base64')}$${hash.toString('base64')}`
}

export function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split('$')
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false
  const [, N, r, p, saltB64, hashB64] = parts
  const expected = Buffer.from(hashB64, 'base64')
  const actual = crypto.scryptSync(password, Buffer.from(saltB64, 'base64'), expected.length, {
    N: Number(N), r: Number(r), p: Number(p), maxmem: 64 * 1024 * 1024,
  })
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected)
}

/** Şifre kuralı: en az 10 karakter, harf ve rakam içersin */
export function passwordProblem(password: string): string | null {
  if (password.length < 10) return 'Şifre en az 10 karakter olmalı.'
  if (!/[A-Za-zÇĞİÖŞÜçğıöşü]/.test(password) || !/\d/.test(password)) return 'Şifre harf ve rakam içermeli.'
  return null
}

/** Paylaşılabilir geçici şifre (karışan karakterler yok) */
export function temporaryPassword(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  const bytes = crypto.randomBytes(14)
  let s = ''
  for (const b of bytes) s += chars[b % chars.length]
  return s.slice(0, 6) + '-' + s.slice(6, 10) + '-' + s.slice(10) + '7'
}

// --------------------------------------------------------------------------- TOTP anahtarı
const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

export function base32Encode(buf: Buffer): string {
  let bits = 0
  let value = 0
  let out = ''
  for (const byte of buf) {
    value = (value << 8) | byte
    bits += 8
    while (bits >= 5) {
      out += B32[(value >>> (bits - 5)) & 31]
      bits -= 5
    }
  }
  if (bits > 0) out += B32[(value << (5 - bits)) & 31]
  return out
}

export const newTotpSecret = () => base32Encode(crypto.randomBytes(20))

export function otpauthUrl(secret: string, account: string, issuer = 'Voltekno Yönetim'): string {
  const label = encodeURIComponent(`${issuer}:${account}`)
  return `otpauth://totp/${label}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`
}
