/**
 * Sipariş verisini fatura PDF'inin beklediği formata dönüştürür.
 * Prisma Order + lines veya Firestore/admin API'den gelen normalize format desteklenir.
 */

export interface InvoiceItem {
  sku: string
  title: string
  qty: number
  unitPrice: number
  total: number
}

export interface InvoiceData {
  customer: {
    name: string
    email: string
    phone?: string
    addressLine?: string
    city?: string
    district?: string
    postalCode?: string
    country?: string
    billingType?: string
    companyName?: string
    taxId?: string
    taxOffice?: string
  }
  pricing: {
    subtotal: number
    /** Kupon + havale indirimi (KDV matrahından düşülmüş) */
    discount?: number
    tax: number
    shipping: number
    total: number
    items: InvoiceItem[]
  }
  status?: string
  /** bank_transfer | stripe | paytr */
  paymentMethod?: string | null
}

/** Prisma Order (include: { lines: true }) -> InvoiceData */
export function buildInvoiceDataFromPrisma(order: {
  shippingName: string
  shippingEmail?: string | null
  shippingPhone: string
  shippingAddress: string
  shippingCity: string
  shippingDistrict: string
  shippingPostalCode: string
  shippingCountry?: string
  billingType?: string | null
  billingName?: string | null
  billingTaxId?: string | null
  billingTaxOffice?: string | null
  user?: { email: string | null } | null
  subtotal: number
  discount?: number
  vatTotal: number
  shippingCost: number
  total: number
  status: string
  paymentMethod?: string | null
  lines: Array<{
    variantId: string | null
    productName: string
    quantity: number
    unitPrice: number
    lineTotal: number
  }>
}): InvoiceData {
  const email = order.shippingEmail ?? order.user?.email ?? ''
  return {
    customer: {
      name: order.shippingName,
      email,
      phone: order.shippingPhone,
      addressLine: order.shippingAddress,
      city: order.shippingCity,
      district: order.shippingDistrict,
      postalCode: order.shippingPostalCode,
      country: order.shippingCountry ?? 'Türkiye',
      billingType: order.billingType ?? 'individual',
      companyName: order.billingName ?? undefined,
      taxId: order.billingTaxId ?? undefined,
      taxOffice: order.billingTaxOffice ?? undefined,
    },
    pricing: {
      subtotal: Number(order.subtotal) || 0,
      discount: Number(order.discount) || 0,
      tax: Number(order.vatTotal) || 0,
      shipping: Number(order.shippingCost) || 0,
      total: Number(order.total) || 0,
      items: order.lines.map((l) => ({
        sku: l.variantId ?? '-',
        title: l.productName,
        qty: l.quantity,
        unitPrice: Number(l.unitPrice) || 0,
        total: Number(l.lineTotal) || 0,
      })),
    },
    status: order.status,
    paymentMethod: order.paymentMethod ?? null,
  }
}

/** Firestore / admin API normalize format (customer, items, pricing) -> InvoiceData */
export function buildInvoiceDataFromNormalized(order: {
  customer: Record<string, unknown>
  items: Array<{ id?: string; name: string; productName?: string; price?: number; quantity: number; unitPrice?: number; lineTotal?: number }>
  pricing: { subtotal?: number; tax?: number; shipping?: number; total?: number }
  status?: string
}): InvoiceData {
  const c = order.customer as Record<string, string | undefined>
  const items = order.items || []
  const pricing = order.pricing || {}
  const subtotal = Number(pricing.subtotal) ?? 0
  const tax = Number(pricing.tax) ?? 0
  const shipping = Number(pricing.shipping) ?? 0
  const total = Number(pricing.total) ?? 0

  return {
    customer: {
      name: c.name ?? '',
      email: c.email ?? '',
      phone: c.phone,
      addressLine: c.addressLine,
      city: c.city,
      district: c.district,
      postalCode: c.postalCode,
      country: c.country ?? 'Türkiye',
      billingType: c.billingType,
      companyName: c.companyName,
      taxId: c.taxId,
      taxOffice: c.taxOffice,
    },
    pricing: {
      subtotal,
      tax,
      shipping,
      total,
      items: items.map((item) => {
        const qty = item.quantity || 1
        const unitPrice = Number(item.unitPrice ?? item.price ?? 0)
        const lineTotal = Number(item.lineTotal) || unitPrice * qty
        return {
          sku: item.id ?? '-',
          title: item.name || item.productName || 'Ürün',
          qty,
          unitPrice,
          total: lineTotal,
        }
      }),
    },
    status: order.status,
  }
}
