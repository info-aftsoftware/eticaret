/**
 * SMTP Email Service (Nodemailer)
 * Alternative to Resend - uses your own SMTP server
 * Works with Hostinger email, Gmail, or any SMTP server
 */

import nodemailer from 'nodemailer'
import type { Transporter, TransportOptions, SendMailOptions, SentMessageInfo } from 'nodemailer'
import { render } from '@react-email/render'
import React from 'react'
import { captureEmail, emailCaptureEnabled } from './email-capture'

// Cache transporter to avoid recreating it on every call
let cachedTransporter: Transporter | null = null

// Create reusable transporter with connection pooling
const createTransporter = () => {
  // Return cached transporter if available
  if (cachedTransporter) {
    return cachedTransporter
  }

  // SMTP configuration from environment variables
  const smtpConfig = {
    host: process.env.SMTP_HOST || 'smtp.hostinger.com',
    port: parseInt(process.env.SMTP_PORT || '465'),
    secure: process.env.SMTP_SECURE !== 'false', // true for 465 (SSL/TLS), false for 587 (STARTTLS)
    auth: {
      user: process.env.SMTP_USER || process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD,
    },
    // TLS options
    tls: {
      rejectUnauthorized: process.env.SMTP_TLS_REJECT_UNAUTHORIZED !== 'false', // Default: true for security
      ciphers: 'SSLv3', // Some servers require this
    },
    // Connection pooling for better performance
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
    // Timeout settings
    connectionTimeout: 10000, // 10 seconds
    greetingTimeout: 10000,
    socketTimeout: 10000,
    // Retry settings
    retry: {
      attempts: 3,
      delay: 2000, // 2 seconds between retries
    },
  } as TransportOptions

  cachedTransporter = nodemailer.createTransport(smtpConfig)
  return cachedTransporter
}

// Close transporter connection (useful for cleanup)
export function closeSMTPConnection() {
  if (cachedTransporter) {
    cachedTransporter.close()
    cachedTransporter = null
  }
}

export interface EmailAttachment {
  filename: string
  content: Buffer
  contentType: string
}

/** SMTP_FROM içindeki adres ("Ad" <adres> veya yalın adres); yoksa SMTP_USER */
function senderAddress(): string {
  const from = process.env.SMTP_FROM || ''
  const m = from.match(/<([^>]+)>/)
  return (m ? m[1] : from.trim()) || process.env.SMTP_USER || ''
}

export async function sendEmailSMTP(
  to: string,
  subject: string,
  content: React.ReactElement | string,
  attachments?: EmailAttachment[]
): Promise<{ success: boolean; error?: string; data?: any }> {
  if (emailCaptureEnabled()) return captureEmail(to, subject, content, attachments?.map((a) => a.filename))

  // Check if SMTP is configured
  if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    console.warn('SMTP credentials not set, skipping email send')
    return { success: false, error: 'SMTP not configured' }
  }

  const startTime = Date.now()
  
  try {
    const transporter = createTransporter()

    // Convert React component to HTML if needed (with timeout)
    let htmlContent: string
    if (typeof content === 'string') {
      htmlContent = content
    } else {
      // Render React component with timeout
      htmlContent = await Promise.race([
        render(content),
        new Promise<string>((_, reject) => 
          setTimeout(() => reject(new Error('Email render timeout')), 5000)
        )
      ])
    }

    const mailOptions: SendMailOptions = {
      // Görünen ad SMTP_FROM_NAME (varsayılan Voltekno); adres SMTP_FROM / SMTP_USER'dan (gönderim adresi sonra değişecek)
      from: `"${process.env.SMTP_FROM_NAME || 'Voltekno'}" <${senderAddress()}>`,
      to: to,
      subject: subject,
      html: htmlContent,
      text: htmlContent.replace(/<[^>]*>/g, '').substring(0, 500),
    }
    if (attachments?.length) {
      mailOptions.attachments = attachments.map((a) => ({
        filename: a.filename,
        content: a.content,
      }))
    }
    const sendPromise = transporter.sendMail(mailOptions)

    const info = await Promise.race([
      sendPromise,
      new Promise<SentMessageInfo>((_, reject) =>
        setTimeout(() => reject(new Error('SMTP send timeout')), 30000)
      )
    ])

    const duration = Date.now() - startTime
    console.log(`Email sent in ${duration}ms:`, info.messageId)
    
    return { 
      success: true, 
      data: { 
        id: info.messageId,
        response: info.response,
        duration: `${duration}ms`
      } 
    }
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`SMTP email send error (${duration}ms):`, error)
    
    // Provide more detailed error messages
    let errorMessage = 'Failed to send email'
    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        errorMessage = 'Email send timeout - SMTP server may be slow or unreachable'
      } else if (error.message.includes('authentication')) {
        errorMessage = 'SMTP authentication failed - check username and password'
      } else if (error.message.includes('connection')) {
        errorMessage = 'SMTP connection failed - check host and port'
      } else {
        errorMessage = error.message
      }
    }
    
    return { 
      success: false, 
      error: errorMessage
    }
  }
}

// Verify SMTP connection
export async function verifySMTPConnection(): Promise<boolean> {
  try {
    const transporter = createTransporter()
    await transporter.verify()
    console.log('SMTP connection verified')
    return true
  } catch (error) {
    console.error('SMTP verification failed:', error)
    return false
  }
}

