export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { reportError } from '@/lib/alerts'
import { prisma } from '@/lib/prisma'
import { isRateLimited } from '@/lib/rate-limit'
import crypto from 'node:crypto'
import { getBankPosConfig, buildPosForm, type PosForm } from '@/lib/payments/bank-pos'
import { getNextOrderNo, getNextCustomerNo } from '@/lib/sequence'
import { getCustomerFromRequest } from '@/lib/customerAuth'
import { priceOrder, PricingError, VAT_RATE, reserveCouponUse, releaseCouponUse } from '@/lib/order-pricing'
import { onOrderCreated, changeOrderStatus } from '@/lib/order-service'
import { toCustomerOrder } from '@/lib/customer-order'
import { getLegalDocument } from '@/lib/legal/documents'

const str = (v: unknown, max = 500): string => (typeof v === 'string' ? v.trim().slice(0, max) : '')

/**
 * Sipariş oluşturur. Fiyat, KDV, kargo ve kupon indirimi sunucuda hesaplanır;
 * istemcinin gönderdiği fiyat/toplam alanları yok sayılır. Ödeme durumu her zaman PENDING başlar
 * ve yalnızca doğrulanmış ödeme webhook'u (veya admin) PAID yapabilir.
 * Body: { customer, items: [{ id, quantity }], couponCode?, paymentMethod: 'bank_transfer' | 'card', acceptedTerms: true, notes? }
 */
