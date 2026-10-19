'use client'

/**
 * Üyelik sayfaları (giriş, kayıt, şifre sıfırlama, e-posta doğrulama) için ortak arayüz parçaları.
 * Tasarım dili: lacivert #0b2540, sarı vurgu #f5b400, kenar #d3d9e1 / #e6ebf1, köşe 10–12 px.
 */

import React, { useId, useState } from 'react'
import { Eye, EyeOff, AlertCircle, CheckCircle2, Info, Loader2 } from 'lucide-react'
import { ClassicPageShell } from '@/components/ClassicPageShell'
import { passwordStrength } from '@/lib/auth-errors'
import { useL } from '@/lib/i18n-inline'

/**
 * Sade, kurumsal üyelik kartı: ortada tek kart, başlık + kısa açıklama, ardından form.
 * (Eski tanıtım paneli, ikon rozeti ve dekoratif öğeler kaldırıldı.)
 */
export function AuthLayout({
  breadcrumb,
  title,
  subtitle,
  children,
}: {
  breadcrumb: string
  title: string
  subtitle?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <ClassicPageShell breadcrumbs={[{ label: breadcrumb }]} noTitle pageHasOwnH1>
      <div className="flex justify-center py-2 sm:py-6 min-w-0">
        <div className="w-full max-w-[440px] min-w-0 sm:bg-white sm:border sm:border-[#e3e8ee] sm:rounded-lg sm:p-8">
          <div className="mb-6">
            <h1 className="text-[22px] sm:text-[24px] font-bold tracking-tight text-[#121926]">{title}</h1>
            {subtitle && <p className="mt-1.5 text-[14.5px] leading-relaxed text-[#5d6e80]">{subtitle}</p>}
          </div>
          {children}
        </div>
      </div>
    </ClassicPageShell>
  )
}

export function FormAlert({ tone = 'error', children }: { tone?: 'error' | 'success' | 'info'; children: React.ReactNode }) {
  const styles = {
    error: 'bg-red-50 border-red-200 text-red-800',
    success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    info: 'bg-[#f1f4f8] border-[#d3d9e1] text-[#20384e]',
  }[tone]
  const Icon = tone === 'error' ? AlertCircle : tone === 'success' ? CheckCircle2 : Info
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={`flex gap-2.5 rounded-md border px-3.5 py-3 text-[14px] leading-relaxed ${styles}`}>
      <Icon className="mt-0.5 h-[18px] w-[18px] shrink-0" />
      <div className="min-w-0">{children}</div>
    </div>
  )
}

const inputBase =
  'block w-full min-w-0 h-11 rounded-md border bg-white px-3.5 text-[15px] text-[#121926] placeholder:text-[#9aa7b5] transition-colors focus:outline-none focus:ring-[3px] disabled:bg-[#f5f7fa] disabled:text-[#5d6e80]'

function inputTone(error?: string) {
  return error
    ? 'border-red-400 focus:border-red-500 focus:ring-red-500/15'
    : 'border-[#d3d9e1] hover:border-[#b9c3cf] focus:border-[#0b2540] focus:ring-[#0b2540]/10'
}

type FieldProps = {
  label: string
  error?: string
  hint?: React.ReactNode
  required?: boolean
  labelExtra?: React.ReactNode
}

export function TextField({
  label,
  error,
  hint,
  required,
  labelExtra,
  className = '',
  ...input
}: FieldProps & React.InputHTMLAttributes<HTMLInputElement>) {
  const id = useId()
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={id} className="text-[14px] font-medium text-[#20384e]">
          {label}
          {required && <span className="text-red-500"> *</span>}
        </label>
        {labelExtra}
      </div>
      <div className="relative">
        <input
          id={id}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-err` : hint ? `${id}-hint` : undefined}
          className={`${inputBase} ${inputTone(error)} ${className}`}
          {...input}
        />
      </div>
      {error ? (
        <p id={`${id}-err`} className="text-[13px] text-red-600">{error}</p>
      ) : hint ? (
        <div id={`${id}-hint`} className="text-[13px] text-[#5d6e80]">{hint}</div>
      ) : null}
    </div>
  )
}

export function PasswordField({
  label,
  error,
  hint,
  required,
  labelExtra,
  ...input
}: FieldProps & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'>) {
  const L = useL()
  const id = useId()
  const [show, setShow] = useState(false)
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={id} className="text-[14px] font-medium text-[#20384e]">
          {label}
          {required && <span className="text-red-500"> *</span>}
        </label>
        {labelExtra}
      </div>
      <div className="relative">
        <input
          id={id}
          type={show ? 'text' : 'password'}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-err` : hint ? `${id}-hint` : undefined}
          className={`${inputBase} ${inputTone(error)} pr-12`}
          {...input}
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="absolute right-1 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-lg text-[#5d6e80] hover:text-[#0b2540] hover:bg-[#f1f4f8] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0b2540]/30 touch-manipulation"
          aria-label={show ? L('Şifreyi gizle', 'Hide password') : L('Şifreyi göster', 'Show password')}
          aria-pressed={show}
        >
          {show ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
        </button>
      </div>
      {error ? (
        <p id={`${id}-err`} className="text-[13px] text-red-600">{error}</p>
      ) : hint ? (
        <div id={`${id}-hint`} className="text-[13px] text-[#5d6e80]">{hint}</div>
      ) : null}
    </div>
  )
}

