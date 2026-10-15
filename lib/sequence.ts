/**
 * Unique sipariş ve müşteri numarası üretimi.
 * Prisma Sequence tablosu kullanır; tek bir atomik upsert ile tekil değer garanti edilir.
 *
 * Sipariş no: ORD-YYYY-NNNNN (örn. ORD-2025-00001)
 * Müşteri no: CUS-NNNNN (örn. CUS-00001)
 */

import { prisma } from '@/lib/prisma'

const ORDER_SEQ_NAME = 'orderNo'
const CUSTOMER_SEQ_NAME = 'customerNo'

/**
 * Atomik sayaç: tek bir upsert sorgusu (ilk kayıtta bile eşzamanlı iki istek çakışmaz).
 */
async function nextValue(name: string): Promise<number> {
  const row = await prisma.sequence.upsert({
    where: { name },
    create: { name, value: 1 },
    update: { value: { increment: 1 } },
  })
  return row.value
}

/**
 * Sonraki sipariş numarasını döner (unique). Format: ORD-YYYY-NNNNN
 */
export async function getNextOrderNo(): Promise<string> {
  const year = new Date().getFullYear()
  const seq = await nextValue(ORDER_SEQ_NAME)
  return `ORD-${year}-${String(seq).padStart(5, '0')}`
}

/**
 * Sonraki müşteri numarasını döner (unique). Format: CUS-NNNNN
 */
export async function getNextCustomerNo(): Promise<string> {
  const seq = await nextValue(CUSTOMER_SEQ_NAME)
  return `CUS-${String(seq).padStart(5, '0')}`
}

/**
 * Sonraki iade talebi numarasını döner (unique). Format: RET-YYYY-NNNNN
 */
export async function getNextReturnNo(): Promise<string> {
  const year = new Date().getFullYear()
  const seq = await nextValue('returnNo')
  return `RET-${year}-${String(seq).padStart(5, '0')}`
}