export async function POST(request: NextRequest) {
  try {
    if (isRateLimited(request, 'orders', 20, 60_000)) {
      return NextResponse.json(
        { success: false, error: 'Çok fazla sipariş isteği. Lütfen kısa süre sonra tekrar deneyin.' },
        { status: 429 }
      )
    }
    const body = await request.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ success: false, error: 'Geçersiz istek' }, { status: 400 })
    }

    const { customer, items, couponCode, acceptedTerms } = body
    const paymentMethod = body.paymentMethod === 'card' ? 'card' : 'bank_transfer'
    // Banka sanal POS bilgileri girilmeden kartla sipariş alınmaz (sipariş oluşturulmadan reddedilir)
    const posConfig = paymentMethod === 'card' ? getBankPosConfig() : null
    if (paymentMethod === 'card' && !posConfig) {
      return NextResponse.json(
        { success: false, code: 'CARD_UNAVAILABLE', error: 'Kartla ödeme şu anda kullanılamıyor. Lütfen Havale/EFT seçeneğiyle devam edin.' },
        { status: 503 }
      )
    }

    if (acceptedTerms !== true) {
      return NextResponse.json(
        { success: false, error: 'Ön Bilgilendirme Formu ve Mesafeli Satış Sözleşmesi onaylanmalıdır.' },
        { status: 400 }
      )
    }

    const c = customer && typeof customer === 'object' ? customer : {}
    const name = str(c.name, 200)
    const email = str(c.email, 200)
    const phone = str(c.phone, 30)
    const addressLine = str(c.addressLine)
    const city = str(c.city, 100)
    const district = str(c.district, 100)
    if (!name || !phone || !addressLine || !city || !district || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Ad, e-posta, telefon ve adres bilgileri zorunludur.' },
        { status: 400 }
      )
    }
    const billingType = c.billingType === 'company' ? 'company' : 'individual'

    let pricing
    try {
      pricing = await priceOrder(items, typeof couponCode === 'string' ? couponCode : null, paymentMethod)
    } catch (e) {
      if (e instanceof PricingError) {
        return NextResponse.json({ success: false, error: e.message }, { status: 400 })
      }
      throw e
    }

    // Kullanıcı yalnızca doğrulanmış token'dan belirlenir; gövdedeki userId yok sayılır.
    let resolvedUserId: string | null = null
    const tokenUserId = (await getCustomerFromRequest(request))?.userId ?? null
    if (tokenUserId) {
      const user = await prisma.user.findUnique({
        where: { id: tokenUserId },
        select: { id: true, customerNo: true },
      })
      if (user) {
        resolvedUserId = user.id
        if (!user.customerNo) {
          const customerNo = await getNextCustomerNo()
          await prisma.user.update({ where: { id: user.id }, data: { customerNo } })
        }
      }
    }

    // Kupon kullanım sınırı: sipariş oluşmadan önce bir kullanım ayrılır (oluşmazsa geri verilir)
    if (pricing.couponCode) {
      try {
        await reserveCouponUse(pricing.couponCode)
      } catch (e) {
        if (e instanceof PricingError) return NextResponse.json({ success: false, error: e.message }, { status: 400 })
        throw e
      }
    }

    const orderNo = await getNextOrderNo().catch(async (e) => {
      await releaseCouponUse(pricing.couponCode)
      throw e
    })
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null

    const order = await prisma.order.create({
      data: {
        orderNo,
        userId: resolvedUserId,
        status: 'PENDING',
        paymentStatus: 'PENDING',
        paymentMethod: paymentMethod === 'card' ? 'card' : 'bank_transfer',
        shippingName: name,
        // Küçük harfle saklanır: üyelikten sonra doğrulanmış e-postayla hesaba bağlanabilsin
        shippingEmail: email.toLowerCase(),
        shippingPhone: phone,
        shippingAddress: addressLine,
        shippingCity: city,
        shippingDistrict: district,
        shippingPostalCode: str(c.postalCode, 10),
        shippingCountry: str(c.country, 100) || 'Türkiye',
        billingType,
        billingName: str(c.billingName, 200) || name,
        billingTaxId: (billingType === 'company' ? str(c.taxId, 11) : str(c.idNumber, 11)) || null,
        billingTaxOffice: billingType === 'company' ? str(c.taxOffice, 100) || null : null,
        billingAddress: str(c.billingAddress) || addressLine,
        billingCity: str(c.billingCity, 100) || city,
        billingDistrict: str(c.billingDistrict, 100) || district,
        billingPostalCode: str(c.postalCode, 10) || null,
        billingCountry: str(c.country, 100) || 'Türkiye',
        subtotal: pricing.subtotal,
        vatTotal: pricing.tax,
        shippingCost: pricing.shipping,
        discount: pricing.discount,
        couponCode: pricing.couponCode,
        couponDiscount: pricing.couponDiscount,
        paymentDiscount: pricing.paymentDiscount,
        total: pricing.total,
        currency: 'TRY',
        customerNote: str(body.notes, 2000) || null,
        notes: JSON.stringify({
          consents: {
            distanceSalesAndPreInfo: true,
            acceptedAt: new Date().toISOString(),
            ip,
            // Onaylanan metin sürümleri (lib/legal/documents.json "Son güncelleme")
            versions: {
              preInfo: getLegalDocument('on-bilgilendirme-formu')?.updated ?? null,
              distanceSales: getLegalDocument('mesafeli-satis-sozlesmesi')?.updated ?? null,
            },
          },
        }),
        lines: {
          create: pricing.lines.map((l) => ({
            variantId: null,
            productName: l.name.slice(0, 500),
            // stok iadesi ve raporlama için katalog ürün id'si
            variantMatrix: { productId: l.productId, ...(l.variantKey ? { variantKey: l.variantKey } : {}) },
            quantity: l.quantity,
            unitPrice: l.unitPrice,
            vatRate: VAT_RATE,
            lineTotal: Math.round(l.lineSubtotal * (1 + VAT_RATE / 100) * 100) / 100,
          })),
        },
      },
      include: { lines: true },
    }).catch(async (e) => {
      await releaseCouponUse(pricing.couponCode)
      throw e
    })

    // ── Stok düşme ─────────────────────────────────────────────────────────
    // Atomik koşullu azaltma: stok yetersizse satır güncellenmez (eksiye düşmez).
    // Hata olursa sipariş iptal edilmez, sadece loglanır.
    const decremented: { productId: string; qty: number; stock: boolean; product: boolean }[] = []
    try {
      for (const line of pricing.lines) {
        const s1 = await prisma.stockOverride.updateMany({
          where: { productId: line.productId, stock: { gte: line.quantity } },
          data: { stock: { decrement: line.quantity } },
        })
        const s2 = await prisma.productOverride.updateMany({
          where: { productId: line.productId, stock: { gte: line.quantity } },
          data: { stock: { decrement: line.quantity } },
        })
        decremented.push({ productId: line.productId, qty: line.quantity, stock: s1.count > 0, product: s2.count > 0 })
      }
    } catch (stockErr) {
      console.error('Stock decrement error (order still created):', stockErr)
    }
    // Hangi satırın stoğu gerçekten düşüldü: iptal/iadede yalnızca bunlar geri eklenir (hayali stok oluşmaz)
    try {
      for (const line of order.lines) {
        const vm = (line.variantMatrix ?? {}) as { productId?: string; variantKey?: string }
        const d = decremented.find((x) => x.productId === vm.productId)
        await prisma.orderLine.update({
          where: { id: line.id },
          data: { variantMatrix: { ...vm, stockDecremented: !!d?.stock, productStockDecremented: !!d?.product } },
        })
      }
    } catch (flagErr) {
      console.error('Stock flag error:', flagErr)
    }
    // ───────────────────────────────────────────────────────────────────────

    // Üyenin sepet özeti (terk edilen sepet hatırlatması) artık gereksiz
    if (resolvedUserId) await prisma.cartSnapshot.deleteMany({ where: { userId: resolvedUserId } }).catch(() => {})

    // Zaman çizelgesi + e-postalar (havalede hemen; kartlı siparişte ödeme onaylanınca)
    await onOrderCreated(order).catch((e) => reportError('siparis-bildirimi', e, { orderNo: order.orderNo }))

    // Kartlı ödeme: tarayıcı bu imzalı formla bankanın 3D Secure sayfasına gider.
    // paymentProviderRef = ödeme dönüş sayfasının durumu sorgularken kullandığı tek kullanımlık anahtar.
    let payment: { form: PosForm; bank: string } | undefined
    if (paymentMethod === 'card' && posConfig) {
      try {
        const returnToken = crypto.randomBytes(18).toString('base64url')
        await prisma.order.update({ where: { id: order.id }, data: { paymentProviderRef: returnToken } })
        const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://voltekno.com').replace(/\/$/, '')
        payment = {
          bank: posConfig.bankName,
          form: buildPosForm(
            { orderNo: order.orderNo, amount: pricing.total, callbackUrl: `${baseUrl}/api/payments/pos/callback`, customer: { name, email, phone } },
            posConfig
          ),
        }
      } catch (e) {
        await reportError('kart-odeme-baslatma', e, { orderNo: order.orderNo })
        await changeOrderStatus(order.id, 'CANCELLED', { actor: 'system', reason: 'Kart ödeme sayfası hazırlanamadı', notifyCustomer: false }).catch(() => {})
        return NextResponse.json(
          { success: false, error: 'Kart ödeme sayfası şu anda açılamıyor. Lütfen Havale/EFT ile deneyin veya daha sonra tekrar deneyin.' },
          { status: 502 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      orderId: order.orderNo,
      pricing: {
        subtotal: pricing.subtotal,
        couponDiscount: pricing.couponDiscount,
        paymentDiscount: pricing.paymentDiscount,
        tax: pricing.tax,
        shipping: pricing.shipping,
        total: pricing.total,
      },
      payment,
    })
  } catch (error) {
    await reportError('siparis-olusturma', error)
    return NextResponse.json(
      { success: false, error: 'Sipariş oluşturulurken bir hata oluştu' },
      { status: 500 }
    )
  }
}


