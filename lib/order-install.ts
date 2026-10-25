/**
 * Siparişte kurulumlu ürün (şarj istasyonu) var mı (kontrol listesi 26): satırın sipariş anındaki lojistik kaydından
 * (OrderLine.variantMatrix: productId, variantKey, panel lojistiği). E-postalardaki "kurulum ve nakliye dahil değil" notu
 * buna göre gösterilir. Saf modül (birim testli).
 */
import { cartLogistics, type LineLogisticsOverride } from '@/lib/shipping/fee'

type LineLike = { quantity: number; variantMatrix?: unknown }

export function orderHasInstall(order: { lines: LineLike[] }): boolean {
  return !!cartLogistics(
    order.lines.map((l) => {
      const vm = (l.variantMatrix ?? {}) as { productId?: string; variantKey?: string; logistics?: LineLogisticsOverride }
      const id = vm.productId ? (vm.variantKey ? `${vm.productId}-${vm.variantKey}` : vm.productId) : ''
      return { id, productId: vm.productId, quantity: l.quantity, logistics: vm.logistics }
    })
  ).hasInstall
}
