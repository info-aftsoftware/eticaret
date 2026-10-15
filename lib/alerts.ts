/**
 * Kritik hata bildirimi (Sentry vb. yokken): hata loglanır ve admin'e e-posta gönderilir.
 * Aynı bağlam için en fazla 15 dakikada bir e-posta (e-posta yağmurunu önler); aradaki tekrarlar sayılır.
 * Kullanım: reportError('stripe-webhook', err, { orderNo })
 */

import { sendEmail } from '@/lib/email'
import { STORE_CONTACT } from '@/lib/store-config'

const THROTTLE_MS = 15 * 60_000
const last = new Map<string, { at: number; suppressed: number }>()

const esc = (v: unknown) =>
  String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

export async function reportError(context: string, error: unknown, details?: Record<string, unknown>): Promise<void> {
  const message = error instanceof Error ? error.message : String(error)
  const stack = error instanceof Error ? error.stack?.split('\n').slice(0, 8).join('\n') : undefined
  console.error(`[${context}]`, error, details ?? '')

  const now = Date.now()
  const entry = last.get(context)
  if (entry && now - entry.at < THROTTLE_MS) {
    entry.suppressed++
    return
  }
  const suppressed = entry?.suppressed ?? 0
  last.set(context, { at: now, suppressed: 0 })

  try {
    const to = process.env.ADMIN_EMAIL || STORE_CONTACT.email
    const rows = Object.entries(details ?? {})
      .map(([k, v]) => `<tr><td style="padding:2px 8px 2px 0;color:#6b7280">${esc(k)}</td><td>${esc(typeof v === 'object' ? JSON.stringify(v) : v)}</td></tr>`)
      .join('')
    await sendEmail(
      to,
      `[Voltekno] Sistem hatası: ${context}`,
      `<div style="font-family:Arial,sans-serif;max-width:640px">
        <h2 style="color:#b91c1c">Sistem hatası</h2>
        <p><strong>Bağlam:</strong> ${esc(context)}<br><strong>Zaman:</strong> ${esc(new Date().toLocaleString('tr-TR'))}</p>
        <p><strong>Hata:</strong> ${esc(message)}</p>
        ${rows ? `<table style="font-size:13px">${rows}</table>` : ''}
        ${stack ? `<pre style="background:#f3f4f6;padding:8px;font-size:12px;white-space:pre-wrap">${esc(stack)}</pre>` : ''}
        ${suppressed ? `<p style="color:#6b7280">Son bildirimden bu yana aynı bağlamda ${suppressed} hata daha oluştu.</p>` : ''}
      </div>`
    )
  } catch (e) {
    console.error('reportError email failed:', e)
  }
}
