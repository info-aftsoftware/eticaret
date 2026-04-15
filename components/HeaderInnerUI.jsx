'use client'

import React, { useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Manrope } from 'next/font/google'
import { fmtPrice } from '@/lib/format'
import { mockProducts, PLACEHOLDER_PRODUCT_IMAGE } from '@/lib/products-mock'
import { HeaderWrapper } from './HeaderWrapper'
import { HeaderTopBar } from './HeaderTopBar'
import { Logo } from './Logo'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Input } from './ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import { Sheet, SheetContent, SheetTitle } from './ui/sheet'
import { ShoppingCart, Heart, User, Search, Menu, ChevronDown, ChevronRight, Home, Phone } from 'lucide-react'

const headerDisplay = Manrope({
  subsets: ['latin'],
  weight: ['700', '800'],
})


const CATEGORY_MENU_IMAGE_BY_VALUE = mockProducts.reduce((acc, product) => {
  if (!product.category || !product.image || product.image === PLACEHOLDER_PRODUCT_IMAGE) return acc
  if (!acc[product.category]) acc[product.category] = product.image
  return acc
}, {})

const GROUP_MENU_META = {
  'elektrikli-arac-sarj-urunleri': {
    badge: 'ELEKTRIKLI ARAC SARJ URUNLERI',
    eyebrow: 'Premium Sarj Cozumleri',
    accent: '#2563eb',
    surface: 'from-blue-50/90 via-white to-slate-50',
  },
  'batarya-depolama': {
    badge: 'AKU VE BATARYALAR',
    eyebrow: 'Enerji Depolama',
    accent: '#f4a11a',
    surface: 'from-amber-50/90 via-white to-slate-50',
  },
  inverterler: {
    badge: 'INVERTERLER',
    eyebrow: 'Guvenilir Donusum',
    accent: '#0f766e',
    surface: 'from-teal-50/90 via-white to-slate-50',
  },
  'gunes-enerjisi': {
    badge: 'GUNES ENERJISI',
    eyebrow: 'Yuksek Verimlilik',
    accent: '#65a30d',
    surface: 'from-lime-50/80 via-white to-slate-50',
  },
  'isi-pompasi-hvac': {
    badge: 'ISI POMPASI VE HVAC',
    eyebrow: 'Iklimlendirme',
    accent: '#7c3aed',
    surface: 'from-violet-50/80 via-white to-slate-50',
  },
}

function getMenuGridClass(count) {
  if (count <= 2) return 'grid grid-cols-2 gap-5 border-b border-slate-100 pb-7'
  if (count <= 4) return 'grid grid-cols-2 gap-5 border-b border-slate-100 pb-7 xl:grid-cols-4'
  if (count <= 6) return 'grid grid-cols-2 gap-5 border-b border-slate-100 pb-7 lg:grid-cols-3'
  return 'grid grid-cols-2 gap-5 border-b border-slate-100 pb-7 lg:grid-cols-4'
}

function getMenuCards(groupKey, items) {
  return items.map((item) => ({
    title: item.labelKey,
    href: `/products?category=${encodeURIComponent(item.value)}`,
    image: CATEGORY_MENU_IMAGE_BY_VALUE[item.value] || PLACEHOLDER_PRODUCT_IMAGE,
    translate: true,
  }))
}

