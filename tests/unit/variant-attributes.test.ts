import { test } from 'node:test'
import assert from 'node:assert/strict'
import { labelMeasurements, variantDistinctLabels } from '../../lib/seo/variant-attributes'
import { mockProducts } from '../../lib/products-mock'

test('varyant etiketinden ortak kelimeler atılır, birim kalır', () => {
  assert.deepEqual(variantDistinctLabels(['5 kW Off-Grid Akıllı İnverter', '6 kW Off-Grid Akıllı İnverter']), ['5 kW', '6 kW'])
  assert.deepEqual(variantDistinctLabels(['90 kW', '180 kW', '270 kW']), ['90 kW', '180 kW', '270 kW'])
  assert.deepEqual(
    variantDistinctLabels(['25,6V 204Ah LiFePO4 Lityum Batarya', '51,2V 102Ah LiFePO4 Lityum Batarya']),
    ['25,6V 204Ah', '51,2V 102Ah'],
  )
  // Ortak son kelimeyle atılan kapanış parantezi geri gelir
  assert.deepEqual(
    variantDistinctLabels(['MDK55A Diyot Modülü (7,5-11 kW Sürücüler)', 'MDK90A Diyot Modülü (18,5-30 kW Sürücüler)']),
    ['MDK55A Diyot Modülü (7,5-11 kW)', 'MDK90A Diyot Modülü (18,5-30 kW)'],
  )
  assert.deepEqual(variantDistinctLabels(['Tek seçenek']), ['Tek seçenek'])
})

test('etiketteki ölçüler ada göre ayrılır; model kodundaki birim alınmaz', () => {
  assert.deepEqual(labelMeasurements('24V 30A'), [
    { name: 'Gerilim', value: '24 V' },
    { name: 'Akım', value: '30 A' },
  ])
  assert.deepEqual(labelMeasurements('1000 D 1000W 12/24V'), [
    { name: 'Güç', value: '1000 W' },
    { name: 'Gerilim', value: '12/24 V' },
  ])
  assert.deepEqual(labelMeasurements('8-12 kW'), [{ name: 'Güç', value: '8-12 kW' }])
  assert.deepEqual(labelMeasurements('MDK55A Diyot Modülü'), [])
  assert.deepEqual(labelMeasurements('RM-5'), [])
})

test('katalogdaki her varyantlı üründe ayırt edici değerler benzersiz', () => {
  for (const p of mockProducts.filter((x) => x.variants?.length)) {
    const labels = variantDistinctLabels(p.variants!.map((v) => v.label))
    assert.equal(new Set(labels).size, labels.length, p.id)
    assert.ok(labels.every(Boolean), p.id)
  }
})
