'use client'

import React, { useEffect, useRef } from 'react'
import Link from 'next/link'
import { fmtPrice } from '@/lib/format'
import { HEADER_NAV_GROUP_COUNT } from '@/lib/categories'
import { HeaderWrapper } from './HeaderWrapper'
import { HeaderTopBar } from './HeaderTopBar'
import { AllCategoriesMenu } from './header/AllCategoriesMenu'
import { NavGroupMenu } from './header/NavGroupMenu'
import { Logo } from './Logo'
import { Badge } from './ui/badge'
import { Input } from './ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import { Sheet, SheetContent, SheetTitle } from './ui/sheet'
import { ShoppingBag, ShoppingCart, Heart, User, Search, Menu, ChevronDown, ChevronRight, Home, Phone } from 'lucide-react'
import { useL } from '@/lib/i18n-inline'

/**
 * Site başlığı — voltekno.com ile birebir yapı:
 * lacivert üst şerit · logo + geniş arama (sarı buton) + hesap / sepet · "TÜM KATEGORİLER" + kategori linkleri.
 * Kategoriler gunesenerjisistemi.com kırılımında (lib/categories.ts).
 */
export function HeaderInnerUI(props) {
  const {
    t,
    pathname,
    router,
    currentCategory,
    mobileMenuOpen,
    setMobileMenuOpen,
    cartItemsCount,
    user,
    isAuthenticated,
    logout,
    searchQuery,
    setSearchQuery,
    handleSearch,
    searchResults = [],
    searchCategories = [],
    searchTotal = 0,
    activeIndex = -1,
    handleSearchKeyDown,
    searchLoading = false,
    searchOpen = false,
    setSearchOpen,
    currency = 'TRY',
    exchangeRates = null,
    navGroups,
  } = props
  const L = useL()

  const [expandedGroups, setExpandedGroups] = React.useState(new Set())
  const desktopSearchRef = useRef(null)
  const mobileSearchRef = useRef(null)
  const mobileSearchInputRef = useRef(null)
  /** Mobil/tablet: arama satırı yalnızca arama simgesine dokununca açılır (kategoriler burger menüde) */
  const [mobileSearchBarOpen, setMobileSearchBarOpen] = React.useState(false)

  useEffect(() => {
    if (mobileSearchBarOpen) mobileSearchInputRef.current?.focus()
  }, [mobileSearchBarOpen])

  // Sayfa değişince (arama yapılınca da) arama satırı kapanır
  useEffect(() => {
    setMobileSearchBarOpen(false)
  }, [pathname])

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
  /** Arama kutusu erişilebilirlik özellikleri (combobox) — listbox id'si masaüstü/mobil için ayrı */
  const comboboxProps = (listId) => ({
    role: 'combobox',
    'aria-label': t('searchPlaceholder'),
    'aria-autocomplete': 'list',
    'aria-expanded': showDropdown,
    'aria-controls': listId,
    'aria-activedescendant': activeIndex >= 0 ? `${listId}-opt-${activeIndex}` : undefined,
    onKeyDown: handleSearchKeyDown,
    autoComplete: 'off',
  })

  const renderSearchDropdown = (onResultClick, listId = 'search-suggestions') => (
    showDropdown && (
      <div className="absolute left-0 right-0 top-full mt-1 z-50 rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50 overflow-hidden">
        {searchLoading ? (
          <div className="px-4 py-6 text-center text-sm text-slate-500">{t('searching')}</div>
        ) : searchResults.length > 0 ? (
          <>
            {searchCategories?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 px-4 pt-3 pb-1">
                {searchCategories.map((c) => (
                  <Link
                    key={c}
                    href={`/products?category=${encodeURIComponent(c)}&q=${encodeURIComponent(searchQuery)}`}
                    onClick={() => { setSearchOpen(false); onResultClick?.() }}
                    className="rounded-full border border-slate-200 px-2.5 py-1 text-xs text-slate-600 hover:border-brand hover:text-brand"
                  >
                    {c}
                  </Link>
                ))}
              </div>
            )}
            <ul id={listId} role="listbox" aria-label={t('searchPlaceholder')} className="max-h-72 overflow-y-auto py-1">
              {searchResults.map((product, index) => (
                <li key={product.id} id={`${listId}-opt-${index}`} role="option" aria-selected={index === activeIndex}>
                  <Link
                    href={product.slug ? `/products/${product.slug}` : `/products/${product.id}`}
                    onClick={() => { setSearchOpen(false); onResultClick?.() }}
                    tabIndex={-1}
                    className={`flex items-center gap-3 px-4 py-3 hover:bg-slate-50 text-left transition-colors ${index === activeIndex ? 'bg-slate-100' : ''}`}
                  >
                    <span className="flex-1 min-w-0 truncate text-sm font-medium text-slate-800">{product.name}</span>
                    {product.price != null && (
                      <span className="shrink-0 text-right">
                        {product.oldPrice != null && product.oldPrice > product.price && (
                          <span className="block text-[11px] text-slate-400 line-through">{fmtPrice(product.oldPrice, currency, exchangeRates)}</span>
                        )}
                        <span className="text-sm font-semibold text-brand">{fmtPrice(product.price, currency, exchangeRates)}</span>
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
                {t('viewAllResults')}{searchTotal > searchResults.length ? ` (${searchTotal})` : ''}
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

  /** Masaüstü kategori satırı: "Tüm Ürünler" + ilk ana kategoriler (voltekno.com'daki 7 link düzeni) */
  const navRowGroups = navGroups.slice(0, HEADER_NAV_GROUP_COUNT)
  const isAllProducts = pathname === '/products' && !currentCategory
  const navLinkClass = (active) =>
    `px-2.5 py-2.5 rounded-lg text-[13.5px] leading-[14px] font-medium whitespace-nowrap transition-colors ${active ? 'bg-[#f1f4f8] text-[#0b2540]' : 'text-[#3b4a5a] hover:bg-[#f1f4f8] hover:text-[#0b2540]'}`

  const searchForm = (listId, inputRef) => (
    <form onSubmit={handleSearch} className="flex h-[44px] min-[1025px]:h-[46px] rounded-md border border-[#d3d9e1] bg-[#f7f8fa] overflow-hidden focus-within:border-[#0b2540] transition-colors">
      <Input
        ref={inputRef}
        type="text"
        placeholder={L('Ürün, marka veya model arayın', 'Search products, brands or models')}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        {...comboboxProps(listId)}
        className="flex-1 min-w-0 h-full px-4 rounded-none border-0 bg-transparent text-sm text-[#26394b] placeholder:text-[#26394b] shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
      />
      <button
        type="submit"
        className="w-[58px] shrink-0 flex items-center justify-center bg-[#f5b400] hover:bg-[#e0a500] text-[#142b40] transition-colors"
        aria-label={t('searchPlaceholder')}
      >
        <Search className="w-5 h-5" strokeWidth={2.25} />
      </button>
    </form>
  )

  const cartLink = (
    <Link href="/cart" className="flex items-center gap-2.5 text-[#142b40] hover:text-[#0b2540] shrink-0">
      <span className="relative inline-flex">
        <ShoppingBag className="w-[22px] h-[22px]" strokeWidth={1.75} />
        <Badge className="absolute -top-2.5 -right-2.5 h-[18px] min-w-[18px] px-1 rounded-full bg-[#ff0000] hover:bg-[#ff0000] text-white border-0 text-[11px] font-medium flex items-center justify-center shadow-none">
          {cartItemsCount}
        </Badge>
      </span>
      <span className="hidden min-[1025px]:inline text-[13px] font-semibold">{L('Sepetim', 'My Cart')}</span>
      <span className="sr-only min-[1025px]:hidden">{t('cartAria')}</span>
    </Link>
  )

  return (
    <HeaderWrapper>
      <HeaderTopBar />

      {/* ── Masaüstü: logo + arama + hesap / sepet ─────────────────────────── */}
      <div className="hidden min-[1025px]:block bg-white shadow-[0_1px_0_#e3e8ee]">
        <div className="flex items-center h-[101px] pt-6 px-6 gap-11 min-w-0 max-w-[1514px] mx-auto">
          <Logo size="header" href="/" />
          <div ref={desktopSearchRef} className="relative flex-1 min-w-0 max-w-[910px]">
            {searchForm('search-suggestions-desktop')}
            {renderSearchDropdown(undefined, 'search-suggestions-desktop')}
          </div>
          <div className="ml-auto w-[331px] flex items-center justify-end gap-8 shrink-0">
              {isAuthenticated && user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button type="button" className="flex items-center gap-3 text-[#142b40] hover:text-[#0b2540] text-[13px] font-semibold whitespace-nowrap outline-none">
                      <User className="w-[18px] h-[18px]" strokeWidth={1.75} />
                      <span className="max-w-[120px] truncate">{user.name.split(' ')[0]}</span>
                      <ChevronDown className="w-3.5 h-3.5 text-[#5d6e80]" />
                    </button>
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
                <Link href="/login" className="flex items-center gap-3 text-[#142b40] hover:text-[#0b2540] text-[13px] font-semibold whitespace-nowrap">
                  <User className="w-[18px] h-[18px]" strokeWidth={1.75} />
                  {L('Giriş Yap / Üye Ol', 'Sign In / Register')}
                </Link>
              )}
              {cartLink}
          </div>
        </div>
      </div>

      {/* ── Masaüstü: TÜM KATEGORİLER + kategori linkleri ─────────────────── */}
      <div className="hidden min-[1025px]:block bg-white shadow-[0_6px_16px_rgba(11,37,64,0.04)]">
        <div className="flex items-center h-[65px] px-6 min-w-0 max-w-[1454px] mx-auto">
          <AllCategoriesMenu navGroups={navGroups} t={t} />
          {/* Daralınca önce boşluklar azalır (justify-evenly), sonra sondaki kategoriler gizlenir (6 → 5 → 4);
              gizlenenler "Tüm Kategoriler" menüsünde. ≤1024 px'te mobil/tablet header (hamburger) devreye girer. */}
          <nav className="flex-1 min-w-0 flex items-center justify-evenly gap-0.5 pl-4" aria-label={L('Ana menü', 'Main menu')}>
            <Link href="/products" className={navLinkClass(isAllProducts)}>
              {t('catNavAllProducts')}
            </Link>
            {navRowGroups.map((g, i) => (
              <NavGroupMenu
                key={g.id}
                group={g}
                label={t(g.navLabelKey || g.labelKey)}
                align={i >= navRowGroups.length - 2 ? 'right' : 'left'}
                className={i === 4 ? 'hidden min-[1200px]:block' : i === 5 ? 'hidden min-[1360px]:block' : ''}
                linkClassName={navLinkClass(pathname?.startsWith(g.href))}
                t={t}
              />
            ))}
          </nav>
        </div>
      </div>

      {/* ── Mobil ve tablet (≤1024): tek satır — menü + logo + simgeler. Kategoriler burger menüde, arama simgeyle açılır ── */}
      <div className="min-[1025px]:hidden bg-white border-b border-[#e3e8ee] shadow-[0_6px_16px_rgba(11,37,64,0.04)]">
        <div className="flex items-center h-[78px] min-[901px]:h-[85px] px-4 min-[541px]:px-6 gap-2">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="w-8 min-[901px]:w-[22px] !min-w-0 !min-h-0 h-10 flex items-center justify-start text-[#14141a] touch-manipulation"
            aria-label={t('openMenu')}
          >
            <Menu className="w-6 h-6" strokeWidth={1.75} />
          </button>
          <Logo size="headerSm" href="/" />
          <div className="ml-auto flex items-center gap-1">
            <button
              type="button"
              onClick={() => setMobileSearchBarOpen((o) => !o)}
              className="w-10 max-[359px]:w-8 h-10 flex items-center justify-center text-[#14141a] touch-manipulation"
              aria-label={t('searchPlaceholder')}
              aria-expanded={mobileSearchBarOpen}
              aria-controls="mobile-search-bar"
            >
              <Search className="w-[22px] h-[22px]" strokeWidth={1.75} />
            </button>
            <Link
              href={isAuthenticated ? '/profile' : '/login'}
              className="w-10 max-[359px]:w-8 h-10 flex items-center justify-center text-[#14141a] touch-manipulation"
              aria-label={isAuthenticated ? t('myAccount') : t('login')}
            >
              <User className="w-[22px] h-[22px]" strokeWidth={1.75} />
            </Link>
            <div className="w-10 max-[359px]:w-8 h-10 flex items-center justify-center">{cartLink}</div>
          </div>
        </div>
        {mobileSearchBarOpen && (
          <div id="mobile-search-bar" className="border-t border-[#e3e8ee] px-4 min-[541px]:px-6 py-2.5">
            <div ref={mobileSearchRef} className="relative">
              {searchForm('search-suggestions-mobile', mobileSearchInputRef)}
              {renderSearchDropdown(undefined, 'search-suggestions-mobile')}
            </div>
          </div>
        )}
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
                {...comboboxProps('search-suggestions-mobile')}
                className="w-full pl-10 pr-4 h-11 rounded-xl border-slate-200 bg-white text-sm placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-slate-300 touch-manipulation"
              />
            </form>
            {renderSearchDropdown(() => setMobileMenuOpen(false), 'search-suggestions-mobile')}
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


