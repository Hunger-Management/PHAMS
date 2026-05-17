const STAFF_STORAGE_KEYS = ['staff-auth-user', 'phams-admin-user']

function safeParseStoredUser(rawValue) {
  if (!rawValue) return null

  try {
    return JSON.parse(rawValue)
  } catch {
    return null
  }
}

function normalizeActor(user) {
  if (!user) return null

  const staffUserId = user.user_id ?? user.id ?? user.staff_user_id ?? null

  return {
    staff_user_id: staffUserId !== null && staffUserId !== undefined ? String(staffUserId) : null,
    staff_name: user.full_name || user.name || user.staff_name || 'System',
    staff_email: user.email || user.staff_email || null,
    staff_role: user.role || 'Staff',
  }
}

export function getCurrentStaffActor(preferredRole = 'admin') {
  if (typeof window === 'undefined') {
    return {
      staff_user_id: null,
      staff_name: 'System',
      staff_email: null,
      staff_role: 'System',
    }
  }

  const orderedKeys = preferredRole === 'staff'
    ? ['staff-auth-user', 'phams-admin-user']
    : ['phams-admin-user', 'staff-auth-user']

  for (const key of orderedKeys) {
    const actor = normalizeActor(safeParseStoredUser(window.localStorage.getItem(key)))
    if (actor) return actor
  }

  return {
    staff_user_id: null,
    staff_name: 'System',
    staff_email: null,
    staff_role: 'System',
  }
}

export function formatDistributionDetails(distribution) {
  if (!distribution) return 'Distribution details unavailable.'

  const recipient = distribution.family_name || distribution.individual_name || distribution.recipient_type || 'Unknown recipient'
  const barangay = distribution.barangay_name || 'Unknown barangay'
  const itemName = distribution.food_name || 'Food supply'
  const quantity = distribution.quantity !== null && distribution.quantity !== undefined && distribution.quantity !== ''
    ? `${distribution.quantity} ${distribution.unit || ''}`.trim()
    : '—'
  const status = distribution.status || 'Unknown status'
  const recordLabel = distribution.distribution_id ? `Distribution #${distribution.distribution_id}` : 'Distribution record'

  return `${recordLabel} • ${recipient} • ${barangay} • ${itemName}${quantity !== '—' ? ` (${quantity})` : ''} • Status: ${status}`
}