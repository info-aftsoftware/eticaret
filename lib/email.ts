import { Resend } from 'resend'
import { sendEmailSMTP } from './email-smtp'
import { captureEmail, emailCaptureEnabled } from './email-capture'
import { isTestRecipient, TEST_RECIPIENT_ERROR } from './email-diagnose'

const resend = new Resend(process.env.RESEND_API_KEY || 're_demo')

export interface EmailAttachment {
  filename: string
  content: Buffer
  contentType: string
}

/**
 * Unified Email Service
 * Automatically uses SMTP if configured, otherwise falls back to Resend
 * Supports optional attachments (e.g. invoice PDF).
 */
export async function sendEmail(
  to: string,
  subject: string,
  content: React.ReactElement | string,
  attachments?: EmailAttachment[]
) {
  // Validate email address
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(to)) {
    console.error('Invalid email address:', to)
    return { success: false, error: 'Invalid email address' }
  }

  if (emailCaptureEnabled()) return captureEmail(to, subject, content, attachments?.map((a) => a.filename))

  // Test / ayrılmış alan adına (example.com …) gönderilmez: SMTP hatası ve geri dönen ileti üretmesin (A10)
  if (isTestRecipient(to)) return { success: false, error: TEST_RECIPIENT_ERROR }

  // Priority: SMTP > Resend
  if (process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
    return await sendEmailSMTP(to, subject, content, attachments)
  }

  // Fallback to Resend if SMTP not configured
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 're_demo') {
    console.warn('Neither SMTP nor RESEND_API_KEY configured, skipping email send')
    return { success: false, error: 'No email service configured' }
  }

  const startTime = Date.now()

  try {
    const payload: Parameters<typeof resend.emails.send>[0] = {
      from: 'voltekno <noreply@voltekno.com>',
      to: [to],
      subject,
      ...(typeof content === 'string' ? { html: content } : { react: content }),
    }
    if (attachments?.length) {
      payload.attachments = attachments.map((a) => ({
        filename: a.filename,
        content: a.content.toString('base64'),
      }))
    }
    const { data, error } = await resend.emails.send(payload)

    const duration = Date.now() - startTime

    if (error) {
      console.error(`Email send error (${duration}ms):`, error)
      return { success: false, error: error.message }
    }

    console.log(`Email sent via Resend in ${duration}ms:`, data?.id)
    return { success: true, data }
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`Email send error (${duration}ms):`, error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email'
    }
  }
}
