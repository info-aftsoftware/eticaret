'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { useAuthStore } from '@/lib/store/useAuthStore'

/** /orders: üye → Hesabım > Siparişlerim, misafir → sipariş takip formu. */
export default function OrdersIndexPage() {
  const router = useRouter()
  const { isAuthenticated, authReady } = useAuthStore()

  useEffect(() => {
    if (!authReady) return
    router.replace(isAuthenticated ? '/profile?tab=orders' : '/siparis-takip')
  }, [authReady, isAuthenticated, router])

  return (
    <div className="flex min-h-[50vh] items-center justify-center gap-3 bg-[#f5f7fa] text-[#20384e]">
      <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
      <span>Siparişlerinize yönlendiriliyorsunuz…</span>
    </div>
  )
}
