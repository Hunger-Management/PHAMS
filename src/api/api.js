import { mockApiFetch } from './mockApi'

const BASE_URL = import.meta.env.VITE_API_URL || 'https://web-production-59ac1.up.railway.app'
const REQUEST_TIMEOUT_MS = 8000
const USE_MOCK_API = (import.meta.env.VITE_USE_MOCK_API ?? (import.meta.env.DEV ? 'true' : 'false')) === 'true'

// ─────────────────────────────────────────────────────────────
// getToken
// Reads the JWT from localStorage. Returns null if not present.
// ─────────────────────────────────────────────────────────────
export function getToken() {
    return localStorage.getItem('phams-token')
}

// ─────────────────────────────────────────────────────────────
// apiFetch
// Wrapper around fetch that automatically:
//   - Prepends BASE_URL
//   - Adds Content-Type: application/json
//   - Adds Authorization: Bearer <token> if token exists
//   - Parses JSON response
//   - Throws an error with the server's message if not ok
// ─────────────────────────────────────────────────────────────
export async function apiFetch(path, options = {}) {
    // If full mock mode is enabled, delegate all requests to the mock API.
    if (USE_MOCK_API) {
        return mockApiFetch(path, options)
    }

    // Special-case: when running against the real backend, allow monetary
    // donation posts (no food_id/food_description) to be handled by the
    // in-browser mock so money donations reflect immediately without a
    // running backend. Detect monetary donation in FormData or plain body.
    try {
        const method = (options.method || 'GET').toUpperCase()
        if (path === '/api/donations' && method === 'POST') {
            const body = options.body
            let foodId = null
            let foodDescription = null

            if (typeof FormData !== 'undefined' && body instanceof FormData) {
                foodId = body.get('food_id')
                foodDescription = body.get('food_description')
            } else if (body && typeof body === 'object') {
                foodId = body.food_id
                foodDescription = body.food_description
            }

            const hasFood = (foodId && String(foodId).trim() !== '') || (foodDescription && String(foodDescription).trim() !== '')
            if (!hasFood) {
                // Build a lightweight plain body for the mock handler (skip files)
                const mockBody = {}
                if (typeof FormData !== 'undefined' && body instanceof FormData) {
                    mockBody.donor_id = body.get('donor_id') || ''
                    mockBody.food_id = ''
                    mockBody.food_description = ''
                    mockBody.quantity = body.get('quantity') || '0'
                    mockBody.quantity_unit = body.get('quantity_unit') || ''
                    mockBody.date_given = body.get('date_given') || new Date().toISOString().split('T')[0]
                } else {
                    mockBody.donor_id = body?.donor_id || ''
                    mockBody.food_id = ''
                    mockBody.food_description = ''
                    mockBody.quantity = body?.quantity || 0
                    mockBody.quantity_unit = body?.quantity_unit || ''
                    mockBody.date_given = body?.date_given || new Date().toISOString().split('T')[0]
                }

                return mockApiFetch('/api/donations', { method: 'POST', body: mockBody })
            }
        }
    } catch (e) {
        // Fall through to real network request on unexpected errors
        console.warn('Monetary mock routing detection failed:', e)
    }

    const token = getToken()
    const controller = new AbortController()
    const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
    const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData

    const headers = {
        ...(options.headers || {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }

    if (!isFormData && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/json'
    }

    try {
        const response = await fetch(`${BASE_URL}${path}`, {
            ...options,
            cache: options.cache || 'no-store',
            headers,
            signal: controller.signal,
        })

        const text = await response.text()
        const data = text ? JSON.parse(text) : {}

        if (!response.ok) {
            const error = new Error(data.message || 'Request failed')
            error.status = response.status

            // Auto-logout on expired/invalid token — skip for login endpoint so
            // bad credentials show an error instead of silently redirecting.
            if (response.status === 401 && path !== '/api/auth/login') {
                localStorage.removeItem('phams-token')
                localStorage.removeItem('phams-admin-user')
                window.location.href = '/staff/login'
            }

            throw error
        }

        return data
    } catch (error) {
        if (error.name === 'AbortError') {
            const timeoutError = new Error(`Request timed out after ${REQUEST_TIMEOUT_MS / 1000} seconds`)
            timeoutError.status = 408
            throw timeoutError
        }

        throw error
    } finally {
        window.clearTimeout(timeoutId)
    }
}