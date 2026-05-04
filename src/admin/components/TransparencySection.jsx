import { useEffect, useMemo, useState } from 'react'
import { Download } from 'lucide-react'
import { useStaffAuth } from '../../context/StaffAuthContext'

export default function TransparencySection({ isDarkMode }) {
  const { staffAccounts } = useStaffAuth()
  const [distributions, setDistributions] = useState([])
  const [foodSupplies, setFoodSupplies] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([
      fetch('/api/distributions'),
      fetch('/api/food-supplies'),
    ])
      .then(async ([distRes, supplyRes]) => {
        if (!distRes.ok) throw new Error('Failed to fetch distributions')
        if (!supplyRes.ok) throw new Error('Failed to fetch food supplies')

        const [distData, supplyData] = await Promise.all([
          distRes.json(),
          supplyRes.json(),
        ])

        setDistributions(Array.isArray(distData) ? distData : [])
        setFoodSupplies(Array.isArray(supplyData) ? supplyData : [])
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message || 'Failed to load transparency data.')
        setLoading(false)
      })
  }, [])

  const formatDate = (value) => {
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) return '—'
    return parsed.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  const formatTime = (value) => {
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) return '—'
    return parsed.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  }

  const recentActivities = useMemo(() => {
    const sorted = [...distributions].sort((a, b) => {
      const aTime = new Date(a.date_given || 0).getTime()
      const bTime = new Date(b.date_given || 0).getTime()
      return bTime - aTime
    })

    return sorted.slice(0, 5).map((activity, index) => {
      const recipient = activity.family_name || activity.individual_name || 'recipient'
      const itemName = activity.food_name || 'food supplies'
      const quantity = activity.quantity ? `${activity.quantity} ${activity.unit || ''}`.trim() : 'Assistance'

      return {
        id: activity.distribution_id || index,
        date: formatDate(activity.date_given),
        time: formatTime(activity.date_given),
        action: 'Food Distribution',
        details: `${quantity} of ${itemName} delivered to ${recipient}`,
        staff: 'Admin System',
        status: activity.status || 'Completed',
      }
    })
  }, [distributions])

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

    return {
      totalAssistance,
      familiesServed: uniqueFamilies.size,
      activeStaff: staffAccounts.length,
      complianceRate,
    }
  }, [distributions, staffAccounts.length])

  const handleDownload = () => {
    alert('Downloading transparency report...')
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
                    <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                      {activity.action}
                    </p>
                    <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                      {activity.details}
                    </p>
                    <div className={`flex items-center gap-4 mt-2 text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      <span>📅 {activity.date}</span>
                      <span>🕐 {activity.time}</span>
                      <span>👤 {activity.staff}</span>
                    </div>
                  </div>
                  <span className="inline-block bg-green-600 text-white text-xs py-1 px-2 rounded-full whitespace-nowrap">
                    {activity.status}
                  </span>
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
          }`}>
            <span>🔄</span>
            Refresh Data
          </button>
        </div>
      </div>
    </div>
  )
}
