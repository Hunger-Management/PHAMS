import { useEffect, useMemo, useState } from 'react'
import { apiFetch } from '../api/api'
import { useDarkMode } from '../hooks/useDarkMode'
import SiteHeader from '../components/SiteHeader'

function getDistributionStatus(distribution) {
  return distribution?.image ? 'Completed' : (distribution?.status || 'Pending')
}

function TransparencyPage() {
  const { isDarkMode, toggleDarkMode } = useDarkMode()
  const [distributions, setDistributions] = useState([])
  const [foodSupplies, setFoodSupplies] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([
      apiFetch('/api/distributions'),
      apiFetch('/api/food-supplies'),
    ])
      .then(([distData, supplyData]) => {
        setDistributions(Array.isArray(distData) ? distData : [])
        setFoodSupplies(Array.isArray(supplyData) ? supplyData : [])
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message || 'Failed to load transparency data.')
        setLoading(false)
      })
  }, [])

  // Stats derived purely from live distribution data
  const summaryStats = useMemo(() => {
    const totalPackagesDistributed = distributions.reduce(
      (sum, d) => sum + (Number(d.quantity) || 0),
      0,
    )
    const uniqueFamilies = new Set(
      distributions
        .map((d) => d.family_id)
        .filter((id) => id !== null && id !== undefined),
    ).size
    const totalDistributions = distributions.length
    const completedDistributions = distributions.filter(
      (d) => getDistributionStatus(d) !== 'Pending',
    ).length
    const distributionRate =
      totalDistributions > 0
        ? Math.round((completedDistributions / totalDistributions) * 100)
        : 0
    const activeBarangays = new Set(
      distributions.map((d) => d.barangay_name).filter(Boolean),
    ).size

    return { totalPackagesDistributed, uniqueFamilies, distributionRate, activeBarangays }
  }, [distributions])

  const statCards = useMemo(
    () => [
      {
        label: 'Total Packages Distributed',
        value: summaryStats.totalPackagesDistributed.toLocaleString(),
        color: 'text-emerald-500',
        icon: (
          <svg viewBox="0 0 24 24" className="h-10 w-10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 2l8 4.5v11L12 22l-8-4.5v-11L12 2z" />
            <path d="M12 22V11" />
            <path d="M4 6.5l8 4.5 8-4.5" />
          </svg>
        ),
      },
      {
        label: 'Families Served',
        value: summaryStats.uniqueFamilies.toLocaleString(),
        color: 'text-orange-500',
        icon: (
          <svg viewBox="0 0 24 24" className="h-10 w-10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M16 7a3 3 0 1 1 0-6 3 3 0 0 1 0 6z" />
            <path d="M8 8a3 3 0 1 1 0-6 3 3 0 0 1 0 6z" />
            <path d="M13 21v-2a4 4 0 0 1 4-4h1a4 4 0 0 1 4 4v2" />
            <path d="M2 21v-2a4 4 0 0 1 4-4h2" />
          </svg>
        ),
      },
      {
        label: 'Distribution Rate',
        value: `${summaryStats.distributionRate}%`,
        color: 'text-blue-600',
        icon: (
          <svg viewBox="0 0 24 24" className="h-10 w-10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 17l6-6 4 4 8-8" />
            <path d="M21 12V7h-5" />
          </svg>
        ),
      },
      {
        label: 'Active Barangays',
        value: summaryStats.activeBarangays.toString(),
        color: 'text-violet-600',
        icon: (
          <svg viewBox="0 0 24 24" className="h-10 w-10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path d="M16 2v4" />
            <path d="M8 2v4" />
            <path d="M3 10h18" />
          </svg>
        ),
      },
    ],
    [summaryStats],
  )

  const barangayDistributionData = useMemo(() => {
    const palette = ['#2563eb', '#ea580c', '#16a34a', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6', '#84cc16', '#06b6d4', '#ef4444']
    const counts = distributions.reduce((acc, item) => {
      const key = item.barangay_name || 'Unknown'
      acc[key] = (acc[key] || 0) + (Number(item.quantity) || 1)
      return acc
    }, {})
    return Object.entries(counts)
      .map(([name, value], index) => ({ name, value, color: palette[index % palette.length] }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10)
  }, [distributions])

  const allocationData = useMemo(() => {
    return foodSupplies
      .map((item) => ({
        label: item.food_name || 'Food Supply',
        value: Number(item.total_quantity) || 0,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 4)
  }, [foodSupplies])

  const resolvedTrendData = useMemo(() => {
    const now = new Date()
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
      return { label: d.toLocaleString('en-US', { month: 'short' }), year: d.getFullYear(), month: d.getMonth() }
    })

    const foodPackages = months.map(({ year, month }) =>
      distributions
        .filter((d) => {
          if (!d.date_given) return false
          const date = new Date(d.date_given)
          return date.getFullYear() === year && date.getMonth() === month
        })
        .reduce((sum, d) => sum + (Number(d.quantity) || 0), 0),
    )

    const familiesReached = months.map(({ year, month }) =>
      new Set(
        distributions
          .filter((d) => {
            if (!d.date_given || !d.family_id) return false
            const date = new Date(d.date_given)
            return date.getFullYear() === year && date.getMonth() === month
          })
          .map((d) => d.family_id),
      ).size,
    )

    return { months: months.map((m) => m.label), foodPackages, familiesReached }
  }, [distributions])

  const trendYMax = useMemo(() => {
    const max = Math.max(...resolvedTrendData.foodPackages, ...resolvedTrendData.familiesReached, 1)
    if (max <= 100) return 100
    if (max <= 1000) return Math.ceil(max / 100) * 100
    return Math.ceil(max / 1000) * 1000
  }, [resolvedTrendData])

  const lastUpdated = useMemo(() => {
    const dates = distributions
      .map((d) => (d.date_given ? new Date(d.date_given) : null))
      .filter(Boolean)
    if (dates.length === 0) return null
    return new Date(Math.max(...dates.map((d) => d.getTime())))
  }, [distributions])

  const totalBarangayDistribution = barangayDistributionData.reduce((sum, item) => sum + item.value, 0)
  const barangayDistributionPercentages = barangayDistributionData.map((item) => ({
    ...item,
    percentage: totalBarangayDistribution > 0 ? (item.value / totalBarangayDistribution) * 100 : 0,
  }))

  const pieGradient = barangayDistributionPercentages
    .map((item, index) => {
      const start = barangayDistributionPercentages
        .slice(0, index)
        .reduce((sum, current) => sum + current.percentage, 0)
      const end = start + item.percentage
      return `${item.color} ${start}% ${end}%`
    })
    .join(', ')

  const totalAllocation = allocationData.reduce((sum, item) => sum + item.value, 0)
  const allocationBreakdown = allocationData.map((item) => ({
    ...item,
    percentage: totalAllocation > 0 ? Math.round((item.value / totalAllocation) * 1000) / 10 : 0,
  }))
  const maxAllocationValue = Math.max(...allocationData.map((item) => item.value), 1)
  const allocationAxisMax = Math.ceil(maxAllocationValue / 1000) * 1000 || 100

  const hasDistributions = distributions.length > 0
  const hasFood = foodSupplies.length > 0

  return (
    <main className={`min-h-screen transition-colors ${
      isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-[#eef5f2] text-slate-900'
    }`}>
      <SiteHeader isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />

      <section className="mx-auto w-[95%] max-w-7xl py-10 md:py-14">
        <div className={`rounded-2xl border p-6 shadow-sm transition-colors md:p-8 ${
          isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'
        }`}>
          <h2 className={`font-display text-3xl font-black tracking-tight md:text-5xl ${isDarkMode ? 'text-slate-100' : 'text-[#011d49]'}`}>
            Transparency Dashboard
          </h2>
          <p className={`mt-4 max-w-none text-base leading-relaxed sm:text-lg md:text-xl ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
            Complete visibility into our operations, resource allocation, and distribution data.
            We believe in full transparency and accountability.
          </p>
          {error && (
            <p className="mt-3 text-sm text-red-500">Unable to load live data: {error}</p>
          )}
          {loading && (
            <p className={`mt-3 text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Loading data...
            </p>
          )}
        </div>
      </section>

      <section className="mx-auto w-[95%] max-w-7xl pb-10 md:pb-14">
        <div className="space-y-6 md:space-y-8">
          {/* STAT CARDS */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {statCards.map((item) => (
              <article
                key={item.label}
                className={`rounded-3xl border p-8 text-center shadow-sm transition-colors ${
                  isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'
                }`}
              >
                <div className={`mx-auto flex w-fit items-center justify-center ${item.color}`}>{item.icon}</div>
                {loading ? (
                  <p className={`mt-7 text-2xl font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-400'}`}>—</p>
                ) : (
                  <p className={`font-display mt-7 text-3xl md:text-4xl font-bold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                    {item.value}
                  </p>
                )}
                <p className={`mt-4 text-base md:text-lg font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>{item.label}</p>
              </article>
            ))}
          </div>

          {/* MONTHLY TREND */}
          <article
            className={`rounded-3xl border p-5 md:p-8 shadow-sm transition-colors ${
              isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'
            }`}
          >
            <h3 className={`font-display text-2xl md:text-3xl font-bold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
              Monthly Distribution Trend
            </h3>

            {!loading && !hasDistributions ? (
              <p className={`mt-6 text-center text-base ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                No distribution records yet.
              </p>
            ) : (
              <div className="mt-6 overflow-x-auto">
                <svg viewBox="0 0 1000 360" className="h-auto min-w-[760px] w-full" role="img" aria-label="Monthly distribution trend chart">
                  <line x1="60" y1="30" x2="60" y2="300" stroke={isDarkMode ? '#94a3b8' : '#475569'} strokeWidth="1" />
                  <line x1="60" y1="300" x2="960" y2="300" stroke={isDarkMode ? '#94a3b8' : '#475569'} strokeWidth="1" />

                  {[30, 97.5, 165, 232.5, 300].map((y) => (
                    <line key={`grid-${y}`} x1="60" y1={y} x2="960" y2={y} stroke={isDarkMode ? '#334155' : '#cbd5e1'} strokeWidth="1" strokeDasharray="4 4" />
                  ))}
                  {[60, 240, 420, 600, 780, 960].map((x) => (
                    <line key={`vgrid-${x}`} x1={x} y1="30" x2={x} y2="300" stroke={isDarkMode ? '#334155' : '#cbd5e1'} strokeWidth="1" strokeDasharray="4 4" />
                  ))}

                  {[1, 0.75, 0.5, 0.25, 0].map((ratio, index) => (
                    <text key={`y-label-${ratio}`} x="52" y={30 + index * 67.5 + 5} textAnchor="end" fontSize="14" fill={isDarkMode ? '#cbd5e1' : '#475569'}>
                      {Math.round(trendYMax * ratio)}
                    </text>
                  ))}
                  {resolvedTrendData.months.map((month, index) => (
                    <text key={month} x={60 + index * 180} y="320" textAnchor="middle" fontSize="14" fill={isDarkMode ? '#cbd5e1' : '#475569'}>
                      {month}
                    </text>
                  ))}

                  <polyline
                    fill="none"
                    stroke="#16a34a"
                    strokeWidth="2.5"
                    points={resolvedTrendData.foodPackages
                      .map((value, index) => `${60 + index * 180},${300 - (value / trendYMax) * 270}`)
                      .join(' ')}
                  />
                  <polyline
                    fill="none"
                    stroke="#ea580c"
                    strokeWidth="2.5"
                    points={resolvedTrendData.familiesReached
                      .map((value, index) => `${60 + index * 180},${300 - (value / trendYMax) * 270}`)
                      .join(' ')}
                  />

                  {resolvedTrendData.foodPackages.map((value, index) => (
                    <circle key={`food-point-${resolvedTrendData.months[index]}`} cx={60 + index * 180} cy={300 - (value / trendYMax) * 270} r="3.2" fill={isDarkMode ? '#0f172a' : '#ffffff'} stroke="#16a34a" strokeWidth="2" />
                  ))}
                  {resolvedTrendData.familiesReached.map((value, index) => (
                    <circle key={`families-point-${resolvedTrendData.months[index]}`} cx={60 + index * 180} cy={300 - (value / trendYMax) * 270} r="3.2" fill={isDarkMode ? '#0f172a' : '#ffffff'} stroke="#ea580c" strokeWidth="2" />
                  ))}
                </svg>
              </div>
            )}

            <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-base md:text-lg font-medium">
              <span className="inline-flex items-center gap-2 text-green-600">
                <span className="h-0.5 w-4 bg-green-600" />
                Food Packages
              </span>
              <span className="inline-flex items-center gap-2 text-orange-600">
                <span className="h-0.5 w-4 bg-orange-600" />
                Families Reached
              </span>
            </div>
          </article>

          {/* DISTRIBUTION BY BARANGAY + RESOURCE ALLOCATION */}
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <article
              className={`rounded-3xl border p-5 md:p-8 shadow-sm transition-colors ${
                isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'
              }`}
            >
              <h3 className={`font-display text-2xl md:text-3xl font-bold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                Distribution by Barangay
              </h3>

              {!loading && !hasDistributions ? (
                <p className={`mt-6 text-center text-base ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  No distribution records yet.
                </p>
              ) : (
                <div className="mt-6 flex flex-col items-center justify-center gap-6 md:gap-8">
                  <div
                    className="h-64 w-64 rounded-full border"
                    style={{
                      background: `conic-gradient(${pieGradient || '#e2e8f0 0% 100%'})`,
                      borderColor: isDarkMode ? '#334155' : '#d1d5db',
                    }}
                  />
                  <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2">
                    {barangayDistributionPercentages.map((item) => (
                      <div key={item.name} className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <p style={{ color: item.color }} className="text-sm md:text-base font-medium">
                          {item.name}: {item.percentage.toFixed(1)}%
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </article>

            <article
              className={`rounded-3xl border p-5 md:p-8 shadow-sm transition-colors ${
                isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'
              }`}
            >
              <h3 className={`font-display text-2xl md:text-3xl font-bold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                Resource Allocation
              </h3>

              {!loading && !hasFood ? (
                <p className={`mt-6 text-center text-base ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  No food supply data yet.
                </p>
              ) : (
                <div className="mt-6 overflow-x-auto">
                  <svg viewBox="0 0 760 360" className="h-auto min-w-[640px] w-full" role="img" aria-label="Resource allocation bar chart">
                    <line x1="70" y1="30" x2="70" y2="300" stroke={isDarkMode ? '#94a3b8' : '#475569'} strokeWidth="1" />
                    <line x1="70" y1="300" x2="730" y2="300" stroke={isDarkMode ? '#94a3b8' : '#475569'} strokeWidth="1" />

                    {[30, 97.5, 165, 232.5, 300].map((y) => (
                      <line key={`alloc-grid-${y}`} x1="70" y1={y} x2="730" y2={y} stroke={isDarkMode ? '#334155' : '#cbd5e1'} strokeWidth="1" strokeDasharray="4 4" />
                    ))}
                    {[allocationAxisMax, allocationAxisMax * 0.75, allocationAxisMax * 0.5, allocationAxisMax * 0.25, 0].map((value, index) => (
                      <text key={`alloc-label-${value}`} x="62" y={30 + index * 67.5 + 5} textAnchor="end" fontSize="14" fill={isDarkMode ? '#cbd5e1' : '#475569'}>
                        {Math.round(value)}
                      </text>
                    ))}

                    {allocationData.map((item, index) => {
                      const x = 86 + index * 155
                      const barWidth = 120
                      const barHeight = (item.value / allocationAxisMax) * 270
                      const y = 300 - barHeight
                      return (
                        <g key={item.label}>
                          <rect x={x} y={y} width={barWidth} height={barHeight} fill="#16a34a" />
                          <text x={x + barWidth / 2} y="326" textAnchor="middle" fontSize="14" fill={isDarkMode ? '#cbd5e1' : '#475569'}>
                            {item.label}
                          </text>
                        </g>
                      )
                    })}
                  </svg>
                </div>
              )}

              <div className="mt-3 flex items-center justify-center gap-2 text-base md:text-lg font-medium" style={{ color: '#16a34a' }}>
                <span className="h-3.5 w-5 bg-green-600" />
                <span>Total Items</span>
              </div>
            </article>
          </div>

          {/* DETAILED RESOURCE BREAKDOWN */}
          <article
            className={`rounded-3xl border p-5 md:p-8 shadow-sm transition-colors ${
              isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'
            }`}
          >
            <h3 className={`font-display text-2xl md:text-3xl font-bold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
              Detailed Resource Breakdown
            </h3>

            {!loading && !hasFood ? (
              <p className={`mt-6 text-center text-base ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                No food supply data yet.
              </p>
            ) : (
              <div className="mt-6 overflow-x-auto">
                <table className="w-full min-w-[760px] border-collapse">
                  <thead>
                    <tr className={`border-b ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                      <th className={`px-4 py-4 text-left text-base md:text-lg font-semibold ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>Category</th>
                      <th className={`px-4 py-4 text-center text-base md:text-lg font-semibold ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>Quantity</th>
                      <th className={`px-4 py-4 text-center text-base md:text-lg font-semibold ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>Percentage</th>
                      <th className={`px-4 py-4 text-center text-base md:text-lg font-semibold ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>Distribution</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allocationBreakdown.map((item) => (
                      <tr key={`breakdown-${item.label}`} className={`border-b ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                        <td className={`px-4 py-4 text-lg ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>{item.label}</td>
                        <td className={`px-4 py-4 text-center text-lg ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                          {item.value.toLocaleString()}
                        </td>
                        <td className={`px-4 py-4 text-center text-lg ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                          {item.percentage}%
                        </td>
                        <td className="px-4 py-4">
                          <div className={`mx-auto h-2.5 w-40 rounded-full ${isDarkMode ? 'bg-slate-700' : 'bg-slate-200'}`}>
                            <div className="h-2.5 rounded-full bg-green-600" style={{ width: `${item.percentage}%` }} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className={`mt-8 text-center ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              <p className="inline-flex items-center gap-2 text-base md:text-lg">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <path d="M16 2v4" />
                  <path d="M8 2v4" />
                  <path d="M3 10h18" />
                </svg>
                Last updated:{' '}
                {lastUpdated
                  ? lastUpdated.toLocaleString('en-PH', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                  : new Date().toLocaleString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })
                }
              </p>
              <p className="mt-2 text-base md:text-lg">
                All data is updated in real-time and reflects the current status of our operations.
              </p>
            </div>
          </article>
        </div>
      </section>
    </main>
  )
}

export default TransparencyPage
