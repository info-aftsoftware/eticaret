'use client'

/**
 * Yönetim paneli için ortak, sade arayüz parçaları (voltekno tasarım dili:
 * lacivert #0b2540, sarı vurgu #f5b400, kenar #e6ebf1, açık zemin #f5f7fa).
 */

import React from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Loader2, Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'

type BtnVariant = 'primary' | 'accent' | 'outline' | 'ghost' | 'danger' | 'success' | 'subtle'
type BtnSize = 'xs' | 'sm' | 'md'

const BTN_VARIANTS: Record<BtnVariant, string> = {
  primary: 'bg-[#0b2540] text-white hover:bg-[#12335a] border border-[#0b2540]',
  accent: 'bg-[#f5b400] text-[#111] hover:bg-[#e0a500] border border-[#f5b400]',
  outline: 'bg-white text-[#20384e] border border-[#d3d9e1] hover:bg-[#f5f7fa] hover:border-[#b9c3cf]',
  ghost: 'bg-transparent text-[#20384e] border border-transparent hover:bg-[#f1f4f8]',
  danger: 'bg-white text-red-700 border border-red-200 hover:bg-red-50',
  success: 'bg-emerald-600 text-white border border-emerald-600 hover:bg-emerald-700',
  subtle: 'bg-[#f1f4f8] text-[#20384e] border border-transparent hover:bg-[#e6ebf1]',
}
const BTN_SIZES: Record<BtnSize, string> = {
  xs: 'h-7 px-2.5 text-xs gap-1 rounded-md [&_svg]:size-3.5',
  sm: 'h-8 px-3 text-[13px] gap-1.5 rounded-md [&_svg]:size-4',
  md: 'h-10 px-4 text-sm gap-2 rounded-lg [&_svg]:size-4',
}

export function btnClass(variant: BtnVariant = 'outline', size: BtnSize = 'sm', className?: string) {
  return cn(
    'inline-flex items-center justify-center font-medium whitespace-nowrap transition-colors select-none',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f5b400]/60 focus-visible:ring-offset-1',
    'disabled:opacity-50 disabled:pointer-events-none [&_svg]:shrink-0',
    BTN_VARIANTS[variant],
    BTN_SIZES[size],
    className
  )
}

export const Btn = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; size?: BtnSize; loading?: boolean }
>(function Btn({ variant = 'outline', size = 'sm', loading, className, children, disabled, type, ...props }, ref) {
  return (
    <button ref={ref} type={type ?? 'button'} className={btnClass(variant, size, className)} disabled={disabled || loading} {...props}>
      {loading && <Loader2 className="animate-spin" />}
      {children}
    </button>
  )
})

export function BtnLink({
  href,
  variant = 'outline',
  size = 'sm',
  className,
  children,
  ...props
}: { href: string; variant?: BtnVariant; size?: BtnSize; className?: string; children: React.ReactNode } & Omit<
  React.AnchorHTMLAttributes<HTMLAnchorElement>,
  'href'
>) {
  return (
    <Link href={href} className={btnClass(variant, size, className)} {...props}>
      {children}
    </Link>
  )
}

export function Panel({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('bg-white border border-[#e6ebf1] rounded-xl shadow-[0_1px_2px_rgba(11,37,64,0.04)]', className)} {...props}>
      {children}
    </div>
  )
}

