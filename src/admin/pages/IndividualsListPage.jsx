import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Users, Search, AlertTriangle, Pencil, Trash2 } from 'lucide-react'
import { useDarkMode } from '../../hooks/useDarkMode'
import { useAdminAuth } from '../../context/AdminAuthContext'
import AdminSidebar from '../components/AdminSidebar'
import { apiFetch } from '../../api/api'

function IndividualsListPage() {
    const { isDarkMode, toggleDarkMode } = useDarkMode()
    const { isAuthenticated } = useAdminAuth()
    const navigate = useNavigate()

    const [individuals, setIndividuals] = useState([])
    const [barangays, setBarangays] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [successMessage, setSuccessMessage] = useState('')
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedBarangayId, setSelectedBarangayId] = useState('')
    const [deletingId, setDeletingId] = useState(null)
    const [editingIndividual, setEditingIndividual] = useState(null)
    const [editForm, setEditForm] = useState({
        name: '',
        age: '',
        gender: 'Male',
        barangay_id: '',
        status: 'Registered',
    })
    const [savingEdit, setSavingEdit] = useState(false)
    const location = useLocation()

    useEffect(() => {
        const barangayIdFromState = location.state?.barangayId
        if (barangayIdFromState) {
            setSelectedBarangayId(String(barangayIdFromState))
        }
    }, [location.state])

    useEffect(() => {
        if (!isAuthenticated) return
        fetchIndividuals()
        fetchBarangays()
    }, [isAuthenticated])

    const fetchIndividuals = async () => {
        setLoading(true)
        setError('')
        setSuccessMessage('')
        try {
            const data = await apiFetch('/api/individuals')
            setIndividuals(Array.isArray(data) ? data : [])
        } catch (err) {
            setError(err.message || 'Failed to load individuals.')
        } finally {
            setLoading(false)
        }
    }

    const fetchBarangays = async () => {
        try {
            const data = await apiFetch('/api/barangays')
            setBarangays(Array.isArray(data) ? data : [])
        } catch {
            setBarangays([])
        }
    }

    const handleDelete = async (individualId) => {
        if (!confirm('Delete this individual record? This cannot be undone.')) {
            return
        }

        setDeletingId(individualId)
        setError('')
        setSuccessMessage('')
        try {
            await apiFetch(`/api/individuals/${individualId}`, { method: 'DELETE' })
            setSuccessMessage('Individual deleted.')
            await fetchIndividuals()
        } catch (err) {
            setError(err.message || 'Failed to delete individual.')
        } finally {
            setDeletingId(null)
        }
    }

    const openEditModal = (individual) => {
        setEditingIndividual(individual)
        setEditForm({
            name: individual.name || '',
            age: individual.age ?? '',
            gender: individual.gender || 'Male',
            barangay_id: individual.barangay_id || '',
            status: individual.status || 'Registered',
        })
        setError('')
        setSuccessMessage('')
    }

    const closeEditModal = () => {
        setEditingIndividual(null)
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
        if (!editingIndividual) return

        setSavingEdit(true)
        setError('')
        setSuccessMessage('')
        try {
            const payload = {
                name: editForm.name,
                age: editForm.age === '' ? null : Number(editForm.age),
                gender: editForm.gender,
                barangay_id: editForm.barangay_id ? Number(editForm.barangay_id) : null,
                status: editForm.status,
            }

            await apiFetch(`/api/individuals/${editingIndividual.individual_id}`, {
                method: 'PUT',
                body: JSON.stringify(payload),
            })

            setSuccessMessage('Individual updated successfully.')
            closeEditModal()
            await fetchIndividuals()
        } catch (err) {
            setError(err.message || 'Failed to update individual.')
        } finally {
            setSavingEdit(false)
        }
    }

    const filtered = individuals.filter((individual) => {
        const q = (searchQuery ?? '').toLowerCase()
        const name = (individual.name ?? '').toLowerCase()
        const barangay = (individual.barangay_name ?? '').toLowerCase()
        const matchesBarangay = !selectedBarangayId || String(individual.barangay_id) === String(selectedBarangayId)

        return matchesBarangay && (name.includes(q) || barangay.includes(q))
    })

    return (
        <div className={`flex min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-[#0b1220] text-slate-100' : 'bg-[#e5e7eb] text-slate-900'}`}>
            <AdminSidebar isDarkMode={isDarkMode} />

            <main className="flex-1 p-8 overflow-auto ml-64">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                                Manage Individuals
                            </h2>
                            <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                {individuals.length} registered {individuals.length === 1 ? 'individual' : 'individuals'}
                            </p>
                        </div>
                    </div>

                    {successMessage ? (
                        <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                            {successMessage}
                        </div>
                    ) : null}

                    {error && individuals.length === 0 ? (
                        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            <div className="flex items-start gap-3">
                                <AlertTriangle size={20} />
                                <div className="flex-1">
                                    <p className="font-semibold">Failed to fetch individuals</p>
                                    <p className="mt-1">{error}</p>
                                    <div className="mt-3 flex items-center gap-3">
                                        <button
                                            onClick={fetchIndividuals}
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

                    <div className={`mb-6 flex items-center gap-3 rounded-xl border px-4 py-2.5 ${isDarkMode ? 'border-white/10 bg-[#111c2e]' : 'border-slate-200 bg-white'}`}>
                        <Search size={16} className={isDarkMode ? 'text-slate-400' : 'text-slate-400'} />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by name or barangay..."
                            className={`flex-1 bg-transparent text-sm outline-none ${isDarkMode ? 'text-slate-100 placeholder-slate-500' : 'text-slate-900 placeholder-slate-400'}`}
                        />
                    </div>

                    <div className={`mb-6 flex flex-wrap items-center gap-3 rounded-xl border px-4 py-3 ${isDarkMode ? 'border-white/10 bg-[#111c2e]' : 'border-slate-200 bg-white'}`}>
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

                    <div className={`rounded-2xl border shadow-sm overflow-hidden ${isDarkMode ? 'border-white/10 bg-[#111c2e]' : 'border-slate-200 bg-white'}`}>
                        {loading ? (
                            <div className={`p-12 text-center text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                Loading individuals...
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className={`p-12 text-center ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                <Users size={36} className="mx-auto mb-3 opacity-30" />
                                <p className="text-sm">
                                    {searchQuery || selectedBarangayId ? 'No individuals match the current filters.' : 'No individuals registered yet.'}
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className={`border-b text-xs uppercase tracking-wide ${isDarkMode ? 'border-white/10 text-slate-400' : 'border-slate-200 text-slate-500'}`}>
                                            <th className="px-6 py-4 text-left font-semibold">Name</th>
                                            <th className="px-6 py-4 text-left font-semibold">Age</th>
                                            <th className="px-6 py-4 text-left font-semibold">Gender</th>
                                            <th className="px-6 py-4 text-left font-semibold">Barangay</th>
                                            <th className="px-6 py-4 text-left font-semibold">Status</th>
                                            <th className="px-6 py-4 text-left font-semibold">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {filtered.map((individual) => (
                                            <tr
                                                key={individual.individual_id}
                                                className={`transition ${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-slate-50'}`}
                                            >
                                                <td className={`px-6 py-4 ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                                                    {individual.name || '—'}
                                                </td>
                                                <td className={`px-6 py-4 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                                                    {individual.age ?? '—'}
                                                </td>
                                                <td className={`px-6 py-4 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                                                    {individual.gender || '—'}
                                                </td>
                                                <td className={`px-6 py-4 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                                                    {individual.barangay_name || '—'}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                                                        individual.status === 'Received'
                                                            ? 'bg-emerald-100 text-emerald-700'
                                                            : 'bg-amber-100 text-amber-700'
                                                    }`}>
                                                        {individual.status || 'Registered'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <button
                                                            onClick={() => openEditModal(individual)}
                                                            className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${isDarkMode
                                                                ? 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                                                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                                            }`}
                                                        >
                                                            <Pencil size={12} />
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(individual.individual_id)}
                                                            disabled={deletingId === individual.individual_id}
                                                            className="inline-flex items-center gap-1 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50"
                                                        >
                                                            <Trash2 size={12} />
                                                            {deletingId === individual.individual_id ? 'Deleting...' : 'Delete'}
                                                        </button>
                                                    </div>
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

            <button
                onClick={toggleDarkMode}
                className={`fixed bottom-5 right-5 z-50 h-12 w-12 rounded-full shadow-lg transition-colors grid place-items-center text-lg font-bold ${isDarkMode ? 'bg-slate-700 text-yellow-300 hover:bg-slate-600' : 'bg-blue-900 text-white hover:bg-blue-800'}`}
                aria-label="Toggle dark mode"
            >
                {isDarkMode ? '☀️' : '🌙'}
            </button>

            {editingIndividual ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className={`w-full max-w-2xl rounded-2xl border p-6 shadow-xl ${isDarkMode
                        ? 'bg-[#111c2e] border-white/10 text-slate-100'
                        : 'bg-white border-slate-200 text-slate-900'
                    }`}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">Edit Individual</h3>
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
                                    Name
                                </label>
                                <input
                                    name="name"
                                    value={editForm.name}
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
                                        Age
                                    </label>
                                    <input
                                        type="number"
                                        name="age"
                                        value={editForm.age}
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
                                        Gender
                                    </label>
                                    <select
                                        name="gender"
                                        value={editForm.gender}
                                        onChange={handleEditChange}
                                        className={`w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/40 ${isDarkMode
                                            ? 'border-slate-600 bg-slate-900 text-slate-100'
                                            : 'border-slate-300 bg-white text-slate-900'
                                        }`}
                                    >
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid gap-3 md:grid-cols-2">
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
                                <div>
                                    <label className={`mb-1 block text-xs font-semibold uppercase tracking-[0.08em] ${isDarkMode
                                        ? 'text-slate-300'
                                        : 'text-slate-600'
                                    }`}>
                                        Status
                                    </label>
                                    <select
                                        name="status"
                                        value={editForm.status}
                                        onChange={handleEditChange}
                                        className={`w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/40 ${isDarkMode
                                            ? 'border-slate-600 bg-slate-900 text-slate-100'
                                            : 'border-slate-300 bg-white text-slate-900'
                                        }`}
                                    >
                                        <option value="Registered">Registered</option>
                                        <option value="Received">Received</option>
                                    </select>
                                </div>
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
    )
}

export default IndividualsListPage
