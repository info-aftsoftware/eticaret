import React from 'react'
import { getLocale, getMessages } from 'next-intl/server'
import { NextIntlClientProvider } from 'next-intl'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ToastProvider } from '@/components/ui/toast'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { PageContainer } from '@/components/PageContainer'
import { SuppressConsoleWarnings } from '@/components/SuppressConsoleWarnings'
import { CookieConsent } from '@/components/CookieConsent'
import { CompareBar } from '@/components/CompareBar'
import { WhatsAppButton } from '@/components/WhatsAppButton'
import { HtmlLangSync } from '@/components/HtmlLangSync'
import { StructuredData } from '@/components/StructuredData'
import { CategoriesWithProductsProvider } from '@/components/CategoriesWithProductsProvider'

const DEFAULT_LOCALE = 'tr' as const
const DEFAULT_MESSAGES: Record<string, unknown> = {}

export default async function IntlProvider({
  children,
}: {
  children: React.ReactNode
}) {
  // Detect admin routes: middleware forwards x-pathname header to server components
  // In static export mode (STATIC_EXPORT=true), headers() is not available — skip admin check
  let isAdmin = false
  if (process.env.STATIC_EXPORT !== 'true') {
    try {
      const { headers } = await import('next/headers')
      const headersList = await headers()
      const pathname = headersList.get('x-pathname') || ''
      isAdmin = pathname.startsWith('/admin')
    } catch {
      // headers() unavailable (static export or edge runtime) — default to full layout
    }
  }

  let locale: string = DEFAULT_LOCALE
  let messages = DEFAULT_MESSAGES
  try {
    locale = (await getLocale()) || DEFAULT_LOCALE
    messages = (await getMessages()) ?? DEFAULT_MESSAGES
  } catch (e) {
    console.error('IntlProvider getLocale/getMessages error:', e)
  }

  // Admin panel: no site Header/Footer, just provide i18n + UI primitives
  if (isAdmin) {
    return (
      <NextIntlClientProvider locale={locale} messages={messages}>
        <HtmlLangSync />
        <SuppressConsoleWarnings />
        <TooltipProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </TooltipProvider>
      </NextIntlClientProvider>
    )
  }

  const skipToContent = locale === 'en' ? 'Skip to content' : 'İçeriğe atla'

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <HtmlLangSync />
      <SuppressConsoleWarnings />
      <StructuredData />
      <TooltipProvider>
        <ToastProvider>
          <CategoriesWithProductsProvider>
          <div className="min-h-screen min-h-dvh flex flex-col bg-background w-full max-w-full overflow-x-hidden">
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] bg-brand text-brand-foreground px-4 py-3 rounded-lg min-h-[44px] flex items-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand"
            >
              {skipToContent}
            </a>
            {/* Suspense yok: header askıya alınmıyor; sınır olunca React büyük header'ı sonradan akıtıyor,
                önce 56px yer tutucu çizilip içerik aşağı kayıyordu (CLS 0.93) */}
            <Header />
            {/* min-h-screen: içerik istemcide geç gelse de footer ilk ekranda görünüp aşağı kaymaz (CLS) */}
            <main className="flex-1 min-h-screen pb-safe min-w-0 w-full max-w-full overflow-x-hidden overflow-y-auto pt-0 mt-0 [&>*]:mt-0 [&>*]:pt-0" id="main-content">
              {/* Dış Suspense yok: içerik (LCP görseli dahil) gizli akış bloğunda kalıp sayfanın sonunu beklemesin */}
              <PageContainer>{children}</PageContainer>
            </main>
            <Footer />
            <CookieConsent />
            <CompareBar />
            <WhatsAppButton />
          </div>
          </CategoriesWithProductsProvider>
        </ToastProvider>
      </TooltipProvider>
    </NextIntlClientProvider>
  )
}