export function PanelHeader({
  title,
  description,
  icon: Icon,
  actions,
  className,
}: {
  title: React.ReactNode
  description?: React.ReactNode
  icon?: React.ComponentType<{ className?: string }>
  actions?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-wrap items-center justify-between gap-3 px-4 sm:px-5 py-3.5 border-b border-[#e6ebf1]', className)}>
      <div className="min-w-0 flex items-center gap-2.5">
        {Icon && (
          <span className="w-8 h-8 rounded-lg bg-[#f1f4f8] text-[#0b2540] flex items-center justify-center shrink-0">
            <Icon className="w-4 h-4" />
          </span>
        )}
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold text-[#121926] leading-tight">{title}</h2>
          {description && <p className="text-xs text-[#5d6e80] mt-0.5">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

export function PageHeader({
  title,
  description,
  actions,
  back,
}: {
  title: React.ReactNode
  description?: React.ReactNode
  actions?: React.ReactNode
  back?: { href: string; label: string }
}) {
  return (
    <div className="space-y-2">
      {back && (
        <Link href={back.href} className="inline-flex items-center gap-1 text-[13px] text-[#5d6e80] hover:text-[#0b2540]">
          <ChevronLeft className="w-4 h-4" />
          {back.label}
        </Link>
      )}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-[#121926] tracking-tight">{title}</h1>
          {description && <p className="text-sm text-[#5d6e80] mt-1">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
      </div>
    </div>
  )
}

const PILL_TONES = {
  slate: 'bg-[#f1f4f8] text-[#20384e] ring-[#e6ebf1]',
  navy: 'bg-[#e8eef6] text-[#0b2540] ring-[#d3deec]',
  amber: 'bg-amber-50 text-amber-800 ring-amber-200',
  yellow: 'bg-[#fff6d6] text-[#7a5a00] ring-[#f5dc85]',
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  red: 'bg-red-50 text-red-700 ring-red-200',
  blue: 'bg-sky-50 text-sky-700 ring-sky-200',
  violet: 'bg-violet-50 text-violet-700 ring-violet-200',
  orange: 'bg-orange-50 text-orange-700 ring-orange-200',
} as const
export type PillTone = keyof typeof PILL_TONES

export function Pill({ tone = 'slate', dot, className, children }: { tone?: PillTone; dot?: boolean; className?: string; children: React.ReactNode }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset whitespace-nowrap', PILL_TONES[tone], className)}>
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />}
      {children}
    </span>
  )
}

export function CountBadge({ value, tone = 'yellow', className }: { value: number; tone?: 'yellow' | 'red' | 'navy'; className?: string }) {
  if (!value) return null
  const tones = { yellow: 'bg-[#f5b400] text-[#111]', red: 'bg-red-500 text-white', navy: 'bg-[#0b2540] text-white' }
  return (
    <span className={cn('min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-bold inline-flex items-center justify-center tabular-nums', tones[tone], className)}>
      {value > 99 ? '99+' : value}
    </span>
  )
}

export const inputClass =
  'h-9 w-full rounded-lg border border-[#d3d9e1] bg-white px-3 text-sm text-[#121926] placeholder:text-[#9aa8b6] ' +
  'focus:outline-none focus:border-[#0b2540] focus:ring-2 focus:ring-[#0b2540]/10 disabled:bg-[#f5f7fa] disabled:text-[#5d6e80]'

export const TextInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(function TextInput(
  { className, ...props },
  ref
) {
  return <input ref={ref} className={cn(inputClass, className)} {...props} />
})

export const TextArea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(function TextArea(
  { className, ...props },
  ref
) {
  return <textarea ref={ref} className={cn(inputClass, 'h-auto py-2 leading-relaxed', className)} {...props} />
})

export function SelectInput({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(inputClass, 'pr-8 cursor-pointer', className)} {...props}>
      {children}
    </select>
  )
}

export function Field({ label, hint, htmlFor, children, className }: { label: React.ReactNode; hint?: React.ReactNode; htmlFor?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={htmlFor} className="block text-[13px] font-medium text-[#20384e]">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-[#5d6e80]">{hint}</p>}
    </div>
  )
}

export function SearchInput({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  className?: string
}) {
  return (
    <div className={cn('relative', className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9aa8b6] pointer-events-none" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder ?? 'Ara'}
        className={cn(inputClass, 'pl-9 pr-8 [&::-webkit-search-cancel-button]:hidden')}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded flex items-center justify-center text-[#9aa8b6] hover:text-[#20384e]"
          aria-label="Aramayı temizle"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  )
}

/** Boş durum: yalnızca metin (süs ikonu rozeti kullanılmaz; `icon` geriye dönük uyumluluk için yok sayılır) */
export function EmptyState({
  title,
  description,
  action,
}: {
  icon?: React.ComponentType<{ className?: string }>
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-14 px-6">
      <p className="text-sm font-semibold text-[#121926]">{title}</p>
      {description && <p className="text-[13px] text-[#5d6e80] mt-1 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function Spinner({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center justify-center py-16', className)}>
      <Loader2 className="w-7 h-7 animate-spin text-[#9aa8b6]" />
    </div>
  )
}

export function Pagination({
  page,
  pageSize,
  total,
  onPage,
}: {
  page: number
  pageSize: number
  total: number
  onPage: (p: number) => void
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize))
  if (total === 0) return null
  const from = (page - 1) * pageSize + 1
  const to = Math.min(total, page * pageSize)
  const nums: (number | '…')[] = []
  for (let i = 1; i <= pages; i++) {
    if (i === 1 || i === pages || Math.abs(i - page) <= 1) nums.push(i)
    else if (nums[nums.length - 1] !== '…') nums.push('…')
  }
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-5 py-3 border-t border-[#e6ebf1] text-[13px] text-[#5d6e80]">
      <span>
        <span className="font-medium text-[#20384e] tabular-nums">{from}–{to}</span> / {total}
      </span>
      <div className="flex items-center gap-1">
        <Btn size="xs" variant="ghost" disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Önceki sayfa">
          <ChevronLeft />
        </Btn>
        {nums.map((n, i) =>
          n === '…' ? (
            <span key={`e${i}`} className="px-1">…</span>
          ) : (
            <button
              key={n}
              type="button"
              onClick={() => onPage(n)}
              className={cn(
                'min-w-[28px] h-7 px-1.5 rounded-md text-xs font-medium tabular-nums',
                n === page ? 'bg-[#0b2540] text-white' : 'text-[#20384e] hover:bg-[#f1f4f8]'
              )}
              aria-current={n === page ? 'page' : undefined}
            >
              {n}
            </button>
          )
        )}
        <Btn size="xs" variant="ghost" disabled={page >= pages} onClick={() => onPage(page + 1)} aria-label="Sonraki sayfa">
          <ChevronRight />
        </Btn>
      </div>
    </div>
  )
}

/** Sekme şeridi (durum sekmeleri vb.) — yatay kaydırılabilir */
export function TabStrip<T extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: { value: T; label: string; count?: number; tone?: 'yellow' | 'red' | 'navy' }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="flex gap-1 overflow-x-auto -mb-px scrollbar-hide" role="tablist">
      {tabs.map((t) => {
        const active = t.value === value
        return (
          <button
            key={t.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t.value)}
            className={cn(
              'shrink-0 inline-flex items-center gap-1.5 px-3 h-10 text-[13px] font-medium border-b-2 transition-colors',
              active ? 'border-[#f5b400] text-[#0b2540]' : 'border-transparent text-[#5d6e80] hover:text-[#20384e]'
            )}
          >
            {t.label}
            {typeof t.count === 'number' && (
              <span
                className={cn(
                  'min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-semibold inline-flex items-center justify-center tabular-nums',
                  active ? 'bg-[#0b2540] text-white' : t.tone === 'yellow' && t.count > 0 ? 'bg-[#fff1c2] text-[#7a5a00]' : 'bg-[#f1f4f8] text-[#5d6e80]'
                )}
              >
                {t.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

/** Basit, erişilebilir modal (Radix gerektirmez) */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
}: {
  open: boolean
  onClose: () => void
  title: React.ReactNode
  description?: React.ReactNode
  children: React.ReactNode
  footer?: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
}) {
  React.useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])
  if (!open) return null
  const widths = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-2xl' }
  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-[#0b2540]/50 backdrop-blur-[1px]" onClick={onClose} aria-hidden />
      <div className={cn('relative w-full bg-white rounded-t-2xl sm:rounded-xl shadow-2xl max-h-[92vh] flex flex-col', widths[size])}>
        <div className="flex items-start justify-between gap-3 px-5 pt-4 pb-3 border-b border-[#e6ebf1]">
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-[#121926]">{title}</h3>
            {description && <p className="text-[13px] text-[#5d6e80] mt-0.5">{description}</p>}
          </div>
          <button type="button" onClick={onClose} className="w-8 h-8 -mr-1 rounded-lg flex items-center justify-center text-[#5d6e80] hover:bg-[#f1f4f8]" aria-label="Kapat">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-5 py-4 overflow-y-auto">{children}</div>
        {footer && <div className="px-5 py-3 border-t border-[#e6ebf1] flex flex-wrap justify-end gap-2 bg-[#f9fafc] rounded-b-xl">{footer}</div>}
      </div>
    </div>
  )
}

export function Checkbox({ checked, onChange, label, className }: { checked: boolean; onChange: (v: boolean) => void; label?: React.ReactNode; className?: string }) {
  return (
    <label className={cn('inline-flex items-center gap-2 text-[13px] text-[#20384e] cursor-pointer select-none', className)}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="w-4 h-4 rounded border-[#b9c3cf] accent-[#0b2540]" />
      {label}
    </label>
  )
}

export const fmtDateTime = (s?: string | null) =>
  s ? new Date(s).toLocaleString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'

export const fmtDate = (s?: string | null) =>
  s ? new Date(s).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

/** "3 dk önce" gibi göreli zaman */
export function timeAgo(s?: string | null): string {
  if (!s) return '—'
  const diff = Date.now() - new Date(s).getTime()
  const min = Math.round(diff / 60000)
  if (min < 1) return 'az önce'
  if (min < 60) return `${min} dk önce`
  const h = Math.round(min / 60)
  if (h < 24) return `${h} sa önce`
  const d = Math.round(h / 24)
  if (d < 7) return `${d} gün önce`
  return fmtDate(s)
}
