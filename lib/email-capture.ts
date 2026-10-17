/**
 * Geliştirme için e-posta yakalama: EMAIL_CAPTURE_DIR tanımlıysa e-postalar gönderilmez,
 * <dizin>/<zaman>-<konu>.html olarak yazılır (alıcı, konu ve ek adları dosyanın başında).
 * Canlı ortamda tanımlanmaz; yalnızca .env.development.local içinde kullanılır.
 */
import fs from 'fs'
import path from 'path'
import type React from 'react'
import { render } from '@react-email/render'

export function emailCaptureEnabled(): boolean {
  return !!process.env.EMAIL_CAPTURE_DIR && process.env.NODE_ENV !== 'production'
}

export async function captureEmail(
  to: string,
  subject: string,
  content: React.ReactElement | string,
  attachmentNames: string[] = []
): Promise<{ success: true; data: { captured: string } }> {
  const dir = path.resolve(process.cwd(), process.env.EMAIL_CAPTURE_DIR as string)
  fs.mkdirSync(dir, { recursive: true })
  const html = typeof content === 'string' ? content : await render(content)
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const slug = subject.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60)
  const file = path.join(dir, `${stamp}-${slug || 'eposta'}.html`)
  const header = `<!-- to: ${to}\n     subject: ${subject}\n     attachments: ${attachmentNames.join(', ') || '-'} -->\n`
  fs.writeFileSync(file, header + html)
  console.log(`[email-capture] ${to} · ${subject} → ${file}`)
  return { success: true, data: { captured: file } }
}
