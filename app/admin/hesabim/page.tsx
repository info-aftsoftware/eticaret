'use client'

import React, { useState } from 'react'
import { PageHeader, Panel, PanelHeader, Btn, Field, TextInput, Pill } from '@/components/admin/ui'
import { useToast } from '@/components/admin/toast'
import { useAdminMe } from '@/components/admin/AdminMeContext'

async function call(url: string, method: string, body?: unknown) {
  const res = await fetch(url, {
    method,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok || !data.success) throw new Error(data.error || 'İşlem başarısız.')
  return data
}

/** Kendi hesabı: şifre değiştirme ve iki adımlı doğrulama (QR ile) */
export default function AdminAccountPage() {
  const me = useAdminMe()
  const toast = useToast()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [repeat, setRepeat] = useState('')
  const [saving, setSaving] = useState(false)
  const [setup, setSetup] = useState<{ qr: string; secret: string } | null>(null)
  const [code, setCode] = useState('')
  const [twoFaPassword, setTwoFaPassword] = useState('')
  const [twoFaBusy, setTwoFaBusy] = useState(false)
  const [totpOn, setTotpOn] = useState<boolean | null>(null)
  const totpEnabled = totpOn ?? me?.user.totpEnabled ?? false

  if (!me) return null
  if (me.user.isMaster) {
    return (
      <div className="space-y-6 max-w-2xl">
        <PageHeader title="Hesabım" />
        <Panel className="p-5 text-sm text-[#3b4a5a] space-y-2">
          <p>Ana yönetici şifresiyle giriş yaptınız. Bu oturumun kişisel ayarı yoktur ve işlem kaydında kim olduğunuz görünmez.</p>
          <p>Kullanıcılar sayfasından kendinize <b>Sahip</b> rolünde kişisel bir hesap açın, o hesapla giriş yapıp iki adımlı doğrulamayı açın. Sonra ana şifreyi yalnızca acil durumlar için saklayın.</p>
        </Panel>
      </div>
    )
  }

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (next !== repeat) return toast.error('Yeni şifreler aynı değil.')
    setSaving(true)
    try {
      await call('/api/admin/account', 'POST', { currentPassword: current, newPassword: next })
      toast.success('Şifreniz değiştirildi.')
      setCurrent(''); setNext(''); setRepeat('')
      if (me.user.mustChangePassword) window.location.href = '/admin'
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const start2fa = async () => {
    setTwoFaBusy(true)
    try {
      const d = await call('/api/admin/account/2fa', 'POST')
      setSetup({ qr: d.qr, secret: d.secret })
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setTwoFaBusy(false)
    }
  }
  const confirm2fa = async (enable: boolean) => {
    setTwoFaBusy(true)
    try {
      await call('/api/admin/account/2fa', enable ? 'PUT' : 'DELETE', { code, currentPassword: twoFaPassword })
      setTotpOn(enable)
      setSetup(null)
      setCode('')
      setTwoFaPassword('')
      toast.success(enable ? 'İki adımlı doğrulama açıldı.' : 'İki adımlı doğrulama kapatıldı.')
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setTwoFaBusy(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader title="Hesabım" description={`${me.user.name} · ${me.user.email} · ${me.user.roleLabel}`} />

      {me.user.mustChangePassword && (
        <div role="alert" className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Devam etmeden önce size verilen geçici şifreyi kendi şifrenizle değiştirin.
        </div>
      )}

      <Panel>
        <PanelHeader title="Şifre" description="En az 10 karakter; harf ve rakam içermeli." />
        <form onSubmit={changePassword} className="p-5 grid gap-4 sm:grid-cols-2">
          <Field label="Mevcut şifre" htmlFor="cur" className="sm:col-span-2">
            <TextInput id="cur" type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} required />
          </Field>
          <Field label="Yeni şifre" htmlFor="new">
            <TextInput id="new" type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} required minLength={10} />
          </Field>
          <Field label="Yeni şifre (tekrar)" htmlFor="rep">
            <TextInput id="rep" type="password" autoComplete="new-password" value={repeat} onChange={(e) => setRepeat(e.target.value)} required minLength={10} />
          </Field>
          <div className="sm:col-span-2">
            <Btn type="submit" variant="primary" loading={saving}>Şifreyi değiştir</Btn>
          </div>
        </form>
      </Panel>

      <Panel>
        <PanelHeader
          title="İki adımlı doğrulama"
          description="Girişte şifrenin yanında Google Authenticator, Microsoft Authenticator gibi bir uygulamadaki 6 haneli kod istenir."
          actions={totpEnabled ? <Pill tone="green" dot>Açık</Pill> : <Pill tone="amber" dot>Kapalı</Pill>}
        />
        <div className="p-5 space-y-4 text-sm text-[#3b4a5a]">
          {!totpEnabled && !setup && (
            <Btn variant="primary" onClick={start2fa} loading={twoFaBusy}>İki adımlı doğrulamayı aç</Btn>
          )}
          {!totpEnabled && setup && (
            <div className="grid gap-5 sm:grid-cols-[220px_1fr] items-start">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={setup.qr} alt="Doğrulama uygulaması için QR kod" width={220} height={220} className="rounded-lg border border-[#e6ebf1]" />
              <div className="space-y-3">
                <ol className="list-decimal pl-5 space-y-1">
                  <li>Doğrulama uygulamasında yeni hesap ekleyin ve QR kodu okutun.</li>
                  <li>Okutamıyorsanız bu anahtarı elle girin: <code className="break-all rounded bg-[#f1f4f8] px-1.5 py-0.5 text-[12px]">{setup.secret}</code></li>
                  <li>Uygulamanın gösterdiği 6 haneli kodu yazıp onaylayın.</li>
                </ol>
                <Field label="Doğrulama kodu" htmlFor="code">
                  <TextInput id="code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} />
                </Field>
                <Field label="Mevcut şifreniz" htmlFor="code-password">
                  <TextInput id="code-password" type="password" autoComplete="current-password" value={twoFaPassword} onChange={(e) => setTwoFaPassword(e.target.value)} />
                </Field>
                <Btn variant="primary" onClick={() => confirm2fa(true)} loading={twoFaBusy} disabled={code.length !== 6 || !twoFaPassword}>Onayla ve aç</Btn>
              </div>
            </div>
          )}
          {totpEnabled && (
            <div className="flex flex-wrap items-end gap-3">
              <Field label="Kapatmak için güncel kod" htmlFor="code-off">
                <TextInput id="code-off" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} />
              </Field>
              <Field label="Mevcut şifreniz" htmlFor="code-off-password">
                <TextInput id="code-off-password" type="password" autoComplete="current-password" value={twoFaPassword} onChange={(e) => setTwoFaPassword(e.target.value)} />
              </Field>
              <Btn variant="danger" onClick={() => confirm2fa(false)} loading={twoFaBusy} disabled={code.length !== 6 || !twoFaPassword}>Kapat</Btn>
            </div>
          )}
        </div>
      </Panel>
    </div>
  )
}
