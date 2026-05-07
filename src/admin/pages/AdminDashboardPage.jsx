import AdminSidebar from '../components/AdminSidebar'
import { useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAdminAuth } from '../../context/AdminAuthContext'
import { useDarkMode } from '../../hooks/useDarkMode'
import BarangayManagementSection from '../components/BarangayManagementSection'
import TransparencySection from '../components/TransparencySection'
import { ArrowLeft } from 'lucide-react'

export default function AdminDashboardPage() {
    const { adminUser } = useAdminAuth()
    const navigate = useNavigate()
    const { isDarkMode, toggleDarkMode } = useDarkMode()

    const [stats, setStats] = useState(null)
    const [statsLoading, setStatsLoading] = useState(true)
    const [statsError, setStatsError] = useState(null)

    const [barangays, setBarangays] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const location = useLocation()

    useEffect(() => {
        const root = document.documentElement
        const body = document.body

        const previousHtmlBg = root.style.backgroundColor
        const previousBodyBg = body.style.backgroundColor
        const previousOverflowX = body.style.overflowX

        root.style.backgroundColor = isDarkMode ? '#0b1220' : '#e5e7eb'
        body.style.backgroundColor = isDarkMode ? '#0b1220' : '#e5e7eb'
        body.style.overflowX = 'hidden'

        if (location?.state?.scrollToTop) {
            window.scrollTo({ top: 0, behavior: 'smooth' })
        }

        if (location?.state?.scrollTo) {
            const id = location.state.scrollTo
            const el = document.getElementById(id)

            if (el) {
                const top =
                    el.getBoundingClientRect().top +
                    window.pageYOffset -
                    24

                window.scrollTo({
                    top,
                    behavior: 'smooth',
                })
            }
        }

        return () => {
            root.style.backgroundColor = previousHtmlBg
            body.style.backgroundColor = previousBodyBg
            body.style.overflowX = previousOverflowX
        }
    }, [location, isDarkMode])

    useEffect(() => {
        fetch('/api/barangays')
            .then((res) => {
                if (!res.ok) {
                    throw new Error('Failed to fetch barangays')
                }

                return res.json()
            })
            .then((data) => {
                setBarangays(data)
                setLoading(false)
            })
            .catch((err) => {
                setError(err.message)
                setLoading(false)
            })
    }, [])

    useEffect(() => {
        fetch('/api/stats')
            .then((res) => {
                if (!res.ok) {
                    throw new Error('Failed to fetch stats')
                }

                return res.json()
            })
            .then((data) => {
                setStats(data)
                setStatsLoading(false)
            })
            .catch((err) => {
                setStatsError(err.message)
                setStatsLoading(false)
            })
    }, [])

    const statCards = stats
        ? [
              {
                  title: 'Total Families',
                  value: stats.totalFamilies,
                  sub: 'All registered households',
              },
              {
                  title: 'Total Individuals',
                  value: stats.totalIndividuals,
                  sub: 'All registered individuals',
              },
              {
                  title: 'Pending Distributions',
                  value: stats.pendingDistributions,
                  sub: 'Awaiting delivery',
              },
              {
                  title: 'Total Food Supply',
                  value: stats.totalFoodSupply,
                  sub: 'Units in stock',
              },
          ]
        : []

    return (
        <div
            className={`min-h-screen transition-colors duration-300 ${
                isDarkMode
                    ? 'bg-[#0b1220] text-slate-100'
                    : 'bg-[#e5e7eb] text-slate-900'
            }`}
        >
            {/* SIDEBAR */}
            <AdminSidebar isDarkMode={isDarkMode} />

            {/* MAIN */}
            <main className="ml-72 min-h-screen p-8">

                {/* BACK BUTTON */}
                <div className="mb-6">
                    <button
                        onClick={() => navigate(-1)}
                        className={`flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold shadow-md transition-all ${
                            isDarkMode
                                ? 'bg-slate-800 text-white hover:bg-slate-700'
                                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                        }`}
                    >
                        <ArrowLeft size={18} />
                        Back
                    </button>
                </div>

                <div className="max-w-7xl mx-auto">

                    {/* HEADER */}
                    <div className="mb-10">
                        <h2
                            className={`text-3xl font-bold ${
                                isDarkMode
                                    ? 'text-white'
                                    : 'text-slate-900'
                            }`}
                        >
                            Welcome,{' '}
                            {adminUser?.full_name || 'Administrator'}
                        </h2>

                        <p
                            className={`mt-2 text-sm ${
                                isDarkMode
                                    ? 'text-slate-400'
                                    : 'text-slate-500'
                            }`}
                        >
                            Full system overview and management
                        </p>
                    </div>

                    {/* STATS */}
                    <section className="mb-10">
                        {statsLoading && (
                            <p
                                className={
                                    isDarkMode
                                        ? 'text-slate-300'
                                        : 'text-slate-600'
                                }
                            >
                                Loading stats...
                            </p>
                        )}

                        {statsError && (
                            <p className="text-red-500">
                                Error: {statsError}
                            </p>
                        )}

                        {!statsLoading && !statsError && (
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                                {statCards.map((s) => (
                                    <div
                                        key={s.title}
                                        className={`rounded-2xl border p-6 shadow-sm transition ${
                                            isDarkMode
                                                ? 'border-white/10 bg-[#111c2e]'
                                                : 'border-slate-200 bg-white'
                                        }`}
                                    >
                                        <p
                                            className={`text-sm ${
                                                isDarkMode
                                                    ? 'text-slate-400'
                                                    : 'text-slate-500'
                                            }`}
                                        >
                                            {s.title}
                                        </p>

                                        <h3
                                            className={`mt-2 text-2xl font-bold ${
                                                isDarkMode
                                                    ? 'text-white'
                                                    : 'text-slate-900'
                                            }`}
                                        >
                                            {s.value}
                                        </h3>

                                        <p className="mt-1 text-xs text-slate-400">
                                            {s.sub}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    {/* BARANGAYS */}
                    <section
                        className={`mb-10 rounded-2xl border shadow-sm ${
                            isDarkMode
                                ? 'border-white/10 bg-[#111c2e]'
                                : 'border-slate-200 bg-white'
                        }`}
                    >
                        <div className="border-b px-6 py-4">
                            <h3
                                className={`text-xl font-semibold ${
                                    isDarkMode
                                        ? 'text-white'
                                        : 'text-slate-900'
                                }`}
                            >
                                Barangays
                            </h3>
                        </div>

                        <div className="px-6 py-4">
                            {loading && (
                                <p
                                    className={
                                        isDarkMode
                                            ? 'text-slate-300'
                                            : 'text-slate-600'
                                    }
                                >
                                    Loading barangays...
                                </p>
                            )}

                            {error && (
                                <p className="text-red-500">
                                    Error: {error}
                                </p>
                            )}

                            {!loading && !error && (
                                <div className="overflow-x-auto">
                                    <table className="w-full border-collapse">
                                        <thead>
                                            <tr className="bg-emerald-600 text-white">
                                                <th className="p-3 text-left">
                                                    ID
                                                </th>

                                                <th className="p-3 text-left">
                                                    Barangay Name
                                                </th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {barangays.map((b) => (
                                                <tr
                                                    key={b.barangay_id}
                                                    className="border-b hover:bg-emerald-50"
                                                >
                                                    <td className="p-3">
                                                        {b.barangay_id}
                                                    </td>

                                                    <td className="p-3">
                                                        {b.name}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* BARANGAY MANAGEMENT */}
                    <BarangayManagementSection
                        isDarkMode={isDarkMode}
                    />

                    {/* TRANSPARENCY */}
                    <TransparencySection
                        isDarkMode={isDarkMode}
                    />
                </div>
            </main>

            {/* DARK MODE TOGGLE */}
            <button
                onClick={toggleDarkMode}
                className={`fixed bottom-5 right-5 z-50 grid h-12 w-12 place-items-center rounded-full text-lg font-bold shadow-lg transition-colors ${
                    isDarkMode
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