export function HeaderInnerUI(props) {
  const {
    t,
    pathname,
    router,
    currentCategory,
    mobileMenuOpen,
    setMobileMenuOpen,
    cartItemsCount,
    cartTotalFormatted,
    user,
    isAuthenticated,
    logout,
    searchQuery,
    setSearchQuery,
    handleSearch,
    searchResults = [],
    searchLoading = false,
    searchOpen = false,
    setSearchOpen,
    currency = 'TRY',
    exchangeRates = null,
    navGroups,
    navLinks,
  } = props

  const [openMenu, setOpenMenu] = React.useState(null)
  const [expandedGroups, setExpandedGroups] = React.useState(new Set())
  const timeoutRef = React.useRef(null)
  const desktopSearchRef = useRef(null)
  const mobileSearchRef = useRef(null)

  useEffect(() => {
    if (!searchOpen) return
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setSearchOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [searchOpen, setSearchOpen])

  useEffect(() => {
    if (!searchOpen) return
    const onMouseDown = (e) => {
      const inDesktop = desktopSearchRef.current?.contains(e.target)
      const inMobile = mobileSearchRef.current?.contains(e.target)
      if (!inDesktop && !inMobile) setSearchOpen(false)
    }
    window.addEventListener('mousedown', onMouseDown)
    return () => window.removeEventListener('mousedown', onMouseDown)
  }, [searchOpen, setSearchOpen])

  const showDropdown = searchOpen && searchQuery.trim().length > 0
  const renderSearchDropdown = (onResultClick) => (
    showDropdown && (
      <div className="absolute left-0 right-0 top-full mt-1 z-50 rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50 overflow-hidden">
        {searchLoading ? (
          <div className="px-4 py-6 text-center text-sm text-slate-500">{t('searching')}</div>
        ) : searchResults.length > 0 ? (
          <>
            <ul className="max-h-72 overflow-y-auto py-1">
              {searchResults.map((product) => (
                <li key={product.id}>
                  <Link
                    href={product.slug ? `/products/${product.slug}` : `/products/${product.id}`}
                    onClick={() => { setSearchOpen(false); onResultClick?.() }}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 text-left transition-colors"
                  >
                    <span className="flex-1 min-w-0 truncate text-sm font-medium text-slate-800">{product.name}</span>
                    {product.price != null && (
                      <span className="shrink-0 text-sm font-semibold text-brand">
                        {fmtPrice(product.price, currency, exchangeRates)}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="border-t border-slate-100 px-4 py-2 bg-slate-50/80">
              <Link
                href={`/products?q=${encodeURIComponent(searchQuery)}`}
                onClick={() => { setSearchOpen(false); onResultClick?.() }}
                className="text-sm font-medium text-brand hover:underline"
              >
                {t('viewAllResults')}
              </Link>
            </div>
          </>
        ) : (
          <div className="px-4 py-6 text-center text-sm text-slate-500">{t('noSearchResults')}</div>
        )}
      </div>
    )
  )

  const toggleGroup = (id) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  /** İmleç trigger ile content arasında gezerken kapanmayı geciktirmek için. */
  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
  }

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setOpenMenu(null)
    }, 200)
  }

  const menuPanelClass = 'w-[min(520px,calc(100vw-3rem))] max-w-[520px] overflow-hidden rounded-2xl border border-slate-100 bg-white p-0 shadow-[0_8px_32px_rgba(15,23,42,0.08),0_1px_3px_rgba(15,23,42,0.04)] animate-in fade-in slide-in-from-top-1 duration-150'
  const desktopNavItemClass = (isActive) =>
    `group relative flex items-center justify-center px-3 py-1.5 rounded-lg text-center transition-all duration-200 ${isActive ? 'text-slate-950' : 'text-slate-600 hover:text-slate-950'}`
  const desktopNavLabelClass = `${headerDisplay.className} text-[14px] font-bold tracking-[-0.01em] leading-[1.25] text-center whitespace-nowrap`
  const desktopNavSubLabelClass = 'hidden'

  const navDropdown = (labelKey, items, categoryHref, groupKey) => {
    const isGroupPageActive = categoryHref && pathname.startsWith(categoryHref)
    const menuCards = getMenuCards(groupKey, items)
    const featuredCard = menuCards[0]
    const remainingCards = menuCards.slice(0, 8)
    return (
      <div
        key={groupKey}
        className="relative shrink-0"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <DropdownMenu modal={false} open={openMenu === labelKey} onOpenChange={(open) => {
          if (open) {
            if (timeoutRef.current) clearTimeout(timeoutRef.current)
            setOpenMenu(labelKey)
          } else if (openMenu === labelKey) {
            setOpenMenu(null)
          }
        }}>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className={`${desktopNavItemClass(isGroupPageActive || openMenu === labelKey)} border-0 outline-none ring-0 focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 ${(isGroupPageActive || openMenu === labelKey) ? 'bg-slate-100' : 'hover:bg-slate-100'}`}
              onMouseEnter={() => { handleMouseEnter(); setOpenMenu(labelKey) }}
            >
              <span className={desktopNavLabelClass}>
                {t(labelKey)}
              </span>
              <ChevronDown className={`ml-1 h-3 w-3 shrink-0 text-slate-400 transition-transform duration-200 ${openMenu === labelKey ? 'rotate-180' : ''}`} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="center"
            collisionPadding={24}
            sideOffset={2}
            className={menuPanelClass}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            {/* Üst accent çizgisi */}
            <div className="h-[3px] bg-gradient-to-r from-brand via-brand/70 to-transparent" />

            <div className="px-5 pt-4 pb-5">
              {/* Başlık satırı */}
              <div className="flex items-center justify-between mb-4">
                <span className={`${headerDisplay.className} text-[10.5px] font-black uppercase tracking-[0.16em] text-brand`}>
                  {t(labelKey)}
                </span>
                <Link
                  href={categoryHref || '/products'}
                  onClick={() => setOpenMenu(null)}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-brand transition-colors"
                >
                  Tümünü Gör
                  <ChevronRight className="h-3 w-3" />
                </Link>
              </div>

              {/* Kategoriler */}
              <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
                {remainingCards.map((card, index) => (
                  <DropdownMenuItem
                    key={`${groupKey}-${card.href}-${index}`}
                    asChild
                    className="m-0 rounded-none border-0 bg-transparent p-0 outline-none focus:bg-transparent data-[highlighted]:bg-transparent"
                  >
                    <Link
                      href={card.href}
                      onClick={() => setOpenMenu(null)}
                      className="group flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-200 group-hover:bg-brand transition-colors shrink-0" />
                      <span className="text-[13px] font-medium text-slate-600 group-hover:text-slate-900 transition-colors leading-tight truncate">
                        {card.translate ? t(card.title) : card.title}
                      </span>
                      <ChevronRight className="h-3 w-3 ml-auto shrink-0 text-slate-200 opacity-0 group-hover:opacity-100 group-hover:text-brand transition-all duration-150" />
                    </Link>
                  </DropdownMenuItem>
                ))}
              </div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    )
  }

  const renderDesktopLink = (href, label, active, helper) => (
    <Link
      href={href}
      className={`${desktopNavItemClass(active)} flex-1 min-w-0 ${active ? 'bg-slate-100' : 'hover:bg-slate-100'}`}
    >
      <span className={desktopNavLabelClass}>{label}</span>
    </Link>
  )

  return (
    <HeaderWrapper>
      <div className="hidden md:block shrink-0">
        <HeaderTopBar />
      </div>
      {/* Ana satır: Logo, Arama, Hesap / Favoriler / Sepet */}
      <div className="hidden md:block bg-white shadow-[0_2px_16px_rgba(15,23,42,0.07)] border-b border-slate-100 shrink-0">
        <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 min-w-0">
          <div className="flex items-center h-[80px] gap-6 sm:gap-8 min-w-0">
            <div className="flex-shrink-0 flex items-center pr-2">
              <Logo size="xl" href="/" />
            </div>
            <div ref={desktopSearchRef} className="flex-1 min-w-0 max-w-xl mx-auto relative">
              <form onSubmit={handleSearch} className="relative">
                <Input
                  type="text"
                  placeholder={t('searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full max-w-full min-w-0 h-11 pl-5 pr-12 rounded-full border border-slate-200/90 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)] focus:border-brand focus:ring-2 focus:ring-brand/10 text-sm transition-all placeholder:text-slate-400"
                />
                <button
                  type="submit"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center text-slate-500 hover:text-brand rounded-full transition-colors"
                  aria-label={t('searchPlaceholder')}
                >
                  <Search className="w-4 h-4" />
                </button>
              </form>
              {renderSearchDropdown()}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {isAuthenticated && user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-11 px-3.5 gap-2 text-slate-700 hover:bg-white hover:text-ink rounded-full border border-slate-200/80 bg-white/90 shadow-[0_8px_20px_rgba(15,23,42,0.04)] transition-colors">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                        <User className="w-4 h-4 text-slate-500" />
                      </div>
                      <div className="hidden xl:block text-left min-w-0">
                        <p className="text-xs text-slate-500 font-medium leading-tight truncate">{t('myAccount')}</p>
                        <p className="text-sm font-semibold text-ink leading-tight truncate max-w-[72px]">{user.name.split(' ')[0]}</p>
                      </div>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" sideOffset={6} className="w-72 p-0 rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-xl shadow-slate-200/50">
                    <div className="px-5 pt-5 pb-4 bg-slate-50/80">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{t('welcome')}</p>
                      <p className="text-base font-semibold text-ink mt-1 leading-snug">{t('greeting', { name: user.name })}</p>
                    </div>
                    <div className="border-t border-slate-200" />
                    <div className="py-2 px-2">
                      <DropdownMenuItem asChild className="rounded-xl h-11 px-4 mx-1 cursor-pointer text-ink font-normal text-base focus:bg-brand-light/30 focus:text-brand data-[highlighted]:bg-brand-light/30 data-[highlighted]:text-brand">
                        <Link href="/profile">{t('goToAccount')}</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="rounded-xl h-11 px-4 mx-1 cursor-pointer text-ink font-normal text-base focus:bg-brand-light/30 focus:text-brand data-[highlighted]:bg-brand-light/30 data-[highlighted]:text-brand">
                        <Link href="/profile?tab=orders">{t('viewOrders')}</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="rounded-xl h-11 px-4 mx-1 cursor-pointer text-ink font-normal text-base focus:bg-brand-light/30 focus:text-brand data-[highlighted]:bg-brand-light/30 data-[highlighted]:text-brand">
                        <Link href="/profile?tab=havale">{t('bankTransferNotify')}</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="rounded-xl h-11 px-4 mx-1 cursor-pointer text-ink font-normal text-base focus:bg-brand-light/30 focus:text-brand data-[highlighted]:bg-brand-light/30 data-[highlighted]:text-brand">
                        <Link href="/profile?tab=settings">{t('updateInfo')}</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="rounded-xl h-11 px-4 mx-1 cursor-pointer text-ink font-normal text-base focus:bg-brand-light/30 focus:text-brand data-[highlighted]:bg-brand-light/30 data-[highlighted]:text-brand">
                        <Link href="/profile?tab=points">{t('pointsAndGifts')}</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="rounded-xl h-11 px-4 mx-1 cursor-pointer text-ink font-normal text-base focus:bg-brand-light/30 focus:text-brand data-[highlighted]:bg-brand-light/30 data-[highlighted]:text-brand">
                        <Link href="/favorites">{t('viewFavorites')}</Link>
                      </DropdownMenuItem>
                    </div>
                    <div className="border-t border-slate-200" />
                    <div className="p-2.5">
                      <button
                        type="button"
                        onClick={() => { logout(); router.push('/') }}
                        className="w-full h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-ink font-medium text-base transition-colors"
                      >
                        {t('logout')}
                      </button>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button asChild variant="ghost" className="h-11 px-3.5 gap-2 text-slate-700 hover:bg-white rounded-full border border-slate-200/80 bg-white/90 shadow-[0_8px_20px_rgba(15,23,42,0.04)] transition-colors">
                  <Link href="/login">
                    <User className="w-4 h-4 text-slate-500" />
                    <div className="hidden xl:block text-left">
                      <p className="text-xs text-slate-500 font-medium leading-tight">{t('login')}</p>
                      <p className="text-sm font-semibold leading-tight">{t('orRegister')}</p>
                    </div>
                  </Link>
                </Button>
              )}
              <Link href="/favorites" className="hidden sm:flex h-11 w-11 items-center justify-center text-slate-500 hover:text-brand hover:bg-white rounded-full border border-slate-200/80 bg-white/90 shadow-[0_8px_20px_rgba(15,23,42,0.04)] transition-colors shrink-0" aria-label={t('favorites')}>
                <Heart className="w-4 h-4" />
              </Link>
              <Button asChild className="h-11 px-4 gap-2 bg-brand hover:bg-brand-hover text-white rounded-full transition-colors relative shrink-0 shadow-[0_14px_30px_rgba(127,29,29,0.18)]">
                <Link href="/cart">
                  <ShoppingCart className="w-4 h-4 shrink-0" />
                  <div className="hidden xl:block text-left whitespace-nowrap">
                    <p className="text-xs text-white/90 font-medium leading-tight">{t('cart')}</p>
                    <p className="text-sm font-bold leading-tight">{cartTotalFormatted}</p>
                  </div>
                  {cartItemsCount > 0 && (
                    <Badge className="absolute -top-0.5 -right-0.5 h-5 min-w-5 px-1.5 bg-white text-brand border border-brand/30 rounded-full flex items-center justify-center text-[10px] font-bold shadow-sm">
                      {cartItemsCount}
                    </Badge>
                  )}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
      {/* Şerit 2: Ana menü */}
      <div className="relative hidden md:block bg-white border-b border-slate-100 shrink-0">
        <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 min-w-0 overflow-x-hidden">
          <nav className="flex items-center gap-0.5 h-[52px] min-w-0 overflow-hidden" aria-label="Ana menu">
            <Link
              href="/"
              className={`${desktopNavItemClass(pathname === '/')} ${pathname === '/' ? 'bg-slate-100' : 'hover:bg-slate-100'}`}
            >
              <span className={desktopNavLabelClass}>Ana Sayfa</span>
            </Link>
            <div className="w-px h-5 bg-slate-200 mx-1 shrink-0" />
            {navGroups.map((g) => navDropdown(g.labelKey, g.categories, g.href, g.id))}
            <div className="w-px h-5 bg-slate-200 mx-1 shrink-0" />
            <Link
              href="/blog"
              className={`${desktopNavItemClass(pathname === '/blog' || pathname?.startsWith('/blog/'))} ${pathname === '/blog' || pathname?.startsWith('/blog/') ? 'bg-slate-100' : 'hover:bg-slate-100'}`}
            >
              <span className={desktopNavLabelClass}>Blog</span>
            </Link>
            <Link
              href="/contact"
              className={`${desktopNavItemClass(pathname === '/contact')} ${pathname === '/contact' ? 'bg-slate-100' : 'hover:bg-slate-100'}`}
            >
              <span className={desktopNavLabelClass}>İletişim</span>
            </Link>
          </nav>
        </div>
      </div>

      {/* Mobil: menü + logo + sepet (safe area wrapper'dan gelir) */}
      <div className="md:hidden flex items-center justify-between min-h-[60px] h-[60px] px-4 gap-2 bg-white border-b border-slate-200/70 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileMenuOpen(true)}
          className="min-h-[44px] min-w-[44px] h-11 w-11 shrink-0 rounded-xl touch-manipulation text-slate-700 hover:bg-slate-100 hover:text-ink transition-colors"
          aria-label={t('openMenu')}
        >
          <Menu className="w-5 h-5" />
        </Button>
        <div className="flex-1 flex justify-center min-w-0 py-1">
          <Logo size="sm" href="/" />
        </div>
        <Link href="/cart" className="relative flex min-h-[44px] min-w-[44px] h-11 w-11 items-center justify-center shrink-0 rounded-xl hover:bg-slate-100 text-slate-700 transition-colors touch-manipulation" aria-label={t('cartAria')}>
          <ShoppingCart className="w-5 h-5" />
          {cartItemsCount > 0 && (
            <Badge className="absolute top-1 right-1 min-h-5 min-w-5 px-1.5 bg-brand text-white rounded-full text-[11px] font-bold flex items-center justify-center border-0 shadow-sm">
              {cartItemsCount}
            </Badge>
          )}
        </Link>
      </div>

      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent
          side="left"
          className="w-[min(300px,100vw-1rem)] sm:w-[min(320px,100vw-2rem)] p-0 flex flex-col max-h-[100dvh] border-0 border-r border-slate-200 overflow-hidden bg-slate-50 rounded-r-2xl shadow-xl pt-safe"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <SheetTitle className="sr-only">{t('mobileMenu')}</SheetTitle>

          {/* Başlık: sade, tek satır */}
          <div className="shrink-0 px-4 pt-4 pb-2">
            <Link href="/" onClick={() => setMobileMenuOpen(false)} className="flex items-center min-h-[44px]">
              <Logo size="md" href="/" />
            </Link>
          </div>

          {/* Arama: tek kutu, ikon içeride */}
          <div ref={mobileSearchRef} className="shrink-0 px-4 pb-4 relative">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <Input
                type="search"
                placeholder={t('searchPlaceholderMobile')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 h-11 rounded-xl border-slate-200 bg-white text-sm placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-slate-300 touch-manipulation"
                autoComplete="off"
              />
            </form>
            {renderSearchDropdown(() => setMobileMenuOpen(false))}
          </div>

          <nav className="flex flex-col flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 pb-4 space-y-6">
            {!isAuthenticated && (
              <div className="flex gap-2">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 flex items-center justify-center h-11 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors touch-manipulation"
                >
                  {t('login')}
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 flex items-center justify-center h-11 rounded-xl bg-brand text-white text-sm font-medium hover:bg-brand-hover transition-colors touch-manipulation"
                >
                  {t('orRegister')}
                </Link>
              </div>
            )}

            {/* Ana menü */}
            <div className="space-y-0.5">
              <Link href="/" onClick={() => setMobileMenuOpen(false)} className={`flex items-center gap-3 h-12 px-3 rounded-xl text-sm font-medium transition-colors touch-manipulation ${pathname === '/' ? 'bg-white text-brand shadow-sm border border-slate-200/80' : 'text-slate-700 hover:bg-white/80'}`}>
                <Home className={`w-5 h-5 shrink-0 ${pathname === '/' ? 'text-brand' : 'text-slate-400'}`} />
                {t('navHome')}
              </Link>
              <Link href="/products" onClick={() => setMobileMenuOpen(false)} className={`flex items-center gap-3 h-12 px-3 rounded-xl text-sm font-medium transition-colors touch-manipulation ${pathname === '/products' && !currentCategory ? 'bg-white text-brand shadow-sm border border-slate-200/80' : 'text-slate-700 hover:bg-white/80'}`}>
                <ShoppingCart className={`w-5 h-5 shrink-0 ${pathname === '/products' && !currentCategory ? 'text-brand' : 'text-slate-400'}`} />
                {t('navProducts')}
              </Link>
              <Link href="/favorites" onClick={() => setMobileMenuOpen(false)} className={`flex items-center gap-3 h-12 px-3 rounded-xl text-sm font-medium transition-colors touch-manipulation ${pathname === '/favorites' ? 'bg-white text-brand shadow-sm border border-slate-200/80' : 'text-slate-700 hover:bg-white/80'}`}>
                <Heart className={`w-5 h-5 shrink-0 ${pathname === '/favorites' ? 'text-brand' : 'text-slate-400'}`} />
                {t('favorites')}
              </Link>
            </div>

            {/* Kategoriler */}
            <div>
              <p className="px-3 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('categories')}</p>
              <div className="space-y-1">
                {navGroups.map((group) => {
                  const isExpanded = expandedGroups.has(group.id)
                  const isGroupActive = pathname.startsWith(`/category/${group.id}`)

                  return (
                    <div key={group.id} className="rounded-xl overflow-hidden bg-white border border-slate-200/80">
                      <div className="flex items-stretch">
                        <Link
                          href={group.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`flex-1 flex items-center gap-3 min-h-[48px] px-3 py-3 text-sm font-medium min-w-0 touch-manipulation ${isGroupActive ? 'text-brand' : 'text-slate-700'}`}
                        >
                          <span className="truncate">{t(group.labelKey)}</span>
                        </Link>
                        <button
                          type="button"
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleGroup(group.id) }}
                          className="min-w-[44px] flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors touch-manipulation"
                          aria-label={isExpanded ? t('collapse') : t('expand')}
                        >
                          <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>
                      </div>
                      {isExpanded && (
                        <div className="border-t border-slate-100 bg-slate-50/50 px-3 py-2 space-y-0.5">
                          {group.categories.map((cat) => {
                            const isSubActive = pathname === '/products' && currentCategory === cat.value
                            const label = t(cat.labelKey)
                            return (
                              <Link
                                key={cat.value}
                                href={`/products?category=${encodeURIComponent(cat.value)}`}
                                onClick={() => setMobileMenuOpen(false)}
                                className={`flex items-center gap-2 min-h-[40px] px-2 py-2 rounded-lg text-sm font-medium transition-colors touch-manipulation ${isSubActive ? 'text-brand bg-white' : 'text-slate-600 hover:text-brand hover:bg-white/80'}`}
                              >
                                <ChevronRight className="w-4 h-4 shrink-0 text-slate-300" />
                                <span className="truncate">{label}</span>
                              </Link>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Blog */}
            <div className="pt-1">
              <Link href="/blog" onClick={() => setMobileMenuOpen(false)} className={`flex items-center gap-3 h-12 px-3 rounded-xl text-sm font-medium transition-colors touch-manipulation ${pathname === '/blog' ? 'bg-white text-brand shadow-sm border border-slate-200/80' : 'text-slate-700 hover:bg-white/80'}`}>
                Blog
              </Link>
            </div>
            {/* İletişim */}
            <div className="pt-1">
              <Link href="/contact" onClick={() => setMobileMenuOpen(false)} className={`flex items-center gap-3 h-12 px-3 rounded-xl text-sm font-medium transition-colors touch-manipulation ${pathname === '/contact' ? 'bg-white text-brand shadow-sm border border-slate-200/80' : 'text-slate-700 hover:bg-white/80'}`}>
                <Phone className={`w-5 h-5 shrink-0 ${pathname === '/contact' ? 'text-brand' : 'text-slate-400'}`} />
                {t('navContact')}
              </Link>
            </div>
          </nav>

          <div className="shrink-0 py-3 px-4 border-t border-slate-200 bg-white/80">
            <p className="text-xs text-center text-slate-400">
              &copy; {new Date().getFullYear()} voltekno
            </p>
          </div>
        </SheetContent>
      </Sheet>
    </HeaderWrapper>
  )
}


