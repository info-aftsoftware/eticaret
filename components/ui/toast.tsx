'use client'

import * as React from 'react'
import Link from '@/lib/i18n/navigation'
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useL } from '@/lib/i18n-inline'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface Toast {
  id: string
  type: ToastType
  title: string
  description?: string
  duration?: number
  /** snackbar: sol altta sade koyu bildirim (ör. favoriye ekleme); aynı anda tek snackbar gösterilir */
  variant?: 'default' | 'snackbar'
  /** Bildirimdeki bağlantı (ör. "Favorilere git") */
  action?: { label: string; href: string }
}

interface ToastContextType {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([])

  const addToast = React.useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(7)
    const newToast: Toast = {
      ...toast,
      id,
      // Düğmeli bildirim (ör. "Sepete git") tıklanabilsin diye biraz daha uzun kalır
      duration: toast.duration ?? (toast.action ? 5000 : 3000),
    }
    
    // Snackbar yenisiyle değişir (art arda tıklamada yığılmaz)
    setToasts((prev) => [...(newToast.variant === 'snackbar' ? prev.filter((t) => t.variant !== 'snackbar') : prev), newToast])

    // Auto remove after duration
    if ((newToast.duration ?? 0) > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, newToast.duration)
    }
  }, [])

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = React.useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}

function ToastContainer({ toasts, removeToast }: { toasts: Toast[]; removeToast: (id: string) => void }) {
  const snack = toasts.filter((t) => t.variant === 'snackbar')
  return (
    <>
      <div className="fixed top-20 right-4 z-[100] flex flex-col gap-2 w-full max-w-sm pointer-events-none">
        {toasts.filter((t) => t.variant !== 'snackbar').map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </div>
      <div className="fixed bottom-4 left-4 right-4 sm:right-auto z-[110] flex flex-col gap-2 sm:w-[360px] pointer-events-none" aria-live="polite">
        {snack.map((toast) => (
          <SnackbarItem key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </div>
    </>
  )
}

function SnackbarItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const L = useL()
  const [isVisible, setIsVisible] = React.useState(false)
  React.useEffect(() => {
    const t = setTimeout(() => setIsVisible(true), 10)
    return () => clearTimeout(t)
  }, [])
  return (
    <div
      role="status"
      className={cn(
        'pointer-events-auto flex items-center gap-3 rounded-lg bg-white text-[#121926] border border-[#d3d9e1] pl-4 pr-2 py-3 shadow-[0_10px_30px_rgba(11,37,64,0.15)] transition-all duration-200',
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
      )}
    >
      <span className="flex-1 min-w-0 text-[13.5px] font-medium truncate">{toast.title}</span>
      {toast.action && (
        <Link
          href={toast.action.href}
          onClick={() => onRemove(toast.id)}
          className="shrink-0 inline-flex items-center gap-1 rounded-md px-2 py-1 text-[13px] font-semibold text-[#0b2540] hover:bg-[#f1f4f8]"
        >
          {toast.action.label} <ArrowRight className="w-3.5 h-3.5" aria-hidden />
        </Link>
      )}
      <button
        type="button"
        onClick={() => onRemove(toast.id)}
        className="shrink-0 !min-h-0 !min-w-0 p-1.5 rounded-md text-[#5d6e80] hover:text-[#121926] hover:bg-[#f1f4f8]"
        aria-label={L('Kapat', 'Close')}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const L = useL()
  const [isVisible, setIsVisible] = React.useState(false)

  React.useEffect(() => {
    // Trigger animation
    setTimeout(() => setIsVisible(true), 10)
  }, [])

  const icons = {
    success: CheckCircle2,
    error: AlertCircle,
    info: Info,
    warning: AlertTriangle,
  }

  const styles = {
    success: 'bg-green-50 border-green-200 text-green-900',
    error: 'bg-red-50 border-red-200 text-red-900',
    info: 'bg-blue-50 border-blue-200 text-blue-900',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-900',
  }

  const Icon = icons[toast.type]

  return (
    <div
      className={cn(
        'pointer-events-auto relative flex items-start gap-3 rounded-lg border p-4 shadow-lg transition-all duration-300',
        styles[toast.type],
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      )}
    >
      <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm">{toast.title}</div>
        {toast.description && (
          <div className="text-xs mt-1 opacity-90">{toast.description}</div>
        )}
        {toast.action && (
          <Link
            href={toast.action.href}
            onClick={() => onRemove(toast.id)}
            className="mt-2.5 inline-flex h-8 items-center gap-1.5 rounded-md bg-[#0b2540] px-3 text-[13px] font-semibold text-white hover:bg-[#12335a] transition-colors"
          >
            {toast.action.label} <ArrowRight className="w-3.5 h-3.5" aria-hidden />
          </Link>
        )}
      </div>
      <button
        onClick={() => onRemove(toast.id)}
        className="flex-shrink-0 p-1 rounded-md hover:bg-black/10 transition-colors"
        aria-label={L('Kapat', 'Close')}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

