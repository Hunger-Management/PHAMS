/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo, useState } from 'react'

const STAFF_STORAGE_KEY = 'staff-auth-user'
const STAFF_ACCOUNTS_STORAGE_KEY = 'staff-accounts'
const DEMO_STAFF = {
  username: 'staff',
  password: 'staff123',
  name: 'Staff User',
  role: 'Operations Staff',
  barangay: 'Poblacion',
}

const StaffAuthContext = createContext(null)

export function StaffAuthProvider({ children }) {
  const [staffAccounts, setStaffAccounts] = useState(() => {
    if (typeof window === 'undefined') {
      return []
    }

    const stored = localStorage.getItem(STAFF_ACCOUNTS_STORAGE_KEY)
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

  const persistAccounts = (nextAccounts) => {
    setStaffAccounts(nextAccounts)
    localStorage.setItem(STAFF_ACCOUNTS_STORAGE_KEY, JSON.stringify(nextAccounts))
  }

  const createStaffAccount = ({ username, password, name, barangay }) => {
    const normalizedUsername = username.trim().toLowerCase()

    if (!normalizedUsername || !password.trim() || !name.trim() || !barangay.trim()) {
      return { ok: false, message: 'All staff account fields are required.' }
    }

    const usernameTakenByDemo = normalizedUsername === DEMO_STAFF.username
    const usernameTakenByCreated = staffAccounts.some(
      (account) => account.username === normalizedUsername,
    )

    if (usernameTakenByDemo || usernameTakenByCreated) {
      return { ok: false, message: 'Username already exists.' }
    }

    const nextAccount = {
      username: normalizedUsername,
      password,
      name: name.trim(),
      role: 'Operations Staff',
      barangay: barangay.trim(),
    }

    persistAccounts([...staffAccounts, nextAccount])
    return { ok: true }
  }

  const deleteStaffAccount = (username) => {
    const nextAccounts = staffAccounts.filter(
      (account) => account.username !== username
    )
    persistAccounts(nextAccounts)
    return { ok: true, message: 'Staff account deleted successfully.' }
  }

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
        barangay: DEMO_STAFF.barangay,
      }
      setStaffUser(nextUser)
      localStorage.setItem(STAFF_STORAGE_KEY, JSON.stringify(nextUser))
      return { ok: true }
    }

    const matchedAccount = staffAccounts.find(
      (account) =>
        account.username === normalizedUsername &&
        account.password === password,
    )

    if (matchedAccount) {
      const nextUser = {
        username: matchedAccount.username,
        name: matchedAccount.name,
        role: matchedAccount.role,
        barangay: matchedAccount.barangay,
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
      staffAccounts,
      isAuthenticated,
      createStaffAccount,
      deleteStaffAccount,
      login,
      logout,
    }),
    [staffUser, staffAccounts, isAuthenticated],
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