/**
 * Müşterinin kendi siparişleri (Prisma). Auth zorunlu; sadece userId eşleşen siparişler döner.
 */
export async function GET(request: NextRequest) {
  try {
    const customer = await getCustomerFromRequest(request)
    const userId = customer?.userId ?? null
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Giriş yapmanız gerekiyor' },
        { status: 401 }
      )
    }

    // Üye olmadan verilen siparişler, e-posta adresi DOĞRULANMIŞ hesapla eşleşiyorsa hesaba bağlanır
    // (doğrulanmamış e-postayla başkasının siparişleri görülemesin diye)
    if (customer?.emailVerified && customer.email) {
      const email = customer.email.trim()
      await prisma.order
        .updateMany({
          where: { userId: null, shippingEmail: { in: Array.from(new Set([email, email.toLowerCase()])) } },
          data: { userId },
        })
        .catch((e) => console.error('Misafir siparişi bağlama hatası:', e))
    }

    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '100', 10), 500)
    const status = searchParams.get('status')

    const where: { userId: string; status?: any } = { userId }
    if (status) where.status = status as any

    const orders = await prisma.order.findMany({
      where,
      include: { lines: true, events: { where: { visibleToCustomer: true }, orderBy: { createdAt: 'asc' } }, returnRequests: { orderBy: { createdAt: 'asc' } } },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    return NextResponse.json({
      success: true,
      orders: orders.map(toCustomerOrder),
    })
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      { success: false, error: 'Siparişler getirilirken bir hata oluştu' },
      { status: 500 }
    )
  }
}
