'use client'

import React, { createContext, useCallback, useContext, useRef, useState } from 'react'
import Link from 'next/link'
import { CheckCircle2, AlertCircle, Bell, X } from 'lucide-react'
import { cn } from '@/lib/utils'

type ToastKind = 'success' | 'error' | 'info'
type ToastItem = { id: number; kind: ToastKind; title: string; text?: string; href?: string }
type ToastApi = {
  success: (title: string, text?: string) => void
  error: (title: string, text?: string) => void
  info: (title: string, text?: string, href?: string) => void
}

const ToastContext = createContext<ToastApi | null>(null)

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext)
  // Sağlayıcı yoksa (ör. auth sayfası) sessizce yok say
  return ctx ?? { success: () => {}, error: () => {}, info: () => {} }
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const seq = useRef(0)

  const dismiss = useCallback((id: number) => setItems((prev) => prev.filter((t) => t.id !== id)), [])

  const push = useCallback(
    (kind: ToastKind, title: string, text?: string, href?: string) => {
      const id = ++seq.current
      setItems((prev) => [...prev.slice(-3), { id, kind, title, text, href }])
      setTimeout(() => dismiss(id), kind === 'error' ? 7000 : kind === 'info' ? 9000 : 4000)
    },
    [dismiss]
  )

  const api = React.useMemo<ToastApi>(
    () => ({
      success: (title, text) => push('success', title, text),
      error: (title, text) => push('error', title, text),
      info: (title, text, href) => push('info', title, text, href),
    }),
    [push]
  )

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="fixed z-[70] bottom-4 right-4 left-4 sm:left-auto sm:w-[360px] flex flex-col gap-2 pointer-events-none" aria-live="polite">
        {items.map((t) => {
          const Icon = t.kind === 'success' ? CheckCircle2 : t.kind === 'error' ? AlertCircle : Bell
          const body = (
            <>
              <Icon
                className={cn(
                  'w-5 h-5 shrink-0 mt-0.5',
                  t.kind === 'success' ? 'text-emerald-600' : t.kind === 'error' ? 'text-red-600' : 'text-[#e0a500]'
                )}
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[#121926]">{t.title}</p>
                {t.text && <p className="text-[13px] text-[#5d6e80] mt-0.5 break-words">{t.text}</p>}
              </div>
            </>
          )
          return (
            <div
              key={t.id}
              role={t.kind === 'error' ? 'alert' : 'status'}
              className={cn(
                'pointer-events-auto flex items-start gap-3 rounded-xl bg-white border shadow-lg px-4 py-3 animate-in slide-in-from-bottom-2 fade-in',
                t.kind === 'error' ? 'border-red-200' : t.kind === 'info' ? 'border-[#f5dc85]' : 'border-[#e6ebf1]'
              )}
            >
              {t.href ? (
                <Link href={t.href} onClick={() => dismiss(t.id)} className="flex items-start gap-3 flex-1 min-w-0">
                  {body}
                </Link>
              ) : (
                body
              )}
              <button type="button" onClick={() => dismiss(t.id)} className="w-6 h-6 -mr-1 rounded flex items-center justify-center text-[#9aa8b6] hover:text-[#20384e]" aria-label="Bildirimi kapat">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}
