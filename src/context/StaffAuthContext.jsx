/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo, useState } from 'react'
import { apiFetch } from '../api/api'

const STAFF_STORAGE_KEY = 'staff-auth-user'
const STAFF_TOKEN_KEY = 'phams-token'

const StaffAuthContext = createContext(null)

export function StaffAuthProvider({ children }) {
  const [staffUser, setStaffUser] = useState(() => {
    if (typeof window === 'undefined') {
      return null
    }

    const stored = localStorage.getItem(STAFF_STORAGE_KEY)
    if (!stored) {
      return null
    }

    try {
      return JSON.parse(stored)
    } catch {
      return null
    }
  })

  const [staffAccounts] = useState([])

  const isAuthenticated = Boolean(staffUser)
  const login = async (emailOrUsername, password) => {
    try {
      const data = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: emailOrUsername, password }),
      })

      if (data.user.role !== 'Staff') {
        return { ok: false, message: 'Access denied. Staff credentials required.' }
      }

      localStorage.setItem(STAFF_TOKEN_KEY, data.token)
      localStorage.setItem(STAFF_STORAGE_KEY, JSON.stringify(data.user))
      setStaffUser(data.user)
      return { ok: true }
    } catch (err) {
      return { ok: false, message: err.message || 'Invalid email or password.' }
    }
  }

  const logout = () => {
    setStaffUser(null)
    localStorage.removeItem(STAFF_STORAGE_KEY)
  }

  const value = useMemo(
    () => ({
      staffUser,
      isAuthenticated,
      login,
      logout,
      staffAccounts,
    }),
    [staffUser, isAuthenticated, staffAccounts],
  )

  return <StaffAuthContext.Provider value={value}>{children}</StaffAuthContext.Provider>
}

export function useStaffAuth() {
  const context = useContext(StaffAuthContext)

  if (!context) {
    throw new Error('useStaffAuth must be used within a StaffAuthProvider')
  }

  return context
}
