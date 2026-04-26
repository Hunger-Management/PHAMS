import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, UserPlus, Search, AlertTriangle } from 'lucide-react'
import { useDarkMode } from '../../hooks/useDarkMode'
import { useAdminAuth } from '../../context/AdminAuthContext'
import AdminSidebar from '../../components/admin/AdminSidebar'
import { apiFetch } from '../../api/api'

function FamilyListPage() {
    const { isDarkMode, toggleDarkMode } = useDarkMode()
    const { isAuthenticated } = useAdminAuth()
    const navigate = useNavigate()

    const [families, setFamilies] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [searchQuery, setSearchQuery] = useState('')
    const [deactivating, setDeactivating] = useState(null)
    const [confirmId, setConfirmId] = useState(null)

    // fetching families on mount
    useEffect(() => {
        if (!isAuthenticated) return
        fetchFamilies()
    }, [isAuthenticated])

    const fetchFamilies = async () => {
        setLoading(true)
        setError('')
        try {
            const data = await apiFetch('/api/families')
            setFamilies(data.families)
        } catch (err) {
            setError(err.message || 'Failed to load families.')
        } finally {
            setLoading(false)
        }
    }

    // deactivate (soft delete)
    const handleDeactivate = async (familyId) => {
        setDeactivating(familyId)
        try {
            await apiFetch(`/api/families/${familyId}`, { method: 'DELETE' })
            // Remove from local state immediately for snappy UX
            setFamilies((prev) => prev.filter((f) => f.family_id !== familyId))
            setConfirmId(null)
        } catch (err) {
            setError(err.message || 'Failed to deactivate family.')
        } finally {
            setDeactivating(null)
        }
    }

    // filter by search
    const filtered = families.filter((f) => {
        const q = searchQuery.toLowerCase()
        return (
            f.family_name.toLowerCase().includes(q) ||
            f.barangay_name.toLowerCase().includes(q) ||
            (f.address && f.address.toLowerCase().includes(q))
        )
    })

    return (
        <div className={`flex min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-[#0b1220] text-slate-100' : 'bg-[#e5e7eb] text-slate-900'
            }`}>
            <AdminSidebar isDarkMode={isDarkMode} />

            <main className="flex-1 p-8 overflow-auto">
                <div className="max-w-7xl mx-auto">

                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                                Manage Families
                            </h2>
                            <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                {families.length} registered {families.length === 1 ? 'family' : 'families'}
                            </p>
                        </div>
                        <button
                            onClick={() => navigate('/admin/families/add')}
                            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition"
                        >
                            <UserPlus size={16} />
                            Register New Family
                        </button>
                    </div>

                    {/* Error */}
                    {error ? (
                        <div className="mb-6 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            <AlertTriangle size={16} />
                            {error}
                        </div>
                    ) : null}

                    {/* Search */}
                    <div className={`mb-6 flex items-center gap-3 rounded-xl border px-4 py-2.5 ${isDarkMode
                            ? 'border-white/10 bg-[#111c2e]'
                            : 'border-slate-200 bg-white'
                        }`}>
                        <Search size={16} className={isDarkMode ? 'text-slate-400' : 'text-slate-400'} />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by family name, barangay, or address..."
                            className={`flex-1 bg-transparent text-sm outline-none ${isDarkMode ? 'text-slate-100 placeholder-slate-500' : 'text-slate-900 placeholder-slate-400'
                                }`}
                        />
                    </div>

                    {/* Table */}
                    <div className={`rounded-2xl border shadow-sm overflow-hidden ${isDarkMode ? 'border-white/10 bg-[#111c2e]' : 'border-slate-200 bg-white'
                        }`}>
                        {loading ? (
                            <div className={`p-12 text-center text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                Loading families...
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className={`p-12 text-center ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                <Users size={36} className="mx-auto mb-3 opacity-30" />
                                <p className="text-sm">
                                    {searchQuery ? 'No families match your search.' : 'No families registered yet.'}
                                </p>
                                {!searchQuery ? (
                                    <button
                                        onClick={() => navigate('/admin/families/add')}
                                        className="mt-4 text-sm text-green-600 hover:underline font-medium"
                                    >
                                        Register the first family →
                                    </button>
                                ) : null}
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className={`border-b text-xs uppercase tracking-wide ${isDarkMode
                                                ? 'border-white/10 text-slate-400'
                                                : 'border-slate-200 text-slate-500'
                                            }`}>
                                            <th className="px-6 py-4 text-left font-semibold">Family</th>
                                            <th className="px-6 py-4 text-left font-semibold">ID</th>
                                            <th className="px-6 py-4 text-left font-semibold">Barangay</th>
                                            <th className="px-6 py-4 text-left font-semibold">Members</th>
                                            <th className="px-6 py-4 text-left font-semibold">Priority Score</th>
                                            <th className="px-6 py-4 text-left font-semibold">Assistance</th>
                                            <th className="px-6 py-4 text-left font-semibold">Type</th>
                                            <th className="px-6 py-4 text-left font-semibold">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {filtered.map((family) => (
                                            <tr
                                                key={family.family_id}
                                                className={`transition ${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-slate-50'
                                                    }`}
                                            >
                                                {/* Family name + address */}
                                                <td className="px-6 py-4">
                                                    <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                                                        {family.family_name}
                                                    </p>
                                                    <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                                        {family.address || '—'}
                                                    </p>
                                                </td>

                                                <td className={`px-6 py-4 font-mono text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                                    {family.household_id || '—'}
                                                </td>

                                                {/* Barangay */}
                                                <td className={`px-6 py-4 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                                                    {family.barangay_name}
                                                </td>

                                                {/* Member count */}
                                                <td className={`px-6 py-4 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                                                    {family.member_count}
                                                </td>

                                                {/* Priority score */}
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${parseFloat(family.priority_score) >= 60
                                                            ? 'bg-red-100 text-red-700'
                                                            : parseFloat(family.priority_score) >= 30
                                                                ? 'bg-amber-100 text-amber-700'
                                                                : 'bg-green-100 text-green-700'
                                                        }`}>
                                                        {parseFloat(family.priority_score).toFixed(1)}
                                                    </span>
                                                </td>

                                                {/* Food assistance status */}
                                                <td className={`px-6 py-4 text-xs ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                                                    {family.food_assistance_status || 'None'}
                                                </td>

                                                {/* NPA badge */}
                                                <td className="px-6 py-4">
                                                    {family.is_npa ? (
                                                        <span className="inline-flex rounded-full bg-purple-100 px-2.5 py-1 text-xs font-semibold text-purple-700">
                                                            NPA
                                                        </span>
                                                    ) : (
                                                        <span className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-400'}`}>
                                                            Regular
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Actions */}
                                                <td className="px-6 py-4">
                                                    {confirmId === family.family_id ? (
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={() => handleDeactivate(family.family_id)}
                                                                disabled={deactivating === family.family_id}
                                                                className="rounded-lg bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50"
                                                            >
                                                                {deactivating === family.family_id ? 'Removing...' : 'Confirm'}
                                                            </button>
                                                            <button
                                                                onClick={() => setConfirmId(null)}
                                                                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${isDarkMode
                                                                        ? 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                                                                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                                                    }`}
                                                            >
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => setConfirmId(family.family_id)}
                                                            className="rounded-lg border border-red-300 text-red-600 hover:bg-red-50 px-3 py-1.5 text-xs font-semibold transition"
                                                        >
                                                            Deactivate
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                </div>
            </main>

            {/* Dark mode toggle */}
            <button
                onClick={toggleDarkMode}
                className={`fixed bottom-5 right-5 z-50 h-12 w-12 rounded-full shadow-lg transition-colors grid place-items-center text-lg font-bold ${isDarkMode
                        ? 'bg-slate-700 text-yellow-300 hover:bg-slate-600'
                        : 'bg-blue-900 text-white hover:bg-blue-800'
                    }`}
                aria-label="Toggle dark mode"
            >
                {isDarkMode ? '☀️' : '🌙'}
            </button>
        </div>
    )
}

export default FamilyListPage