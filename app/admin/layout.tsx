'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Package,
  ShoppingCart,
  Layers,
  ArrowLeft,
  BarChart3,
  Menu,
  X,
  FileText,
  Percent,
  FolderOpen,
  LogOut,
  Users,
  MessageSquare,
  TrendingUp,
  Zap,
  ChevronRight,
  Star,
  MessageCircle,
} from 'lucide-react'
import Image from 'next/image'

type NavItem = { href: string; label: string; icon: any; exact?: boolean }
type NavSection = { title: string; items: NavItem[] }

const navSections: NavSection[] = [
  {
    title: 'Genel',
    items: [
      { href: '/admin', label: 'Dashboard', icon: BarChart3, exact: true },
    ],
  },
  {
    title: 'Satış & Siparişler',
    items: [
      { href: '/admin/orders', label: 'Siparişler', icon: ShoppingCart },
      { href: '/admin/indirimler', label: 'İndirimler & Kuponlar', icon: Percent },
      { href: '/admin/istatistikler', label: 'İstatistikler', icon: TrendingUp },
      { href: '/admin/musteriler', label: 'Müşteriler', icon: Users },
      { href: '/admin/ges-teklifler', label: 'GES Teklif İstekleri', icon: FileText },
      { href: '/admin/iletisim', label: 'İletişim Formları', icon: MessageSquare },
    ],
  },
  {
    title: 'Müşteri',
    items: [
      { href: '/admin/yorumlar', label: 'Yorumlar', icon: Star },
      { href: '/admin/sorular', label: 'Sorular', icon: MessageCircle },
    ],
  },
  {
    title: 'Katalog & Stok',
    items: [
      { href: '/admin/products', label: 'Ürün Yönetimi', icon: Package },
      { href: '/admin/katalog', label: 'Ürün Düzenleme', icon: FolderOpen },
      { href: '/admin/urunler', label: 'Stok Yönetimi', icon: Layers },
    ],
  },
]

function SidebarContent({
  pathname,
  handleLogout,
  onNavClick,
}: {
  pathname: string | null
  handleLogout: () => void
  onNavClick?: () => void
}) {
  return (
    <>
      {/* Logo */}
      <div className="flex items-center px-5 h-16 border-b border-white/8 shrink-0">
        <Image src="/voltekno-logo-transparent.png" alt="Voltekno" width={140} height={40} style={{ height: 'auto' }} className="object-contain brightness-0 invert" priority />
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
        {navSections.map((section) => (
          <div key={section.title}>
            <p className="px-3 mb-1.5 text-[10px] font-semibold text-white/35 uppercase tracking-widest">
              {section.title}
            </p>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon
                const isActive = ('exact' in item && item.exact)
                  ? pathname === item.href
                  : pathname?.startsWith(item.href) && item.href !== '/admin'
                  || (item.href === '/admin' && pathname === '/admin')
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavClick}
                      className={`group flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${isActive
                        ? 'bg-white/10 text-white'
                        : 'text-white/55 hover:bg-white/6 hover:text-white/90'
                        }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-[#f4a11a]' : 'text-white/40 group-hover:text-white/70'}`} />
                      <span className="flex-1 truncate">{item.label}</span>
                      {isActive && <ChevronRight className="w-3 h-3 text-white/30 shrink-0" />}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-white/8 space-y-0.5 shrink-0">
        <Link
          href="/"
          onClick={onNavClick}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-white/45 hover:text-white/80 hover:bg-white/6 transition-all"
        >
          <ArrowLeft className="w-4 h-4 shrink-0" />
          Siteye Dön
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-400/70 hover:text-red-300 hover:bg-red-500/8 transition-all"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Çıkış Yap
        </button>
      </div>
    </>
  )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [firebaseReady, setFirebaseReady] = useState(false)

  React.useEffect(() => {
    if (pathname === '/admin/auth') {
      setFirebaseReady(true)
      return
    }
    const signIn = async () => {
      try {
        const { getAuth } = await import('@/lib/firebase/config')
        const { signInWithCustomToken } = await import('firebase/auth')
        const auth = getAuth()
        if (auth.currentUser?.uid === 'admin-panel-user') { setFirebaseReady(true); return }
        const res = await fetch('/api/admin/firebase-token', { credentials: 'include' })
        if (res.ok) {
          const data = await res.json()
          if (data.firebaseCustomToken) await signInWithCustomToken(auth, data.firebaseCustomToken)
        }
      } catch { }
      setFirebaseReady(true)
    }
    signIn()
  }, [pathname])

  const handleLogout = async () => {
    try { await fetch('/api/admin/logout', { method: 'POST', credentials: 'include' }) } catch { }
    try {
      const { getAuth } = await import('@/lib/firebase/config')
      const { signOut } = await import('firebase/auth')
      await signOut(getAuth())
    } catch { }
    router.push('/admin/auth')
  }

  if (pathname === '/admin/auth') return <>{children}</>

  if (!firebaseReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div className="w-5 h-5 border-2 border-brand border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  // Aktif sayfa başlığı
  const allItems = navSections.flatMap((s) => s.items)
  const activeItem = allItems.find((item) =>
    item.exact ? pathname === item.href : pathname?.startsWith(item.href)
  )

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-60 lg:fixed lg:inset-y-0 bg-slate-900 shadow-xl z-10">
        <SidebarContent pathname={pathname} handleLogout={handleLogout} />
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-20 h-14 bg-slate-900 flex items-center justify-between px-4">
        <button
          onClick={() => setSidebarOpen(true)}
          className="w-9 h-9 flex items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Menüyü aç"
        >
          <Menu className="w-5 h-5" />
        </button>
        <Image src="/voltekno-logo-transparent.png" alt="Voltekno" width={110} height={32} style={{ height: 'auto' }} className="object-contain brightness-0 invert" />
        <div className="w-9" />
      </div>

      {/* Mobile Sidebar overlay */}
      {sidebarOpen && (
        <>
          <div className="fixed inset-0 z-30 bg-black/60 lg:hidden" onClick={() => setSidebarOpen(false)} aria-hidden />
          <aside className="fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 shadow-2xl lg:hidden flex flex-col">
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-lg text-white/50 hover:text-white hover:bg-white/10"
              aria-label="Kapat"
            >
              <X className="w-4 h-4" />
            </button>
            <SidebarContent pathname={pathname} handleLogout={handleLogout} onNavClick={() => setSidebarOpen(false)} />
          </aside>
        </>
      )}

      {/* Main */}
      <main className="flex-1 lg:pl-60 min-h-screen flex flex-col">
        {/* Top bar */}
        <div className="hidden lg:flex items-center gap-2 h-14 px-8 bg-white border-b border-slate-100 shrink-0">
          <p className="text-sm font-semibold text-slate-700">{activeItem?.label ?? 'Admin Panel'}</p>
        </div>

        {/* Page content */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8 pt-[72px] lg:pt-6">
          {children}
        </div>
      </main>
    </div>
  )
}
