export const dynamic = 'force-dynamic'

/**
 * GES (Güneş Enerjisi Santrali) teklif isteği.
 * Zorunlu: fullName, phone, city. Kayıt Prisma'ya + isteğe bağlı admin e-postası.
 */

import { NextRequest, NextResponse } from 'next/server'
import { isValidEmail, isValidTrPhone } from '@/lib/checkout-validation'
import React from 'react'
import { prisma } from '@/lib/prisma'
import { sendEmailSMTP } from '@/lib/email-smtp'
import { isRateLimited } from '@/lib/rate-limit'

const optionalLine = (key: string, label: string, value: string | number | undefined) =>
  value != null && String(value).trim() !== ''
    ? React.createElement('p', { key }, [React.createElement('strong', { key: 'l' }, `${label}: `), String(value)])
    : null

function GesQuoteEmail(props: {
  fullName: string
  phone: string
  city: string
  email?: string
  district?: string
  monthlyKwh?: number
  regionId?: string
  suggestedKwp?: number
  installationType?: string
  notes?: string
  wantsEvChargingQuote?: boolean
  wantsLightingQuote?: boolean
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
  financing?: string
  attachmentPanelUrl?: string
  attachmentBillUrl?: string
  attachmentRoofUrl?: string
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
    installationType,
    notes,
    wantsEvChargingQuote,
    wantsLightingQuote,
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
    financing,
    attachmentPanelUrl,
    attachmentBillUrl,
    attachmentRoofUrl,
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
        React.createElement('h1', { key: 'title', style: { margin: 0, fontSize: '24px' } }, 'Yeni GES Teklif İsteği'),
      ]),
      React.createElement('div', {
        key: 'content',
        style: {
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '0 0 8px 8px',
        },
      }, [
        React.createElement('p', { key: 'intro', style: { marginBottom: '20px' } }, 'Sitedeki GES sayfasından teklif talebi alındı:'),
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
          installationType && React.createElement('p', { key: 'installationType' }, [React.createElement('strong', { key: 'l' }, 'Kurulum tipi: '), installationType]),
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
          optionalLine('financing', 'Finansman', financing),
          notes && React.createElement('p', { key: 'notes', style: { marginTop: '12px' } }, [React.createElement('strong', { key: 'l' }, 'Not: '), notes]),
          (wantsEvChargingQuote || wantsLightingQuote) && React.createElement('p', { key: 'extra', style: { marginTop: '12px' } }, [
            React.createElement('strong', { key: 'l' }, 'Ek fiyat teklifi istediği: '),
            [wantsEvChargingQuote && 'GES araç şarj istasyonu', wantsLightingQuote && 'GES aydınlatma'].filter(Boolean).join(', '),
          ]),
          (attachmentPanelUrl || attachmentBillUrl || attachmentRoofUrl) &&
            React.createElement('p', { key: 'attachments', style: { marginTop: '12px' } }, [
              React.createElement('strong', { key: 'l' }, 'Dosyalar: '),
              ...[
                attachmentPanelUrl && React.createElement('a', { key: 'p', href: attachmentPanelUrl, style: { color: '#0d9488', marginRight: '8px' } }, 'Panosu'),
                attachmentBillUrl && React.createElement('a', { key: 'b', href: attachmentBillUrl, style: { color: '#0d9488', marginRight: '8px' } }, 'Fatura'),
                attachmentRoofUrl && React.createElement('a', { key: 'r', href: attachmentRoofUrl, style: { color: '#0d9488' } }, 'Çatı'),
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

/** Ek dosya bağlantısı yalnızca bu projenin Firebase Storage ges-attachments klasörüne işaret edebilir (admin e-postasındaki bağlantı kimlik avı için kullanılmasın) */
function safeAttachmentUrl(v: unknown): string | undefined {
  if (typeof v !== 'string') return undefined
  const u = v.trim()
  if (u.length > 1000) return undefined
  try {
    const url = new URL(u)
    const bucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
    if (url.protocol !== 'https:' || url.hostname !== 'firebasestorage.googleapis.com') return undefined
    if (bucket && !url.pathname.startsWith('/v0/b/' + bucket + '/o/')) return undefined
    if (!decodeURIComponent(url.pathname).includes('/o/ges-attachments/')) return undefined
    return u
  } catch {
    return undefined
  }
}

export async function POST(request: NextRequest) {
  try {
    if (isRateLimited(request as unknown as Request, 'ges-quote', 10, 60_000)) {
      return NextResponse.json(
        { success: false, error: 'Çok fazla istek. Lütfen bir dakika sonra tekrar deneyin.' },
        { status: 429 }
      )
    }
    const body = await request.json()
    const fullName = typeof body.fullName === 'string' ? body.fullName.trim().slice(0, 120) : ''
    const phone = typeof body.phone === 'string' ? body.phone.trim().replace(/\s/g, '') : ''
    const city = typeof body.city === 'string' ? body.city.trim().slice(0, 100) : ''
    // Geçersiz e-posta kaydedilmez (formda e-posta alanı oturumdan dolar, zorunlu değildir)
    const email = typeof body.email === 'string' && isValidEmail(body.email) ? body.email.trim().slice(0, 300) : undefined
    const monthlyKwh = typeof body.monthlyKwh === 'number' && Number.isFinite(body.monthlyKwh) ? body.monthlyKwh : undefined
    const regionId = typeof body.regionId === 'string' ? body.regionId.trim().slice(0, 300) || undefined : undefined
    const suggestedKwp = typeof body.suggestedKwp === 'number' && Number.isFinite(body.suggestedKwp) ? body.suggestedKwp : undefined
    const installationType = typeof body.installationType === 'string' ? body.installationType.trim().slice(0, 300) || undefined : undefined
    const notes = typeof body.notes === 'string' ? body.notes.trim().slice(0, 2000) || undefined : undefined
    const wantsEvChargingQuote = body.wantsEvChargingQuote === true
    const wantsLightingQuote = body.wantsLightingQuote === true
    const district = typeof body.district === 'string' ? body.district.trim().slice(0, 300) || undefined : undefined
    const propertyType = typeof body.propertyType === 'string' ? body.propertyType.trim().slice(0, 300) || undefined : undefined
    const monthlyBillRange = typeof body.monthlyBillRange === 'string' ? body.monthlyBillRange.trim().slice(0, 300) || undefined : undefined
    const subscriberType = typeof body.subscriberType === 'string' ? body.subscriberType.trim().slice(0, 300) || undefined : undefined
    const threePhase = typeof body.threePhase === 'string' ? body.threePhase.trim().slice(0, 300) || undefined : undefined
    const installationAreaType = typeof body.installationAreaType === 'string' ? body.installationAreaType.trim().slice(0, 300) || undefined : undefined
    const roofType = typeof body.roofType === 'string' ? body.roofType.trim().slice(0, 300) || undefined : undefined
    const roofAreaRange = typeof body.roofAreaRange === 'string' ? body.roofAreaRange.trim().slice(0, 300) || undefined : undefined
    const shading = typeof body.shading === 'string' ? body.shading.trim().slice(0, 300) || undefined : undefined
    const deedStatus = typeof body.deedStatus === 'string' ? body.deedStatus.trim().slice(0, 300) || undefined : undefined
    const usageGoal = typeof body.usageGoal === 'string' ? body.usageGoal.trim().slice(0, 300) || undefined : Array.isArray(body.usageGoal) ? (body.usageGoal as string[]).filter(Boolean).join(', ') : undefined
    const storagePreference = typeof body.storagePreference === 'string' ? body.storagePreference.trim().slice(0, 300) || undefined : undefined
    const budgetRange = typeof body.budgetRange === 'string' ? body.budgetRange.trim().slice(0, 300) || undefined : undefined
    const financing = typeof body.financing === 'string' ? body.financing.trim().slice(0, 300) || undefined : undefined
    const kvkkAccepted = body.kvkkAccepted === true
    const callAccepted = body.callAccepted === true
    const attachmentPanelUrl = safeAttachmentUrl(body.attachmentPanelUrl)
    const attachmentBillUrl = safeAttachmentUrl(body.attachmentBillUrl)
    const attachmentRoofUrl = safeAttachmentUrl(body.attachmentRoofUrl)
    const formData = body.formData != null && typeof body.formData === 'object' ? (body.formData as object) : undefined

    if (!fullName || fullName.length < 2) {
      return NextResponse.json(
        { success: false, error: 'Ad soyad en az 2 karakter olmalıdır.' },
        { status: 400 }
      )
    }
    if (!isValidTrPhone(phone)) {
      return NextResponse.json(
        { success: false, error: 'Geçerli bir telefon numarası girin (11 hane, örn. 0532 123 45 67).' },
        { status: 400 }
      )
    }
    if (!city || city.length < 2) {
      return NextResponse.json(
        { success: false, error: 'Şehir girin.' },
        { status: 400 }
      )
    }
    if (body.kvkkAccepted !== undefined && !kvkkAccepted) {
      return NextResponse.json(
        { success: false, error: 'KVKK aydınlatma metnini kabul etmeniz gerekiyor.' },
        { status: 400 }
      )
    }
    // Aranma onayı isteğe bağlı (madde 22): aranmak istemeyen talepte dönüş e-postayla, e-posta zorunlu
    if (body.callAccepted !== undefined && !callAccepted && !email) {
      return NextResponse.json(
        { success: false, error: 'Aranmak istemiyorsanız size dönebilmemiz için e-posta adresinizi yazın.' },
        { status: 400 }
      )
    }

    const record = await prisma.gesQuoteRequest.create({
      data: {
        fullName,
        phone,
        city,
        email,
        district,
        monthlyKwh,
        regionId,
        suggestedKwp,
        installationType,
        notes,
        wantsEvChargingQuote,
        wantsLightingQuote,
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
        financing,
        kvkkAccepted: body.kvkkAccepted !== undefined ? kvkkAccepted : undefined,
        callAccepted: body.callAccepted !== undefined ? callAccepted : undefined,
        attachmentPanelUrl,
        attachmentBillUrl,
        attachmentRoofUrl,
        formData: formData ?? undefined,
      },
    })

    const adminEmail = process.env.SMTP_EMAIL || process.env.SMTP_USER || 'info@voltekno.com'
    const emailResult = await sendEmailSMTP(
      adminEmail,
      `Yeni GES Teklif İsteği: ${fullName} - ${city}`,
      React.createElement(GesQuoteEmail, {
        fullName,
        phone,
        city,
        email,
        district,
        monthlyKwh,
        regionId,
        suggestedKwp,
        installationType,
        notes,
        wantsEvChargingQuote,
        wantsLightingQuote,
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
        financing,
        attachmentPanelUrl,
        attachmentBillUrl,
        attachmentRoofUrl,
      })
    )
    if (!emailResult.success) {
      console.error('GES quote email error:', emailResult.error)
    }

    return NextResponse.json({
      success: true,
      message: 'Teklif isteğiniz alındı. En kısa sürede size dönüş yapacağız.',
      id: record.id,
    })
  } catch (error) {
    console.error('GES quote error:', error)
    return NextResponse.json(
      { success: false, error: 'Bir hata oluştu. Lütfen tekrar deneyin.' },
      { status: 500 }
    )
  }
}
