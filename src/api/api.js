const BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3000'
 const REQUEST_TIMEOUT_MS = 8000

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
    const token = getToken()
    const controller = new AbortController()
    const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
    }

    try {
        const response = await fetch(`${BASE_URL}${path}`, {
            ...options,
            headers,
            signal: controller.signal,
        })

        const text = await response.text()
        const data = text ? JSON.parse(text) : {}

        if (!response.ok) {
            const error = new Error(data.message || 'Request failed')
            error.status = response.status

            // Auto-logout on expired/invalid token
            if (response.status === 401) {
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