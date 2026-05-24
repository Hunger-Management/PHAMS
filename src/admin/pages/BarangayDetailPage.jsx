import { useEffect, useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, Users, Home } from 'lucide-react'
import { useDarkMode } from '../../hooks/useDarkMode'
import AdminSidebar from '../components/AdminSidebar'
import StaffSidebar from '../../pages/staff/StaffSidebar'
import { apiFetch } from '../../api/api'

function BarangayDetailPage() {
    const { isDarkMode, toggleDarkMode } = useDarkMode()
    const { barangayId } = useParams()
    const navigate = useNavigate()
    const location = useLocation()

    const isStaffView = location.pathname.startsWith('/staff/')
    const backPath = isStaffView ? '/staff/dashboard' : '/admin/dashboard'
    const backState = isStaffView
        ? { scrollTo: 'barangay-management-section', selectedNav: 'Barangays' }
        : { selectedNav: 'Barangays' }

    const [barangay, setBarangay] = useState(null)
    const [families, setFamilies] = useState([])
    const [individuals, setIndividuals] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        const loadData = async () => {
            setLoading(true)
            setError('')
            try {
                const [barangayData, familiesData, individualsData] = await Promise.all([
                    apiFetch(`/api/barangays/${barangayId}`),
                    apiFetch('/api/families'),
                    apiFetch('/api/individuals'),
                ])

                setBarangay(barangayData)
                
                // Filter families and individuals by barangay_id on the client
                const allFamilies = Array.isArray(familiesData) ? familiesData : (familiesData.families || [])
                const allIndividuals = Array.isArray(individualsData) ? individualsData : (individualsData.individuals || [])
                
                const familiesForBarangay = allFamilies.filter(f => Number(f.barangay_id) === Number(barangayId))
                const individualsForBarangay = allIndividuals.filter(i => Number(i.barangay_id) === Number(barangayId))
                
                setFamilies(familiesForBarangay)
                setIndividuals(individualsForBarangay)
            } catch (err) {
                setError(err.message || 'Failed to load barangay details.')
            } finally {
                setLoading(false)
            }
        }

        loadData()
    }, [barangayId])

    if (loading) {
        return (
            <div className={`flex min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-[#0b1220] text-slate-100' : 'bg-[#e5e7eb] text-slate-900'}`}>
                {isStaffView ? (
                    <StaffSidebar isDarkMode={isDarkMode} />
                ) : (
                    <AdminSidebar isDarkMode={isDarkMode} />
                )}
                <main className={isStaffView ? 'md:ml-72 flex-1 pt-16 px-4 pb-4 md:p-10' : 'md:ml-64 flex-1 pt-16 px-4 pb-4 md:p-10'}>
                    <p className={isDarkMode ? 'text-slate-300' : 'text-slate-600'}>Loading...</p>
                </main>
            </div>
        )
    }

    if (error || !barangay) {
        return (
            <div className={`flex min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-[#0b1220] text-slate-100' : 'bg-[#e5e7eb] text-slate-900'}`}>
                {isStaffView ? (
                    <StaffSidebar isDarkMode={isDarkMode} />
                ) : (
                    <AdminSidebar isDarkMode={isDarkMode} />
                )}
                <main className={isStaffView ? 'md:ml-72 flex-1 pt-16 px-4 pb-4 md:p-10' : 'md:ml-64 flex-1 pt-16 px-4 pb-4 md:p-10'}>
                    <button
                        onClick={() => navigate(backPath, { state: backState })}
                        className="flex items-center gap-2 mb-6 text-blue-600 hover:text-blue-800 font-medium"
                    >
                        <ArrowLeft size={18} />
                        Back
                    </button>
                    <p className="text-red-500">{error || 'Barangay not found.'}</p>
                </main>
            </div>
        )
    }

    return (
        <div className={`flex min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-[#0b1220] text-slate-100' : 'bg-[#e5e7eb] text-slate-900'}`}>
            {isStaffView ? (
                <StaffSidebar isDarkMode={isDarkMode} />
            ) : (
                <AdminSidebar isDarkMode={isDarkMode} />
            )}

            <main className={isStaffView ? 'md:ml-72 flex-1 pt-16 px-4 pb-4 md:p-10' : 'md:ml-64 flex-1 pt-16 px-4 pb-4 md:p-10'}>
                <div className="max-w-7xl mx-auto">
                    {/* Header with back button */}
                    <button
                        onClick={() => navigate(backPath, { state: backState })}
                        className="flex items-center gap-2 mb-6 text-blue-600 hover:text-blue-800 font-medium"
                    >
                        <ArrowLeft size={18} />
                        Back to Barangays
                    </button>

                    {/* Barangay Title */}
                    <div className="mb-10">
                        <h1 className={`text-4xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                            {barangay.name}
                        </h1>
                        <p className={`text-sm mt-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                            Barangay ID: {barangay.barangay_id}
                        </p>
                        <div className="mt-4 flex flex-wrap gap-3">
                            <button
                                type="button"
                                onClick={() => navigate('/admin/families', { state: { barangayId: barangay.barangay_id, selectedNav: 'Manage Families' } })}
                                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${isDarkMode
                                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                    : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                }`}
                            >
                                View Families in Manage Families
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate('/admin/individuals', { state: { barangayId: barangay.barangay_id, selectedNav: 'Manage Individuals' } })}
                                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${isDarkMode
                                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                                    : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                                }`}
                            >
                                View Individuals in Manage Individuals
                            </button>
                        </div>
                    </div>

                    {/* Overview Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                        <div className={`p-6 rounded-2xl border shadow-sm transition ${isDarkMode ? 'bg-[#111c2e] border-white/10' : 'bg-white border-slate-200'}`}>
                            <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                Total Families
                            </p>
                            <h3 className={`text-3xl font-bold mt-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                                {families.length}
                            </h3>
                        </div>

                        <div className={`p-6 rounded-2xl border shadow-sm transition ${isDarkMode ? 'bg-[#111c2e] border-white/10' : 'bg-white border-slate-200'}`}>
                            <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                Total Individuals
                            </p>
                            <h3 className={`text-3xl font-bold mt-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                                {individuals.length}
                            </h3>
                        </div>

                        <div className={`p-6 rounded-2xl border shadow-sm transition ${isDarkMode ? 'bg-[#111c2e] border-white/10' : 'bg-white border-slate-200'}`}>
                            <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                Total Residents
                            </p>
                            <h3 className={`text-3xl font-bold mt-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                                {families.length + individuals.length}
                            </h3>
                        </div>

                        <div className={`p-6 rounded-2xl border shadow-sm transition ${isDarkMode ? 'bg-[#111c2e] border-white/10' : 'bg-white border-slate-200'}`}>
                            <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                Status
                            </p>
                            <h3 className={`text-lg font-bold mt-2 ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                                Active
                            </h3>
                        </div>
                    </div>

                    {/* Families Section */}
                    <div className={`rounded-2xl border p-6 shadow-sm mb-10 transition ${isDarkMode ? 'bg-[#111c2e] border-white/10' : 'bg-white border-slate-200'}`}>
                        <div className="flex items-center gap-2 mb-6">
                            <Home size={24} className={isDarkMode ? 'text-emerald-400' : 'text-emerald-600'} />
                            <h3 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                                Assigned Families ({families.length})
                            </h3>
                        </div>

                        {families.length === 0 ? (
                            <p className={`text-sm italic ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                No families assigned to this barangay.
                            </p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className={`border-b ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                                            <th className={`text-left py-3 px-4 font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                                Family Name
                                            </th>
                                            <th className={`text-left py-3 px-4 font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                                Head of Family
                                            </th>
                                            <th className={`text-left py-3 px-4 font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                                Address
                                            </th>
                                            <th className={`text-left py-3 px-4 font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                                Phone
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {families.map((family) => (
                                            <tr
                                                key={family.family_id}
                                                className={`border-b transition ${isDarkMode ? 'border-slate-700 hover:bg-slate-800' : 'border-slate-200 hover:bg-slate-50'}`}
                                            >
                                                <td className={`py-3 px-4 font-semibold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                                                    {family.family_name}
                                                </td>
                                                <td className={`py-3 px-4 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                                                    {family.head_of_family || '—'}
                                                </td>
                                                <td className={`py-3 px-4 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                                                    {family.address || '—'}
                                                </td>
                                                <td className={`py-3 px-4 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                                                    {family.phone || '—'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Individuals Section */}
                    <div className={`rounded-2xl border p-6 shadow-sm transition ${isDarkMode ? 'bg-[#111c2e] border-white/10' : 'bg-white border-slate-200'}`}>
                        <div className="flex items-center gap-2 mb-6">
                            <Users size={24} className={isDarkMode ? 'text-blue-400' : 'text-blue-600'} />
                            <h3 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                                Assigned Individuals ({individuals.length})
                            </h3>
                        </div>

                        {individuals.length === 0 ? (
                            <p className={`text-sm italic ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                No individuals assigned to this barangay.
                            </p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className={`border-b ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                                            <th className={`text-left py-3 px-4 font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                                Name
                                            </th>
                                            <th className={`text-left py-3 px-4 font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                                Age
                                            </th>
                                            <th className={`text-left py-3 px-4 font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                                Gender
                                            </th>
                                            <th className={`text-left py-3 px-4 font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                                Contact
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {individuals.map((individual) => (
                                            <tr
                                                key={individual.individual_id}
                                                className={`border-b transition ${isDarkMode ? 'border-slate-700 hover:bg-slate-800' : 'border-slate-200 hover:bg-slate-50'}`}
                                            >
                                                <td className={`py-3 px-4 font-semibold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                                                    {individual.name}
                                                </td>
                                                <td className={`py-3 px-4 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                                                    {individual.age || '—'}
                                                </td>
                                                <td className={`py-3 px-4 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                                                    {individual.gender || '—'}
                                                </td>
                                                <td className={`py-3 px-4 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                                                    {individual.phone || '—'}
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

            {/* Dark mode toggle */}
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

export default BarangayDetailPage
