/**
 * Satış biçimleri (lib/sale-mode.ts): teklifle satılan ürün fiyatsız ve sepete eklenemez; şarj istasyonu satın alınır,
 * kurulum ve nakliye fiyata dahil değildir (kargo ücretine girmez).
 */
import { test, expect } from '@playwright/test'

const QUOTE = 'aft-5-4-kwh-lifepo4-lfp-batarya'
const STATION = 'aft-pro-v2-dc-hizli-elektrikli-arac-sarj-istasyonu-90-270kw'

test.describe('satış biçimleri', () => {
  test('teklif ürünü: fiyat yerine "Fiyat için teklif alın", sepet düğmesi yok, sunucu reddeder', async ({ page, request }) => {
    await page.goto(`/products/${QUOTE}`)
    const main = page.locator('main')
    await expect(main.getByText('Fiyat için teklif alın').first()).toBeVisible()
    await expect(main.getByRole('link', { name: /WhatsApp/ }).first()).toBeVisible()
    // Ürün kutusunda sepet düğmesi yok (alttaki öneri kartları başka ürünlere ait)
    await expect(page.locator('h1').locator('xpath=ancestor::*[.//button][1]').getByRole('button', { name: /Sepete Ekle/ })).toHaveCount(0)
    const quote = await (await request.post('/api/cart/quote', { data: { items: [{ id: QUOTE, quantity: 1 }] } })).json()
    expect(quote.lines[0].available).toBe(false)
    expect(quote.lines[0].error).toContain('teklif')
  })

  test('şarj istasyonu: fiyatlı, sepete eklenir, kurulum ve nakliye notu; sepette kargo "Ayrıca planlanır"', async ({ page }) => {
    await page.goto(`/products/${STATION}`)
    await expect(page.getByText('Kurulum ve nakliye fiyata dahil değildir').first()).toBeVisible()
    await page.getByRole('button', { name: /Sepete Ekle/ }).first().click()
    await page.goto('/cart')
    await expect(page.getByText('Ayrıca planlanır').first()).toBeVisible()
    await expect(page.getByText(/Şarj istasyonu: Kurulum ve nakliye/).first()).toBeVisible()
  })
})
