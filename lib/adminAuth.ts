import type { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import type { Prisma } from '@prisma/client'
import { summarizeChanges, type FieldChange } from '@/lib/audit-diff'
import { masterLoginPolicy } from '@/lib/admin-2fa-policy'
import { prisma } from '@/lib/prisma'
import { canAccess, isAdminRole, type AdminRole } from '@/lib/admin-users'
import { getClientIp } from '@/lib/rate-limit'

const JWT_SECRET = process.env.JWT_SECRET ?? ''

/** Ana şifreyle (ADMIN_TOKEN) açılan oturumun kimliği: kullanıcı kaydı yoktur, rolü "owner" sayılır */
export const MASTER_SESSION_SUB = 'admin'

export type AdminActor = {
  /** AdminUser.id; ana şifreyle girişte null */
  userId: string | null
  role: AdminRole
  name: string
  email: string | null
  mustChangePassword: boolean
}

/** sv: kullanıcının oturum sürümü; şifre/2FA değişince, sıfırlanınca, pasifleştirilince veya çıkışta artar, eski çerezler düşer */
type SessionPayload = { sub?: string; admin?: boolean; uid?: string; sv?: number }

export const ADMIN_SESSION_MAX_AGE = 60 * 60 * 24 * 7 // 7 gün

/** Yönetim oturum çerezini yazar (giriş ve kendi şifresini/2FA'sını değiştiren kullanıcının yeni oturumu) */
export function setAdminSessionCookie(response: NextResponse, payload: { sub: string; uid?: string; sv?: number }) {
  const token = jwt.sign({ ...payload, admin: true }, JWT_SECRET, { expiresIn: ADMIN_SESSION_MAX_AGE, algorithm: 'HS256' })
  response.cookies.set('admin_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: ADMIN_SESSION_MAX_AGE,
    path: '/',
  })
}

/** Kullanıcının tüm açık oturumlarını geçersiz kılar; yeni sürümü döner */
export async function bumpAdminSessions(userId: string): Promise<number> {
  const u = await prisma.adminUser.update({ where: { id: userId }, data: { sessionVersion: { increment: 1 } }, select: { sessionVersion: true } })
  return u.sessionVersion
}

const MASTER_SESSION_SEQ = 'adminMasterSessionVersion'

/** Ana şifre oturumlarının sürümü (kullanıcı kaydı olmadığı için Sequence tablosunda) */
export async function masterSessionVersion(): Promise<number> {
  return (await prisma.sequence.findUnique({ where: { name: MASTER_SESSION_SEQ } }))?.value ?? 0
}

/** Tüm ana şifre oturumlarını geçersiz kılar (ana şifre oturumundan çıkışta) */
export async function bumpMasterSessions(): Promise<void> {
  await prisma.sequence.upsert({ where: { name: MASTER_SESSION_SEQ }, create: { name: MASTER_SESSION_SEQ, value: 1 }, update: { value: { increment: 1 } } })
}

/** Çıkış: oturumun sahibine göre ilgili oturum sürümü artar; kopyalanmış çerez de çalışmaz */
export async function revokeAdminSession(request: NextRequest): Promise<void> {
  const s = readSession(request)
  if (!s) return
  if (s.uid) await bumpAdminSessions(s.uid)
  else if (s.sub === MASTER_SESSION_SUB) await bumpMasterSessions()
}

function readSession(request: NextRequest): SessionPayload | null {
  return readSessionCookie(request.cookies.get('admin_session')?.value)
}

/**
 * Sunucu bileşenlerinde (next/headers cookies) yönetici oturumu geçerli mi; ör. taslak ürün önizlemesi (A08).
 * API'lerle aynı kural: pasif kullanıcı ve artık izin verilmeyen ana şifre oturumu geçersiz (A12).
 */
export async function isAdminSessionCookie(value: string | undefined): Promise<boolean> {
  const s = readSessionCookie(value)
  if (!s) return false
  if (!s.uid) return (s.sv ?? 0) === (await masterSessionVersion()) && masterSessionAllowed()
  const user = await prisma.adminUser.findUnique({ where: { id: s.uid }, select: { active: true, role: true, sessionVersion: true } })
  return !!user?.active && isAdminRole(user.role) && (s.sv ?? 0) === user.sessionVersion
}

