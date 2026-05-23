import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useDarkMode } from '../../hooks/useDarkMode'
import SiteHeader from '../../components/SiteHeader'
import { apiFetch } from '../../api/api'

function BarangayDetailLayout({ barangayName }) {
  const { isDarkMode, toggleDarkMode } = useDarkMode()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [liveStats, setLiveStats] = useState(null)
  const [profile, setProfile] = useState({
    description: `Community profile for ${barangayName}.`,
    residents: '0',
    households: '0',
    registeredFamilies: '0',
    iwpaCount: '0',
    activeDistributions: '0',
    captain: 'To Be Assigned',
    phone: '+63 900 000 0000',
    email: 'barangay@pateros.gov.ph',
  })

  useEffect(() => {
    let mounted = true
    setLoading(true)
    setError(null)

    Promise.all([
      apiFetch('/api/barangays'),
      apiFetch('/api/families'),
      apiFetch('/api/individuals'),
      apiFetch('/api/distributions'),
      apiFetch('/api/users'),
      apiFetch('/api/food-supplies'),
    ])
      .then(([barangays, families, individuals, distributions, users, foodSupplies]) => {
        if (!mounted) return

        const barangay = (Array.isArray(barangays) ? barangays : []).find((b) => String(b.name).toLowerCase() === String(barangayName).toLowerCase())
        const barangayId = barangay ? Number(barangay.barangay_id) : null

        const familiesFor = (Array.isArray(families) ? families : []).filter((f) => Number(f.barangay_id) === barangayId)
        const individualsFor = (Array.isArray(individuals) ? individuals : []).filter((i) => Number(i.barangay_id) === barangayId)
        const distributionsFor = (Array.isArray(distributions) ? distributions : []).filter((d) => Number(d.barangay_id) === barangayId)

        const registeredFamilies = familiesFor.length
        const households = familiesFor.length
        const residents = familiesFor.reduce((sum, f) => sum + (Number(f.member_count) || 0), 0) + individualsFor.length

        const iwpaCount = individualsFor.filter((i) => String(i.status || '').toLowerCase() === 'pending').length

        const activeDistributions = distributionsFor.filter((d) => String(d.status || '').toLowerCase() !== 'completed').length

        // Pick a captain/staff: find user with barangay_id matching
        const staffFor = (Array.isArray(users) ? users : []).filter((u) => Number(u.barangay_id) === barangayId)
        const captain = staffFor[0]

        setProfile({
          description: barangay?.description || `Community profile for ${barangayName}.`,
          residents: String(residents),
          households: String(households),
          registeredFamilies: String(registeredFamilies),
          iwpaCount: String(iwpaCount),
          activeDistributions: String(activeDistributions),
          captain: captain ? (captain.full_name || captain.name) : 'To Be Assigned',
          phone: captain?.phone || captain?.contact || '+63 900 000 0000',
          email: captain?.email || 'barangay@pateros.gov.ph',
        })

        // ── Monthly families assisted (last 6 months) ──────────────────
        const now = new Date()
        const sixMonths = Array.from({ length: 6 }, (_, i) => {
          const start = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
          const end = new Date(now.getFullYear(), now.getMonth() - (4 - i), 1)
          const count = new Set(
            distributionsFor
              .filter((d) => {
                if (!d.date_given || !d.family_id) return false
                const date = new Date(d.date_given)
                return date >= start && date < end
              })
              .map((d) => d.family_id)
          ).size
          return { month: start.toLocaleString('en-US', { month: 'short' }), count }
        })
        const maxCount = Math.max(...sixMonths.map((m) => m.count), 1)
        const monthlyData = sixMonths.map((m) => ({
          month: m.month,
          value: m.count > 0 ? Math.round((m.count / maxCount) * 95) : 0,
        }))

        // ── Assistance type breakdown from real distribution data ───────
        const foodCounts = {}
        distributionsFor.forEach((d) => {
          const key = d.food_name || 'Other'
          foodCounts[key] = (foodCounts[key] || 0) + (Number(d.quantity) || 1)
        })
        const foodTotal = Object.values(foodCounts).reduce((sum, v) => sum + v, 0)
        const colorPalette = ['#3b82f6', '#f59e0b', '#10b981', '#6366f1', '#ef4444']
        const liveAssistanceTypes = Object.entries(foodCounts)
          .map(([label, value], i) => ({
            label,
            value: foodTotal > 0 ? Math.round((value / foodTotal) * 100) : 0,
            color: colorPalette[i % colorPalette.length],
          }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 4)

        // ── Recent activities from real distributions (no names) ────────
        const liveActivities = [...distributionsFor]
          .filter((d) => d.date_given)
          .sort((a, b) => new Date(b.date_given) - new Date(a.date_given))
          .slice(0, 3)
          .map((d) => {
            const daysAgo = Math.floor((Date.now() - new Date(d.date_given)) / 86400000)
            const timeLabel = daysAgo === 0 ? 'today' : daysAgo === 1 ? '1 day ago' : `${daysAgo} days ago`
            const color = String(d.status || '').toLowerCase() === 'completed' ? 'bg-emerald-500'
              : String(d.status || '').toLowerCase() === 'pending' ? 'bg-amber-500'
              : 'bg-blue-500'
            return {
              title: `${d.food_name || 'Food'} Distribution`,
              detail: `${d.status || 'Recorded'} · ${d.quantity ? `${d.quantity} ${d.unit || 'units'}` : 'qty unknown'} · ${timeLabel}`,
              color,
            }
          })

        // ── Municipal food supply inventory ─────────────────────────────
        const liveInventory = (Array.isArray(foodSupplies) ? foodSupplies : [])
          .slice(0, 4)
          .map((item) => ({
            label: item.food_name || 'Supply',
            value: `${Number(item.total_quantity || 0).toLocaleString()} ${item.unit || 'units'}`,
          }))

        setLiveStats({
          monthlyFamilies: monthlyData,
          assistanceTypes: liveAssistanceTypes.length > 0 ? liveAssistanceTypes : null,
          recentActivities: liveActivities.length > 0 ? liveActivities : null,
          inventoryItems: liveInventory.length > 0 ? liveInventory : null,
        })

        setLoading(false)
      })
      .catch((err) => {
        if (!mounted) return
        setError(err.message || 'Failed to load barangay data')
        setLoading(false)
      })

    return () => { mounted = false }
  }, [barangayName])

  const statCards = [
    { label: 'Registered Families', value: profile.registeredFamilies, icon: '👥', iconBg: 'bg-blue-50 text-blue-600' },
    { label: 'Individuals With Pending Assistance (IWPA)', value: profile.iwpaCount, icon: '⚠', iconBg: 'bg-amber-50 text-amber-600' },
    { label: 'Active Distributions', value: profile.activeDistributions, icon: '📦', iconBg: 'bg-emerald-50 text-emerald-600' },
    { label: 'Total Households', value: profile.households, icon: '↗', iconBg: 'bg-violet-50 text-violet-600' },
  ]

  const activeAssistanceTypes = liveStats?.assistanceTypes ?? []
  const totalAssistance = activeAssistanceTypes.reduce((sum, item) => sum + item.value, 0)
  const pieSegments = totalAssistance > 0
    ? activeAssistanceTypes
      .map((item, index) => {
        const startValue = activeAssistanceTypes.slice(0, index).reduce((sum, current) => sum + current.value, 0)
        const start = (startValue / totalAssistance) * 100
        const end = ((startValue + item.value) / totalAssistance) * 100
        return `${item.color} ${start}% ${end}%`
      })
      .join(', ')
    : '#cbd5e1 0% 100%'

  return (
    <main className={`min-h-screen transition-colors ${
      isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-[#eaf1ef] text-slate-900'
    }`}>
      <SiteHeader isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />

      <section className="mx-auto w-[95%] max-w-7xl py-5 md:py-6 lg:py-8">
        <article className={`rounded-2xl p-5 sm:p-6 md:p-8 lg:p-10 shadow-lg transition-colors ${
          isDarkMode
            ? 'bg-gradient-to-r from-gray-900 to-blue-700'
            : 'bg-gradient-to-r from-blue-600 to-blue-800'
        }`}>
          <div className="flex flex-col gap-5 md:gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <h2
                className="font-display text-2xl sm:text-3xl md:text-5xl font-bold text-white"
              >
                Barangay {barangayName}
              </h2>
              <p className="mt-3 md:mt-4 max-w-3xl text-base sm:text-lg leading-relaxed text-blue-100">
                {profile.description}
              </p>

              <div className="mt-4 md:mt-6 flex flex-wrap items-center gap-x-4 md:gap-x-6 gap-y-2 text-blue-100">
                <p className="text-base sm:text-lg">👥 {profile.residents} residents</p>
                <p className="text-base sm:text-lg">📍 {profile.households} households</p>
              </div>
            </div>

            <aside className="w-full max-w-sm rounded-xl border border-white/20 bg-white/10 p-4 md:p-5 backdrop-blur-sm">
              <p className="text-sm font-semibold tracking-wide text-blue-100">Barangay Captain</p>
              <p className="font-display mt-2 text-2xl sm:text-3xl font-bold text-white">
                {profile.captain}
              </p>
              <p className="mt-4 text-base sm:text-lg text-blue-100">📞 {profile.phone}</p>
              <p className="mt-2 text-base sm:text-lg text-blue-100">✉ {profile.email}</p>
            </aside>
          </div>
        </article>

        <div className="mt-5 md:mt-6 grid grid-cols-1 gap-3 md:gap-4 md:grid-cols-2 xl:grid-cols-4">
          {statCards.map((card) => (
            <article
              key={card.label}
              className={`rounded-2xl border p-5 md:p-6 shadow-sm transition-colors ${
                isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'
              }`}
            >
              <div className={`mb-3 md:mb-4 inline-flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-xl text-xl sm:text-2xl ${card.iconBg}`}>
                {card.icon}
              </div>
              <p className={`text-lg sm:text-xl md:text-2xl font-semibold ${isDarkMode ? 'text-slate-200' : 'text-slate-600'}`}>{card.label}</p>
              <p
                className={`font-display mt-2 text-3xl sm:text-4xl md:text-5xl font-bold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}
              >
                {card.value}
              </p>
            </article>
          ))}
        </div>

        <div className="mt-5 md:mt-6 grid grid-cols-1 gap-3 md:gap-4 xl:grid-cols-2">
          <article className={`rounded-2xl border p-5 md:p-6 shadow-sm transition-colors ${
            isDarkMode ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'
          }`}>
            <h3 className="font-display text-2xl sm:text-3xl font-bold">Monthly Families Assisted</h3>
            <p className={`mt-1 text-base sm:text-lg ${isDarkMode ? 'text-slate-300' : 'text-slate-500'}`}>
              Number of families receiving assistance per month
            </p>

            <div className="mt-6 md:mt-8">
              {!liveStats?.monthlyFamilies ? (
                <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>No distribution records yet.</p>
              ) : (
                <div className="grid grid-cols-6 items-end gap-3 sm:gap-4 md:gap-5">
                  {liveStats.monthlyFamilies.map((entry) => (
                    <div key={entry.month} className="flex flex-col items-center gap-2">
                      <div className={`flex h-44 sm:h-52 md:h-56 w-full items-end rounded-xl ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
                        {entry.value > 0 && (
                          <div className="w-full rounded-xl bg-blue-500" style={{ height: `${entry.value}%` }} />
                        )}
                      </div>
                      <p className={`text-sm sm:text-base font-semibold ${isDarkMode ? 'text-slate-300' : 'text-slate-500'}`}>{entry.month}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </article>

          <article className={`rounded-2xl border p-5 md:p-6 shadow-sm transition-colors ${
            isDarkMode ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'
          }`}>
            <h3 className="font-display text-2xl sm:text-3xl font-bold">Assistance Types</h3>
            <p className={`mt-1 text-base sm:text-lg ${isDarkMode ? 'text-slate-300' : 'text-slate-500'}`}>Distribution breakdown</p>

            {activeAssistanceTypes.length === 0 ? (
              <p className={`mt-6 text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>No distribution records yet.</p>
            ) : (
              <div className="mt-6 md:mt-8 flex flex-col items-center justify-center gap-5 md:gap-6 lg:flex-row">
                <div
                  className="h-56 w-56 shrink-0 aspect-square rounded-full border"
                  style={{
                    background: `conic-gradient(${pieSegments})`,
                    borderColor: isDarkMode ? '#334155' : '#cbd5e1',
                  }}
                />
                <div className="w-full space-y-2 md:space-y-3">
                  {activeAssistanceTypes.map((item) => (
                    <div key={item.label} className="flex items-center justify-between rounded-lg px-3 py-2" style={{ backgroundColor: isDarkMode ? '#0f172a' : '#f8fafc' }}>
                      <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className={`font-semibold ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>{item.label}</span>
                      </div>
                      <span className={`font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>{item.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </article>

          <article className={`rounded-2xl border p-5 md:p-6 shadow-sm transition-colors ${
            isDarkMode ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl text-xl ${
                isDarkMode ? 'bg-blue-900/40 text-blue-300' : 'bg-blue-100 text-blue-600'
              }`}>
                📅
              </div>
              <h3 className="font-display text-2xl sm:text-3xl font-bold">Recent Activities</h3>
            </div>

            <div className="mt-5 md:mt-6 space-y-2.5 md:space-y-3">
              {!liveStats?.recentActivities || liveStats.recentActivities.length === 0 ? (
                <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>No activities recorded yet.</p>
              ) : liveStats.recentActivities.map((activity) => (
                <div
                  key={activity.title}
                  className={`rounded-xl border p-3.5 md:p-4 ${
                    isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-slate-100 bg-slate-50'
                  }`}
                >
                  <div className="flex items-start gap-2.5 md:gap-3">
                    <span className={`mt-2 h-2.5 w-2.5 rounded-full ${activity.color}`} />
                    <div>
                      <p className={`text-lg sm:text-xl md:text-2xl font-semibold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>{activity.title}</p>
                      <p className={`text-sm sm:text-base ${isDarkMode ? 'text-slate-300' : 'text-slate-500'}`}>{activity.detail}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className={`rounded-2xl border p-5 md:p-6 shadow-sm transition-colors ${
            isDarkMode ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl text-xl ${
                isDarkMode ? 'bg-emerald-900/40 text-emerald-300' : 'bg-emerald-100 text-emerald-600'
              }`}>
                📦
              </div>
              <h3 className="font-display text-2xl sm:text-3xl font-bold">Municipal Food Supply</h3>
            </div>

            <div className="mt-5 md:mt-6 space-y-2.5 md:space-y-3">
              {!liveStats?.inventoryItems || liveStats.inventoryItems.length === 0 ? (
                <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>No food supply inventory recorded yet.</p>
              ) : liveStats.inventoryItems.map((item) => (
                <div
                  key={item.label}
                  className={`flex items-center justify-between rounded-xl border px-3 py-2.5 md:px-4 md:py-3 ${
                    isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-slate-100 bg-slate-50'
                  }`}
                >
                  <p className={`text-lg sm:text-xl md:text-2xl font-semibold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>{item.label}</p>
                  <p className={`font-display text-lg sm:text-xl md:text-2xl font-bold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>{item.value}</p>
                </div>
              ))}
            </div>
          </article>
           </div>
      </section>
    </main>
  )
}

export default BarangayDetailLayout
