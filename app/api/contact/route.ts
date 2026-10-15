export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { sendEmailSMTP } from '@/lib/email-smtp'
import { isRateLimited, getClientIp } from '@/lib/rate-limit'
import { verifyTurnstile, TURNSTILE_ERROR } from '@/lib/turnstile'
import { getAdminFirestore } from '@/lib/firebaseAdminServer'
import { FieldValue } from 'firebase-admin/firestore'
import React from 'react'

// Simple email template for contact form
function ContactFormEmail({ name, email, phone, subject, message }: {
  name: string
  email: string
  phone?: string
  subject: string
  message: string
}) {
  return React.createElement('div', {
    style: {
      fontFamily: 'Arial, sans-serif',
      maxWidth: '600px',
      margin: '0 auto',
      padding: '20px',
      backgroundColor: '#f9fafb',
    }
  }, [
    React.createElement('div', {
      key: 'header',
      style: {
        backgroundColor: '#2563eb',
        color: 'white',
        padding: '20px',
        borderRadius: '8px 8px 0 0',
        textAlign: 'center' as const,
      }
    }, [
      React.createElement('h1', {
        key: 'title',
        style: { margin: 0, fontSize: '24px' }
      }, 'Yeni İletişim Formu Mesajı')
    ]),
    React.createElement('div', {
      key: 'content',
      style: {
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '0 0 8px 8px',
      }
    }, [
      React.createElement('p', { key: 'intro', style: { marginBottom: '20px' } }, 
        'Voltekno web sitesinden yeni bir iletişim formu mesajı alındı:'
      ),
      React.createElement('div', { key: 'details', style: { marginBottom: '20px' } }, [
        React.createElement('p', { key: 'name' }, [
          React.createElement('strong', { key: 'label' }, 'Ad Soyad: '),
          name
        ]),
        React.createElement('p', { key: 'email' }, [
          React.createElement('strong', { key: 'label' }, 'E-posta: '),
          React.createElement('a', { 
            key: 'link',
            href: `mailto:${email}`,
            style: { color: '#2563eb', textDecoration: 'none' }
          }, email)
        ]),
        phone && React.createElement('p', { key: 'phone' }, [
          React.createElement('strong', { key: 'label' }, 'Telefon: '),
          React.createElement('a', {
            key: 'link',
            href: `tel:${phone}`,
            style: { color: '#2563eb', textDecoration: 'none' }
          }, phone)
        ]),
        React.createElement('p', { key: 'subject' }, [
          React.createElement('strong', { key: 'label' }, 'Konu: '),
          subject
        ]),
      ]),
      React.createElement('div', {
        key: 'message',
        style: {
          backgroundColor: '#f3f4f6',
          padding: '15px',
          borderRadius: '6px',
          marginTop: '20px',
        }
      }, [
        React.createElement('strong', { key: 'label', style: { display: 'block', marginBottom: '10px' } }, 'Mesaj:'),
        React.createElement('p', {
          key: 'text',
          style: {
            whiteSpace: 'pre-wrap',
            margin: 0,
            lineHeight: '1.6',
          }
        }, message)
      ]),
      React.createElement('div', {
        key: 'footer',
        style: {
          marginTop: '30px',
          paddingTop: '20px',
          borderTop: '1px solid #e5e7eb',
          fontSize: '12px',
          color: '#6b7280',
        }
      }, [
        React.createElement('p', { key: 'note', style: { margin: 0 } }, 
          'Bu mesaj Voltekno web sitesi iletişim formundan gönderilmiştir.'
        )
      ])
    ])
  ])
}

export async function POST(request: NextRequest) {
  try {
    if (isRateLimited(request, 'contact', 5, 10 * 60_000)) {
      return NextResponse.json(
        { success: false, error: 'Çok fazla istek. Lütfen bir dakika sonra tekrar deneyin.' },
        { status: 429 }
      )
    }
    const body = await request.json().catch(() => ({}))
    if (!(await verifyTurnstile(body.turnstileToken, getClientIp(request)))) {
      return NextResponse.json({ success: false, error: TURNSTILE_ERROR }, { status: 400 })
    }
    const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '')
    const name = str(body.name, 100)
    const email = str(body.email, 200)
    const phone = str(body.phone, 30)
    const subject = str(body.subject, 200)
    const message = str(body.message, 5000)
    const productId = str(body.productId, 200) || null

    // Validation
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { success: false, error: 'Tüm zorunlu alanları doldurun' },
        { status: 400 }
      )
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Geçerli bir e-posta adresi girin' },
        { status: 400 }
      )
    }

    // Get admin email from environment or use default
    const adminEmail = process.env.SMTP_EMAIL || process.env.SMTP_USER || 'info@voltekno.com'

    // Send email to admin
    const emailResult = await sendEmailSMTP(
      adminEmail,
      `Yeni İletişim Formu: ${subject}`,
      React.createElement(ContactFormEmail, {
        name,
        email,
        phone: phone || undefined,
        subject,
        message,
      })
    )

    if (!emailResult.success) {
      console.error('Email gönderme hatası:', emailResult.error)
      // Don't fail the request if email fails, just log it
    }

    // Firestore'a kaydet (admin panelinde görüntülenebilmesi için)
    try {
      const db = getAdminFirestore()
      if (db) {
        await db.collection('contactMessages').add({
          name,
          email,
          phone: phone || null,
          subject,
          message,
          productId,
          status: 'new',
          emailSent: emailResult.success,
          createdAt: FieldValue.serverTimestamp(),
        })
      }
    } catch (fsErr) {
      console.error('Firestore contact save error:', fsErr)
      // Non-critical: don't fail the request
    }

    return NextResponse.json({
      success: true,
      message: 'Mesajınız başarıyla gönderildi. En kısa sürede size dönüş yapacağız.',
    })
  } catch (error) {
    console.error('Contact form error:', error)
    return NextResponse.json(
      { success: false, error: 'Bir hata oluştu. Lütfen tekrar deneyin.' },
      { status: 500 }
    )
  }
}

