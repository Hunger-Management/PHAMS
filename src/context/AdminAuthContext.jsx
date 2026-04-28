import { createContext, useContext, useMemo, useState } from 'react'
import { apiFetch } from '../api/api'

const ADMIN_STORAGE_KEY = 'phams-token'
const ADMIN_USER_KEY = 'phams-admin-user'
const DEMO_ADMIN_EMAIL = 'admin@pateros.gov.ph'
const DEMO_ADMIN_PASSWORD = 'admin123'

function createDemoAdminUser(email) {
    return {
        id: 'demo-admin',
        email,
        name: 'Administrator',
        full_name: 'Administrator',
        role: 'Admin',
    }
}

const AdminAuthContext = createContext(null)

export function AdminAuthProvider({ children }) {
    const [adminUser, setAdminUser] = useState(() => {
        const stored = localStorage.getItem(ADMIN_USER_KEY)
        if (!stored) return null
        try {
            return JSON.parse(stored)
        } catch {
            return null
        }
    })

    const isAuthenticated = Boolean(adminUser)

    // Login - Calls POST /api/auth/login, stores JWT and user info.
    const login = async (email, password) => {
        try {
            const data = await apiFetch('/api/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password }),
            })

            // Only allow Admin role through this context
            if (data.user.role !== 'Admin') {
                return { ok: false, message: 'Access denied. Admin credentials required.' }
            }

            localStorage.setItem(ADMIN_STORAGE_KEY, data.token)
            localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(data.user))
            setAdminUser(data.user)
            return { ok: true }
        } catch (err) {
            const isDemoCredentials = email === DEMO_ADMIN_EMAIL && password === DEMO_ADMIN_PASSWORD

            if (isDemoCredentials && (!err || err.status === undefined)) {
                const demoUser = createDemoAdminUser(email)

                localStorage.setItem(ADMIN_STORAGE_KEY, 'demo-admin-token')
                localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(demoUser))
                setAdminUser(demoUser)
                return { ok: true }
            }

            return { ok: false, message: err.message || 'Login failed.' }
        }
    }

    // logout
    const logout = () => {
        localStorage.removeItem(ADMIN_STORAGE_KEY)
        localStorage.removeItem(ADMIN_USER_KEY)
        setAdminUser(null)
    }

    const value = useMemo(
        () => ({ adminUser, isAuthenticated, login, logout }),
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