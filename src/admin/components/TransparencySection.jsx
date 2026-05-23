import { useEffect, useMemo, useState } from 'react'
import { Download, Pencil, Trash2 } from 'lucide-react'
import { apiFetch } from '../../api/api'
import { formatDistributionDetails, getCurrentStaffActor } from '../../utils/staffActivity'

export default function TransparencySection({ isDarkMode }) {
  const [distributions, setDistributions] = useState([])
  const [foodSupplies, setFoodSupplies] = useState([])
  const [activityLogs, setActivityLogs] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [actionError, setActionError] = useState('')
  const [editingDistribution, setEditingDistribution] = useState(null)
  const [editingStatus, setEditingStatus] = useState('Pending')
  const [savingStatus, setSavingStatus] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  const loadTransparencyData = async () => {
    setLoading(true)
    setError('')
    setActionError('')
    try {
      const [distData, supplyData, logData, usersData] = await Promise.all([
        apiFetch('/api/distributions'),
        apiFetch('/api/food-supplies'),
        apiFetch('/api/activity-logs?limit=12'),
        apiFetch('/api/users'),
      ])

      setDistributions(Array.isArray(distData) ? distData : [])
      setFoodSupplies(Array.isArray(supplyData) ? supplyData : [])
      setActivityLogs(Array.isArray(logData) ? logData : [])
      setUsers(Array.isArray(usersData) ? usersData : [])
    } catch (err) {
      setError(err.message || 'Failed to load transparency data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTransparencyData()
  }, [])

  useEffect(() => {
    const refreshWhenVisible = () => {
      if (!document.hidden) {
        loadTransparencyData()
      }
    }

    const intervalId = window.setInterval(refreshWhenVisible, 15000)
    window.addEventListener('focus', refreshWhenVisible)
    document.addEventListener('visibilitychange', refreshWhenVisible)

    return () => {
      window.clearInterval(intervalId)
      window.removeEventListener('focus', refreshWhenVisible)
      document.removeEventListener('visibilitychange', refreshWhenVisible)
    }
  }, [])

  // Cleanup body overflow when component unmounts
  useEffect(() => {
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  const formatDate = (value) => {
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) return '—'
    return parsed.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  const formatTimestamp = (value) => {
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) return '—'
    return parsed.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  const recentActivities = useMemo(() => {
    const sorted = [...activityLogs].sort((a, b) => {
      const aTime = new Date(a.performed_at || a.created_at || 0).getTime()
      const bTime = new Date(b.performed_at || b.created_at || 0).getTime()
      return bTime - aTime
    })

    return sorted.slice(0, 5).map((activity, index) => {
      const action = String(activity.action || 'updated').toLowerCase()
      const actionLabelMap = {
        created: 'Created',
        distributed: 'Distributed',
        updated: 'Updated',
        deleted: 'Deleted',
      }
      const staffName = activity.staff_name || 'System'
      const staffId = activity.staff_user_id ? `#${activity.staff_user_id}` : 'n/a'

      return {
        id: activity.distribution_id || index,
        action: actionLabelMap[action] || 'Updated',
        timestamp: formatTimestamp(activity.performed_at || activity.created_at || activity.date_given),
        staff: `${staffName} (${staffId})`,
        details: activity.distribution_details || formatDistributionDetails(activity),
        status: activity.status || 'Recorded',
      }
    })
  }, [activityLogs])

  const assistanceBreakdown = useMemo(() => {
    const totals = foodSupplies.map((supply) => ({
      category: supply.food_name || 'Unknown',
      count: Number(supply.total_quantity) || 0,
    }))

    const totalCount = totals.reduce((sum, item) => sum + item.count, 0)
    return totals
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map((item) => ({
        ...item,
        percentage: totalCount > 0 ? Math.round((item.count / totalCount) * 100) : 0,
      }))
  }, [foodSupplies])

  const barangayDistribution = useMemo(() => {
    const counts = distributions.reduce((acc, item) => {
      const key = item.barangay_name || 'Unknown'
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {})

    const items = Object.entries(counts).map(([barangay, families]) => ({ barangay, families }))
    const total = items.reduce((sum, item) => sum + item.families, 0)

    return items
      .sort((a, b) => b.families - a.families)
      .slice(0, 6)
      .map((item) => ({
        ...item,
        percentage: total > 0 ? Math.round((item.families / total) * 100) : 0,
      }))
  }, [distributions])

  const summaryStats = useMemo(() => {
    const totalAssistance = distributions.length
    const uniqueFamilies = new Set(
      distributions.map((item) => item.family_id).filter((value) => value !== null && value !== undefined),
    )
    const totalCompleted = distributions.filter((item) => item.status !== 'Pending').length
    const complianceRate = totalAssistance > 0
      ? Math.round((totalCompleted / totalAssistance) * 100)
      : 0
    const activeStaff = users.filter((user) => String(user.role || '').toLowerCase() === 'staff').length

    return {
      totalAssistance,
      familiesServed: uniqueFamilies.size,
      activeStaff,
      complianceRate,
    }
  }, [distributions, users])

  const handleDownload = () => {
    alert('Downloading transparency report...')
  }

  const openEditModal = (distribution) => {
    setEditingDistribution(distribution)
    setEditingStatus(distribution.status || 'Pending')
    setActionError('')
    setSuccessMessage('')
    document.body.style.overflow = 'hidden'
    
    // Scroll modal into current viewport
    setTimeout(() => {
      const modal = document.querySelector('[role="dialog"]')
      if (modal) {
        modal.scrollIntoView({ behavior: 'auto', block: 'center' })
      }
    }, 50)
  }

  const closeEditModal = () => {
    setEditingDistribution(null)
    document.body.style.overflow = 'unset'
  }

  const handleUpdateStatus = async (event) => {
    event.preventDefault()
    if (!editingDistribution) return

    setSavingStatus(true)
    setActionError('')
    setSuccessMessage('')
    try {
      const actor = getCurrentStaffActor()
      await apiFetch(`/api/distributions/${editingDistribution.distribution_id}`, {
        method: 'PUT',
        body: JSON.stringify({
          status: editingStatus,
          ...actor,
        }),
      })

      setSuccessMessage('Distribution status updated.')
      closeEditModal()
      await loadTransparencyData()
    } catch (err) {
      setActionError(err.message || 'Failed to update distribution status.')
    } finally {
      setSavingStatus(false)
    }
  }

  const handleDeleteDistribution = async (distributionId) => {
    if (!confirm('Delete this distribution record? This cannot be undone.')) {
      return
    }

    setDeletingId(distributionId)
    setActionError('')
    setSuccessMessage('')
    try {
      const actor = getCurrentStaffActor()
      await apiFetch(`/api/distributions/${distributionId}`, {
        method: 'DELETE',
        body: JSON.stringify({ ...actor }),
      })
      setSuccessMessage('Distribution deleted.')
      await loadTransparencyData()
    } catch (err) {
      setActionError(err.message || 'Failed to delete distribution.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div id="transparency-section" className="mt-10">
      {/* HEADER */}
      <div className="mb-8">
        <h3 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
          System Transparency
        </h3>
        <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          Complete activity log and assistance breakdown
        </p>
        {loading && (
          <p className={`mt-2 text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Loading transparency data...
          </p>
        )}
        {error && (
          <p className="mt-2 text-xs text-red-500">Error: {error}</p>
        )}
      </div>

      {/* SUMMARY STATS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div
          className={`p-6 rounded-2xl border shadow-sm transition ${
            isDarkMode
              ? 'bg-[#111c2e] border-white/10'
              : 'bg-white border-slate-200'
          }`}
        >
          <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Total Assistance Given
          </p>
          <h3
            className={`text-2xl font-bold mt-2 ${
              isDarkMode ? 'text-white' : 'text-slate-900'
            }`}
          >
            {summaryStats.totalAssistance}
          </h3>
          <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-400'}`}>
            All forms of assistance
          </p>
        </div>

        <div
          className={`p-6 rounded-2xl border shadow-sm transition ${
            isDarkMode
              ? 'bg-[#111c2e] border-white/10'
              : 'bg-white border-slate-200'
          }`}
        >
          <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Families Served
          </p>
          <h3
            className={`text-2xl font-bold mt-2 ${
              isDarkMode ? 'text-white' : 'text-slate-900'
            }`}
          >
            {summaryStats.familiesServed}
          </h3>
          <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-400'}`}>
            This month
          </p>
        </div>

        <div
          className={`p-6 rounded-2xl border shadow-sm transition ${
            isDarkMode
              ? 'bg-[#111c2e] border-white/10'
              : 'bg-white border-slate-200'
          }`}
        >
          <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Active Staff
          </p>
          <h3
            className={`text-2xl font-bold mt-2 ${
              isDarkMode ? 'text-white' : 'text-slate-900'
            }`}
          >
            {summaryStats.activeStaff}
          </h3>
          <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-400'}`}>
            Across all barangays
          </p>
        </div>

        <div
          className={`p-6 rounded-2xl border shadow-sm transition ${
            isDarkMode
              ? 'bg-[#111c2e] border-white/10'
              : 'bg-white border-slate-200'
          }`}
        >
          <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Compliance Rate
          </p>
          <h3
            className={`text-2xl font-bold mt-2 ${
              isDarkMode ? 'text-white' : 'text-slate-900'
            }`}
          >
            {summaryStats.complianceRate}%
          </h3>
          <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-400'}`}>
            Reports submitted on time
          </p>
        </div>
      </div>

      {successMessage ? (
        <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {successMessage}
        </div>
      ) : null}

      {actionError ? (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {actionError}
        </div>
      ) : null}

      {/* MAIN CONTENT - TWO COLUMNS */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* RECENT ACTIVITIES */}
        <div
          className={`rounded-2xl border p-6 transition ${
            isDarkMode
              ? 'bg-[#111c2e] border-white/10'
              : 'bg-white border-slate-200'
          }`}
        >
          <h4 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
            Recent Activities
          </h4>
          <div className="space-y-3">
            {recentActivities.map((activity) => (
              <div
                key={activity.id}
                className={`p-4 rounded-xl border transition ${
                  isDarkMode
                    ? 'border-slate-700 bg-slate-800/50'
                    : 'border-slate-200 bg-slate-50'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                        {activity.action}
                      </p>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${activity.action === 'Deleted' ? 'bg-red-100 text-red-700' : activity.action === 'Updated' ? 'bg-amber-100 text-amber-700' : activity.action === 'Distributed' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                        {activity.status}
                      </span>
                    </div>
                    <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                      {activity.details}
                    </p>
                    <div className={`mt-3 grid gap-1 text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      <span>Timestamp: {activity.timestamp}</span>
                      <span>Staff: {activity.staff}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ASSISTANCE BREAKDOWN */}
        <div
          className={`rounded-2xl border p-6 transition ${
            isDarkMode
              ? 'bg-[#111c2e] border-white/10'
              : 'bg-white border-slate-200'
          }`}
        >
          <h4 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
            Assistance Breakdown
          </h4>
          <div className="space-y-3">
            {assistanceBreakdown.map((item) => (
              <div key={item.category} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-medium ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                    {item.category}
                  </span>
                  <span className={`text-sm font-bold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                    {item.count} ({item.percentage}%)
                  </span>
                </div>
                <div
                  className={`w-full h-2 rounded-full overflow-hidden ${
                    isDarkMode ? 'bg-slate-700' : 'bg-slate-200'
                  }`}
                >
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-600"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* BARANGAY DISTRIBUTION */}
      <div
        className={`rounded-2xl border p-6 mb-8 transition ${
          isDarkMode
            ? 'bg-[#111c2e] border-white/10'
            : 'bg-white border-slate-200'
        }`}
      >
        <h4 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
          Assistance Distribution by Barangay
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {barangayDistribution.map((item) => (
            <div
              key={item.barangay}
              className={`p-4 rounded-xl border transition ${
                isDarkMode
                  ? 'border-slate-700 bg-slate-800/50'
                  : 'border-slate-200 bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  {item.barangay}
                </p>
                <span className={`text-xs font-bold px-2 py-1 rounded ${isDarkMode ? 'bg-blue-900/40 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>
                  {item.percentage}%
                </span>
              </div>
              <p className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                {item.families} families
              </p>
              <div
                className={`w-full h-1.5 rounded-full overflow-hidden mt-2 ${
                  isDarkMode ? 'bg-slate-700' : 'bg-slate-200'
                }`}
              >
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600"
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* DISTRIBUTION LIST */}
      <div
        id="distribution-list-section"
        className={`rounded-2xl border p-6 mb-8 transition ${
          isDarkMode
            ? 'bg-[#111c2e] border-white/10'
            : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <h4 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
            Distribution Records
          </h4>
          <span className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            {distributions.length} total
          </span>
        </div>

        {loading ? (
          <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Loading distributions...
          </p>
        ) : distributions.length === 0 ? (
          <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            No distributions recorded yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={`border-b text-xs uppercase tracking-wide ${
                  isDarkMode
                    ? 'border-white/10 text-slate-400'
                    : 'border-slate-200 text-slate-500'
                }`}>
                  <th className="px-4 py-3 text-left font-semibold">ID</th>
                  <th className="px-4 py-3 text-left font-semibold">Recipient</th>
                  <th className="px-4 py-3 text-left font-semibold">Image</th>
                  <th className="px-4 py-3 text-left font-semibold">Barangay</th>
                  <th className="px-4 py-3 text-left font-semibold">Item</th>
                  <th className="px-4 py-3 text-left font-semibold">Status</th>
                  <th className="px-4 py-3 text-left font-semibold">Date</th>
                  <th className="px-4 py-3 text-left font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {distributions.map((distribution) => {
                  const recipient = distribution.family_name || distribution.individual_name || 'Unknown'
                  const itemName = distribution.food_name || 'Food supply'
                  const itemQty = distribution.quantity ? `${distribution.quantity} ${distribution.unit || ''}`.trim() : '—'
                  return (
                    <tr
                      key={distribution.distribution_id}
                      className={`transition ${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-slate-50'}`}
                    >
                      <td className={`px-4 py-3 text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        {distribution.distribution_id}
                      </td>
                      <td className={`px-4 py-3 ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                        {recipient}
                      </td>
                      <td className="px-4 py-3">
                        {distribution.image ? (
                          <img
                            src={`data:image/jpeg;base64,${distribution.image}`}
                            alt="Distribution photo"
                            className="h-10 w-10 rounded-md object-cover"
                          />
                        ) : (
                          <span className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                            —
                          </span>
                        )}
                      </td>
                      <td className={`px-4 py-3 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                        {distribution.barangay_name || '—'}
                      </td>
                      <td className={`px-4 py-3 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                        {itemName} {itemQty !== '—' ? `(${itemQty})` : ''}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                          distribution.status === 'Pending'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {distribution.status || 'Pending'}
                        </span>
                      </td>
                      <td className={`px-4 py-3 text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        {formatDate(distribution.date_given)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            onClick={() => openEditModal(distribution)}
                            className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                              isDarkMode
                                ? 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            <Pencil size={12} />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteDistribution(distribution.distribution_id)}
                            disabled={deletingId === distribution.distribution_id}
                            className="inline-flex items-center gap-1 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50"
                          >
                            <Trash2 size={12} />
                            {deletingId === distribution.distribution_id ? 'Deleting...' : 'Delete'}
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

      {/* ACTION BUTTONS */}
      <div
        className={`rounded-2xl border p-6 transition ${
          isDarkMode
            ? 'bg-[#111c2e] border-white/10'
            : 'bg-white border-slate-200'
        }`}
      >
        <h4 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
          Actions
        </h4>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-4 rounded-lg font-medium transition"
          >
            <Download size={18} />
            Download Report
          </button>
          <button className="flex items-center gap-2 bg-slate-600 hover:bg-slate-700 text-white py-2.5 px-4 rounded-lg font-medium transition">
            <span>📊</span>
            View Analytics
          </button>
          <button className={`flex items-center gap-2 py-2.5 px-4 rounded-lg font-medium transition ${
            isDarkMode
              ? 'border border-slate-600 text-slate-200 hover:bg-slate-800'
              : 'border border-slate-300 text-slate-700 hover:bg-slate-50'
          }`}
          onClick={loadTransparencyData}
          >
            <span>🔄</span>
            Refresh Data
          </button>
        </div>
      </div>

      {editingDistribution ? (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4">
          <div role="dialog" className={`w-full max-w-lg rounded-2xl border p-6 shadow-xl ${
            isDarkMode
              ? 'bg-[#111c2e] border-white/10 text-slate-100'
              : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Update Distribution Status</h3>
              <button
                onClick={closeEditModal}
                className={`text-xs font-semibold px-3 py-1 rounded ${
                  isDarkMode
                    ? 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Close
              </button>
            </div>

            <form onSubmit={handleUpdateStatus} className="space-y-4">
              <div>
                <label className={`mb-1 block text-xs font-semibold uppercase tracking-[0.08em] ${
                  isDarkMode ? 'text-slate-300' : 'text-slate-600'
                }`}>
                  Status
                </label>
                <select
                  value={editingStatus}
                  onChange={(event) => setEditingStatus(event.target.value)}
                  className={`w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/40 ${
                    isDarkMode
                      ? 'border-slate-600 bg-slate-900 text-slate-100'
                      : 'border-slate-300 bg-white text-slate-900'
                  }`}
                >
                  <option value="Pending">Pending</option>
                  <option value="Received">Received</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                    isDarkMode
                      ? 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingStatus}
                  className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm font-semibold transition disabled:opacity-50"
                >
                  {savingStatus ? 'Saving...' : 'Save Status'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  )
}
