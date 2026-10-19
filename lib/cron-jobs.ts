/**
 * Zamanlanmış görevlerin kendisi. İki yoldan çağrılır:
 * - HTTP: app/api/cron/* (Authorization: Bearer <CRON_SECRET>; Hostinger cron veya elle)
 * - Uygulama içi zamanlayıcı: lib/scheduler.ts (instrumentation.ts başlatır; sunucuda cron kurulmamış olsa da çalışır)
 */
import path from 'path'
import { promises as fs } from 'fs'
import { reportError } from '@/lib/alerts'
import { prisma } from '@/lib/prisma'
import { BANK_TRANSFER_PAYMENT_DAYS, bankTransferDeadline } from '@/lib/store-config'
import { changeOrderStatus, logOrderEvent, sendCustomerStatusEmail } from '@/lib/order-service'
import { processStockAlerts } from '@/lib/stock-alerts'
import { processAbandonedCarts } from '@/lib/abandoned-cart'
import { gzipSync } from 'zlib'
import { sendEmail } from '@/lib/email'
import { STORE_CONTACT } from '@/lib/store-config'
import { pruneErrors } from '@/lib/error-log'
import { processReviewRequests } from '@/lib/review-requests'

const DAY = 86_400_000

/** Kartlı siparişte banka dönüşü bu kadar dakika gelmezse yönetici uyarılır */
const CARD_CHECK_AFTER_MIN = 60

/**
 * Havale/EFT ödeme süresi takibi.
 * - Son ödeme gününden 1 gün önce: müşteriye ödeme hatırlatması (bir kez)
 * - Son ödeme günü geçince: sipariş iptal, stok iadesi, müşteriye iptal e-postası
 * - Sonuçlanmamış kart ödemeleri için yönetici uyarısı
 * - Stoğa giren ürünler için bekleyen "stok gelince haber ver" e-postaları
 * - Terk edilen sepet hatırlatması (24 saat hareketsiz, ticari ileti izni olan üyeler, sepet başına bir kez)
 * - Yorum isteği: teslimattan 7 gün sonra (sipariş başına bir kez)
 * dry: hiçbir değişiklik yapmadan yapılacakları listeler.
 */
