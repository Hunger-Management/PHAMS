const BASE_URL = import.meta.env.VITE_API_URL || ''

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

    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
    }

    const response = await fetch(`${BASE_URL}${path}`, {
        ...options,
        headers,
    })

    const contentType = response.headers.get('content-type') || ''
    const responseText = await response.text()
    let data = {}

    if (responseText) {
        if (contentType.includes('application/json')) {
            try {
                data = JSON.parse(responseText)
            } catch {
                data = { message: responseText }
            }
        } else {
            data = { message: responseText }
        }
    }

    if (!response.ok) {
        const error = new Error(data.message || response.statusText || 'Request failed')
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
}