function readSessionCookie(cookie: string | undefined): SessionPayload | null {
  if (!cookie || !JWT_SECRET) return null
  try {
    const decoded = jwt.verify(cookie, JWT_SECRET, { algorithms: ['HS256'] }) as SessionPayload
    return decoded.admin === true && decoded.sub ? decoded : null
  } catch {
    return null
  }
}

/**
 * Oturum sahibini çözer. Kullanıcı hesabıyla açılan oturumda rol ve durum her istekte veritabanından okunur:
 * pasifleştirilen kullanıcının oturumu anında düşer, rol değişikliği anında geçerli olur.
 */
export async function getAdminActor(request: NextRequest): Promise<AdminActor | null> {
  const s = readSession(request)
  if (!s) return null
  if (!s.uid) {
    // Ana şifre oturumu, giriş kuralı artık izin vermiyorsa (ör. 2FA'lı Sahip hesabı açıldı, ADMIN_MASTER_LOGIN=off) düşer (A12)
    if ((s.sv ?? 0) !== (await masterSessionVersion()) || !(await masterSessionAllowed())) return null
    return { userId: null, role: 'owner', name: 'Ana yönetici şifresi', email: null, mustChangePassword: false }
  }
  const user = await prisma.adminUser.findUnique({ where: { id: s.uid } })
  if (!user || !user.active || !isAdminRole(user.role) || (s.sv ?? 0) !== user.sessionVersion) return null
  return { userId: user.id, role: user.role, name: user.name, email: user.email, mustChangePassword: user.mustChangePassword }
}

/** Ana şifre oturumları için giriş kuralı (lib/admin-2fa-policy.ts); Sahip 2FA sayısı kısa süre önbelleklenir */
let ownerCache: { at: number; count: number } | null = null
async function masterSessionAllowed(): Promise<boolean> {
  const mode = process.env.ADMIN_MASTER_LOGIN
  const hasMasterTotp = Boolean(process.env.ADMIN_TOTP_SECRET)
  if (mode?.trim().toLowerCase() !== 'off' && (hasMasterTotp || mode?.trim().toLowerCase() === 'allow')) return true
  if (!ownerCache || Date.now() - ownerCache.at > 60_000) {
    ownerCache = { at: Date.now(), count: await prisma.adminUser.count({ where: { active: true, role: 'owner', totpEnabled: true } }) }
  }
  return masterLoginPolicy({ mode, hasMasterTotp, ownersWith2fa: ownerCache.count }).allowed
}

/** Admin session cookie geçerli mi (rol/izin kontrolü yapmaz; middleware ile aynı kural) */
export function verifyAdminCookie(request: NextRequest): boolean {
  return readSession(request) !== null
}

export type CheckAdminResult =
  | { ok: true; userId?: string; actor: AdminActor }
  | { error: string; status: number }

/** İşlem kaydı (hata yönetimi akışını bozmaz) */
export async function logAdminAction(
  actor: AdminActor | null,
  action: string,
  extra: {
    method?: string
    path?: string
    ip?: string | null
    details?: string
    /** A09: değişen nesne ve alanlar (eski → yeni); details verilmezse özet bunlardan üretilir */
    objectType?: 'product' | 'order' | 'stock'
    objectId?: string
    changes?: FieldChange[]
  } = {}
): Promise<void> {
  try {
    await prisma.adminAuditLog.create({
      data: {
        adminUserId: actor?.userId ?? null,
        actor: actor ? (actor.email ? `${actor.name} <${actor.email}>` : actor.name) : 'bilinmiyor',
        action,
        method: extra.method,
        path: extra.path,
        ip: extra.ip ?? null,
        details: (extra.details ?? (extra.changes?.length ? summarizeChanges(extra.changes) : undefined))?.slice(0, 2000),
        objectType: extra.objectType ?? null,
        objectId: extra.objectId ?? null,
        ...(extra.changes?.length ? { changes: extra.changes.slice(0, 200) as unknown as Prisma.InputJsonValue } : {}),
      },
    })
  } catch (e) {
    console.error('Admin audit log error:', e)
  }
}

