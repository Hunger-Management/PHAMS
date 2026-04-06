import { createContext, useContext, useMemo, useState } from 'react'

const STAFF_STORAGE_KEY = 'staff-auth-user'
const DEMO_STAFF = {
  username: 'staff',
  password: 'staff123',
  name: 'Staff User',
  role: 'Operations Staff',
}

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

  const isAuthenticated = Boolean(staffUser)

  const login = (username, password) => {
    const normalizedUsername = username.trim().toLowerCase()

    if (
      normalizedUsername === DEMO_STAFF.username &&
      password === DEMO_STAFF.password
    ) {
      const nextUser = {
        username: DEMO_STAFF.username,
        name: DEMO_STAFF.name,
        role: DEMO_STAFF.role,
      }
      setStaffUser(nextUser)
      localStorage.setItem(STAFF_STORAGE_KEY, JSON.stringify(nextUser))
      return { ok: true }
    }

    return { ok: false, message: 'Invalid username or password.' }
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
    }),
    [staffUser, isAuthenticated],
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
