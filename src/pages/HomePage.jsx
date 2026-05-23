import { useEffect, useMemo, useState } from 'react'
import { useDarkMode } from '../hooks/useDarkMode'
import Footer from '../components/Footer'
import SiteHeader from '../components/SiteHeader'
import { apiFetch } from '../api/api'
import municipalHallHero from '../assets/town.jpg'
import churchHero from '../assets/Pateros_Church,_Mar_2024.jpg'
import pateros22Hero from '../assets/pateros22-sstring.jpg'
import pandangguhan from '../assets/pandangguhan.jpg'

const heroSlides = [
  { src: municipalHallHero, alt: 'Pateros Municipal Hall' },
  { src: churchHero, alt: 'Pateros Church' },
  { src: pateros22Hero, alt: 'Pateros Community View' },
  { src: pandangguhan, alt: 'Pandangguhan' },
]

const statusClassMap = {
  Completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  Received: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
  Processed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  Pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  Updated: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
}

function relativeTime(dateStr) {
  if (!dateStr) return '—'
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins} minute${mins !== 1 ? 's' : ''} ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} hour${hrs !== 1 ? 's' : ''} ago`
  const days = Math.floor(hrs / 24)
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// SVG chart constants
const SVG_W = 860, SVG_H = 340
const CX0 = 70, CX1 = 820, CY0 = 35, CY1 = 275
const CW = CX1 - CX0   // 750
const CH = CY1 - CY0   // 240

function HomePage() {
  const { isDarkMode, toggleDarkMode } = useDarkMode()
  const [activeSlideIndex, setActiveSlideIndex] = useState(0)

  const [stats, setStats] = useState(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [statsError, setStatsError] = useState(null)

  const [barangayStats, setBarangayStats] = useState([])
  const [barangaysLoading, setBarangaysLoading] = useState(true)
  const [barangaysError, setBarangaysError] = useState(null)

  const [distributions, setDistributions] = useState([])
  const [activityLogs, setActivityLogs] = useState([])
  const [activityLoading, setActivityLoading] = useState(true)
  const [showAllActivity, setShowAllActivity] = useState(false)

  const [chartRange, setChartRange] = useState(6)
  const [showRangeMenu, setShowRangeMenu] = useState(false)

  useEffect(() => {
    apiFetch('/api/stats')
      .then((data) => { setStats(data); setStatsLoading(false) })
      .catch((err) => { setStatsError(err.message || 'Failed to load stats'); setStatsLoading(false) })

    Promise.all([apiFetch('/api/barangays'), apiFetch('/api/families')])
      .then(([barangaysData, familiesData]) => {
        const barangays = Array.isArray(barangaysData) ? barangaysData : []
        const families = Array.isArray(familiesData) ? familiesData : []

        const countsById = families.reduce((acc, f) => {
          const id = Number(f.barangay_id) || 0
          acc[id] = (acc[id] || 0) + 1
          return acc
        }, {})

        const enriched = barangays.map((b) => ({
          barangay_id: b.barangay_id,
          name: b.name,
          familyCount: countsById[b.barangay_id] || 0,
        }))

        const sorted = enriched.sort((a, z) => z.familyCount - a.familyCount)
        const top = sorted.slice(0, 5)
        const maxCount = top.length > 0 ? Math.max(...top.map((t) => t.familyCount), 1) : 1

        const withWidth = top.map((t) => ({
          ...t,
          width: t.familyCount === 0 ? '0%' : `${Math.round((t.familyCount / maxCount) * 100)}%`,
        }))

        setBarangayStats(withWidth)
        setBarangaysLoading(false)
      })
      .catch((err) => { setBarangaysError(err.message || 'Failed to load barangay data'); setBarangaysLoading(false) })

    Promise.all([
      apiFetch('/api/distributions'),
      apiFetch('/api/activity-logs?limit=10'),
    ])
      .then(([distData, logData]) => {
        setDistributions(Array.isArray(distData) ? distData : [])
        setActivityLogs(Array.isArray(logData) ? logData : [])
        setActivityLoading(false)
      })
      .catch(() => { setActivityLoading(false) })

    const slideInterval = setTimeout(() => {
      setActiveSlideIndex((i) => (i + 1) % heroSlides.length)
    }, 5000)
    return () => clearTimeout(slideInterval)
  }, [activeSlideIndex])

  // Build monthly chart data from real distributions
  const chartData = useMemo(() => {
    const now = new Date()
    const months = []
    for (let i = chartRange - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      months.push({ year: d.getFullYear(), month: d.getMonth(), label: d.toLocaleString('en-US', { month: 'short' }), count: 0 })
    }
    distributions.forEach((dist) => {
      if (!dist.date_given) return
      const d = new Date(dist.date_given)
      const entry = months.find((m) => m.year === d.getFullYear() && m.month === d.getMonth())
      if (entry) entry.count++
    })
    return months
  }, [distributions, chartRange])

  // SVG path points
  const chartPoints = useMemo(() => {
    const maxVal = Math.max(...chartData.map((m) => m.count), 1)
    const hasData = chartData.some((m) => m.count > 0)
    const xStep = chartData.length > 1 ? CW / (chartData.length - 1) : 0
    const pts = chartData.map((m, i) => ({
      x: CX0 + xStep * i,
      y: CY1 - (m.count / maxVal) * CH,
    }))
    const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')
    const areaPath = pts.length > 0
      ? `${linePath} L${pts[pts.length - 1].x},${CY1} L${pts[0].x},${CY1} Z`
      : ''

    // Y-axis tick values (0 at bottom, maxVal at top, 4 even steps)
    const yTicks = [0, 1, 2, 3, 4].map((step) => {
      const val = Math.round((maxVal / 4) * step)
      const y = CY1 - (val / maxVal) * CH
      return { val, y }
    })

    return { pts, linePath, areaPath, maxVal, hasData, yTicks }
  }, [chartData])

  // Map activity logs to table rows
  const liveActivities = useMemo(() => {
    return activityLogs.map((log, i) => {
      const action = String(log.action || '').toLowerCase()
      const type = action === 'created' ? 'Registration' : action === 'deleted' ? 'Update' : 'Distribution'
      const desc = log.distribution_details || (log.staff_name ? `Activity logged by ${log.staff_name}` : 'System activity recorded')
      const rawStatus = String(log.status || '').toLowerCase()
      const status =
        rawStatus === 'completed' ? 'Completed' :
        rawStatus === 'received' ? 'Received' :
        rawStatus === 'pending' ? 'Pending' :
        action === 'created' ? 'Processed' :
        action === 'updated' ? 'Updated' :
        'Completed'
      return {
        key: log.log_id ?? log.distribution_id ?? i,
        type,
        description: desc,
        time: relativeTime(log.performed_at || log.created_at),
        status,
      }
    })
  }, [activityLogs])

  const handleDownload = () => {
    const headers = ['ID', 'Recipient', 'Barangay', 'Item', 'Quantity', 'Status', 'Date Given']
    const rows = distributions.map((d) => [
      d.distribution_id ?? '',
      d.recipient_name ?? d.family_name ?? '',
      d.barangay_name ?? '',
      d.food_item ?? d.item_name ?? '',
      d.quantity ?? '',
      d.status ?? '',
      d.date_given ? new Date(d.date_given).toLocaleDateString('en-US') : '',
    ])
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `phams-report-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <main className={`min-h-screen transition-colors ${
      isDarkMode ? 'bg-slate-950 text-slate-50' : 'bg-[#eaf1ef] text-slate-900'
    }`}>
      <SiteHeader isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />

      {/* Hero */}
      <section className="mx-auto w-[95%] max-w-7xl py-5 md:py-6">
        <div className={`relative overflow-hidden rounded-xl border shadow-lg transition-colors ${
          isDarkMode ? 'border-slate-700 shadow-slate-900' : 'border-slate-300 shadow-lg'
        }`}>
          <img
            key={heroSlides[activeSlideIndex].src}
            src={heroSlides[activeSlideIndex].src}
            alt={heroSlides[activeSlideIndex].alt}
            className="h-[280px] md:h-[420px] w-full object-cover transition-opacity duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/72 via-slate-900/25 to-transparent" />
          <div className="absolute bottom-0 left-0 p-5 md:p-7 max-w-2xl text-white">
            <h2 className="text-3xl md:text-5xl font-black leading-[1.05]" style={{ fontFamily: 'Arial Black, Trebuchet MS, sans-serif' }}>
              Pateros Zero Hunger Management
            </h2>
            <p className="mt-2 md:mt-3 text-sm md:text-lg text-slate-100">
              Empowering communities, ensuring food security, and supporting our citizens.
            </p>
          </div>
        </div>

        <div className="flex justify-center gap-2 py-3">
          {heroSlides.map((slide, index) => (
            <button
              key={slide.alt}
              type="button"
              aria-label={`Show slide ${index + 1}`}
              onClick={() => setActiveSlideIndex(index)}
              className={`h-1.5 rounded-full transition-all ${
                activeSlideIndex === index
                  ? 'w-5 bg-slate-500'
                  : isDarkMode ? 'w-1.5 bg-slate-700' : 'w-1.5 bg-slate-300'
              }`}
            />
          ))}
        </div>
      </section>

      {/* Dashboard */}
      <section className="mx-auto w-[95%] max-w-7xl pb-10 md:pb-12">

        {/* Header row */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className={`text-2xl font-extrabold transition-colors ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}
              style={{ fontFamily: 'Arial Black, Trebuchet MS, sans-serif' }}>
              Dashboard Overview
            </h3>
            <p className={`text-xs mt-1 transition-colors ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Pateros Zero Hunger Management System
            </p>
          </div>
          <button
            onClick={handleDownload}
            className={`rounded-md border px-4 py-2 text-xs md:text-sm font-semibold transition-colors ${
              isDarkMode
                ? 'border-slate-600 bg-slate-800 text-slate-200 hover:bg-slate-700'
                : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            Download Report
          </button>
        </div>

        {/* Stat cards */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4">
          {statsLoading && [0, 1, 2, 3].map((i) => (
            <article key={i} className={`rounded-xl border p-4 shadow-sm transition-colors ${isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'}`}>
              <div className="flex items-start justify-between gap-2">
                <p className={`h-4 w-32 rounded ${isDarkMode ? 'bg-slate-700' : 'bg-slate-100'}`} />
                <span className={`h-8 w-8 rounded-lg ${isDarkMode ? 'bg-blue-900/30' : 'bg-blue-50'}`} />
              </div>
              <div className="mt-4 h-10 w-28 rounded bg-slate-300/30" />
            </article>
          ))}

          {statsError && (
            <div className={`col-span-4 rounded-xl border p-4 ${isDarkMode ? 'bg-[#111c2e]' : 'bg-white'}`}>
              <p className="text-sm text-red-500">Error loading stats: {statsError}</p>
            </div>
          )}

          {!statsLoading && !statsError && stats && (() => {
            const items = [
              { label: 'Total Registered Families', value: stats.totalFamilies ?? '0', icon: <i className="fi fi-sr-users" aria-hidden="true" /> },
              { label: '4Ps (No Permanent Address)', value: stats.fourPsNoPermanentAddress ?? stats.noPermanentAddress ?? '0', icon: '📍' },
              { label: 'Active Food Supply (Tons)', value: stats.totalFoodSupply ?? '0', icon: '📦' },
              { label: 'Pending Distributions', value: stats.pendingDistributions ?? '0', icon: '🚚' },
            ]
            return items.map((item) => (
              <article key={item.label} className={`rounded-xl border p-4 shadow-sm transition-colors ${isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'}`}>
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-xs leading-snug transition-colors ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{item.label}</p>
                  <span className={`h-8 w-8 rounded-lg grid place-items-center text-sm transition-colors ${isDarkMode ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-50 text-blue-700'}`}>
                    {item.icon}
                  </span>
                </div>
                <p className={`mt-4 text-3xl font-black transition-colors ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}
                  style={{ fontFamily: 'Arial Black, Trebuchet MS, sans-serif' }}>
                  {item.value}
                </p>
              </article>
            ))
          })()}
        </div>

        {/* Chart + Priority Areas */}
        <div className="mt-5 grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-4">

          {/* Monthly Food Distribution chart */}
          <article className={`rounded-2xl border p-4 md:p-6 shadow-sm transition-colors ${
            isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'
          }`}>
            <div className="flex items-center justify-between gap-3">
              <h4 className={`text-2xl font-extrabold transition-colors ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}
                style={{ fontFamily: 'Arial Black, Trebuchet MS, sans-serif' }}>
                Monthly Food Distribution
              </h4>

              {/* Range dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowRangeMenu((v) => !v)}
                  className={`text-sm font-medium transition-colors ${
                    isDarkMode ? 'text-slate-300 hover:text-slate-200' : 'text-slate-700 hover:text-slate-900'
                  }`}
                >
                  Last {chartRange} Months ▾
                </button>
                {showRangeMenu && (
                  <div className={`absolute right-0 top-7 z-10 w-36 rounded-lg border shadow-lg text-sm overflow-hidden ${
                    isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
                  }`}>
                    {[3, 6, 12].map((n) => (
                      <button
                        key={n}
                        onClick={() => { setChartRange(n); setShowRangeMenu(false) }}
                        className={`w-full text-left px-4 py-2.5 transition-colors ${
                          chartRange === n
                            ? isDarkMode ? 'bg-blue-700 text-white' : 'bg-blue-600 text-white'
                            : isDarkMode ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        Last {n} Months
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className={`mt-4 rounded-xl border p-3 md:p-4 transition-colors ${
              isDarkMode ? 'border-slate-700 bg-slate-900' : 'border-slate-100 bg-[#f9fcff]'
            }`}>
              <div className="h-[300px] md:h-[340px] w-full">
                <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="h-full w-full" role="img" aria-label="Monthly food distribution chart">
                  {/* Grid lines */}
                  <g stroke={isDarkMode ? '#334155' : '#e2e8f0'} strokeDasharray="4 4">
                    {chartPoints.yTicks.map((t) => (
                      <line key={t.y} x1={CX0} y1={t.y} x2={CX1} y2={t.y} />
                    ))}
                  </g>

                  {/* Area fill + line */}
                  {chartPoints.hasData && (
                    <>
                      <path d={chartPoints.areaPath} fill="rgba(59,130,246,0.16)" />
                      <path d={chartPoints.linePath} stroke="#3b82f6" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                      {chartPoints.pts.map((p, i) => (
                        <circle key={i} cx={p.x} cy={p.y} r="4" fill="#3b82f6" />
                      ))}
                    </>
                  )}

                  {/* No data message */}
                  {!chartPoints.hasData && (
                    <text x={SVG_W / 2} y={SVG_H / 2} textAnchor="middle" fill="#94a3b8" fontSize="16" fontFamily="Trebuchet MS, sans-serif">
                      No distribution data for this period
                    </text>
                  )}

                  {/* Y-axis labels */}
                  <g fill={isDarkMode ? '#94a3b8' : '#64748b'} fontSize="13" fontFamily="Trebuchet MS, Segoe UI, sans-serif">
                    {chartPoints.yTicks.map((t) => (
                      <text key={t.y} x={CX0 - 8} y={t.y + 5} textAnchor="end">{t.val}</text>
                    ))}
                  </g>

                  {/* X-axis labels */}
                  <g fill={isDarkMode ? '#94a3b8' : '#64748b'} fontSize="13" fontFamily="Trebuchet MS, Segoe UI, sans-serif">
                    {chartData.map((m, i) => {
                      const x = CX0 + (chartData.length > 1 ? (CW / (chartData.length - 1)) * i : 0)
                      return (
                        <text key={i} x={x} y={SVG_H - 20} textAnchor="middle">{m.label}</text>
                      )
                    })}
                  </g>
                </svg>
              </div>
            </div>
          </article>

          {/* Priority Areas */}
          <article className={`rounded-2xl border p-4 md:p-6 shadow-sm transition-colors ${
            isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'
          }`}>
            <h4 className={`text-2xl font-extrabold transition-colors ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}
              style={{ fontFamily: 'Arial Black, Trebuchet MS, sans-serif' }}>
              Priority Areas
            </h4>
            <p className={`mt-1 transition-colors ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Families needing assistance</p>

            <div className="mt-6 space-y-6">
              {barangaysLoading && (
                <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Loading...</p>
              )}
              {barangaysError && (
                <p className="text-sm text-red-500">Error: {barangaysError}</p>
              )}
              {!barangaysLoading && !barangaysError && barangayStats.length === 0 && (
                <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>No data available</p>
              )}
              {!barangaysLoading && !barangaysError && barangayStats.map((area) => (
                <div key={area.barangay_id} className="grid grid-cols-[120px_1fr] items-center gap-3">
                  <p className={`text-sm text-right leading-tight transition-colors ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    {area.name}
                  </p>
                  <div className={`h-9 w-full rounded-md border border-dashed p-1 transition-colors ${isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-slate-50 border-slate-200'}`}>
                    {area.familyCount > 0 && (
                      <div
                        className="h-full rounded bg-sky-500 transition-all duration-500"
                        style={{ width: area.width }}
                        title={`${area.familyCount} ${area.familyCount === 1 ? 'family' : 'families'}`}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </article>
        </div>

        {/* Recent System Activity */}
        <article className={`mt-4 rounded-2xl border shadow-sm overflow-hidden transition-colors ${
          isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'
        }`}>
          <div className={`flex items-center justify-between gap-3 px-5 py-4 border-b transition-colors ${
            isDarkMode ? 'bg-slate-700/50 border-slate-700' : 'bg-slate-50 border-slate-200'
          }`}>
            <h4 className={`text-2xl font-extrabold transition-colors ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}
              style={{ fontFamily: 'Arial Black, Trebuchet MS, sans-serif' }}>
              Recent System Activity
            </h4>
            {!showAllActivity && liveActivities.length > 5 && (
              <button
                type="button"
                onClick={() => setShowAllActivity(true)}
                className={`text-sm font-semibold transition-colors ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}
              >
                View All
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            {activityLoading ? (
              <div className="px-5 py-6">
                {[0, 1, 2].map((i) => (
                  <div key={i} className={`mb-3 h-5 rounded ${isDarkMode ? 'bg-slate-700' : 'bg-slate-100'}`} style={{ width: `${70 - i * 10}%` }} />
                ))}
              </div>
            ) : liveActivities.length === 0 ? (
              <p className={`px-5 py-6 text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                No recent activity recorded yet.
              </p>
            ) : (
              <table className="w-full min-w-[760px] text-left">
                <thead className={`border-b transition-colors ${isDarkMode ? 'bg-slate-700/50 border-slate-700' : 'bg-slate-100 border-slate-200'}`}>
                  <tr className={`text-[11px] uppercase tracking-[0.08em] transition-colors ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    <th className="px-5 py-3 font-semibold">Type</th>
                    <th className="px-5 py-3 font-semibold">Description</th>
                    <th className="px-5 py-3 font-semibold">Time</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(showAllActivity ? liveActivities : liveActivities.slice(0, 5)).map((activity) => (
                    <tr key={activity.key} className={`border-b last:border-b-0 transition-colors ${
                      isDarkMode ? 'border-slate-700 hover:bg-slate-700/50' : 'border-slate-200 hover:bg-slate-50'
                    }`}>
                      <td className={`px-5 py-3.5 font-semibold transition-colors ${isDarkMode ? 'text-slate-200' : 'text-slate-900'}`}>
                        {activity.type}
                      </td>
                      <td className={`px-5 py-3.5 transition-colors ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                        {activity.description}
                      </td>
                      <td className={`px-5 py-3.5 transition-colors ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        {activity.time}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClassMap[activity.status] ?? statusClassMap.Updated}`}>
                          {activity.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </article>
      </section>

      <Footer isDarkMode={isDarkMode} />
    </main>
  )
}

export default HomePage