/**
 * Admin yetkisi + rol izni (lib/admin-users.ts → canAccess) + işlem kaydı.
 * Değiştiren her istek (GET/HEAD dışı) kim, ne zaman, hangi yol olarak kaydedilir.
 * Şifre değiştirmesi zorunlu kullanıcı yalnızca kendi hesap uçlarına erişebilir.
 */
export async function checkAdmin(request: NextRequest): Promise<CheckAdminResult> {
  const actor = await getAdminActor(request)
  if (!actor) return { error: 'Unauthorized', status: 401 }
  const path = request.nextUrl.pathname
  const method = request.method.toUpperCase()
  if (actor.mustChangePassword && !path.startsWith('/api/admin/account') && !path.startsWith('/api/admin/me')) {
    return { error: 'Devam etmek için şifrenizi değiştirin.', status: 403 }
  }
  if (!canAccess(actor.role, path, method)) {
    return { error: 'Bu işlem için yetkiniz yok.', status: 403 }
  }
  // Değiştiren istekler kaydedilir (kullanıcı ve hesap uçları, ürün/stok/sipariş düzenleme kendi alan bazında kaydını yazar)
  if (method !== 'GET' && method !== 'HEAD' && !path.startsWith('/api/admin/account') && !path.startsWith('/api/admin/users') && !isSelfLogged(method, path)) {
    void logAdminAction(actor, describeAdminRequest(method, path), { method, path, ip: getClientIp(request), details: `${method} ${path}` })
  }
  return { ok: true, userId: actor.userId ?? undefined, actor }
}

/** Alan bazında (eski → yeni) kaydı kendisi yazan uçlar (A09); genel "PATCH adres" satırı bunlar için yazılmaz */
const SELF_LOGGED: [string, RegExp][] = [
  ['PATCH', /^\/api\/admin\/catalog\/(?!bulk$)[^/]+$/],
  ['PATCH', /^\/api\/admin\/catalog\/bulk$/],
  ['PATCH', /^\/api\/admin\/stock-overrides$/],
  ['PATCH', /^\/api\/admin\/orders\/[^/]+$/],
]
export const isSelfLogged = (method: string, path: string) => SELF_LOGGED.some(([m, re]) => m === method && re.test(path))

const REQUEST_LABELS: [RegExp, string][] = [
  [/^\/api\/admin\/orders\/[^/]+\/send-invoice$/, 'Fatura e-postası gönderildi'],
  [/^\/api\/admin\/orders\/[^/]+\/packing-slip$/, 'Paketleme formu alındı'],
  [/^\/api\/admin\/orders/, 'Sipariş güncellendi'],
  [/^\/api\/admin\/shipping/, 'Kargo işlemi'],
  [/^\/api\/admin\/catalog\/bulk/, 'Toplu ürün işlemi'],
  [/^\/api\/admin\/catalog\/[^/]+\/images/, 'Ürün görseli değiştirildi'],
  [/^\/api\/admin\/(catalog|products)/, 'Ürün güncellendi'],
  [/^\/api\/admin\/(stok|stock-overrides)/, 'Stok güncellendi'],
  [/^\/api\/admin\/imports/, 'Toplu içe aktarma'],
  [/^\/api\/admin\/discounts/, 'Kampanya değiştirildi'],
  [/^\/api\/admin\/coupons/, 'Kupon değiştirildi'],
  [/^\/api\/admin\/customers/, 'Müşteri kaydı güncellendi'],
  [/^\/api\/admin\/reviews/, 'Yorum moderasyonu'],
  [/^\/api\/admin\/questions/, 'Soru moderasyonu / yanıt'],
  [/^\/api\/admin\/ges-/, 'GES teklif kaydı güncellendi'],
  [/^\/api\/admin\/system/, 'Sistem işlemi'],
]

/** İşlem kaydı için okunur ad (silme istekleri ayrıca belirtilir) */
export function describeAdminRequest(method: string, path: string): string {
  const label = REQUEST_LABELS.find(([re]) => re.test(path))?.[1] ?? 'Yönetim işlemi'
  return method === 'DELETE' ? `${label} (silme)` : label
}

/** Eski token tabanlı doğrulama (kullanılmıyor; geriye dönük uyumluluk) */
export function getAdminTokenFromRequest(request: NextRequest): string | null {
  return request.headers.get('authorization')?.replace('Bearer ', '') || null
}
