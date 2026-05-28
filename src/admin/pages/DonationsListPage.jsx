import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, AlertTriangle, Archive, Gift, RefreshCw, CheckCircle, XCircle } from 'lucide-react'
import { useDarkMode } from '../../hooks/useDarkMode'
import { useAdminAuth } from '../../context/AdminAuthContext'
import AdminSidebar from '../components/AdminSidebar'
import { apiFetch } from '../../api/api'

const POLL_INTERVAL = 5000

const STATUS_STYLES = {
  pending:  'bg-amber-100 text-amber-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-600',
}

function StatusBadge({ status }) {
  const s = String(status || 'pending').toLowerCase()
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${STATUS_STYLES[s] || 'bg-slate-100 text-slate-600'}`}>
      {s}
    </span>
  )
}

function DonationsListPage() {
    const { isDarkMode, toggleDarkMode } = useDarkMode()
    const { isAuthenticated } = useAdminAuth()
    const navigate = useNavigate()

    const [donations, setDonations] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [successMessage, setSuccessMessage] = useState('')
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [deletingId, setDeletingId] = useState(null)
    const [actioningId, setActioningId] = useState(null)
    const [refreshing, setRefreshing] = useState(false)
    const [proofDonation, setProofDonation] = useState(null)
    const [rejectModal, setRejectModal] = useState(null) // { donation_id }
    const [rejectReason, setRejectReason] = useState('')
    const pollIntervalRef = useRef(null)
    const lastCountRef = useRef(0)

    useEffect(() => {
        if (!isAuthenticated) return
        fetchDonations()
        pollIntervalRef.current = setInterval(() => { fetchDonations(true) }, POLL_INTERVAL)
        return () => { if (pollIntervalRef.current) clearInterval(pollIntervalRef.current) }
    }, [isAuthenticated])

    const fetchDonations = async (silent = false) => {
        if (!silent) { setLoading(true); setError(''); setSuccessMessage('') }
        else setRefreshing(true)
        try {
            const data = await apiFetch('/api/donations')
            const newDonations = Array.isArray(data) ? data : []
            setDonations(newDonations)
            if (silent && newDonations.length > lastCountRef.current) {
                setSuccessMessage(`New donation(s) added: ${newDonations.length - lastCountRef.current}`)
                setTimeout(() => setSuccessMessage(''), 3000)
            }
            lastCountRef.current = newDonations.length
        } catch (err) {
            if (!silent) setError(err.message || 'Failed to load donations.')
        } finally {
            if (!silent) setLoading(false)
            else setRefreshing(false)
        }
    }

    const handleArchive = async (donationId) => {
        if (!confirm('Archive this donation record? It will be hidden from the main list but preserved for audit and compliance purposes.')) return
        setDeletingId(donationId)
        setError(''); setSuccessMessage('')
        try {
            await apiFetch(`/api/donations/${donationId}`, { method: 'DELETE' })
            setSuccessMessage('Donation archived.')
            await fetchDonations()
        } catch (err) {
            setError(err.message || 'Failed to archive donation.')
        } finally {
            setDeletingId(null)
        }
    }

    const handleApprove = async (donationId) => {
        if (!confirm('Approve this donation?')) return
        setActioningId(donationId)
        setError(''); setSuccessMessage('')
        try {
            await apiFetch(`/api/donations/${donationId}/approve`, { method: 'PUT' })
            setSuccessMessage('Donation approved.')
            await fetchDonations()
        } catch (err) {
            setError(err.message || 'Failed to approve donation.')
        } finally {
            setActioningId(null)
        }
    }

    const openRejectModal = (donation) => {
        setRejectModal(donation)
        setRejectReason('')
    }

    const handleReject = async () => {
        if (!rejectModal) return
        setActioningId(rejectModal.donation_id)
        setError(''); setSuccessMessage('')
        try {
            await apiFetch(`/api/donations/${rejectModal.donation_id}/reject`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rejection_reason: rejectReason }),
            })
            setSuccessMessage('Donation rejected.')
            setRejectModal(null)
            await fetchDonations()
        } catch (err) {
            setError(err.message || 'Failed to reject donation.')
        } finally {
            setActioningId(null)
        }
    }

    const openProofModal = (donation) => { setProofDonation(donation); document.body.style.overflow = 'hidden' }
    const closeProofModal = () => { setProofDonation(null); document.body.style.overflow = 'unset' }

    const filtered = donations.filter((donation) => {
        const q = (searchQuery ?? '').toLowerCase()
        const matchSearch = (donation.donor_name ?? '').toLowerCase().includes(q)
            || (donation.food_name ?? '').toLowerCase().includes(q)
            || (donation.food_description ?? '').toLowerCase().includes(q)
            || (donation.tracking_number ?? '').toLowerCase().includes(q)
            || (donation.barangay_name ?? '').toLowerCase().includes(q)
        if (!matchSearch) return false
        if (statusFilter !== 'all' && (donation.status || 'pending') !== statusFilter) return false
        return true
    })

    const formatDate = (value) => {
        if (!value) return '—'
        const parsed = new Date(value)
        if (Number.isNaN(parsed.getTime())) return '—'
        return parsed.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    }

    const pendingCount = donations.filter((d) => (d.status || 'pending') === 'pending').length

    const inputClass = `flex-1 bg-transparent text-sm outline-none ${isDarkMode ? 'text-slate-100 placeholder-slate-500' : 'text-slate-900 placeholder-slate-400'}`

    return (
        <div className={`flex min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-[#0b1220] text-slate-100' : 'bg-[#e5e7eb] text-slate-900'}`}>
            <AdminSidebar isDarkMode={isDarkMode} />

            <main className="flex-1 pt-16 px-4 pb-4 md:p-8 overflow-auto md:ml-64">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Manage Donations</h2>
                            <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                {donations.length} recorded &nbsp;{pendingCount > 0 && <span className="text-amber-600 font-semibold">· {pendingCount} pending review</span>}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => fetchDonations(false)}
                                disabled={refreshing}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition ${isDarkMode ? 'border border-white/10 text-slate-300 hover:bg-white/5 disabled:opacity-50' : 'border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-50'}`}
                            >
                                <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
                                {refreshing ? 'Refreshing...' : 'Refresh'}
                            </button>
                            <button
                                onClick={() => navigate('/admin/donations/add')}
                                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition"
                            >
                                <Gift size={16} /> Log Donation
                            </button>
                        </div>
                    </div>

                    {successMessage && (
                        <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{successMessage}</div>
                    )}
                    {error && (
                        <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            <AlertTriangle size={16} className="mt-0.5 shrink-0" />{error}
                        </div>
                    )}

                    {/* Search + status filter bar */}
                    <div className="mb-4 flex flex-wrap items-center gap-3">
                        <div className={`flex flex-1 items-center gap-3 rounded-xl border px-4 py-2.5 ${isDarkMode ? 'border-white/10 bg-[#111c2e]' : 'border-slate-200 bg-white'}`}>
                            <Search size={16} className="text-slate-400 shrink-0" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search donor, food, tracking number, barangay..."
                                className={inputClass}
                            />
                        </div>
                        <div className="flex gap-1">
                            {['all', 'pending', 'approved', 'rejected'].map((s) => (
                                <button
                                    key={s}
                                    onClick={() => setStatusFilter(s)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition ${statusFilter === s
                                        ? s === 'pending' ? 'bg-amber-500 text-white'
                                          : s === 'approved' ? 'bg-green-600 text-white'
                                          : s === 'rejected' ? 'bg-red-500 text-white'
                                          : 'bg-blue-600 text-white'
                                        : isDarkMode ? 'bg-white/10 text-slate-300 hover:bg-white/20' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                                    }`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className={`rounded-2xl border shadow-sm overflow-hidden ${isDarkMode ? 'border-white/10 bg-[#111c2e]' : 'border-slate-200 bg-white'}`}>
                        {loading ? (
                            <div className={`p-12 text-center text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Loading donations...</div>
                        ) : filtered.length === 0 ? (
                            <div className={`p-12 text-center ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                <Gift size={36} className="mx-auto mb-3 opacity-30" />
                                <p className="text-sm">{searchQuery || statusFilter !== 'all' ? 'No donations match your filter.' : 'No donations recorded yet.'}</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className={`border-b text-xs uppercase tracking-wide ${isDarkMode ? 'border-white/10 text-slate-400' : 'border-slate-200 text-slate-500'}`}>
                                            <th className="px-4 py-4 text-left font-semibold">Image</th>
                                            <th className="px-4 py-4 text-left font-semibold">Tracking #</th>
                                            <th className="px-4 py-4 text-left font-semibold">Status</th>
                                            <th className="px-4 py-4 text-left font-semibold">Type</th>
                                            <th className="px-4 py-4 text-left font-semibold">Donor</th>
                                            <th className="px-4 py-4 text-left font-semibold">Item / Amount</th>
                                            <th className="px-4 py-4 text-left font-semibold">Qty</th>
                                            <th className="px-4 py-4 text-left font-semibold">Barangay</th>
                                            <th className="px-4 py-4 text-left font-semibold">Date</th>
                                            <th className="px-4 py-4 text-left font-semibold">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className={`divide-y ${isDarkMode ? 'divide-white/5' : 'divide-slate-100'}`}>
                                        {filtered.map((donation) => {
                                            const status = (donation.status || 'pending').toLowerCase()
                                            const isPending = status === 'pending'
                                            const isRejected = status === 'rejected'
                                            const isMonetary = (donation.donation_type || '') === 'monetary'
                                            return (
                                                <tr key={donation.donation_id} className={`transition ${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-slate-50'}`}>
                                                    <td className="px-4 py-4">
                                                        {donation.image ? (
                                                            <img src={`data:image/jpeg;base64,${donation.image}`} alt="Donation" className="h-10 w-10 rounded-md object-cover cursor-pointer" onClick={() => openProofModal(donation)} />
                                                        ) : <span className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>—</span>}
                                                    </td>
                                                    <td className={`px-4 py-4 font-mono text-xs ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                                                        {donation.tracking_number || '—'}
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <StatusBadge status={donation.status} />
                                                        {isRejected && donation.rejection_reason && (
                                                            <p className={`mt-1 text-xs max-w-[120px] truncate ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`} title={donation.rejection_reason}>
                                                                {donation.rejection_reason}
                                                            </p>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <span className={`text-xs capitalize ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                                                            {donation.donation_type || 'food'}
                                                        </span>
                                                    </td>
                                                    <td className={`px-4 py-4 ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>{donation.donor_name || '—'}</td>
                                                    <td className={`px-4 py-4 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                                                        {isMonetary ? <span className="text-emerald-600 font-semibold">₱ {Number(donation.quantity || 0).toLocaleString()}</span>
                                                            : (donation.food_name || donation.food_description || '—')}
                                                    </td>
                                                    <td className={`px-4 py-4 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                                                        {isMonetary ? '—' : `${donation.quantity ?? '—'} ${donation.quantity_unit || donation.unit || ''}`}
                                                    </td>
                                                    <td className={`px-4 py-4 text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                                        {donation.barangay_name || <span className="italic">Municipality-wide</span>}
                                                    </td>
                                                    <td className={`px-4 py-4 text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{formatDate(donation.date_given)}</td>
                                                    <td className="px-4 py-4">
                                                        <div className="flex flex-wrap items-center gap-1.5">
                                                            {donation.image && (
                                                                <button
                                                                    onClick={() => openProofModal(donation)}
                                                                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${isDarkMode ? 'bg-blue-700/70 text-blue-100 hover:bg-blue-700' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}
                                                                >
                                                                    Proof
                                                                </button>
                                                            )}
                                                            {isPending && (
                                                                <button
                                                                    onClick={() => handleApprove(donation.donation_id)}
                                                                    disabled={actioningId === donation.donation_id}
                                                                    className="inline-flex items-center gap-1 rounded-lg bg-green-600 text-white hover:bg-green-700 px-2.5 py-1 text-xs font-semibold transition disabled:opacity-50"
                                                                >
                                                                    <CheckCircle size={11} /> Approve
                                                                </button>
                                                            )}
                                                            {isPending && (
                                                                <button
                                                                    onClick={() => openRejectModal(donation)}
                                                                    disabled={actioningId === donation.donation_id}
                                                                    className="inline-flex items-center gap-1 rounded-lg bg-red-500 text-white hover:bg-red-600 px-2.5 py-1 text-xs font-semibold transition disabled:opacity-50"
                                                                >
                                                                    <XCircle size={11} /> Reject
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={() => handleArchive(donation.donation_id)}
                                                                disabled={deletingId === donation.donation_id}
                                                                className="inline-flex items-center gap-1 rounded-lg border border-slate-300 text-slate-500 hover:bg-slate-50 px-2.5 py-1 text-xs font-semibold transition disabled:opacity-50"
                                                                title="Archive (record preserved for compliance)"
                                                            >
                                                                <Archive size={11} />
                                                                {deletingId === donation.donation_id ? '...' : 'Archive'}
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
                </div>
            </main>

            <button
                onClick={toggleDarkMode}
                className={`fixed bottom-5 right-5 z-50 h-12 w-12 rounded-full shadow-lg transition-colors grid place-items-center text-lg font-bold ${isDarkMode ? 'bg-slate-700 text-yellow-300 hover:bg-slate-600' : 'bg-blue-900 text-white hover:bg-blue-800'}`}
                aria-label="Toggle dark mode"
            >
                {isDarkMode ? '☀️' : '🌙'}
            </button>

            {/* Proof modal */}
            {proofDonation && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={closeProofModal}>
                    <div className={`w-full max-w-3xl rounded-2xl border p-4 shadow-xl ${isDarkMode ? 'bg-[#111c2e] border-white/10' : 'bg-white border-slate-200'}`} onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-3">
                            <div>
                                <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Proof of Donation</h3>
                                {proofDonation.tracking_number && (
                                    <p className={`text-xs font-mono ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{proofDonation.tracking_number}</p>
                                )}
                            </div>
                            <button onClick={closeProofModal} className={`text-xs font-semibold px-3 py-1 rounded ${isDarkMode ? 'bg-slate-700 text-slate-200 hover:bg-slate-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>Close</button>
                        </div>
                        <img src={`data:image/jpeg;base64,${proofDonation.image}`} alt="Proof" className="max-h-[75vh] w-full rounded-lg object-contain" />
                    </div>
                </div>
            )}

            {/* Reject reason modal */}
            {rejectModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                    <div className={`w-full max-w-md rounded-2xl border p-6 shadow-xl ${isDarkMode ? 'bg-[#111c2e] border-white/10 text-slate-100' : 'bg-white border-slate-200 text-slate-900'}`}>
                        <h3 className="text-lg font-semibold mb-1">Reject Donation</h3>
                        <p className={`text-sm mb-4 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                            Rejecting donation from <strong>{rejectModal.donor_name}</strong>.
                        </p>
                        <label className={`block text-xs font-semibold uppercase tracking-wide mb-1.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                            Reason (optional)
                        </label>
                        <textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            rows={3}
                            placeholder="Enter reason for rejection..."
                            className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-red-400/40 transition ${isDarkMode ? 'border-white/10 bg-[#0b1220] text-slate-100 placeholder-slate-500' : 'border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400'}`}
                        />
                        <div className="mt-4 flex justify-end gap-2">
                            <button onClick={() => setRejectModal(null)} className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${isDarkMode ? 'bg-white/10 text-slate-300 hover:bg-white/20' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}>
                                Cancel
                            </button>
                            <button
                                onClick={handleReject}
                                disabled={actioningId === rejectModal.donation_id}
                                className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition disabled:opacity-50"
                            >
                                {actioningId === rejectModal.donation_id ? 'Rejecting...' : 'Confirm Reject'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default DonationsListPage
