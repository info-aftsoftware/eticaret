'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import {
  Package,
  ShoppingCart,
  ArrowLeft,
  LayoutDashboard,
  Menu,
  X,
  FileText,
  Percent,
  LogOut,
  Users,
  MessageSquare,
  TrendingUp,
  Star,
  MessageCircle,
  Bell,
  BellOff,
  ExternalLink,
  UserCog,
  ScrollText,
  Activity,
  CircleUser,
} from 'lucide-react'
import { ToastProvider } from '@/components/admin/toast'
import { AdminLiveProvider, useAdminLive, type LiveCounts } from '@/components/admin/AdminLiveProvider'
import { CountBadge } from '@/components/admin/ui'
import { cn } from '@/lib/utils'
import { AdminMeContext, useAdminMe, type AdminMe } from '@/components/admin/AdminMeContext'

type NavItem = {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  exact?: boolean
  badge?: (c: LiveCounts) => number
}
type NavSection = { title: string; items: NavItem[] }

const navSections: NavSection[] = [
  {
    title: 'Genel',
    items: [{ href: '/admin', label: 'Genel Bakış', icon: LayoutDashboard, exact: true }],
  },
  {
    title: 'Satış',
    items: [
      { href: '/admin/orders', label: 'Siparişler', icon: ShoppingCart, badge: (c) => c.ordersAction },
      { href: '/admin/musteriler', label: 'Müşteriler', icon: Users },
      { href: '/admin/indirimler', label: 'İndirimler & Kuponlar', icon: Percent },
      { href: '/admin/istatistikler', label: 'İstatistikler', icon: TrendingUp },
    ],
  },
  {
    title: 'Katalog',
    items: [{ href: '/admin/products', label: 'Ürünler & Stok', icon: Package }],
  },
  {
    title: 'Müşteri İletişimi',
    items: [
      { href: '/admin/yorumlar', label: 'Yorumlar', icon: Star, badge: (c) => c.pendingReviews },
      { href: '/admin/sorular', label: 'Sorular', icon: MessageCircle, badge: (c) => c.pendingQuestions },
      { href: '/admin/iletisim', label: 'İletişim Formları', icon: MessageSquare },
      { href: '/admin/ges-teklifler', label: 'GES Teklif İstekleri', icon: FileText },
    ],
  },
  {
    title: 'Yönetim',
    items: [
      { href: '/admin/kullanicilar', label: 'Kullanıcılar', icon: UserCog },
      { href: '/admin/islem-kaydi', label: 'İşlem Kaydı', icon: ScrollText },
      { href: '/admin/sistem', label: 'Sistem Durumu', icon: Activity },
    ],
  },
]

const allItems = [...navSections.flatMap((s) => s.items), { href: '/admin/hesabim', label: 'Hesabım', icon: CircleUser } as NavItem]
const isActive = (item: NavItem, pathname: string | null) =>
  item.exact ? pathname === item.href : !!pathname && (pathname === item.href || pathname.startsWith(item.href + '/'))

