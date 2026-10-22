/**
 * Klasik gezinme kuralları: yeni sayfa en baştan başlar, sayfa numarası adreste (?page=) durur,
 * geri tuşu önceki sayfaya döner, filtre değişince 1. sayfaya dönülür.
 */
import { test, expect, type Page } from '@playwright/test'

const pageButton = (page: Page, n: number) => page.getByRole('button', { name: new RegExp(`^(${n}\\. sayfa|Page ${n})$`) })

test.describe('gezinme kuralları', () => {
  test('ürün listesinde sayfa değişince en üste dönülür ve adres güncellenir', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Numaralı düğmeler masaüstünde; mobilde önceki/sonraki')
    await page.goto('/products')
    await expect(pageButton(page, 3)).toBeVisible({ timeout: 20_000 })
    await pageButton(page, 3).scrollIntoViewIfNeeded()
    expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(300)
    await pageButton(page, 3).click()
    await expect(page).toHaveURL(/[?&]page=3\b/)
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThan(5)
    await expect(pageButton(page, 3)).toHaveAttribute('aria-current', 'page')

    await pageButton(page, 4).scrollIntoViewIfNeeded()
    await pageButton(page, 4).click()
    await expect(page).toHaveURL(/[?&]page=4\b/)
    await page.goBack()
    await expect(page).toHaveURL(/[?&]page=3\b/)
    await expect(pageButton(page, 3)).toHaveAttribute('aria-current', 'page')
  })

  test('?page= ile açılan liste o sayfayı gösterir, yenilemede korunur', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Numaralı düğmeler masaüstünde')
    await page.goto('/products?page=2')
    await expect(pageButton(page, 2)).toHaveAttribute('aria-current', 'page', { timeout: 20_000 })
    const first = await page.locator('main a[href^="/products/"]').first().getAttribute('href')
    await page.reload()
    await expect(pageButton(page, 2)).toHaveAttribute('aria-current', 'page', { timeout: 20_000 })
    expect(await page.locator('main a[href^="/products/"]').first().getAttribute('href')).toBe(first)
  })

  test('alt sayfadan ürüne geçince ürün sayfası en üstten açılır', async ({ page }) => {
    await page.goto('/products')
    const card = page.locator('main a[href^="/products/"]').nth(8)
    await card.scrollIntoViewIfNeeded()
    expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(300)
    await card.click()
    await expect(page).toHaveURL(/\/products\/[^?]+/)
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThan(5)
  })
})
