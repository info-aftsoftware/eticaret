'use client'

import React from 'react'

/** Oturumdaki yönetici (/api/admin/me): menü yalnızca rolün okuyabildiği sayfaları gösterir */
export type AdminMe = {
  user: {
    name: string
    email: string | null
    role: string
    roleLabel: string
    isMaster: boolean
    totpEnabled: boolean
    mustChangePassword: boolean
  }
  pages: string[]
}

export const AdminMeContext = React.createContext<AdminMe | null>(null)
export const useAdminMe = () => React.useContext(AdminMeContext)
