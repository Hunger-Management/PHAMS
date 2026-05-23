/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo, useState, useEffect, useRef } from 'react'
import { apiFetch } from '../api/api'

const STAFF_STORAGE_KEY = 'staff-auth-user'
const STAFF_TOKEN_KEY = 'phams-token'

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

  // Keep a local cache of staff accounts so UI can display assigned staff per barangay.
  const [loadedStaffAccounts, setLoadedStaffAccounts] = useState([])

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

  const logout = () => {
    setStaffUser(null)
    localStorage.removeItem(STAFF_STORAGE_KEY)
  }

  // Load staff accounts once (non-critical, best-effort). Normalize shape to
  // what other components expect (`username`, `name`, `barangay`, `password`).
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const users = await apiFetch('/api/users')
        if (!mounted) return
        const staffs = Array.isArray(users) ? users.filter((u) => String(u.role).toLowerCase() === 'staff') : []
        const normalized = staffs.map((s) => ({
          user_id: s.user_id || s.id || null,
          username: s.email || s.username || null,
          name: s.name || s.full_name || s.username || 'Staff',
          barangay: s.barangay || s.barangay_name || (s.barangay_id ? String(s.barangay_id) : null),
          password: s.password || null,
        }))
        setLoadedStaffAccounts(normalized)
      } catch {
        // non-fatal
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  // Exposed method to refresh staff accounts on demand (used after create/delete)
  const refreshStaffAccounts = async (opts = {}) => {
    try {
      const users = await apiFetch('/api/users')
      const staffs = Array.isArray(users) ? users.filter((u) => String(u.role).toLowerCase() === 'staff') : []
      const normalized = staffs.map((s) => ({
        user_id: s.user_id || s.id || null,
        username: s.email || s.username || null,
        name: s.name || s.full_name || s.username || 'Staff',
        barangay: s.barangay || s.barangay_name || (s.barangay_id ? String(s.barangay_id) : null),
        password: s.password || null,
      }))
      setLoadedStaffAccounts(normalized)
    } catch {
      // ignore
    }
    // Broadcast update to other tabs/windows so they refresh too (best-effort).
    try {
      if (!opts.suppressBroadcast && typeof window !== 'undefined') {
        if (bcRef.current && bcRef.current.postMessage) {
          bcRef.current.postMessage({ type: 'users-updated', ts: Date.now() })
        } else {
          // fallback: toggle a localStorage key to trigger storage event in other tabs
          try {
            localStorage.setItem('phams-users-updated', String(Date.now()))
          } catch {}
        }
      }
    } catch (e) {
      // ignore
    }
  }

  // BroadcastChannel for cross-tab realtime updates (best-effort)
  const bcRef = useRef(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if ('BroadcastChannel' in window) {
      bcRef.current = new BroadcastChannel('phams-users')
      bcRef.current.onmessage = (ev) => {
        try {
          const data = ev.data || {}
          if (data && data.type === 'users-updated') {
            // Refresh without rebroadcasting to avoid loops
            refreshStaffAccounts({ suppressBroadcast: true })
          }
        } catch (e) {
          // ignore
        }
      }
    } else {
      // Fallback: listen for localStorage changes
      const handler = (ev) => {
        try {
          if (ev.key === 'phams-users-updated') {
            refreshStaffAccounts({ suppressBroadcast: true })
          }
        } catch (e) {
          // ignore
        }
      }
      window.addEventListener('storage', handler)
      // store handler so we can remove it later
      bcRef.current = { storageHandler: handler }
    }

    return () => {
      try {
        if (bcRef.current && bcRef.current.close) bcRef.current.close()
      } catch {}
      if (bcRef.current && bcRef.current.storageHandler) {
        window.removeEventListener('storage', bcRef.current.storageHandler)
      }
      bcRef.current = null
    }
  }, [])

  const value = useMemo(
    () => ({
      staffUser,
      isAuthenticated,
      login,
      logout,
      staffAccounts: loadedStaffAccounts,
      refreshStaffAccounts,
    }),
    [staffUser, isAuthenticated, login, logout, loadedStaffAccounts],
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
