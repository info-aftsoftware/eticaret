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

  test('masaüstü açılır kategori menüleri hiçbir genişlikte ekrandan taşmaz', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Açılır menüler masaüstü başlığında')
    test.setTimeout(150_000)
    await page.goto('/')
    for (const width of [1025, 1100, 1145, 1200, 1280, 1366, 1440, 1536, 1920]) {
      await page.setViewportSize({ width, height: 900 })
      const nav = page.locator('nav[aria-label="Ana menü"], nav[aria-label="Main menu"]').first()
      const triggers = nav.locator(':scope > div > a')
      const count = await triggers.count()
      for (let i = 0; i < count; i++) {
        const trigger = triggers.nth(i)
        if (!(await trigger.isVisible())) continue
        await trigger.hover()
        const panel = trigger.locator('xpath=following-sibling::div[1]')
        await expect(panel).toBeVisible()
        await page.waitForTimeout(50)
        const box = await panel.locator(':scope > div').boundingBox()
        const label = `${width}px, ${(await trigger.textContent())?.trim()}`
        expect(box, label).not.toBeNull()
        expect(box!.x, label).toBeGreaterThanOrEqual(0)
        expect(box!.x + box!.width, label).toBeLessThanOrEqual(width)
        await page.mouse.move(width / 2, 850)
        await page.waitForTimeout(250)
      }
    }
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