function SidebarContent({ pathname, onLogout, onNavClick }: { pathname: string | null; onLogout: () => void; onNavClick?: () => void }) {
  const { counts } = useAdminLive()
  const me = useAdminMe()
  const sections = navSections
    .map((s) => ({ ...s, items: s.items.filter((i) => !me || me.pages.includes(i.href)) }))
    .filter((s) => s.items.length > 0)
  return (
    <>
      <div className="flex items-center px-5 h-16 border-b border-white/10 shrink-0">
        <Link href="/admin" onClick={onNavClick} className="flex items-center gap-2">
          <Image src="/voltekno-logo-transparent.png" alt="Voltekno" width={132} height={38} style={{ height: 'auto' }} className="object-contain brightness-0 invert" priority />
        </Link>
        <span className="ml-auto text-[10px] font-semibold uppercase tracking-wider text-[#f5b400] bg-[#f5b400]/10 rounded px-1.5 py-0.5">Panel</span>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5" aria-label="Yönetim menüsü">
        {sections.map((section) => (
          <div key={section.title}>
            <p className="px-3 mb-1.5 text-[10px] font-semibold text-white/40 uppercase tracking-widest">{section.title}</p>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon
                const active = isActive(item, pathname)
                const badge = counts && item.badge ? item.badge(counts) : 0
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavClick}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'group relative flex items-center gap-3 px-3 h-9 rounded-lg text-[13px] font-medium transition-colors',
                        active ? 'bg-white/10 text-white' : 'text-white/65 hover:bg-white/5 hover:text-white'
                      )}
                    >
                      {active && <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r bg-[#f5b400]" />}
                      <Icon className={cn('w-4 h-4 shrink-0', active ? 'text-[#f5b400]' : 'text-white/45 group-hover:text-white/80')} />
                      <span className="flex-1 truncate">{item.label}</span>
                      <CountBadge value={badge} />
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="p-3 border-t border-white/10 space-y-0.5 shrink-0">
        {me && (
          <Link
            href="/admin/hesabim"
            onClick={onNavClick}
            aria-current={pathname === '/admin/hesabim' ? 'page' : undefined}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-white/80 hover:text-white hover:bg-white/5"
          >
            <CircleUser className="w-4 h-4 shrink-0 text-white/50" />
            <span className="min-w-0">
              <span className="block truncate text-[13px] font-medium">{me.user.name}</span>
              <span className="block truncate text-[11px] text-white/45">{me.user.roleLabel}{!me.user.isMaster && !me.user.totpEnabled ? ' · 2FA kapalı' : ''}</span>
            </span>
          </Link>
        )}
        <Link href="/" onClick={onNavClick} className="flex items-center gap-3 px-3 h-9 rounded-lg text-[13px] font-medium text-white/60 hover:text-white hover:bg-white/5">
          <ArrowLeft className="w-4 h-4 shrink-0" />
          Siteye Dön
        </Link>
        <button type="button" onClick={onLogout} className="w-full flex items-center gap-3 px-3 h-9 rounded-lg text-[13px] font-medium text-red-300/80 hover:text-red-200 hover:bg-red-500/10">
          <LogOut className="w-4 h-4 shrink-0" />
          Çıkış Yap
        </button>
      </div>
    </>
  )
}

function SoundToggle({ dark = false }: { dark?: boolean }) {
  const { soundOn, setSoundOn } = useAdminLive()
  return (
    <button
      type="button"
      onClick={() => setSoundOn(!soundOn)}
      className={cn(
        'h-9 px-2.5 rounded-lg inline-flex items-center gap-1.5 text-[13px] font-medium transition-colors',
        dark ? 'text-white/70 hover:text-white hover:bg-white/10' : 'text-[#20384e] hover:bg-[#f1f4f8]'
      )}
      aria-pressed={soundOn}
      title={soundOn ? 'Yeni sipariş sesi açık' : 'Yeni sipariş sesi kapalı'}
    >
      {soundOn ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4 opacity-70" />}
      <span className={dark ? 'sr-only' : 'hidden xl:inline'}>{soundOn ? 'Ses açık' : 'Ses kapalı'}</span>
    </button>
  )
}

function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { counts } = useAdminLive()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST', credentials: 'include' })
    } catch {}
    try {
      const { getAuth } = await import('@/lib/firebase/config')
      const { signOut } = await import('firebase/auth')
      await signOut(getAuth())
    } catch {}
    router.push('/admin/auth')
  }

  const activeItem = allItems.find((item) => isActive(item, pathname))
  const totalBadge = counts ? counts.ordersAction + counts.pendingReviews + counts.pendingQuestions : 0

  return (
    <div className="min-h-screen bg-[#f5f7fa] flex">
      <aside className="hidden lg:flex lg:flex-col lg:w-60 lg:fixed lg:inset-y-0 bg-[#0b2540] z-30">
        <SidebarContent pathname={pathname} onLogout={handleLogout} />
      </aside>

      {/* Mobil/tablet üst çubuk */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 h-14 bg-[#0b2540] flex items-center justify-between px-3">
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="relative w-10 h-10 flex items-center justify-center rounded-lg text-white/80 hover:text-white hover:bg-white/10"
          aria-label="Menüyü aç"
        >
          <Menu className="w-5 h-5" />
          {totalBadge > 0 && <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#f5b400]" />}
        </button>
        <Link href="/admin" className="flex items-center">
          <Image src="/voltekno-logo-transparent.png" alt="Voltekno" width={110} height={32} style={{ height: 'auto' }} className="object-contain brightness-0 invert" />
        </Link>
        <SoundToggle dark />
      </div>

      {sidebarOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-[#0b2540]/60 lg:hidden" onClick={() => setSidebarOpen(false)} aria-hidden />
          <aside className="fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-[#0b2540] shadow-2xl lg:hidden flex flex-col">
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-3 w-8 h-8 flex items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/10 z-10"
              aria-label="Menüyü kapat"
            >
              <X className="w-4 h-4" />
            </button>
            <SidebarContent pathname={pathname} onLogout={handleLogout} onNavClick={() => setSidebarOpen(false)} />
          </aside>
        </>
      )}

      <main className="flex-1 min-w-0 lg:pl-60 min-h-screen flex flex-col">
        <div className="hidden lg:flex items-center gap-3 h-14 px-8 bg-white border-b border-[#e6ebf1] shrink-0 sticky top-0 z-20">
          <p className="text-sm font-semibold text-[#121926]">{activeItem?.label ?? 'Yönetim Paneli'}</p>
          <div className="ml-auto flex items-center gap-1">
            {counts && (counts.awaitingPayment > 0 || counts.toPrepare > 0) && (
              <Link href="/admin/orders" className="hidden xl:inline-flex items-center gap-2 h-8 px-3 rounded-full bg-[#fff6d6] text-[#7a5a00] text-xs font-medium hover:bg-[#ffefb3] mr-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#e0a500] animate-pulse" />
                {counts.toPrepare > 0 && `${counts.toPrepare} sipariş hazırlanmayı bekliyor`}
                {counts.toPrepare > 0 && counts.awaitingPayment > 0 && ' · '}
                {counts.awaitingPayment > 0 && `${counts.awaitingPayment} havale bekleniyor`}
              </Link>
            )}
            <SoundToggle />
            <Link href="/" target="_blank" className="h-9 px-2.5 rounded-lg inline-flex items-center gap-1.5 text-[13px] font-medium text-[#20384e] hover:bg-[#f1f4f8]">
              <ExternalLink className="w-4 h-4" />
              <span className="hidden xl:inline">Siteyi Gör</span>
            </Link>
          </div>
        </div>

        <div className="flex-1 w-full max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8 pt-[72px] sm:pt-[80px] lg:pt-6">{children}</div>
      </main>
    </div>
  )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [me, setMe] = useState<AdminMe | null>(null)

  // Oturumdaki yönetici; şifresini değiştirmesi gereken kullanıcı yalnızca Hesabım sayfasını kullanabilir
  React.useEffect(() => {
    if (pathname === '/admin/auth') return
    let cancelled = false
    fetch('/api/admin/me', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelled || !d?.success) return
        setMe({ user: d.user, pages: d.pages })
        if (d.user.mustChangePassword && pathname !== '/admin/hesabim') router.replace('/admin/hesabim')
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [pathname, router])

  if (pathname === '/admin/auth') return <React.Suspense fallback={null}>{children}</React.Suspense>

  return (
    <ToastProvider>
      <AdminMeContext.Provider value={me}>
        <AdminLiveProvider>
          <AdminShell>
            {/* Sayfalar useSearchParams kullanır: derlemede istemci tarafına bırakılır */}
            <React.Suspense fallback={<div className="py-16 text-center text-sm text-[#5d6e80]">Yükleniyor…</div>}>{children}</React.Suspense>
          </AdminShell>
        </AdminLiveProvider>
      </AdminMeContext.Provider>
    </ToastProvider>
  )
}
