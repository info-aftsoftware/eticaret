export const dynamic = 'force-dynamic'

/**
 * GES Teklif Doğrulama formu – kayıt + kırmızı bayrak hesaplama.
 */

import { NextRequest, NextResponse } from 'next/server'
import { isValidEmail, isValidTrPhone } from '@/lib/checkout-validation'
import { prisma } from '@/lib/prisma'
import { isRateLimited } from '@/lib/rate-limit'
import { sendEmailSMTP } from '@/lib/email-smtp'
import { adminNotifyEmail } from '@/lib/store-config'

const esc = (v: unknown) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

const PRODUCTION_KWH_PER_KWP_MIN = 1200
const PRODUCTION_KWH_PER_KWP_MAX = 1800
const PAYBACK_SUSPICIOUS_YEARS = 3
const PERFORMANCE_GUARANTEE_MIN = 80

function computeRedFlags(body: Record<string, unknown>): string[] {
  const flags: string[] = []
  const panelBrandModel = typeof body.panelBrandModel === 'string' ? body.panelBrandModel.trim() : ''
  const panelWatt = typeof body.panelWatt === 'number' ? body.panelWatt : null
  const panelCount = typeof body.panelCount === 'number' ? body.panelCount : null
  const totalKwp = typeof body.totalKwp === 'number' ? body.totalKwp : null
  const inverterTotalKw = typeof body.inverterTotalKw === 'number' ? body.inverterTotalKw : null
  const mpptCount = typeof body.mpptCount === 'number' ? body.mpptCount : null
  const annualProductionKwh = typeof body.annualProductionKwh === 'number' ? body.annualProductionKwh : null
  const paybackYearsQuoted = typeof body.paybackYearsQuoted === 'number' ? body.paybackYearsQuoted : null
  const warrantyPerformance25Pct = typeof body.warrantyPerformance25Pct === 'number' ? body.warrantyPerformance25Pct : null

  if (!panelBrandModel || panelBrandModel.length < 2) {
    flags.push('Panel markası / modeli belirtilmemiş.')
  }
  if (totalKwp != null && panelWatt != null && panelCount != null && panelCount > 0) {
    const expectedKwp = (panelWatt * panelCount) / 1000
    const diff = Math.abs(expectedKwp - totalKwp)
    if (diff > 0.5) {
      flags.push('Panel Watt × Adet ile kurulu güç (kWp) uyuşmuyor.')
    }
  }
  if (inverterTotalKw != null && totalKwp != null && totalKwp > 0 && inverterTotalKw < totalKwp * 0.9) {
    flags.push('İnverter gücü panel gücüne göre düşük görünüyor.')
  }
  if (mpptCount != null && totalKwp != null && totalKwp > 5 && mpptCount < 2) {
    flags.push('MPPT sayısı büyük sistem için yetersiz olabilir.')
  }
  if (annualProductionKwh != null && totalKwp != null && totalKwp > 0) {
    const ratio = annualProductionKwh / totalKwp
    if (ratio > PRODUCTION_KWH_PER_KWP_MAX) {
      flags.push('Yıllık üretim iddiası (kWh/kWp) Türkiye ortalamasının üzerinde; kontrol edin.')
    }
  }
  if (paybackYearsQuoted != null && paybackYearsQuoted < PAYBACK_SUSPICIOUS_YEARS) {
    flags.push('3 yıldan kısa amortisman iddiası gerçekçi olmayabilir.')
  }
  if (warrantyPerformance25Pct != null && warrantyPerformance25Pct < PERFORMANCE_GUARANTEE_MIN) {
    flags.push('25. yıl performans garantisi %80 altında; riskli olabilir.')
  }

  return flags
}