export async function runExpireOrders({ dry = false }: { dry?: boolean } = {}) {
  const now = Date.now()
  const expireBefore = new Date(now - BANK_TRANSFER_PAYMENT_DAYS * DAY)
  const remindBefore = new Date(now - (BANK_TRANSFER_PAYMENT_DAYS - 1) * DAY)

  const awaiting = await prisma.order.findMany({
    where: {
      status: 'PENDING',
      paymentMethod: 'bank_transfer',
      paymentStatus: { not: 'PAID' },
      createdAt: { lt: remindBefore },
    },
    include: { lines: true, events: { where: { type: { in: ['reminder', 'payment_notice'] } }, select: { type: true } } },
    orderBy: { createdAt: 'asc' },
    take: 200,
  })

  const result = { expired: [] as string[], reminded: [] as string[], held: [] as string[], errors: [] as string[] }
  for (const order of awaiting) {
    try {
      // Müşteri havale bildirimi yaptıysa (dekont/ödeme bildirimi) sipariş otomatik iptal edilmez ve hatırlatma gitmez:
      // para gelmiş olabilir, admin bankayı kontrol edip onaylar (admin canlı paneli bu siparişleri ayrıca listeler).
      if (order.events.some((e) => e.type === 'payment_notice')) {
        result.held.push(order.orderNo)
        continue
      }
      // Son ödeme günü (e-postada yazan tarih) İstanbul saatiyle bitmeden iptal edilmez
      if (order.createdAt < expireBefore && bankTransferDeadline(order.createdAt).getTime() < now) {
        if (!dry) {
          await changeOrderStatus(order.id, 'CANCELLED', {
            actor: 'system',
            reason: `${BANK_TRANSFER_PAYMENT_DAYS} gün içinde ödeme alınamadı`,
          })
        }
        result.expired.push(order.orderNo)
      } else if (!order.events.some((e) => e.type === 'reminder')) {
        if (!dry) {
          await sendCustomerStatusEmail(order, 'payment_reminder')
          await logOrderEvent(order.id, { type: 'reminder', message: 'Ödeme hatırlatma e-postası gönderildi.', visibleToCustomer: false })
        }
        result.reminded.push(order.orderNo)
      }
    } catch (e) {
      result.errors.push(`${order.orderNo}: ${e instanceof Error ? e.message : 'hata'}`)
      await reportError('cron-havale-takibi', e, { orderNo: order.orderNo })
    }
  }
  // Sonuçlanmamış kart ödemeleri: müşteri banka sayfasını kapattıysa banka dönüşü hiç gelmez.
  // Kart çekilmiş olabileceği için otomatik iptal EDİLMEZ; yöneticiye bir kez uyarı gider,
  // banka panelinden kontrol edilip yönetim panelinden "ödendi" veya "iptal" yapılır (iptal stok + kuponu geri verir).
  const cardBefore = new Date(now - CARD_CHECK_AFTER_MIN * 60_000)
  const staleCard = await prisma.order.findMany({
    where: {
      status: 'PENDING',
      paymentMethod: 'card',
      paymentStatus: { not: 'PAID' },
      createdAt: { lt: cardBefore },
      events: { none: { type: 'card-check' } },
    },
    select: { id: true, orderNo: true, total: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
    take: 100,
  })
  const cardUnresolved: string[] = []
  for (const o of staleCard) {
    cardUnresolved.push(o.orderNo)
    if (dry) continue
    await logOrderEvent(o.id, {
      type: 'card-check',
      message: `Kart ödemesi ${CARD_CHECK_AFTER_MIN} dakikadır sonuçlanmadı (banka dönüşü gelmedi). Banka panelinden kontrol edip ödendi/iptal olarak işaretleyin.`,
      visibleToCustomer: false,
    })
  }
  if (!dry && cardUnresolved.length) {
    await reportError('kart-odemesi-sonuclanmadi', new Error(`${cardUnresolved.length} kartlı sipariş banka dönüşü olmadan bekliyor`), {
      orders: cardUnresolved.join(', '),
    })
  }

  // Yedek: admin dışından (ör. iade/iptal stok iadesi) stoğa giren ürünlerin bekleyen bildirimleri
  const stockAlerts = dry ? null : await processStockAlerts().catch((e) => ({ error: String(e) }))
  // Terk edilen sepet hatırlatması (yalnızca ticari ileti izni olan üyeler)
  const abandonedCarts = await processAbandonedCarts({ dry }).catch((e) => ({ error: String(e) }))
  // Teslimattan 7 gün sonra yorum isteği (sipariş başına bir kez)
  const reviewRequests = await processReviewRequests({ dry }).catch((e) => ({ error: String(e) }))
  return { ok: true, dry, ...result, cardUnresolved, stockAlerts, abandonedCarts, reviewRequests }
}

/** Yerel yedek dizini (Sistem Durumu sayfası ve indirme ucu da kullanır) */
export function backupDir(): string {
  return path.resolve(process.env.BACKUP_DIR || path.join(process.cwd(), 'backups'))
}

/**
 * Sunucu dışı kopya: yedek gzip ile sıkıştırılıp BACKUP_EMAIL (yoksa ADMIN_EMAIL) adresine e-postayla gider.
 * Sunucu/disk kaybında son yedek posta kutusunda kalır. BACKUP_EMAIL=0 kapatır; 15 MB üstü gönderilmez.
 */
async function emailBackup(file: string, size: number): Promise<string> {
  const to = process.env.BACKUP_EMAIL ?? process.env.ADMIN_EMAIL ?? STORE_CONTACT.email
  if (!to || to === '0') return 'kapalı'
  try {
    const gz = gzipSync(await fs.readFile(file), { level: 9 })
    if (gz.length > 15 * 1024 * 1024) return `gönderilmedi: ${Math.round(gz.length / 1048576)} MB (15 MB sınırı)`
    const name = `${path.basename(file)}.gz`
    const res = await sendEmail(
      to,
      `[Voltekno] Günlük veritabanı yedeği ${new Date().toLocaleDateString('tr-TR')}`,
      `<div style="font-family:Arial,sans-serif;max-width:600px;color:#121926">
        <p>Günlük otomatik veritabanı yedeği ektedir (<b>${name}</b>, ${Math.round(gz.length / 1024)} KB sıkıştırılmış, ${Math.round(size / 1024)} KB açık).</p>
        <p style="color:#5d6e80;font-size:13px">Geri yükleme: dosyayı gunzip ile açın, uygulamayı durdurun, DATABASE_URL'in gösterdiği dosyanın yerine koyun ve uygulamayı başlatın. Bu e-postaları silmeyin; son birkaç haftayı saklamanız önerilir.</p>
      </div>`,
      [{ filename: name, content: gz, contentType: 'application/gzip' }]
    )
    return res && (res as { success?: boolean }).success === false ? 'e-posta gönderilemedi' : `e-posta: ${to}`
  } catch (e) {
    await reportError('yedek-eposta', e)
    return 'e-posta gönderilemedi'
  }
}

/**
 * Veritabanı yedeği (günde 1 kez).
 * SQLite: VACUUM INTO ile tutarlı kopya → BACKUP_DIR (varsayılan ./backups — herkese açık klasöre KOYMAYIN).
 * Son BACKUP_KEEP (varsayılan 14) yedek tutulur. PostgreSQL'de sağlayıcının yedekleme özelliği kullanılmalı.
 */
export async function runBackup(): Promise<{ status: number; body: Record<string, unknown> }> {
  const url = process.env.DATABASE_URL ?? ''
  if (!url.startsWith('file:')) {
    return { status: 400, body: { ok: false, error: 'Bu görev yalnızca SQLite içindir; PostgreSQL için sağlayıcı yedeklemesini kullanın.' } }
  }

  const dir = backupDir()
  const publicDir = path.resolve(process.cwd(), 'public')
  if (dir.startsWith(publicDir)) {
    return { status: 400, body: { ok: false, error: 'BACKUP_DIR herkese açık klasörün içinde olamaz.' } }
  }
  const keep = Math.max(1, parseInt(process.env.BACKUP_KEEP || '14', 10) || 14)

  try {
    await fs.mkdir(dir, { recursive: true })
    const stamp = new Date().toISOString().replace(/[:.]/g, '-')
    const file = path.join(dir, `voltekno-${stamp}.db`)
    // Dosya adı sunucuda üretilir (kullanıcı girdisi yok); tek tırnaklar SQL için kaçışlanır
    await prisma.$executeRawUnsafe(`VACUUM INTO '${file.replace(/'/g, "''")}'`)
    const { size } = await fs.stat(file)

    const backups = (await fs.readdir(dir)).filter((f) => /^voltekno-.*\.db$/.test(f)).sort()
    const removed = backups.slice(0, Math.max(0, backups.length - keep))
    await Promise.all(removed.map((f) => fs.unlink(path.join(dir, f))))

    const offsite = await emailBackup(file, size)
    const prunedErrors = await pruneErrors().catch(() => 0)
    return {
      status: 200,
      body: { ok: true, file: path.basename(file), sizeBytes: size, kept: backups.length - removed.length, removed: removed.length, offsite, prunedErrors },
    }
  } catch (e) {
    await reportError('veritabani-yedegi', e, { dir })
    return { status: 500, body: { ok: false, error: 'Yedek alınamadı' } }
  }
}
