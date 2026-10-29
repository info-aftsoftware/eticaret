import React from 'react'
import { Text, Section, Link } from '@react-email/components'
import { EmailLayout, OrderSummary, OrderProgress, CtaButton, BankTransferBox, AmountRow, s, fmtTRY, tx, type EmailLocale, type OrderEmailData } from './shared'
import { localizePath } from '../../lib/i18n/locale-path'

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

type Bilingual = { tr: string; en: string }

const TITLES: Record<OrderEmailKind, Bilingual> = {
  payment_reminder: { tr: 'Ödemenizi bekliyoruz', en: 'We are awaiting your payment' },
  payment_received: { tr: 'Ödemeniz alındı', en: 'Payment received' },
  payment_failed: { tr: 'Ödemeniz tamamlanamadı', en: 'Your payment could not be completed' },
  confirmed: { tr: 'Siparişiniz hazırlanıyor', en: 'Your order is being prepared' },
  shipped: { tr: 'Siparişiniz kargoda', en: 'Your order has shipped' },
  delivered: { tr: 'Siparişiniz teslim edildi', en: 'Your order has been delivered' },
  cancelled: { tr: 'Siparişiniz iptal edildi', en: 'Your order has been cancelled' },
  returned: { tr: 'Siparişinizin iadesi tamamlandı', en: 'Your return is complete' },
  cancel_requested: { tr: 'İptal talebiniz alındı', en: 'We received your cancellation request' },
  cancel_rejected: { tr: 'İptal talebiniz hakkında', en: 'About your cancellation request' },
}

const SUBJECTS: Record<OrderEmailKind, Bilingual> = {
  ...TITLES,
  payment_received: { tr: 'Ödemeniz alındı, siparişiniz onaylandı', en: 'Payment received, your order is confirmed' },
  shipped: { tr: 'Siparişiniz kargoya verildi', en: 'Your order has shipped' },
}

export const ORDER_EMAIL_SUBJECTS: Record<OrderEmailKind, (orderNo: string, locale?: EmailLocale | null) => string> = Object.fromEntries(
  (Object.keys(SUBJECTS) as OrderEmailKind[]).map((k) => [k, (n: string, locale?: EmailLocale | null) => `${SUBJECTS[k][locale === 'en' ? 'en' : 'tr']} - ${n}`])
) as Record<OrderEmailKind, (orderNo: string, locale?: EmailLocale | null) => string>

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
  const L = tx(order.locale)
  const amount = order.refundAmount ?? order.total
  return (
    <Section style={s.boxGreen}>
      <Text style={s.boxTitle}>{L('Ücret iadeniz başlatıldı', 'Your refund has been initiated')}</Text>
      <AmountRow label={L('İade tutarı', 'Refund amount')} value={fmtTRY(amount, order.locale)} strong />
      <Text style={{ ...s.row, marginTop: '6px' }}>
        {order.paymentMethod === 'bank_transfer'
          ? L(
              'Tutar, havale/EFT yaptığınız hesaba iade edilir. Farklı bir hesaba iade istiyorsanız bu e-postayı IBAN ve hesap sahibi bilgisiyle yanıtlayın.',
              'The amount will be refunded to the account you paid from. If you would like the refund sent to a different account, reply to this email with the IBAN and account holder name.'
            )
          : L(
              'Tutar, ödemede kullandığınız karta iade edilir. Kart ekstrenize yansıma süresi bankanıza bağlı olarak genellikle 2–10 iş günüdür.',
              'The amount will be refunded to the card you paid with. It usually appears on your card statement within 2–10 business days, depending on your bank.'
            )}
      </Text>
    </Section>
  )
}

