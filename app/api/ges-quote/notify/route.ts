export const dynamic = 'force-dynamic'

/**
 * GES form bildirimi: Sadece e-posta gönderir (Firestore istemci tarafında kaydedilir).
 * Her gönderimde 1 mail (form özeti). fullQuoteRequested=true ise ek olarak "Teklif al basıldı" maili.
 */

import { NextRequest, NextResponse } from 'next/server'
import React from 'react'
import { sendEmailSMTP } from '@/lib/email-smtp'
import { isRateLimited } from '@/lib/rate-limit'

const optionalLine = (key: string, label: string, value: string | number | undefined) =>
  value != null && String(value).trim() !== ''
    ? React.createElement('p', { key }, [React.createElement('strong', { key: 'l' }, `${label}: `), String(value)])
    : null

function buildFormEmail(props: {
  fullName: string
  phone: string
  city: string
  email?: string
  district?: string
  monthlyKwh?: number
  regionId?: string
  suggestedKwp?: number
  propertyType?: string
  monthlyBillRange?: string
  subscriberType?: string
  threePhase?: string
  installationAreaType?: string
  roofType?: string
  roofAreaRange?: string
  shading?: string
  deedStatus?: string
  usageGoal?: string
  storagePreference?: string
  budgetRange?: string
  attachmentBillUrl?: string
  attachmentRoofUrl?: string
  excludeInstallationCost?: boolean
}) {
  const {
    fullName,
    phone,
    city,
    email,
    district,
    monthlyKwh,
    regionId,
    suggestedKwp,
    propertyType,
    monthlyBillRange,
    subscriberType,
    threePhase,
    installationAreaType,
    roofType,
    roofAreaRange,
    shading,
    deedStatus,
    usageGoal,
    storagePreference,
    budgetRange,
    attachmentBillUrl,
    attachmentRoofUrl,
    excludeInstallationCost,
  } = props
  return React.createElement(
    'div',
    {
      style: {
        fontFamily: 'Arial, sans-serif',
        maxWidth: '600px',
        margin: '0 auto',
        padding: '20px',
        backgroundColor: '#f9fafb',
      },
    },
    [
      React.createElement('div', {
        key: 'header',
        style: {
          backgroundColor: '#0d9488',
          color: 'white',
          padding: '20px',
          borderRadius: '8px 8px 0 0',
          textAlign: 'center' as const,
        },
      }, [
        React.createElement('h1', { key: 'title', style: { margin: 0, fontSize: '24px' } }, 'Yeni GES Form Talebi'),
      ]),
      React.createElement('div', {
        key: 'content',
        style: {
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '0 0 8px 8px',
        },
      }, [
        React.createElement('p', { key: 'intro', style: { marginBottom: '20px' } }, 'GES sayfasından form gönderildi:'),
        React.createElement('div', { key: 'details', style: { marginBottom: '20px' } }, [
          React.createElement('p', { key: 'name' }, [React.createElement('strong', { key: 'l' }, 'Ad Soyad: '), fullName]),
          React.createElement('p', { key: 'phone' }, [
            React.createElement('strong', { key: 'l' }, 'Telefon: '),
            React.createElement('a', { key: 'link', href: `tel:${phone}`, style: { color: '#0d9488', textDecoration: 'none' } }, phone),
          ]),
          React.createElement('p', { key: 'city' }, [React.createElement('strong', { key: 'l' }, 'Şehir: '), city]),
          district && React.createElement('p', { key: 'district' }, [React.createElement('strong', { key: 'l' }, 'İlçe: '), district]),
          email && React.createElement('p', { key: 'email' }, [React.createElement('strong', { key: 'l' }, 'E-posta: '), email]),
          monthlyKwh != null && React.createElement('p', { key: 'kwh' }, [React.createElement('strong', { key: 'l' }, 'Aylık tüketim (kWh): '), String(monthlyKwh)]),
          regionId && React.createElement('p', { key: 'region' }, [React.createElement('strong', { key: 'l' }, 'Bölge: '), regionId]),
          suggestedKwp != null && React.createElement('p', { key: 'kwp' }, [React.createElement('strong', { key: 'l' }, 'Önerilen kWp: '), String(suggestedKwp)]),
          optionalLine('propertyType', 'Mülk türü', propertyType),
          optionalLine('monthlyBillRange', 'Aylık fatura bandı', monthlyBillRange),
          optionalLine('subscriberType', 'Abone türü', subscriberType),
          optionalLine('threePhase', '3 Faz', threePhase),
          optionalLine('installationAreaType', 'Kurulum alanı', installationAreaType),
          optionalLine('roofType', 'Çatı tipi', roofType),
          optionalLine('roofAreaRange', 'Çatı alanı', roofAreaRange),
          optionalLine('shading', 'Gölgeleme', shading),
          optionalLine('deedStatus', 'Tapu', deedStatus),
          optionalLine('usageGoal', 'Kullanım amacı', usageGoal),
          optionalLine('storagePreference', 'Batarya tercihi', storagePreference),
          optionalLine('budgetRange', 'Bütçe', budgetRange),
          excludeInstallationCost === true &&
            React.createElement('p', { key: 'excl', style: { marginTop: '12px', color: '#b91c1c', fontWeight: 'bold' } }, 'Kurulum maliyeti hariç teklif istedi.'),
          (attachmentBillUrl || attachmentRoofUrl) &&
            React.createElement('p', { key: 'attachments', style: { marginTop: '12px' } }, [
              React.createElement('strong', { key: 'l' }, 'Dosyalar: '),
              ...[
                attachmentBillUrl && React.createElement('span', { key: 'b' }, 'Fatura, '),
                attachmentRoofUrl && React.createElement('span', { key: 'r' }, 'Çatı'),
              ].filter(Boolean),
            ]),
        ]),
        React.createElement('div', {
          key: 'footer',
          style: { marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #e5e7eb', fontSize: '12px', color: '#6b7280' },
        }, [React.createElement('p', { key: 'note', style: { margin: 0 } }, 'Bu istek GES teklif formundan gönderilmiştir.')]),
      ]),
    ]
  )
}

export async function POST(request: NextRequest) {
  try {
    if (isRateLimited(request as unknown as Request, 'ges-quote-notify', 5, 10 * 60_000)) {
      return NextResponse.json(
        { success: false, error: 'Çok fazla istek. Lütfen bir dakika sonra tekrar deneyin.' },
        { status: 429 }
      )
    }
    const body = await request.json()
    const fullName = typeof body.fullName === 'string' ? body.fullName.trim() : ''
    const phone = typeof body.phone === 'string' ? body.phone.trim().replace(/\s/g, '') : ''
    const city = typeof body.city === 'string' ? body.city.trim() : ''
    if (!fullName || fullName.length < 2 || !phone || phone.length < 10 || !city || city.length < 2) {
      return NextResponse.json(
        { success: false, error: 'Ad, telefon ve şehir zorunludur.' },
        { status: 400 }
      )
    }

    const adminEmail = process.env.SMTP_EMAIL || process.env.SMTP_USER || 'info@voltekno.com'
    const email = typeof body.email === 'string' ? body.email.trim() || undefined : undefined
    const district = typeof body.district === 'string' ? body.district.trim() || undefined : undefined
    const monthlyKwh = typeof body.monthlyKwh === 'number' && Number.isFinite(body.monthlyKwh) ? body.monthlyKwh : (typeof body.monthlyKwh === 'string' ? parseFloat(body.monthlyKwh) : undefined)
    const regionId = typeof body.regionId === 'string' ? body.regionId.trim() || undefined : undefined
    const suggestedKwp = typeof body.suggestedKwp === 'number' && Number.isFinite(body.suggestedKwp) ? body.suggestedKwp : undefined
    const propertyType = typeof body.propertyType === 'string' ? body.propertyType.trim() || undefined : undefined
    const monthlyBillRange = typeof body.monthlyBillRange === 'string' ? body.monthlyBillRange.trim() || undefined : undefined
    const subscriberType = typeof body.subscriberType === 'string' ? body.subscriberType.trim() || undefined : undefined
    const threePhase = typeof body.threePhase === 'string' ? body.threePhase.trim() || undefined : undefined
    const installationAreaType = typeof body.installationAreaType === 'string' ? body.installationAreaType.trim() || undefined : undefined
    const roofType = typeof body.roofType === 'string' ? body.roofType.trim() || undefined : undefined
    const roofAreaRange = typeof body.roofAreaRange === 'string' ? body.roofAreaRange.trim() || undefined : undefined
    const shading = typeof body.shading === 'string' ? body.shading.trim() || undefined : undefined
    const deedStatus = typeof body.deedStatus === 'string' ? body.deedStatus.trim() || undefined : undefined
    const usageGoal = typeof body.usageGoal === 'string' ? body.usageGoal.trim() || undefined : undefined
    const storagePreference = typeof body.storagePreference === 'string' ? body.storagePreference.trim() || undefined : undefined
    const budgetRange = typeof body.budgetRange === 'string' ? body.budgetRange.trim() || undefined : undefined
    const attachmentBillUrl = typeof body.attachmentBillUrl === 'string' ? body.attachmentBillUrl.trim() || undefined : undefined
    const attachmentRoofUrl = typeof body.attachmentRoofUrl === 'string' ? body.attachmentRoofUrl.trim() || undefined : undefined
    const excludeInstallationCost = body.excludeInstallationCost === true
    const fullQuoteRequested = body.fullQuoteRequested === true

    const formEmail = buildFormEmail({
      fullName,
      phone,
      city,
      email,
      district,
      monthlyKwh: Number.isFinite(monthlyKwh) ? monthlyKwh : undefined,
      regionId,
      suggestedKwp,
      propertyType,
      monthlyBillRange,
      subscriberType,
      threePhase,
      installationAreaType,
      roofType,
      roofAreaRange,
      shading,
      deedStatus,
      usageGoal,
      storagePreference,
      budgetRange,
      attachmentBillUrl,
      attachmentRoofUrl,
      excludeInstallationCost,
    })

    const res1 = await sendEmailSMTP(
      adminEmail,
      `Yeni GES Form Talebi: ${fullName} - ${city}`,
      formEmail
    )
    if (!res1.success) {
      console.error('GES notify email error:', res1.error)
    }

    if (fullQuoteRequested) {
      const res2 = await sendEmailSMTP(
        adminEmail,
        `GES Teklif Al butonuna basıldı: ${fullName} - ${city}`,
        React.createElement('div', {
          style: { fontFamily: 'Arial, sans-serif', padding: '20px', backgroundColor: '#f9fafb' },
        }, [
          React.createElement('p', { key: '1' }, ['Kullanıcı "Teklif talebini gönder" butonuna bastı.']),
          React.createElement('p', { key: '2' }, [React.createElement('strong', { key: 'l' }, 'Ad: '), fullName]),
          React.createElement('p', { key: '3' }, [React.createElement('strong', { key: 'l' }, 'Telefon: '), phone]),
          React.createElement('p', { key: '4' }, [React.createElement('strong', { key: 'l' }, 'Şehir: '), city]),
        ])
      )
      if (!res2.success) {
        console.error('GES full-quote email error:', res2.error)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Bildirim gönderildi.',
    })
  } catch (error) {
    console.error('GES notify error:', error)
    return NextResponse.json(
      { success: false, error: 'Bildirim gönderilemedi.' },
      { status: 500 }
    )
  }
}
