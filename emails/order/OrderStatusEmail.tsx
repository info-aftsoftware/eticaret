import React from 'react'
import { Text, Section, Link } from '@react-email/components'
import { EmailLayout, OrderSummary, OrderProgress, CtaButton, BankTransferBox, AmountRow, s, fmtTRY, type OrderEmailData } from './shared'

export type OrderEmailKind =
  | 'payment_reminder'
  | 'payment_received'
  | 'payment_failed'
  | 'confirmed'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'returned'
  | 'cancel_requested'
  | 'cancel_rejected'

export const ORDER_EMAIL_SUBJECTS: Record<OrderEmailKind, (orderNo: string) => string> = {
  payment_reminder: (n) => `Ödemenizi bekliyoruz - ${n}`,
  payment_received: (n) => `Ödemeniz alındı, siparişiniz onaylandı - ${n}`,
  payment_failed: (n) => `Ödemeniz tamamlanamadı - ${n}`,
  confirmed: (n) => `Siparişiniz hazırlanıyor - ${n}`,
  shipped: (n) => `Siparişiniz kargoya verildi - ${n}`,
  delivered: (n) => `Siparişiniz teslim edildi - ${n}`,
  cancelled: (n) => `Siparişiniz iptal edildi - ${n}`,
  returned: (n) => `Siparişinizin iadesi tamamlandı - ${n}`,
  cancel_requested: (n) => `İptal talebiniz alındı - ${n}`,
  cancel_rejected: (n) => `İptal talebiniz hakkında - ${n}`,
}

const TITLES: Record<OrderEmailKind, string> = {
  payment_reminder: 'Ödemenizi bekliyoruz',
  payment_received: 'Ödemeniz alındı',
  payment_failed: 'Ödemeniz tamamlanamadı',
  confirmed: 'Siparişiniz hazırlanıyor',
  shipped: 'Siparişiniz kargoda',
  delivered: 'Siparişiniz teslim edildi',
  cancelled: 'Siparişiniz iptal edildi',
  returned: 'Siparişinizin iadesi tamamlandı',
  cancel_requested: 'İptal talebiniz alındı',
  cancel_rejected: 'İptal talebiniz hakkında',
}

const TONE: Record<OrderEmailKind, 'navy' | 'green' | 'red' | 'amber'> = {
  payment_reminder: 'amber',
  payment_received: 'green',
  payment_failed: 'red',
  confirmed: 'navy',
  shipped: 'navy',
  delivered: 'green',
  cancelled: 'red',
  returned: 'navy',
  cancel_requested: 'amber',
  cancel_rejected: 'navy',
}

const PROGRESS: Partial<Record<OrderEmailKind, 0 | 1 | 2 | 3 | 4>> = {
  payment_received: 1,
  confirmed: 2,
  shipped: 3,
  delivered: 4,
}

function RefundBox({ order }: { order: OrderEmailData }) {
  const amount = order.refundAmount ?? order.total
  return (
    <Section style={s.boxGreen}>
      <Text style={s.boxTitle}>Ücret iadeniz başlatıldı</Text>
      <AmountRow label="İade tutarı" value={fmtTRY(amount)} strong />
      <Text style={{ ...s.row, marginTop: '6px' }}>
        {order.paymentMethod === 'bank_transfer'
          ? 'Tutar, havale/EFT yaptığınız hesaba iade edilir. Farklı bir hesaba iade istiyorsanız bu e-postayı IBAN ve hesap sahibi bilgisiyle yanıtlayın.'
          : 'Tutar, ödemede kullandığınız karta iade edilir. Kart ekstrenize yansıma süresi bankanıza bağlı olarak genellikle 2–10 iş günüdür.'}
      </Text>
    </Section>
  )
}

