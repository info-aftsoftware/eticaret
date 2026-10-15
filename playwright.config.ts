import { defineConfig, devices } from '@playwright/test'

// PLAYWRIGHT_BASE_URL verilirse çalışan sunucu kullanılır (ör. http://localhost:3005), yoksa npm run dev başlatılır
const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000'

export default defineConfig({
  testDir: './tests',
  // tests/unit/*.test.ts Node test aracıyla çalışır (npm run test:unit)
  testMatch: '**/*.spec.ts',
  // Sabit fiyatlı test ürünü (tests/e2e-catalog.ts): fiyat testleri döviz kurundan bağımsız kalsın
  globalSetup: './tests/e2e-catalog.ts',
  globalTeardown: './tests/global-teardown.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      // PW_CHANNEL=chrome → bilgisayarda kurulu Google Chrome kullanılır (Playwright tarayıcı indirmesi gerekmez)
      use: { ...devices['Desktop Chrome'], ...(process.env.PW_CHANNEL ? { channel: process.env.PW_CHANNEL } : {}) },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: 'npm run dev',
        url: 'http://localhost:3000',
        reuseExistingServer: !process.env.CI,
      },
})