export function PasswordStrength({ password }: { password: string }) {
  const L = useL()
  const { score, label } = passwordStrength(password)
  if (!password) return <span>{L('En az 8 karakter; harf ve rakam kullanmanızı öneririz.', 'At least 8 characters; we recommend using letters and numbers.')}</span>
  const colors = ['bg-red-500', 'bg-red-500', 'bg-amber-500', 'bg-emerald-500', 'bg-emerald-600']
  const text = ['text-red-600', 'text-red-600', 'text-amber-700', 'text-emerald-700', 'text-emerald-700']
  return (
    <span className="block" aria-live="polite">
      <span className="flex gap-1.5" aria-hidden>
        {[1, 2, 3, 4].map((i) => (
          <span key={i} className={`h-1.5 flex-1 rounded-full ${score >= i ? colors[score] : 'bg-[#e6ebf1]'}`} />
        ))}
      </span>
      <span className="mt-1.5 flex flex-wrap justify-between gap-x-3">
        <span className={`font-medium ${text[score]}`}>{L('Şifre gücü:', 'Password strength:')} {L(label, ['Very weak', 'Weak', 'Fair', 'Good', 'Strong'][score])}</span>
        {password.length < 8 && <span>{L('En az 8 karakter önerilir', 'At least 8 characters recommended')}</span>}
      </span>
    </span>
  )
}

export function Checkbox({
  checked,
  onChange,
  children,
  error,
  disabled,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  children: React.ReactNode
  error?: string
  disabled?: boolean
}) {
  const id = useId()
  return (
    <div>
      <div className="flex items-start gap-3">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          aria-invalid={!!error}
          className={`mt-0.5 h-5 w-5 min-h-0 min-w-0 p-0 shrink-0 cursor-pointer rounded border accent-[#0b2540] ${error ? 'border-red-400' : 'border-[#b9c3cf]'}`}
        />
        <label htmlFor={id} className="cursor-pointer text-[14px] leading-relaxed text-[#20384e] [&_button]:min-h-0 [&_button]:min-w-0">
          {children}
        </label>
      </div>
      {error && <p className="mt-1 pl-8 text-[13px] text-red-600">{error}</p>}
    </div>
  )
}

export function PrimaryButton({
  loading,
  loadingText,
  children,
  className = '',
  ...props
}: { loading?: boolean; loadingText?: string } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      className={`flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#0b2540] px-5 text-[15px] font-semibold text-white transition-colors hover:bg-[#12335a] focus:outline-none focus-visible:ring-[3px] focus-visible:ring-[#0b2540]/30 disabled:cursor-not-allowed disabled:opacity-70 touch-manipulation ${className}`}
    >
      {loading ? (
        <>
          <Loader2 className="h-[18px] w-[18px] animate-spin" />
          {loadingText ?? children}
        </>
      ) : (
        children
      )}
    </button>
  )
}

export function SecondaryButton({ className = '', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`flex h-11 w-full items-center justify-center gap-2.5 rounded-md border border-[#d3d9e1] bg-white px-5 text-[15px] font-semibold text-[#121926] transition-colors hover:bg-[#f5f7fa] hover:border-[#b9c3cf] focus:outline-none focus-visible:ring-[3px] focus-visible:ring-[#0b2540]/15 disabled:cursor-not-allowed disabled:opacity-60 touch-manipulation ${className}`}
    />
  )
}

export function Divider({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 text-[13px] text-[#5d6e80]" role="separator">
      <span className="h-px flex-1 bg-[#e6ebf1]" />
      {children}
      <span className="h-px flex-1 bg-[#e6ebf1]" />
    </div>
  )
}

export const linkClass = 'font-semibold text-[#0b2540] underline-offset-2 hover:underline'
