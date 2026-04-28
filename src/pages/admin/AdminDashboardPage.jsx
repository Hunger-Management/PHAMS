import AdminSidebar from '../../components/admin/AdminSidebar'
import { useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { useAdminAuth } from '../../context/AdminAuthContext'
import { useNavigate } from 'react-router-dom'
import { useDarkMode } from '../../hooks/useDarkMode'
import CreateStaffAccountSection from '../../components/admin/CreateStaffAccountSection'
import BarangayManagementSection from '../../components/admin/BarangayManagementSection'
import TransparencySection from '../../components/admin/TransparencySection'

export default function AdminDashboardPage() {
    const { adminUser } = useAdminAuth()
    const navigate = useNavigate()
    const { isDarkMode, toggleDarkMode } = useDarkMode()

    const location = useLocation()

    useEffect(() => {
        if (location?.state?.scrollToTop) {
            window.scrollTo({ top: 0, behavior: 'smooth' })
        }
    }, [location])

    const stats = [
        { title: 'Total Families', value: '2,847', sub: '+12% from last month' },
        { title: 'Barangays Covered', value: '24', sub: 'All barangays active' },
        { title: 'Families Assisted', value: '1,523', sub: '53.5% assistance rate' },
        { title: 'Monthly Progress', value: '87%', sub: 'Target: 90%' }
    ]

    return (
        <div
            className={`flex min-h-screen transition-colors duration-300 ${isDarkMode
                    ? 'bg-[#0b1220] text-slate-100'
                    : 'bg-[#e5e7eb] text-slate-900'
                }`}
        >
            {/* SIDEBAR */}
            <AdminSidebar isDarkMode={isDarkMode} />

            {/* MAIN */}
            <main className="flex-1 p-10 ml-64">
                <div className="max-w-7xl mx-auto lg:origin-top lg:scale-[1.03]">

                    {/* HEADER */}
                    <div className="mb-10">
                        <h2
                            className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'
                                }`}
                        >
                            Welcome, {adminUser?.full_name || 'Administrator'}
                        </h2>

                        <p
                            className={`text-sm ${isDarkMode
                                    ? 'text-slate-400'
                                    : 'text-slate-500'
                                }`}
                        >
                            Full system overview and management
                        </p>
                    </div>

                    {/* STATS */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                        {stats.map((s, i) => (
                            <div
                                key={i}
                                className={`p-6 rounded-2xl border shadow-sm transition ${isDarkMode
                                        ? 'bg-[#111c2e] border-white/10'
                                        : 'bg-white border-slate-200'
                                    }`}
                            >
                                <p
                                    className={`text-sm ${isDarkMode
                                            ? 'text-slate-400'
                                            : 'text-slate-500'
                                        }`}
                                >
                                    {s.title}
                                </p>

                                <h3
                                    className={`text-2xl font-bold mt-2 ${isDarkMode
                                            ? 'text-white'
                                            : 'text-slate-900'
                                        }`}
                                >
                                    {s.value}
                                </h3>

                                <p className="text-xs mt-1 text-slate-400">
                                    {s.sub}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* LOWER SECTION */}
                    <div className="grid md:grid-cols-2 gap-6">

                        {/* SYSTEM OVERVIEW */}
                        <div
                            className={`p-6 rounded-2xl border shadow-sm ${isDarkMode
                                    ? 'bg-[#111c2e] border-white/10'
                                    : 'bg-white border-slate-200'
                                }`}
                        >
                            <h3
                                className={`font-semibold mb-4 ${isDarkMode
                                        ? 'text-white'
                                        : 'text-slate-900'
                                    }`}
                            >
                                System Overview
                            </h3>

                            <ul
                                className={`space-y-3 text-sm ${isDarkMode
                                        ? 'text-slate-300'
                                        : 'text-slate-600'
                                    }`}
                            >
                                <li>• Full access to all family records</li>
                                <li>• Manage staff accounts and permissions</li>
                                <li>• View monitoring dashboards</li>
                                <li>• Cross-barangay data analysis</li>
                            </ul>
                        </div>

                        {/* QUICK ACTIONS */}
                        <div
                            className={`p-6 rounded-2xl border shadow-sm ${isDarkMode
                                    ? 'bg-[#111c2e] border-white/10'
                                    : 'bg-white border-slate-200'
                                }`}
                        >
                            <h3
                                className={`font-semibold mb-4 ${isDarkMode
                                        ? 'text-white'
                                        : 'text-slate-900'
                                    }`}
                            >
                                Quick Actions
                            </h3>

                            <div className="space-y-3">
                                <button
                                    onClick={() =>
                                        navigate('/admin/families/add')
                                    }
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-medium"
                                >
                                    Add New Family Record
                                </button>

                                <button
                                    onClick={() =>
                                        navigate('/admin/families')
                                    }
                                    className="w-full bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-xl font-medium"
                                >
                                    View All Records
                                </button>

                                <button
                                    className={`w-full py-2.5 rounded-xl font-medium ${isDarkMode
                                            ? 'border border-white/10 text-white hover:bg-white/10'
                                            : 'border border-slate-300 text-slate-700 hover:bg-slate-50'
                                        }`}
                                >
                                    Generate Reports
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* CREATE STAFF ACCOUNT */}
                    <CreateStaffAccountSection isDarkMode={isDarkMode} />

                    {/* BARANGAY MANAGEMENT */}
                    <BarangayManagementSection isDarkMode={isDarkMode} />

                    {/* TRANSPARENCY */}
                    <TransparencySection isDarkMode={isDarkMode} />
                </div>
            </main>

            {/* DARK MODE TOGGLE */}
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