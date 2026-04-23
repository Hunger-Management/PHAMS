/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo, useState } from 'react'

const ADMIN_STORAGE_KEY = 'admin-auth-user'

const DEMO_ADMIN = {
  username: 'admin',
  password: 'admin123',
  name: 'Administrator',
  role: 'System Admin',
}

const AdminAuthContext = createContext(null)

export function AdminAuthProvider({ children }) {
  const [adminUser, setAdminUser] = useState(() => {
    const stored = localStorage.getItem(ADMIN_STORAGE_KEY)
    if (!stored) return null

    try {
      return JSON.parse(stored)
    } catch {
      return null
    }
  })

  const isAuthenticated = Boolean(adminUser)

  const login = (username, password) => {
    const normalizedUsername = username.trim().toLowerCase()

    if (
      normalizedUsername === DEMO_ADMIN.username &&
      password === DEMO_ADMIN.password
    ) {
      const nextUser = {
        username: DEMO_ADMIN.username,
        name: DEMO_ADMIN.name,
        role: DEMO_ADMIN.role,
      }

      setAdminUser(nextUser)
      localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(nextUser))
      return { ok: true }
    }

    return { ok: false, message: 'Invalid admin credentials' }
  }

  const logout = () => {
    setAdminUser(null)
    localStorage.removeItem(ADMIN_STORAGE_KEY)
  }

  const value = useMemo(
    () => ({
      adminUser,
      isAuthenticated,
      login,
      logout,
    }),
    [adminUser, isAuthenticated],
  )

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  )
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext)

  if (!context) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider')
  }

  return context
}