import { useEffect, useState } from 'react'
import { Search, AlertTriangle, Trash2, User } from 'lucide-react'
import { useDarkMode } from '../../hooks/useDarkMode'
import { useAdminAuth } from '../../context/AdminAuthContext'
import AdminSidebar from '../components/AdminSidebar'
import { apiFetch } from '../../api/api'
import { useStaffAuth } from '../../context/StaffAuthContext'

function UsersListPage() {
    const { isDarkMode, toggleDarkMode } = useDarkMode()
    const { isAuthenticated, adminUser } = useAdminAuth()

    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [successMessage, setSuccessMessage] = useState('')
    const [searchQuery, setSearchQuery] = useState('')
    const [deletingId, setDeletingId] = useState(null)
    const [roleFilter, setRoleFilter] = useState('All')
    const { refreshStaffAccounts } = useStaffAuth()

    useEffect(() => {
        if (!isAuthenticated) return
        fetchUsers()
    }, [isAuthenticated])

    const fetchUsers = async () => {
        setLoading(true)
        setError('')
        setSuccessMessage('')
        try {
            const data = await apiFetch('/api/users')
            setUsers(Array.isArray(data) ? data : [])
        } catch (err) {
            setError(err.message || 'Failed to load users.')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (userId) => {
        if (!confirm('Delete this user account? This cannot be undone.')) {
            return
        }

        setDeletingId(userId)
        setError('')
        setSuccessMessage('')
        try {
            await apiFetch(`/api/users/${userId}`, { method: 'DELETE' })
            setSuccessMessage('User deleted.')
            await fetchUsers()
            try {
                if (refreshStaffAccounts) await refreshStaffAccounts()
            } catch (e) {
                // ignore
            }
        } catch (err) {
            setError(err.message || 'Failed to delete user.')
        } finally {
            setDeletingId(null)
        }
    }

    const filtered = users.filter((userItem) => {
        const q = (searchQuery ?? '').toLowerCase()
        const name = (userItem.name ?? '').toLowerCase()
        const email = (userItem.email ?? '').toLowerCase()
        const role = (userItem.role ?? '').toLowerCase()
        const matchesRole = roleFilter === 'All' || role === roleFilter.toLowerCase()

        return matchesRole && (name.includes(q) || email.includes(q) || role.includes(q))
    })

    const formatDate = (value) => {
        if (!value) return '—'
        const parsed = new Date(value)
        if (Number.isNaN(parsed.getTime())) return '—'
        return parsed.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    }

    const currentUserId = adminUser?.user_id

    return (
        <div className={`flex min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-[#0b1220] text-slate-100' : 'bg-[#e5e7eb] text-slate-900'}`}>
            <AdminSidebar isDarkMode={isDarkMode} />

            <main className="flex-1 pt-16 px-4 pb-4 md:p-8 overflow-auto md:ml-64">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                                Manage Users
                            </h2>
                            <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                {users.length} total {users.length === 1 ? 'user' : 'users'}
                            </p>
                        </div>
                    </div>

                    {successMessage ? (
                        <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                            {successMessage}
                        </div>
                    ) : null}

                    {error && users.length === 0 ? (
                        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            <div className="flex items-start gap-3">
                                <AlertTriangle size={20} />
                                <div className="flex-1">
                                    <p className="font-semibold">Failed to fetch users</p>
                                    <p className="mt-1">{error}</p>
                                    <div className="mt-3 flex items-center gap-3">
                                        <button
                                            onClick={fetchUsers}
                                            className="rounded-md bg-red-600 text-white px-3 py-1.5 text-sm font-semibold hover:bg-red-700 transition"
                                        >
                                            Retry
                                        </button>
                                        <span className="text-xs text-slate-500">(Check API server, CORS, and network connection)</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : error ? (
                        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {error}
                        </div>
                    ) : null}

                    <div className="mb-6 flex flex-wrap items-center gap-3">
                        <div className={`flex items-center gap-2 rounded-xl border px-3 py-2 ${isDarkMode ? 'border-white/10 bg-[#111c2e]' : 'border-slate-200 bg-white'}`}>
                            {['All', 'Admin', 'Staff'].map((role) => (
                                <button
                                    key={role}
                                    onClick={() => setRoleFilter(role)}
                                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${roleFilter === role
                                            ? 'bg-green-600 text-white'
                                            : isDarkMode
                                                ? 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                        }`}
                                >
                                    {role}
                                </button>
                            ))}
                        </div>

                        <div className={`flex flex-1 items-center gap-3 rounded-xl border px-4 py-2.5 ${isDarkMode ? 'border-white/10 bg-[#111c2e]' : 'border-slate-200 bg-white'}`}>
                        <Search size={16} className={isDarkMode ? 'text-slate-400' : 'text-slate-400'} />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by name, email, or role..."
                            className={`flex-1 bg-transparent text-sm outline-none ${isDarkMode ? 'text-slate-100 placeholder-slate-500' : 'text-slate-900 placeholder-slate-400'}`}
                        />
                        </div>
                    </div>

                    <div className={`rounded-2xl border shadow-sm overflow-hidden ${isDarkMode ? 'border-white/10 bg-[#111c2e]' : 'border-slate-200 bg-white'}`}>
                        {loading ? (
                            <div className={`p-12 text-center text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                Loading users...
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className={`p-12 text-center ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                <User size={36} className="mx-auto mb-3 opacity-30" />
                                <p className="text-sm">
                                    {searchQuery ? 'No users match your search.' : 'No users available.'}
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className={`border-b text-xs uppercase tracking-wide ${isDarkMode ? 'border-white/10 text-slate-400' : 'border-slate-200 text-slate-500'}`}>
                                            <th className="px-6 py-4 text-left font-semibold">Name</th>
                                            <th className="px-6 py-4 text-left font-semibold">Email</th>
                                            <th className="px-6 py-4 text-left font-semibold">Role</th>
                                            <th className="px-6 py-4 text-left font-semibold">Barangay</th>
                                            <th className="px-6 py-4 text-left font-semibold">Created</th>
                                            <th className="px-6 py-4 text-left font-semibold">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {filtered.map((userItem) => {
                                            const isSelf = currentUserId && userItem.user_id === currentUserId
                                            return (
                                                <tr
                                                    key={userItem.user_id}
                                                    className={`transition ${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-slate-50'}`}
                                                >
                                                    <td className={`px-6 py-4 ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                                                        {userItem.name || '—'}
                                                    </td>
                                                    <td className={`px-6 py-4 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                                                        {userItem.email || '—'}
                                                    </td>
                                                    <td className={`px-6 py-4 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                                                        {userItem.role || '—'}
                                                    </td>
                                                    <td className={`px-6 py-4 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                                                        {userItem.barangay_name || '—'}
                                                    </td>
                                                    <td className={`px-6 py-4 text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                                        {formatDate(userItem.created_at)}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {isSelf ? (
                                                            <span className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                                                Current user
                                                            </span>
                                                        ) : (
                                                            <button
                                                                onClick={() => handleDelete(userItem.user_id)}
                                                                disabled={deletingId === userItem.user_id}
                                                                className="inline-flex items-center gap-1 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50"
                                                            >
                                                                <Trash2 size={12} />
                                                                {deletingId === userItem.user_id ? 'Deleting...' : 'Delete'}
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <button
                onClick={toggleDarkMode}
                className={`fixed bottom-5 right-5 z-50 h-12 w-12 rounded-full shadow-lg transition-colors grid place-items-center text-lg font-bold ${isDarkMode ? 'bg-slate-700 text-yellow-300 hover:bg-slate-600' : 'bg-blue-900 text-white hover:bg-blue-800'}`}
                aria-label="Toggle dark mode"
            >
                {isDarkMode ? '☀️' : '🌙'}
            </button>
        </div>
    )
}

export default UsersListPage
