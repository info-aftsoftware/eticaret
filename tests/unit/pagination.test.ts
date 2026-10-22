import { test } from 'node:test'
import assert from 'node:assert/strict'
import { pageItems, parsePageParam } from '../../lib/pagination'

test('7 sayfaya kadar hepsi gösterilir', () => {
  assert.deepEqual(pageItems(1, 1), [1])
  assert.deepEqual(pageItems(3, 7), [1, 2, 3, 4, 5, 6, 7])
})

test('başta, ortada ve sonda "…" doğru yerde', () => {
  assert.deepEqual(pageItems(1, 15), [1, 2, 3, 4, 5, 'gap', 15])
  assert.deepEqual(pageItems(4, 15), [1, 2, 3, 4, 5, 'gap', 15])
  assert.deepEqual(pageItems(7, 15), [1, 'gap', 6, 7, 8, 'gap', 15])
  assert.deepEqual(pageItems(12, 15), [1, 'gap', 11, 12, 13, 14, 15])
  assert.deepEqual(pageItems(15, 15), [1, 'gap', 11, 12, 13, 14, 15])
})

test('sayfa sayısı dışındaki değer sınırlanır', () => {
  assert.deepEqual(pageItems(40, 15), [1, 'gap', 11, 12, 13, 14, 15])
})

test('?page= çözümlemesi', () => {
  assert.equal(parsePageParam('3'), 3)
  assert.equal(parsePageParam('0'), 1)
  assert.equal(parsePageParam('abc'), 1)
  assert.equal(parsePageParam(null), 1)
})
