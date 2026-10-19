'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { UserPlus } from 'lucide-react'
import { PageHeader, Panel, Btn, Field, TextInput, SelectInput, Pill, Modal, EmptyState, Spinner, fmtDateTime } from '@/components/admin/ui'
import { useToast } from '@/components/admin/toast'
import { useAdminMe } from '@/components/admin/AdminMeContext'

type AdminUserRow = {
  id: string
  email: string
  name: string
  role: string
  roleLabel: string
  active: boolean
  totpEnabled: boolean
  mustChangePassword: boolean
  lastLoginAt: string | null
  createdAt: string
}
type RoleOption = { value: string; label: string; description: string }

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

/** Yönetim kullanıcıları (yalnızca Sahip): ekle, rol ver, pasifleştir, şifre / 2FA sıfırla */
export default function AdminUsersPage() {
  const toast = useToast()
  const me = useAdminMe()
  const [users, setUsers] = useState<AdminUserRow[] | null>(null)
  const [roles, setRoles] = useState<RoleOption[]>([])
  const [error, setError] = useState('')
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', role: 'operator' })
  const [busy, setBusy] = useState<string | null>(null)
  /** Yeni / sıfırlanan geçici şifre: yalnızca bir kez gösterilir */
  const [secret, setSecret] = useState<{ email: string; password: string } | null>(null)

  const load = useCallback(async () => {
    try {
      const d = await call('/api/admin/users', 'GET')
      setUsers(d.users)
      setRoles(d.roles)
    } catch (err) {
      setError((err as Error).message)
    }
  }, [])
  useEffect(() => {
    void load()
  }, [load])

  const replace = (u: AdminUserRow) => setUsers((prev) => (prev ? prev.map((x) => (x.id === u.id ? u : x)) : prev))

  const add = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy('add')
    try {
      const d = await call('/api/admin/users', 'POST', form)
      setUsers((prev) => [...(prev ?? []), d.user])
      setSecret({ email: d.user.email, password: d.temporaryPassword })
      setAdding(false)
      setForm({ name: '', email: '', role: 'operator' })
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setBusy(null)
    }
  }

  const patch = async (u: AdminUserRow, body: Record<string, unknown>, done: string) => {
    setBusy(u.id)
    try {
      const d = await call(`/api/admin/users/${u.id}`, 'PATCH', body)
      replace(d.user)
      if (d.temporaryPassword) setSecret({ email: d.user.email, password: d.temporaryPassword })
      else toast.success(done)
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kullanıcılar"
        description="Panele kimin hangi yetkiyle girdiğini yönetin. Her kişiye ayrı hesap açın; ortak şifre kullanmayın."
        actions={<Btn variant="primary" onClick={() => setAdding(true)}><UserPlus /> Kullanıcı ekle</Btn>}
      />

      <Panel className="p-4 text-[13px] text-[#3b4a5a]">
        <ul className="grid gap-1.5 sm:grid-cols-2">
          {roles.map((r) => (
            <li key={r.value}><b className="text-[#121926]">{r.label}:</b> {r.description}</li>
          ))}
        </ul>
      </Panel>

      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      {!users && !error && <div className="flex justify-center py-10"><Spinner /></div>}
      {users && users.length === 0 && (
        <EmptyState title="Henüz kullanıcı yok" description="Kendinize Sahip rolünde bir hesap açarak başlayın; sonra o hesapla giriş yapıp iki adımlı doğrulamayı açın." />
      )}
      {users && users.length > 0 && (
        <Panel className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#f5f7fa] text-left text-[12px] text-[#5d6e80]">
              <tr>
                <th className="px-4 py-2.5 font-semibold">Kullanıcı</th>
                <th className="px-4 py-2.5 font-semibold">Rol</th>
                <th className="px-4 py-2.5 font-semibold">Durum</th>
                <th className="px-4 py-2.5 font-semibold">Son giriş</th>
                <th className="px-4 py-2.5 font-semibold text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eef1f5]">
              {users.map((u) => {
                const isSelf = me?.user.email === u.email
                return (
                  <tr key={u.id} className={u.active ? '' : 'opacity-60'}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-[#121926]">{u.name}{isSelf && <span className="text-[#5d6e80]"> (siz)</span>}</p>
                      <p className="text-[12px] text-[#5d6e80]">{u.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <SelectInput
                        aria-label={`${u.name} rolü`}
                        className="min-w-[180px]"
                        value={u.role}
                        disabled={isSelf || busy === u.id}
                        onChange={(e) => patch(u, { role: e.target.value }, 'Rol değiştirildi.')}
                      >
                        {roles.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                      </SelectInput>
                    </td>
                    <td className="px-4 py-3 space-x-1.5 whitespace-nowrap">
                      {u.active ? <Pill tone="green" dot>Aktif</Pill> : <Pill tone="slate">Pasif</Pill>}
                      {u.totpEnabled ? <Pill tone="navy">2FA</Pill> : <Pill tone="amber">2FA yok</Pill>}
                      {u.mustChangePassword && <Pill tone="yellow">Geçici şifre</Pill>}
                    </td>
                    <td className="px-4 py-3 text-[13px] text-[#5d6e80] whitespace-nowrap">{u.lastLoginAt ? fmtDateTime(u.lastLoginAt) : 'Hiç'}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap justify-end gap-1.5">
                        <Btn size="xs" onClick={() => patch(u, { resetPassword: true }, '')} disabled={busy === u.id}>Şifre sıfırla</Btn>
                        {u.totpEnabled && <Btn size="xs" onClick={() => patch(u, { resetTwoFactor: true }, '2FA sıfırlandı; kullanıcı yeniden kurmalı.')} disabled={busy === u.id}>2FA sıfırla</Btn>}
                        {!isSelf && (
                          <Btn size="xs" variant={u.active ? 'danger' : 'outline'} onClick={() => patch(u, { active: !u.active }, u.active ? 'Kullanıcı pasifleştirildi.' : 'Kullanıcı etkinleştirildi.')} disabled={busy === u.id}>
                            {u.active ? 'Pasifleştir' : 'Etkinleştir'}
                          </Btn>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </Panel>
      )}

      <Modal
        open={adding}
        onClose={() => setAdding(false)}
        title="Kullanıcı ekle"
        description="Geçici şifre bir kez gösterilir; kullanıcı ilk girişte kendi şifresini belirler."
        footer={<><Btn onClick={() => setAdding(false)}>Vazgeç</Btn><Btn variant="primary" type="submit" form="add-user" loading={busy === 'add'}>Ekle</Btn></>}
      >
        <form id="add-user" onSubmit={add} className="grid gap-4">
          <Field label="Ad soyad" htmlFor="u-name"><TextInput id="u-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></Field>
          <Field label="E-posta" htmlFor="u-email"><TextInput id="u-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></Field>
          <Field label="Rol" htmlFor="u-role">
            <SelectInput id="u-role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              {roles.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </SelectInput>
          </Field>
        </form>
      </Modal>

      <Modal
        open={Boolean(secret)}
        onClose={() => setSecret(null)}
        title="Geçici şifre"
        description="Bu şifre bir daha gösterilmez. Kullanıcıya güvenli bir yoldan iletin; ilk girişte değiştirmesi istenir."
        footer={<Btn variant="primary" onClick={() => setSecret(null)}>Kaydettim</Btn>}
      >
        {secret && (
          <div className="space-y-2 text-sm">
            <p className="text-[#5d6e80]">{secret.email}</p>
            <code className="block select-all rounded-lg bg-[#f1f4f8] px-3 py-2.5 text-[15px] font-semibold tracking-wide text-[#121926]">{secret.password}</code>
          </div>
        )}
      </Modal>
    </div>
  )
}
