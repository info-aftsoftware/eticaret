/**
 * Ürün grupları: üyelik (ürün + marka + kategori), grup/marka kampanyası, toplu fiyat değişikliği.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { groupMembers, groupRules, groupRulesError, isGroupMember, planPriceChange, priceChangeError } from '../../lib/product-groups'
import { applyCampaigns, type ActiveCampaign } from '../../lib/discounts'

const p = (id: string, brand: string, category: string, extra: Record<string, unknown> = {}) => ({
  id, name: id.toUpperCase(), sku: id, description: '', price: 1000, brand, category, stock: 5, featured: false, isVariantProduct: false, ...extra,
})

const products = [
  p('a', 'TommaTech', 'TopCon Güneş Paneli'),
  p('b', 'Victron', 'Hibrit İnverter'),
  p('c', 'Deye', 'Hibrit İnverter'),
  p('d', 'Apex', 'Jel Akü'),
]

test('grup üyeliği: tek tek ürün, marka ve kategori birleşimi', () => {
  const rules = groupRules({ productIds: ['d'], brands: ['TommaTech'], categories: ['Hibrit İnverter'] })
  assert.deepEqual(groupMembers(rules, products).map((x) => x.id), ['a', 'b', 'c', 'd'])
  assert.deepEqual(groupMembers(groupRules({ brands: ['Victron'] }), products).map((x) => x.id), ['b'])
  // Seçilen markaya sonradan eklenen ürün de gruba girer (üyelik dinamik)
  assert.equal(isGroupMember(groupRules({ brands: ['Victron'] }), p('yeni', 'Victron', 'Kablo')), true)
})

test('grup kuralı: ad ve en az bir seçim zorunlu', () => {
  assert.ok(groupRulesError('', groupRules({ brands: ['X'] })))
  assert.ok(groupRulesError('Boş', groupRules({})))
  assert.equal(groupRulesError('Paneller', groupRules({ categories: ['TopCon Güneş Paneli'] })), null)
})

test('grup ve marka kampanyası yalnız kapsadığı ürünlere uygulanır', () => {
  const base: Omit<ActiveCampaign, 'scope' | 'brandName' | 'group'> = { id: 'c', name: 'K', categoryName: null, productIds: [], type: 'PERCENT', value: 10, endDate: null }
  const grp: ActiveCampaign = { ...base, scope: 'GROUP', brandName: null, group: groupRules({ productIds: ['d'], categories: ['Hibrit İnverter'] }) }
  assert.deepEqual(products.map((x) => applyCampaigns(x, [grp]).price), [1000, 900, 900, 900])
  const brand: ActiveCampaign = { ...base, scope: 'BRAND', brandName: 'TommaTech', group: null }
  assert.deepEqual(products.map((x) => applyCampaigns(x, [brand]).price), [900, 1000, 1000, 1000])
})

test('toplu zam: sabit TL\'de TL fiyatı (tam TL), dövize bağlıda döviz fiyatı (kuruş), varyantlar birlikte, teklifli atlanır', () => {
  const plan = planPriceChange(
    [
      { id: 'tl', name: 'TL', price: 515, priceMode: 'fixed' },
      { id: 'fx', name: 'FX', price: 7079, basePrice: 142.56, priceCurrency: 'USD', priceMode: 'fx', variants: [{ key: 'v1', label: '450', price: 7079, basePrice: 142.56 }, { key: 'v2', label: '600', price: 10082, basePrice: 203.04 }] },
      { id: 'q', name: 'Teklifli', price: 0, saleMode: 'quote' },
    ],
    10
  )
  assert.deepEqual(plan.rows.map((r) => [r.id, r.mode, r.from, r.to, r.skipped ?? null]), [
    ['tl', 'fixed', 515, 567, null],
    ['fx', 'fx', 142.56, 156.82, null],
    ['q', 'fixed', 0, 0, 'quote'],
  ])
  assert.deepEqual(plan.rows[1].variants.map((v) => v.to), [156.82, 223.34])
  assert.equal(plan.changed, 2)
  assert.equal(plan.skipped, 1)
})

test('toplu zam yüzdesi sınırları', () => {
  assert.ok(priceChangeError(0))
  assert.ok(priceChangeError(-95))
  assert.ok(priceChangeError(600))
  assert.ok(priceChangeError(''))
  assert.equal(priceChangeError(15), null)
  assert.equal(priceChangeError(-10), null)
})