export async function POST(request: NextRequest) {
  try {
    if (isRateLimited(request as unknown as Request, 'ges-quote-verify', 15, 60_000)) {
      return NextResponse.json(
        { success: false, error: 'Çok fazla istek. Lütfen bir dakika sonra tekrar deneyin.' },
        { status: 429 }
      )
    }
    const body = await request.json()

    // İletişim bilgileri sitedeki formlarla aynı kuralla (lib/checkout-validation)
    if (!isValidEmail(body.contactEmail)) {
      return NextResponse.json({ success: false, error: 'Geçerli bir e-posta adresi girin (örn. ad@ornek.com).' }, { status: 400 })
    }
    if (!isValidTrPhone(body.contactPhone)) {
      return NextResponse.json({ success: false, error: 'Geçerli bir telefon numarası girin (11 hane, örn. 0532 123 45 67).' }, { status: 400 })
    }

    const companyName = typeof body.companyName === 'string' ? body.companyName.trim() : ''
    // Firma adı isteğe bağlı

    const quoteDate = body.quoteDate
      ? new Date(body.quoteDate)
      : undefined
    const totalPriceTry =
      typeof body.totalPriceTry === 'number' && Number.isFinite(body.totalPriceTry)
        ? body.totalPriceTry
        : typeof body.totalPriceTry === 'string'
          ? parseFloat(body.totalPriceTry.replace(/\s/g, '').replace(',', '.'))
          : undefined
    const num = (v: unknown) =>
      typeof v === 'number' && Number.isFinite(v) ? v : typeof v === 'string' ? parseFloat(v.replace(',', '.')) : undefined
    const int = (v: unknown) => {
      const n = typeof v === 'number' ? v : typeof v === 'string' ? parseInt(v, 10) : undefined
      return n != null && Number.isFinite(n) ? n : undefined
    }
    const str = (v: unknown) => (typeof v === 'string' ? v.trim() || undefined : undefined)

    const redFlags = computeRedFlags(body)

    const record = await prisma.gesQuoteVerification.create({
      data: {
        companyName,
        quoteDate: quoteDate && !Number.isNaN(quoteDate.getTime()) ? quoteDate : undefined,
        totalPriceTry: totalPriceTry != null && Number.isFinite(totalPriceTry) ? totalPriceTry : undefined,
        turnkey: str(body.turnkey),
        panelBrandModel: str(body.panelBrandModel),
        panelWatt: int(body.panelWatt),
        panelCount: int(body.panelCount),
        totalKwp: num(body.totalKwp),
        panelTechnology: str(body.panelTechnology),
        panelCertifications: str(body.panelCertifications),
        panelEfficiencyPct: num(body.panelEfficiencyPct),
        warrantyProductYears: int(body.warrantyProductYears),
        warrantyPerformanceYears: int(body.warrantyPerformanceYears),
        warrantyPerformance25Pct: num(body.warrantyPerformance25Pct),
        inverterBrandModel: str(body.inverterBrandModel),
        inverterTotalKw: num(body.inverterTotalKw),
        inverterType: str(body.inverterType),
        mpptCount: int(body.mpptCount),
        storageCompatible: str(body.storageCompatible),
        batteryBrandModel: str(body.batteryBrandModel),
        batteryKwh: num(body.batteryKwh),
        batteryChemistry: str(body.batteryChemistry),
        mountingType: str(body.mountingType),
        staticProjectProvided: str(body.staticProjectProvided),
        electricalIncluded: str(body.electricalIncluded),
        annualProductionKwh: num(body.annualProductionKwh),
        paybackYearsQuoted: num(body.paybackYearsQuoted),
        warrantyService: str(body.warrantyService),
        smartEMS: str(body.smartEMS),
        attachmentBillUrl: str(body.attachmentBillUrl),
        attachmentQuotePdfUrl: str(body.attachmentQuotePdfUrl),
        contactName: str(body.contactName),
        contactEmail: str(body.contactEmail),
        contactPhone: str(body.contactPhone),
        redFlags: redFlags.length ? redFlags : undefined,
      },
    })

    // Yöneticiye bildirim (kontrol listesi 30): talep panelde, e-posta kısa özet; gönderilemezse talep yine kaydedilir
    const rows: [string, unknown][] = [
      ['Ad soyad', body.contactName], ['E-posta', body.contactEmail], ['Telefon', body.contactPhone], ['Firma', body.companyName],
      ['Panel', body.panelBrandModel], ['Toplam kWp', body.totalKwp], ['İnverter', body.inverterBrandModel], ['Teklif tutarı (TL)', body.totalPriceTl],
      ['Uyarılar', redFlags.join(' · ')],
    ]
    const html = `<p>Yeni GES teklif doğrulama talebi (kayıt no: ${esc(record.id)}). Ayrıntılar panelde: Teklif Doğrulama.</p><table>${rows
      .filter(([, v]) => v != null && String(v).trim() !== '')
      .map(([k, v]) => `<tr><td style="padding:2px 12px 2px 0;color:#5d6e80">${esc(k)}</td><td>${esc(v)}</td></tr>`)
      .join('')}</table>`
    await sendEmailSMTP(adminNotifyEmail(), `Yeni teklif doğrulama talebi: ${String(body.contactName || body.contactEmail).slice(0, 80)}`, html).catch((e) =>
      console.error('Teklif doğrulama bildirimi gönderilemedi:', e)
    )

    return NextResponse.json({
      success: true,
      id: record.id,
      redFlags,
      message: 'Doğrulama kaydınız alındı.',
    })
  } catch (error) {
    console.error('GES quote verify error:', error)
    return NextResponse.json(
      { success: false, error: 'Bir hata oluştu. Lütfen tekrar deneyin.' },
      { status: 500 }
    )
  }
}