/** Sipariş durum e-postaları (ödeme, hazırlanıyor, kargo, teslim, iptal, iade, iptal talebi). */
export default function OrderStatusEmail({ order, kind, reason }: {
  order: OrderEmailData
  kind: OrderEmailKind
  reason?: string | null
}) {
  const refunded = order.paymentStatus === 'REFUNDED' || (order.refundAmount ?? 0) > 0
  const progress = PROGRESS[kind]
  const site = (order.siteUrl || order.orderUrl.replace(/\/orders\/.*$/, '')).replace(/\/$/, '')
  return (
    <EmailLayout
      preview={`${TITLES[kind]} — ${order.orderNo}`}
      title={TITLES[kind]}
      subtitle={<>Sipariş no: <strong style={{ color: '#ffffff' }}>{order.orderNo}</strong> · {order.createdAt}</>}
      tone={TONE[kind]}
    >
      <Text style={s.p}>Merhaba {order.customerName},</Text>
      {progress !== undefined && <OrderProgress step={progress} />}

      {kind === 'payment_reminder' && (
        <>
          <Text style={s.p}>
            Siparişiniz için havale/EFT ödemeniz henüz hesabımıza ulaşmadı. Siparişinizin iptal edilmemesi için lütfen{' '}
            <strong>{order.paymentDueDate}</strong> tarihine kadar <strong>{fmtTRY(order.total)}</strong> ödeme yapın.
            Ödemeyi yaptıysanız bu e-postayı dikkate almayın.
          </Text>
          <BankTransferBox order={order} />
        </>
      )}

      {kind === 'payment_received' && (
        <Text style={s.p}>
          <strong>{fmtTRY(order.total)}</strong> tutarındaki ödemeniz alındı ve siparişiniz onaylandı. Siparişiniz hazırlanıp kargoya
          verildiğinde takip bilgilerini ayrıca göndereceğiz.
        </Text>
      )}

      {kind === 'payment_failed' && (
        <>
          <Section style={s.boxRed}>
            <Text style={s.row}>
              Siparişiniz için kart ödemesi bankanız tarafından onaylanmadı, bu nedenle sipariş tamamlanmadı ve ödeme alınmadı.
            </Text>
          </Section>
          <Text style={s.p}>
            Kart bilgilerinizi ve limitinizi kontrol ederek tekrar deneyebilir ya da <strong>Havale/EFT</strong> seçeneğiyle indirimli
            ödeyebilirsiniz. Sorun devam ederse kartınızın internet alışverişine ve 3D Secure doğrulamasına açık olduğundan emin olun.
          </Text>
          <CtaButton href={`${site}/cart`}>Tekrar dene</CtaButton>
        </>
      )}

      {kind === 'confirmed' && (
        <Text style={s.p}>Siparişiniz onaylandı ve depomuzda hazırlanmaya başlandı. Kargoya verildiğinde takip bilgilerini e-posta ile göndereceğiz.</Text>
      )}

      {kind === 'shipped' && (
        <>
          <Text style={s.p}>Siparişiniz yola çıktı. Kargonuzu aşağıdaki bilgilerle takip edebilirsiniz.</Text>
          <Section style={s.boxBlue}>
            <Text style={s.boxTitle}>Kargo bilgileri</Text>
            {order.carrierName && <AmountRow label="Kargo firması" value={order.carrierName} />}
            {order.trackingNumber && <AmountRow label="Takip numarası" value={<span style={s.mono}>{order.trackingNumber}</span>} />}
            {order.trackingHint && <Text style={{ ...s.row, marginTop: '6px' }}>{order.trackingHint}</Text>}
            <Text style={s.note}>Kargo firmasının sistemine kaydın düşmesi birkaç saat sürebilir.</Text>
          </Section>
          {order.trackingUrl && <CtaButton href={order.trackingUrl}>Kargomu takip et</CtaButton>}
        </>
      )}

      {kind === 'delivered' && (
        <>
          <Text style={s.p}>
            Siparişiniz teslim edildi. Bizi tercih ettiğiniz için teşekkür ederiz. Ürünlerle ilgili deneyiminizi ürün sayfasında
            değerlendirme olarak paylaşabilirsiniz.
          </Text>
          <Text style={s.note}>
            Teslimattan itibaren 14 gün içinde cayma hakkınızı kullanabilirsiniz. İade talebini sipariş sayfanızdan oluşturabilirsiniz;{' '}
            <Link href={`${site}/returns`} style={s.link}>iade ve cayma koşulları</Link>.
          </Text>
        </>
      )}

      {kind === 'cancelled' && (
        <>
          <Text style={s.p}>
            {order.orderNo} numaralı siparişiniz iptal edildi.{reason ? <> <strong>Neden:</strong> {reason}</> : null}
          </Text>
          {refunded ? (
            <RefundBox order={order} />
          ) : order.paymentMethod === 'bank_transfer' ? (
            <Text style={s.p}>Siparişiniz için ödeme alınmadığından herhangi bir işlem yapmanıza gerek yoktur.</Text>
          ) : null}
        </>
      )}

      {kind === 'returned' && (
        <>
          <Text style={s.p}>İade ettiğiniz ürünler tarafımıza ulaştı ve siparişinizin iadesi tamamlandı.{reason ? ` Not: ${reason}` : ''}</Text>
          {refunded && <RefundBox order={order} />}
        </>
      )}

      {kind === 'cancel_requested' && (
        <>
          <Text style={s.p}>
            Siparişiniz için iptal talebiniz bize ulaştı.{reason ? <> <strong>Belirttiğiniz neden:</strong> {reason}</> : null}
          </Text>
          <Section style={s.boxAmber}>
            <Text style={s.row}>
              Talebiniz en kısa sürede (genellikle 1 iş günü içinde) değerlendirilecek. Siparişiniz kargoya verilmeden iptal onaylanırsa
              ödediğiniz <strong>{fmtTRY(order.total)}</strong> tutarın tamamı iade edilir ve size e-posta ile bilgi verilir.
            </Text>
          </Section>
        </>
      )}

      {kind === 'cancel_rejected' && (
        <>
          <Text style={s.p}>
            Siparişiniz için iptal talebiniz kabul edilemedi.{reason ? <> <strong>Açıklama:</strong> {reason}</> : null}
          </Text>
          <Text style={s.p}>
            Siparişinizi teslim aldıktan sonra 14 gün içinde cayma hakkınızı kullanarak iade talebi oluşturabilirsiniz. Sorularınız için
            bu e-postayı yanıtlayabilirsiniz.
          </Text>
        </>
      )}

      {kind !== 'payment_failed' && <OrderSummary order={order} compact={kind === 'cancel_requested' || kind === 'cancel_rejected' || kind === 'returned'} />}
      {kind !== 'payment_failed' && kind !== 'shipped' && <CtaButton href={order.orderUrl} secondary>Siparişimi görüntüle</CtaButton>}
      {kind === 'shipped' && (
        <Text style={{ ...s.note, textAlign: 'center' as const }}>
          Sipariş detayınız: <Link href={order.orderUrl} style={s.link}>{order.orderNo}</Link>
        </Text>
      )}
    </EmailLayout>
  )
}
