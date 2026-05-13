import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, AlertTriangle, Trash2, Gift } from 'lucide-react'
import { useDarkMode } from '../../hooks/useDarkMode'
import { useAdminAuth } from '../../context/AdminAuthContext'
import AdminSidebar from '../components/AdminSidebar'
import { apiFetch } from '../../api/api'

function DonationsListPage() {
    const { isDarkMode, toggleDarkMode } = useDarkMode()
    const { isAuthenticated } = useAdminAuth()
    const navigate = useNavigate()

    const [donations, setDonations] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [successMessage, setSuccessMessage] = useState('')
    const [searchQuery, setSearchQuery] = useState('')
    const [deletingId, setDeletingId] = useState(null)

    useEffect(() => {
        if (!isAuthenticated) return
        fetchDonations()
    }, [isAuthenticated])

    const fetchDonations = async () => {
        setLoading(true)
        setError('')
        setSuccessMessage('')
        try {
            const data = await apiFetch('/api/donations')
            setDonations(Array.isArray(data) ? data : [])
        } catch (err) {
            setError(err.message || 'Failed to load donations.')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (donationId) => {
        if (!confirm('Delete this donation record? This cannot be undone.')) {
            return
        }

        setDeletingId(donationId)
        setError('')
        setSuccessMessage('')
        try {
            await apiFetch(`/api/donations/${donationId}`, { method: 'DELETE' })
            setSuccessMessage('Donation deleted.')
            await fetchDonations()
        } catch (err) {
            setError(err.message || 'Failed to delete donation.')
        } finally {
            setDeletingId(null)
        }
    }

    const filtered = donations.filter((donation) => {
        const q = (searchQuery ?? '').toLowerCase()
        const donor = (donation.donor_name ?? '').toLowerCase()
        const food = (donation.food_name ?? '').toLowerCase()

        return donor.includes(q) || food.includes(q)
    })

    const formatDate = (value) => {
        if (!value) return '—'
        const parsed = new Date(value)
        if (Number.isNaN(parsed.getTime())) return '—'
        return parsed.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    }

    return (
        <div className={`flex min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-[#0b1220] text-slate-100' : 'bg-[#e5e7eb] text-slate-900'}`}>
            <AdminSidebar isDarkMode={isDarkMode} />

            <main className="flex-1 p-8 overflow-auto ml-64">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                                Manage Donations
                            </h2>
                            <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                {donations.length} recorded {donations.length === 1 ? 'donation' : 'donations'}
                            </p>
                        </div>
                        <button
                            onClick={() => navigate('/admin/donations/add')}
                            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition"
                        >
                            <Gift size={16} />
                            Log Donation
                        </button>
                    </div>

                    {successMessage ? (
                        <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                            {successMessage}
                        </div>
                    ) : null}

                    {error && donations.length === 0 ? (
                        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            <div className="flex items-start gap-3">
                                <AlertTriangle size={20} />
                                <div className="flex-1">
                                    <p className="font-semibold">Failed to fetch donations</p>
                                    <p className="mt-1">{error}</p>
                                    <div className="mt-3 flex items-center gap-3">
                                        <button
                                            onClick={fetchDonations}
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
                            placeholder="Search by donor or food name..."
                            className={`flex-1 bg-transparent text-sm outline-none ${isDarkMode ? 'text-slate-100 placeholder-slate-500' : 'text-slate-900 placeholder-slate-400'}`}
                        />
                    </div>

                    <div className={`rounded-2xl border shadow-sm overflow-hidden ${isDarkMode ? 'border-white/10 bg-[#111c2e]' : 'border-slate-200 bg-white'}`}>
                        {loading ? (
                            <div className={`p-12 text-center text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                Loading donations...
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className={`p-12 text-center ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                <Gift size={36} className="mx-auto mb-3 opacity-30" />
                                <p className="text-sm">
                                    {searchQuery ? 'No donations match your search.' : 'No donations recorded yet.'}
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className={`border-b text-xs uppercase tracking-wide ${isDarkMode ? 'border-white/10 text-slate-400' : 'border-slate-200 text-slate-500'}`}>
                                            <th className="px-6 py-4 text-left font-semibold">Image</th>
                                            <th className="px-6 py-4 text-left font-semibold">Donor</th>
                                            <th className="px-6 py-4 text-left font-semibold">Food</th>
                                            <th className="px-6 py-4 text-left font-semibold">Quantity</th>
                                            <th className="px-6 py-4 text-left font-semibold">Unit</th>
                                            <th className="px-6 py-4 text-left font-semibold">Date Given</th>
                                            <th className="px-6 py-4 text-left font-semibold">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {filtered.map((donation) => (
                                            <tr
                                                key={donation.donation_id}
                                                className={`transition ${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-slate-50'}`}
                                            >
                                                <td className="px-6 py-4">
                                                    {donation.image ? (
                                                        <img
                                                            src={`data:image/jpeg;base64,${donation.image}`}
                                                            alt="Donation photo"
                                                            className="h-10 w-10 rounded-md object-cover"
                                                        />
                                                    ) : (
                                                        <span className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                                            —
                                                        </span>
                                                    )}
                                                </td>
                                                <td className={`px-6 py-4 ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                                                    {donation.donor_name || '—'}
                                                </td>
                                                <td className={`px-6 py-4 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                                                    {donation.food_name || '—'}
                                                </td>
                                                <td className={`px-6 py-4 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                                                    {donation.quantity ?? '—'}
                                                </td>
                                                <td className={`px-6 py-4 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                                                    {donation.unit || '—'}
                                                </td>
                                                <td className={`px-6 py-4 text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                                    {formatDate(donation.date_given)}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <button
                                                        onClick={() => handleDelete(donation.donation_id)}
                                                        disabled={deletingId === donation.donation_id}
                                                        className="inline-flex items-center gap-1 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50"
                                                    >
                                                        <Trash2 size={12} />
                                                        {deletingId === donation.donation_id ? 'Deleting...' : 'Delete'}
                                                    </button>
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
        </div>
    )
}

export default DonationsListPage
