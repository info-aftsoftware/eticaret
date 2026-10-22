/**
 * Değerlendirme yalnızca ürünü satın alıp teslim almış üyeye açık: misafir formu görmez, API misafiri reddeder.
 */
import { test, expect } from '@playwright/test'

const PID = 'tommatech-450wp-dark-series-16bb-topcon-gunes-paneli'

test.describe('ürün değerlendirmesi yalnızca alıcıya', () => {
  test('misafir değerlendirme gönderemez, uygunluk "login" döner', async ({ request }) => {
    const res = await request.post(`/api/products/${PID}/reviews`, {
      data: { rating: 5, comment: 'Satın almadan yorum', guestName: 'Deneme', guestEmail: 'deneme@example.com' },
    })
    expect([400, 401]).toContain(res.status()) // 400: Turnstile açıksa önce o reddeder
    const el = await request.get(`/api/products/${PID}/reviews/eligibility`)
    expect(el.status()).toBe(200)
    expect(await el.json()).toEqual({ canReview: false, reason: 'login' })
  })

  test('misafir ürün sayfasında formu görmez, yalnızca bilgi notu görür', async ({ page }) => {
    await page.goto(`/products/${PID}`)
    const section = page.locator('#degerlendirmeler')
    await section.scrollIntoViewIfNeeded()
    await expect(section).toContainText('yalnızca bu ürünü satın alan müşterilerimiz', { timeout: 15_000 })
    await expect(section.getByText('Değerlendirme Yaz')).toHaveCount(0)
    await expect(section.locator('textarea')).toHaveCount(0)
  })
})
