import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Users, UserPlus, Search, AlertTriangle, Pencil, Trash2 } from 'lucide-react'
import { useDarkMode } from '../../hooks/useDarkMode'
import { useAdminAuth } from '../../context/AdminAuthContext'
import AdminSidebar from '../components/AdminSidebar'
import { apiFetch } from '../../api/api'

function FamilyListPage() {
    const { isDarkMode, toggleDarkMode } = useDarkMode()
    const { isAuthenticated } = useAdminAuth()
    const navigate = useNavigate()

    const [families, setFamilies] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedBarangayId, setSelectedBarangayId] = useState('')
    const [deletingId, setDeletingId] = useState(null)
    const [successMessage, setSuccessMessage] = useState('')
    const [barangays, setBarangays] = useState([])
    const [barangaysLoading, setBarangaysLoading] = useState(false)
    const [editFamily, setEditFamily] = useState(null)
    const [editForm, setEditForm] = useState({
        family_name: '',
        address: '',
        head_of_family: '',
        phone: '',
        barangay_id: '',
    })
    const [savingEdit, setSavingEdit] = useState(false)

    const location = useLocation()

    useEffect(() => {
        const barangayIdFromState = location.state?.barangayId
        if (barangayIdFromState) {
            setSelectedBarangayId(String(barangayIdFromState))
        }
    }, [location.state])

    const LOCAL_KEY = 'phams-local-families'
    const loadLocal = () => {
        try {
            return JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]') || []
        } catch (e) {
            return []
        }
    }

    // fetching families on mount — preload local families and accept `newFamily` passed via navigation state
    useEffect(() => {
        if (!isAuthenticated) return

        // show local-saved families immediately
        const local = loadLocal()
        if (local.length) setFamilies(local)

        const newFamily = location.state?.newFamily
        if (newFamily) setFamilies((prev) => [newFamily, ...prev])

        fetchFamilies()
        fetchBarangays()
    }, [isAuthenticated])

    const fetchFamilies = async () => {
        setLoading(true)
        setError('')
        setSuccessMessage('')
        try {
            const data = await apiFetch('/api/families')
            setFamilies(Array.isArray(data) ? data : (data.families || []))
        } catch (err) {
            const local = loadLocal()
            if (local.length) {
                // keep showing local families and show a recoverable error
                setFamilies(local)
                setError(err.message || 'Failed to fetch full list; showing local data.')
                setLoading(false)
                return
            }

            // no local data — show the error normally
            setError(err.message || 'Failed to load families.')
        } finally {
            setLoading(false)
        }
    }

    const fetchBarangays = async () => {
        setBarangaysLoading(true)
        try {
            const data = await apiFetch('/api/barangays')
            setBarangays(Array.isArray(data) ? data : [])
        } catch (err) {
            setBarangays([])
        } finally {
            setBarangaysLoading(false)
        }
    }

    const handleDelete = async (familyId) => {
        if (!confirm('Delete this family record? This cannot be undone.')) {
            return
        }

        setDeletingId(familyId)
        setError('')
        setSuccessMessage('')
        try {
            // If family is a locally stored entry, remove from localStorage
            if (typeof familyId === 'string' && familyId.startsWith('local-')) {
                const local = loadLocal().filter((f) => f.family_id !== familyId)
                localStorage.setItem(LOCAL_KEY, JSON.stringify(local))
                setFamilies((prev) => prev.filter((f) => f.family_id !== familyId))
                setSuccessMessage('Family deleted.')
            } else {
                await apiFetch(`/api/families/${familyId}`, { method: 'DELETE' })
                await fetchFamilies()
                setSuccessMessage('Family deleted.')
            }
        } catch (err) {
            setError(err.message || 'Failed to delete family.')
        } finally {
            setDeletingId(null)
        }
    }

    const openEditModal = (family) => {
        setEditFamily(family)
        setEditForm({
            family_name: family.family_name || '',
            address: family.address || '',
            head_of_family: family.head_of_family || '',
            phone: family.phone || '',
            barangay_id: family.barangay_id || '',
        })
        setError('')
        setSuccessMessage('')
    }

    const closeEditModal = () => {
        setEditFamily(null)
    }

    const handleEditChange = (event) => {
        const { name, value } = event.target
        setEditForm((current) => ({
            ...current,
            [name]: value,
        }))
    }

    const handleEditSubmit = async (event) => {
        event.preventDefault()
        if (!editFamily) return

        setSavingEdit(true)
        setError('')
        setSuccessMessage('')
        try {
            const payload = {
                family_name: editForm.family_name,
                address: editForm.address,
                head_of_family: editForm.head_of_family,
                phone: editForm.phone,
                barangay_id: editForm.barangay_id ? Number(editForm.barangay_id) : null,
            }

            await apiFetch(`/api/families/${editFamily.family_id}`, {
                method: 'PUT',
                body: JSON.stringify(payload),
            })

            setSuccessMessage('Family updated successfully.')
            closeEditModal()
            await fetchFamilies()
        } catch (err) {
            setError(err.message || 'Failed to update family.')
        } finally {
            setSavingEdit(false)
        }
    }

    // filter by search
    const filtered = families.filter((f) => {
        const q = (searchQuery ?? '').toLowerCase()
        const familyName = (f.family_name ?? '').toLowerCase()
        const barangayName = (f.barangay_name ?? '').toLowerCase()
        const address = (f.address ?? '').toLowerCase()
        const matchesBarangay = !selectedBarangayId || String(f.barangay_id) === String(selectedBarangayId)

        return (
            matchesBarangay &&
            (
                familyName.includes(q) ||
                barangayName.includes(q) ||
                address.includes(q)
            )
        )
    })

    return (
        <div className={`flex min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-[#0b1220] text-slate-100' : 'bg-[#e5e7eb] text-slate-900'
            }`}>
            <AdminSidebar isDarkMode={isDarkMode} />

            <main className="flex-1 p-8 overflow-auto ml-64">
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

                    {/* Messages */}
                    {successMessage ? (
                        <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                            {successMessage}
                        </div>
                    ) : null}

                    {error && families.length === 0 ? (
                        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            <div className="flex items-start gap-3">
                                <AlertTriangle size={20} />
                                <div className="flex-1">
                                    <p className="font-semibold">Failed to fetch families</p>
                                    <p className="mt-1">{error}</p>
                                    <div className="mt-3 flex items-center gap-3">
                                        <button
                                            onClick={() => fetchFamilies()}
                                            className="rounded-md bg-red-600 text-white px-3 py-1.5 text-sm font-semibold hover:bg-red-700 transition"
                                        >
                                            Retry
                                        </button>
                                        <button
                                            onClick={() => navigate('/admin/families/add')}
                                            className="rounded-md bg-green-600 text-white px-3 py-1.5 text-sm font-semibold hover:bg-green-700 transition"
                                        >
                                            Register New Family
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

                    <div className={`mb-6 flex flex-wrap items-center gap-3 rounded-xl border px-4 py-3 ${isDarkMode
                            ? 'border-white/10 bg-[#111c2e]'
                            : 'border-slate-200 bg-white'
                        }`}>
                        <label className={`text-xs font-semibold uppercase tracking-[0.08em] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                            Barangay Filter
                        </label>
                        <select
                            value={selectedBarangayId}
                            onChange={(e) => setSelectedBarangayId(e.target.value)}
                            className={`min-w-[220px] rounded-lg border px-3 py-2 text-sm outline-none ${isDarkMode
                                ? 'border-white/10 bg-[#0b1220] text-slate-100'
                                : 'border-slate-200 bg-slate-50 text-slate-900'
                            }`}
                        >
                            <option value="">All barangays</option>
                            {barangays.map((barangay) => (
                                <option key={barangay.barangay_id} value={barangay.barangay_id}>
                                    {barangay.name}
                                </option>
                            ))}
                        </select>
                        {selectedBarangayId ? (
                            <button
                                type="button"
                                onClick={() => setSelectedBarangayId('')}
                                className={`text-sm font-medium underline ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}
                            >
                                Clear filter
                            </button>
                        ) : null}
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
                                    {searchQuery || selectedBarangayId ? 'No families match the current filters.' : 'No families registered yet.'}
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
                                            <th className="px-6 py-4 text-left font-semibold">Image</th>
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
                                        {filtered.map((family) => {
                                            const priorityScore = Number(family.priority_score)
                                            const hasPriorityScore = Number.isFinite(priorityScore)

                                            return (
                                            <tr
                                                key={family.family_id}
                                                className={`transition ${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-slate-50'
                                                    }`}>
                                                <td className="px-6 py-4">
                                                    {family.image ? (
                                                        <img
                                                            src={`data:image/jpeg;base64,${family.image}`}
                                                            alt={`${family.family_name || 'Family'} photo`}
                                                            className="h-10 w-10 rounded-md object-cover"
                                                        />
                                                    ) : (
                                                        <span className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                                            —
                                                        </span>
                                                    )}
                                                </td>
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
                                                    {family.barangay_name || '—'}
                                                </td>

                                                {/* Member count */}
                                                <td className={`px-6 py-4 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                                                    {family.member_count ?? '—'}
                                                </td>

                                                {/* Priority score */}
                                                <td className="px-6 py-4">
                                                    {hasPriorityScore ? (
                                                        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${priorityScore >= 60
                                                                ? 'bg-red-100 text-red-700'
                                                                : priorityScore >= 30
                                                                    ? 'bg-amber-100 text-amber-700'
                                                                    : 'bg-green-100 text-green-700'
                                                            }`}>
                                                            {priorityScore.toFixed(1)}
                                                        </span>
                                                    ) : (
                                                        <span className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                                            —
                                                        </span>
                                                    )}
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
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <button
                                                            onClick={() => openEditModal(family)}
                                                            className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${isDarkMode
                                                                    ? 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                                                                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                                                }`}
                                                        >
                                                            <Pencil size={12} />
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(family.family_id)}
                                                            disabled={deletingId === family.family_id}
                                                            className="inline-flex items-center gap-1 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50"
                                                        >
                                                            <Trash2 size={12} />
                                                            {deletingId === family.family_id ? 'Deleting...' : 'Delete'}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {editFamily ? (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                            <div className={`w-full max-w-2xl rounded-2xl border p-6 shadow-xl ${isDarkMode
                                    ? 'bg-[#111c2e] border-white/10 text-slate-100'
                                    : 'bg-white border-slate-200 text-slate-900'
                                }`}>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold">Edit Family</h3>
                                    <button
                                        onClick={closeEditModal}
                                        className={`text-xs font-semibold px-3 py-1 rounded ${isDarkMode
                                                ? 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                            }`}
                                    >
                                        Close
                                    </button>
                                </div>

                                <form onSubmit={handleEditSubmit} className="space-y-4">
                                    <div>
                                        <label className={`mb-1 block text-xs font-semibold uppercase tracking-[0.08em] ${isDarkMode
                                                ? 'text-slate-300'
                                                : 'text-slate-600'
                                            }`}>
                                            Family Name
                                        </label>
                                        <input
                                            name="family_name"
                                            value={editForm.family_name}
                                            onChange={handleEditChange}
                                            required
                                            className={`w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/40 ${isDarkMode
                                                    ? 'border-slate-600 bg-slate-900 text-slate-100'
                                                    : 'border-slate-300 bg-white text-slate-900'
                                                }`}
                                        />
                                    </div>

                                    <div className="grid gap-3 md:grid-cols-2">
                                        <div>
                                            <label className={`mb-1 block text-xs font-semibold uppercase tracking-[0.08em] ${isDarkMode
                                                    ? 'text-slate-300'
                                                    : 'text-slate-600'
                                                }`}>
                                                Head of Family
                                            </label>
                                            <input
                                                name="head_of_family"
                                                value={editForm.head_of_family}
                                                onChange={handleEditChange}
                                                className={`w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/40 ${isDarkMode
                                                        ? 'border-slate-600 bg-slate-900 text-slate-100'
                                                        : 'border-slate-300 bg-white text-slate-900'
                                                    }`}
                                            />
                                        </div>
                                        <div>
                                            <label className={`mb-1 block text-xs font-semibold uppercase tracking-[0.08em] ${isDarkMode
                                                    ? 'text-slate-300'
                                                    : 'text-slate-600'
                                                }`}>
                                                Phone
                                            </label>
                                            <input
                                                name="phone"
                                                value={editForm.phone}
                                                onChange={handleEditChange}
                                                className={`w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/40 ${isDarkMode
                                                        ? 'border-slate-600 bg-slate-900 text-slate-100'
                                                        : 'border-slate-300 bg-white text-slate-900'
                                                    }`}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className={`mb-1 block text-xs font-semibold uppercase tracking-[0.08em] ${isDarkMode
                                                ? 'text-slate-300'
                                                : 'text-slate-600'
                                            }`}>
                                            Address
                                        </label>
                                        <input
                                            name="address"
                                            value={editForm.address}
                                            onChange={handleEditChange}
                                            className={`w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/40 ${isDarkMode
                                                    ? 'border-slate-600 bg-slate-900 text-slate-100'
                                                    : 'border-slate-300 bg-white text-slate-900'
                                                }`}
                                        />
                                    </div>

                                    <div>
                                        <label className={`mb-1 block text-xs font-semibold uppercase tracking-[0.08em] ${isDarkMode
                                                ? 'text-slate-300'
                                                : 'text-slate-600'
                                            }`}>
                                            Barangay
                                        </label>
                                        <select
                                            name="barangay_id"
                                            value={editForm.barangay_id}
                                            onChange={handleEditChange}
                                            disabled={barangaysLoading}
                                            className={`w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/40 ${isDarkMode
                                                    ? 'border-slate-600 bg-slate-900 text-slate-100'
                                                    : 'border-slate-300 bg-white text-slate-900'
                                                }`}
                                        >
                                            <option value="">Select barangay</option>
                                            {barangays.map((barangay) => (
                                                <option key={barangay.barangay_id} value={barangay.barangay_id}>
                                                    {barangay.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="flex items-center justify-end gap-3">
                                        <button
                                            type="button"
                                            onClick={closeEditModal}
                                            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${isDarkMode
                                                    ? 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                                                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                                }`}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={savingEdit}
                                            className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm font-semibold transition disabled:opacity-50"
                                        >
                                            {savingEdit ? 'Saving...' : 'Save Changes'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    ) : null}

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
