import { Home, MapPin, UserPlus, Eye, LogOut } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useStaffAuth } from '../../context/StaffAuthContext'

function StaffSidebar({ isDarkMode }) {
    const { logout, staffUser } = useStaffAuth()
    const navigate = useNavigate()
    const location = useLocation()
    const [selectedNav, setSelectedNav] = useState(() => location.state?.selectedNav || 'Dashboard')

    useEffect(() => {
        setSelectedNav(location.state?.selectedNav || 'Dashboard')
    }, [location.pathname, location.state])

    const handleLogout = () => {
        logout()
        navigate('/staff/login')
    }

    const getInitials = (name) => {
        if (!name) return 'S'
        return name
            .split(' ')
            .map((part) => part[0])
            .join('')
            .toUpperCase()
    }

    const navItems = [
        { name: 'Dashboard', icon: Home, path: '/staff/dashboard', sectionId: 'dashboard-top' },
        { name: 'Barangays', icon: MapPin, path: '/staff/dashboard', sectionId: 'barangays-section' },
        { name: 'Add Family', icon: UserPlus, path: '/staff/dashboard', sectionId: 'add-family-section' },
        { name: 'Transparency', icon: Eye, path: '/staff/dashboard', sectionId: 'transparency-section' },
    ]

    const scrollToSection = (sectionId, selectedName) => {
        setSelectedNav(selectedName)

        if (sectionId === 'dashboard-top') {
            window.scrollTo({ top: 0, behavior: 'smooth' })
            return
        }

        const el = document.getElementById(sectionId)
        if (el) {
            const top = el.getBoundingClientRect().top + window.pageYOffset - 24
            window.scrollTo({ top, behavior: 'smooth' })
            return
        }

        navigate('/staff/dashboard', {
            state: {
                scrollTo: sectionId,
                selectedNav: selectedName,
            },
        })
    }

    return (
        <aside className={`fixed top-0 left-0 z-20 flex h-screen w-72 flex-col justify-between overflow-hidden shadow-2xl ${isDarkMode ? 'bg-gradient-to-b from-[#05334a] to-[#07253c] text-white' : 'bg-white text-slate-900 border-r border-slate-200'}`}>
            <div className="p-6">
                <div className="mb-10 flex items-center gap-3 border-b border-white/10 pb-6">
                    <div className={`rounded-xl p-3 text-lg shadow-sm ${isDarkMode ? 'bg-gradient-to-br from-emerald-500 to-emerald-600' : 'bg-emerald-50 text-emerald-700'}`}>🌾</div>
                    <div>
                        <h1 className={`text-xl font-semibold leading-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Zero Hunger</h1>
                        <p className={`text-sm ${isDarkMode ? 'text-white/70' : 'text-slate-500'}`}>Management System</p>
                    </div>
                </div>

                <div className={`mb-8 flex items-center gap-3 rounded-2xl px-4 py-3 ${isDarkMode ? 'border border-white/10 bg-white/3' : ''}`}>
                    <div className={`flex h-12 w-12 items-center justify-center rounded-full font-bold text-sm tracking-wide ${isDarkMode ? 'bg-[#163241] text-white' : 'bg-emerald-50 text-emerald-700'}`}>
                        {getInitials(staffUser?.name)}
                    </div>
                    <div>
                        <p className="text-sm font-semibold leading-tight">
                            {staffUser?.name || 'Staff User'}
                        </p>
                        <span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide ${isDarkMode ? 'bg-[#2f8f4e] text-white' : 'bg-emerald-100 text-emerald-800'}`}>
                            STAFF
                        </span>
                        <p className={`text-xs ${isDarkMode ? 'text-white/60' : 'text-slate-500'}`}>
                            {staffUser?.barangay || 'Poblacion'}
                        </p>
                    </div>
                </div>

                <nav className="space-y-2 text-base">
                    {navItems.map((item) => {
                        const Icon = item.icon
                        const isActive = selectedNav === item.name

                        return (
                            <button
                                key={item.path}
                                onClick={() => {
                                    scrollToSection(item.sectionId, item.name)
                                }}
                                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition ${isActive ? (isDarkMode ? 'bg-[#3c9452] font-semibold text-white shadow-sm' : 'bg-emerald-100 font-semibold text-emerald-800 shadow-sm') : (isDarkMode ? 'text-white/75 hover:bg-white/8 hover:text-white' : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900')}`}
                            >
                                <Icon size={20} />
                                <span className={`${isDarkMode ? '' : ''}`}>{item.name}</span>
                            </button>
                        )
                    })}
                </nav>
            </div>

            <div className="border-t border-white/10 p-6">
                <button
                    onClick={handleLogout}
                    className={`flex w-full items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition ${isDarkMode ? 'bg-[#2f4861] text-white hover:bg-[#345a75]' : 'bg-slate-100 text-slate-900 hover:bg-slate-200'}`}
                >
                    <LogOut size={14} />
                    Sign Out
                </button>
                <p className={`mt-3 text-center text-xs ${isDarkMode ? 'text-white/50' : 'text-slate-500'}`}>
                    Barangay Staff Portal
                </p>
            </div>
        </aside>
    )
}

export default StaffSidebar