/** Sipariş durum e-postaları (ödeme, hazırlanıyor, kargo, teslim, iptal, iade, iptal talebi); siparişin dilinde. */
export default function OrderStatusEmail({ order, kind, reason }: {
  order: OrderEmailData
  kind: OrderEmailKind
  reason?: string | null
}) {
  const en = order.locale === 'en'
  const L = tx(order.locale)
  const fmt = (n: number) => fmtTRY(n, order.locale)
  const title = TITLES[kind][en ? 'en' : 'tr']
  const refunded = order.paymentStatus === 'REFUNDED' || (order.refundAmount ?? 0) > 0
  const progress = PROGRESS[kind]
  const site = (order.siteUrl || order.orderUrl.replace(/(\/en)?\/orders\/.*$/, '')).replace(/\/$/, '')
  return (
    <EmailLayout
      locale={order.locale}
      preview={`${title} — ${order.orderNo}`}
      title={title}
      subtitle={<>{L('Sipariş no', 'Order no.')}: <strong style={{ color: '#ffffff' }}>{order.orderNo}</strong> · {order.createdAt}</>}
      tone={TONE[kind]}
    >
      <Text style={s.p}>{L(`Merhaba ${order.customerName},`, `Hello ${order.customerName},`)}</Text>
      {progress !== undefined && <OrderProgress step={progress} locale={order.locale} />}

      {kind === 'payment_reminder' && (
        <>
          {en ? (
            <Text style={s.p}>
              We have not yet received your bank transfer (EFT) for this order. To keep your order from being cancelled, please transfer{' '}
              <strong>{fmt(order.total)}</strong> by <strong>{order.paymentDueDate}</strong>. If you have already paid, please disregard this email.
            </Text>
          ) : (
            <Text style={s.p}>
              Siparişiniz için havale/EFT ödemeniz henüz hesabımıza ulaşmadı. Siparişinizin iptal edilmemesi için lütfen{' '}
              <strong>{order.paymentDueDate}</strong> tarihine kadar <strong>{fmt(order.total)}</strong> ödeme yapın.
              Ödemeyi yaptıysanız bu e-postayı dikkate almayın.
            </Text>
          )}
          <BankTransferBox order={order} />
        </>
      )}

      {kind === 'payment_received' &&
        (en ? (
          <Text style={s.p}>
            Your payment of <strong>{fmt(order.total)}</strong> has been received and your order is confirmed. We will send you the tracking
            details once your order has been prepared and shipped.
          </Text>
        ) : (
          <Text style={s.p}>
            <strong>{fmt(order.total)}</strong> tutarındaki ödemeniz alındı ve siparişiniz onaylandı. Siparişiniz hazırlanıp kargoya
            verildiğinde takip bilgilerini ayrıca göndereceğiz.
          </Text>
        ))}
      {order.estimatedDelivery && (kind === 'payment_received' || kind === 'confirmed') && (
        <Text style={s.p}>
          {en ? (
            <>
              Estimated delivery: <strong>{order.estimatedDelivery}</strong> (orders placed before 15:00 on a business day ship the same day,
              later orders the next business day; transit takes 1–3 business days).
            </>
          ) : (
            <>
              Tahmini teslimat aralığınız: <strong>{order.estimatedDelivery}</strong> (iş günü 15:00 öncesi siparişler aynı gün, sonrası ertesi iş günü kargoya verilir; kargoda 1–3 iş günü).
            </>
          )}
        </Text>
      )}

      {kind === 'payment_failed' && (
        <>
          <Section style={s.boxRed}>
            <Text style={s.row}>
              {L(
                'Siparişiniz için kart ödemesi bankanız tarafından onaylanmadı, bu nedenle sipariş tamamlanmadı ve ödeme alınmadı.',
                'Your bank did not approve the card payment for this order, so the order was not completed and no payment was taken.'
              )}
            </Text>
          </Section>
          {en ? (
            <Text style={s.p}>
              Please check your card details and limit and try again, or pay with a discount by <strong>bank transfer (EFT)</strong>. If the
              problem persists, make sure your card is enabled for online purchases and 3D Secure verification.
            </Text>
          ) : (
            <Text style={s.p}>
              Kart bilgilerinizi ve limitinizi kontrol ederek tekrar deneyebilir ya da <strong>Havale/EFT</strong> seçeneğiyle indirimli
              ödeyebilirsiniz. Sorun devam ederse kartınızın internet alışverişine ve 3D Secure doğrulamasına açık olduğundan emin olun.
            </Text>
          )}
          <CtaButton href={`${site}${localizePath('/cart', en ? 'en' : 'tr')}`}>{L('Tekrar dene', 'Try again')}</CtaButton>
        </>
      )}

      {kind === 'confirmed' && (
        <Text style={s.p}>
          {L(
            'Siparişiniz onaylandı ve depomuzda hazırlanmaya başlandı. Kargoya verildiğinde takip bilgilerini e-posta ile göndereceğiz.',
            'Your order has been confirmed and is now being prepared in our warehouse. We will email you the tracking details once it ships.'
          )}
        </Text>
      )}

      {kind === 'shipped' && (
        <>
          <Text style={s.p}>{L('Siparişiniz yola çıktı. Kargonuzu aşağıdaki bilgilerle takip edebilirsiniz.', 'Your order is on its way. You can track your shipment with the details below.')}</Text>
          <Section style={s.boxBlue}>
            <Text style={s.boxTitle}>{L('Kargo bilgileri', 'Shipping details')}</Text>
            {order.carrierName && <AmountRow label={L('Kargo firması', 'Carrier')} value={order.carrierName} />}
            {order.trackingNumber && <AmountRow label={L('Takip numarası', 'Tracking number')} value={<span style={s.mono}>{order.trackingNumber}</span>} />}
            {order.trackingHint && <Text style={{ ...s.row, marginTop: '6px' }}>{order.trackingHint}</Text>}
            <Text style={s.note}>{L('Kargo firmasının sistemine kaydın düşmesi birkaç saat sürebilir.', "It may take a few hours for the shipment to appear in the carrier's system.")}</Text>
          </Section>
          {order.trackingUrl && <CtaButton href={order.trackingUrl}>{L('Kargomu takip et', 'Track my shipment')}</CtaButton>}
        </>
      )}

      {kind === 'delivered' && (
        <>
          <Text style={s.p}>
            {L(
              'Siparişiniz teslim edildi. Bizi tercih ettiğiniz için teşekkür ederiz. Ürünlerle ilgili deneyiminizi ürün sayfasında değerlendirme olarak paylaşabilirsiniz.',
              'Your order has been delivered. Thank you for choosing us. You are welcome to share your experience as a review on the product page.'
            )}
          </Text>
          {en ? (
            <Text style={s.note}>
              You may exercise your right of withdrawal within 14 days of delivery. You can create a return request from your order page; see the{' '}
              <Link href={`${site}${localizePath('/returns', 'en')}`} style={s.link}>returns and withdrawal terms</Link>.
            </Text>
          ) : (
            <Text style={s.note}>
              Teslimattan itibaren 14 gün içinde cayma hakkınızı kullanabilirsiniz. İade talebini sipariş sayfanızdan oluşturabilirsiniz;{' '}
              <Link href={`${site}/returns`} style={s.link}>iade ve cayma koşulları</Link>.
            </Text>
          )}
        </>
      )}

      {kind === 'cancelled' && (
        <>
          <Text style={s.p}>
            {L(`${order.orderNo} numaralı siparişiniz iptal edildi.`, `Your order ${order.orderNo} has been cancelled.`)}
            {reason ? <> <strong>{L('Neden', 'Reason')}:</strong> {reason}</> : null}
          </Text>
          {refunded ? (
            <RefundBox order={order} />
          ) : order.paymentMethod === 'bank_transfer' ? (
            <Text style={s.p}>
              {L(
                'Siparişiniz için ödeme alınmadığından herhangi bir işlem yapmanıza gerek yoktur.',
                'No payment was received for this order, so there is nothing you need to do.'
              )}
            </Text>
          ) : null}
        </>
      )}

      {kind === 'returned' && (
        <>
          <Text style={s.p}>
            {L(
              'İade ettiğiniz ürünler tarafımıza ulaştı ve siparişinizin iadesi tamamlandı.',
              'The items you returned have reached us and the return of your order is complete.'
            )}
            {reason ? ` ${L('Not', 'Note')}: ${reason}` : ''}
          </Text>
          {refunded && <RefundBox order={order} />}
        </>
      )}

      {kind === 'cancel_requested' && (
        <>
          <Text style={s.p}>
            {L('Siparişiniz için iptal talebiniz bize ulaştı.', 'We have received your request to cancel this order.')}
            {reason ? <> <strong>{L('Belirttiğiniz neden', 'Reason given')}:</strong> {reason}</> : null}
          </Text>
          <Section style={s.boxAmber}>
            {en ? (
              <Text style={s.row}>
                Your request will be reviewed as soon as possible (usually within 1 business day). If the cancellation is approved before
                your order ships, the full amount of <strong>{fmt(order.total)}</strong> you paid will be refunded and we will let you know by email.
              </Text>
            ) : (
              <Text style={s.row}>
                Talebiniz en kısa sürede (genellikle 1 iş günü içinde) değerlendirilecek. Siparişiniz kargoya verilmeden iptal onaylanırsa
                ödediğiniz <strong>{fmt(order.total)}</strong> tutarın tamamı iade edilir ve size e-posta ile bilgi verilir.
              </Text>
            )}
          </Section>
        </>
      )}

      {kind === 'cancel_rejected' && (
        <>
          <Text style={s.p}>
            {L('Siparişiniz için iptal talebiniz kabul edilemedi.', 'Unfortunately, we could not accept your cancellation request.')}
            {reason ? <> <strong>{L('Açıklama', 'Explanation')}:</strong> {reason}</> : null}
          </Text>
          <Text style={s.p}>
            {L(
              'Siparişinizi teslim aldıktan sonra 14 gün içinde cayma hakkınızı kullanarak iade talebi oluşturabilirsiniz. Sorularınız için bu e-postayı yanıtlayabilirsiniz.',
              'After you receive your order, you can use your right of withdrawal within 14 days and create a return request. If you have any questions, just reply to this email.'
            )}
          </Text>
        </>
      )}

      {kind !== 'payment_failed' && <OrderSummary order={order} compact={kind === 'cancel_requested' || kind === 'cancel_rejected' || kind === 'returned'} />}
      {kind !== 'payment_failed' && kind !== 'shipped' && <CtaButton href={order.orderUrl} secondary>{L('Siparişimi görüntüle', 'View my order')}</CtaButton>}
      {kind === 'shipped' && (
        <Text style={{ ...s.note, textAlign: 'center' as const }}>
          {L('Sipariş detayınız', 'Order details')}: <Link href={order.orderUrl} style={s.link}>{order.orderNo}</Link>
        </Text>
      )}
    </EmailLayout>
  )
}
