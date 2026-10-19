import { ADMIN_ROLES, isAdminRole } from '@/lib/admin-users'

/** Yönetim kullanıcısının istemciye giden hali (şifre özeti ve 2FA anahtarı yok) */
export const adminUserView = (u: {
  id: string
  email: string
  name: string
  role: string
  active: boolean
  totpEnabled: boolean
  mustChangePassword: boolean
  lastLoginAt: Date | null
  createdAt: Date
}) => ({
  id: u.id,
  email: u.email,
  name: u.name,
  role: u.role,
  roleLabel: isAdminRole(u.role) ? ADMIN_ROLES[u.role].label : u.role,
  active: u.active,
  totpEnabled: u.totpEnabled,
  mustChangePassword: u.mustChangePassword,
  lastLoginAt: u.lastLoginAt,
  createdAt: u.createdAt,
})
