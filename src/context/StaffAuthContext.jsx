/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo, useState } from 'react'
import { apiFetch } from '../api/api'

const STAFF_STORAGE_KEY = 'staff-auth-user'
const STAFF_TOKEN_KEY = 'phams-token'
const STAFF_ACCOUNTS_KEY = 'phams-staff-accounts'

const StaffAuthContext = createContext(null)

export function StaffAuthProvider({ children }) {
  const [staffUser, setStaffUser] = useState(() => {
    if (typeof window === 'undefined') return null
    const stored = localStorage.getItem(STAFF_STORAGE_KEY)
    if (!stored) return null
    try {
      const user = JSON.parse(stored)
      // Normalize sessions stored before barangay name was resolved
      if (!user.barangay && user.barangay_name) {
        return { ...user, barangay: user.barangay_name }
      }
      return user
    } catch {
      return null
    }
  })

  const [staffAccounts, setStaffAccounts] = useState(() => {
    if (typeof window === 'undefined') {
      return []
    }

    const stored = localStorage.getItem(STAFF_ACCOUNTS_KEY)
    if (!stored) {
      return []
    }

    try {
      const parsed = JSON.parse(stored)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  })

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

      // Normalize: real backend returns `barangay`, mock API returns `barangay_name`.
      // Ensure staffUser.barangay is always the resolved name string.
      let userData = { ...data.user }
      if (!userData.barangay && userData.barangay_name) {
        userData.barangay = userData.barangay_name
      }
      if (!userData.barangay && userData.barangay_id) {
        try {
          const b = await apiFetch(`/api/barangays/${userData.barangay_id}`)
          if (b?.name) userData.barangay = b.name
        } catch {
          // non-fatal — sidebar will still render with barangay_id fallback
        }
      }

      localStorage.setItem(STAFF_TOKEN_KEY, data.token)
      localStorage.setItem(STAFF_STORAGE_KEY, JSON.stringify(userData))
      setStaffUser(userData)
      return { ok: true }
    } catch (err) {
      return { ok: false, message: err.message || 'Invalid email or password.' }
    }
  }

  const persistStaffAccounts = (accounts) => {
    if (typeof window === 'undefined') {
      return
    }

    localStorage.setItem(STAFF_ACCOUNTS_KEY, JSON.stringify(accounts))
  }

  const createStaffAccount = (staffData) => {
    if (!staffData?.name || !staffData?.username || !staffData?.password) {
      return { ok: false, message: 'Name, username, and password are required.' }
    }

    const exists = staffAccounts.some((staff) => staff.username === staffData.username)
    if (exists) {
      return { ok: false, message: 'Username already exists.' }
    }

    const nextAccounts = [
      {
        name: staffData.name,
        username: staffData.username,
        password: staffData.password,
        barangay: staffData.barangay || '',
        createdAt: new Date().toISOString(),
      },
      ...staffAccounts,
    ]

    setStaffAccounts(nextAccounts)
    persistStaffAccounts(nextAccounts)
    return { ok: true }
  }

  const deleteStaffAccount = (username) => {
    const nextAccounts = staffAccounts.filter((staff) => staff.username !== username)
    setStaffAccounts(nextAccounts)
    persistStaffAccounts(nextAccounts)
    return { ok: true }
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
      createStaffAccount,
      deleteStaffAccount,
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
