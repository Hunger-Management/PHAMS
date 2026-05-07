import { Home, MapPin, UserPlus, Eye, LogOut } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useStaffAuth } from '../../context/StaffAuthContext'

function StaffSidebar({ isDarkMode }) {
    const { logout, staffUser } = useStaffAuth()
    const navigate = useNavigate()
    const location = useLocation()

    const [selectedNav, setSelectedNav] = useState(() => location.state?.selectedNav || 'Dashboard')

    // ✅ NEW MODAL STATE
    const [showLogoutModal, setShowLogoutModal] = useState(false)

    useEffect(() => {
        setSelectedNav(location.state?.selectedNav || 'Dashboard')
    }, [location.pathname, location.state])

    // ✅ UPDATED LOGOUT FLOW
    const handleLogout = () => {
        setShowLogoutModal(true)
    }

    const confirmLogout = () => {
        logout()
        navigate('/staff/login')
    }

    const cancelLogout = () => {
        setShowLogoutModal(false)
    }

    const getInitials = (name) => {
        if (!name) return 'S'
        return name.split(' ').map((part) => part[0]).join('').toUpperCase()
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
        <>
            <aside className={`fixed top-0 left-0 z-20 flex h-screen w-72 flex-col justify-between overflow-hidden shadow-2xl ${isDarkMode ? 'bg-gradient-to-b from-[#05334a] to-[#07253c] text-white' : 'bg-white text-slate-900 border-r border-slate-200'}`}>
                <div className="p-6">

                    {/* HEADER + NAV (unchanged) */}
                    <div className="mb-10 flex items-center gap-3 border-b border-white/10 pb-6">
                        <div className={`rounded-xl p-3 text-lg shadow-sm ${isDarkMode ? 'bg-gradient-to-br from-emerald-500 to-emerald-600' : 'bg-emerald-50 text-emerald-700'}`}>🌾</div>
                        <div>
                            <h1 className="text-xl font-semibold">Zero Hunger</h1>
                            <p className="text-sm opacity-70">Management System</p>
                        </div>
                    </div>

                    {/* NAV (unchanged) */}
                    <nav className="space-y-2 text-base">
                        {navItems.map((item) => (
                            <button
                                key={item.path}
                                onClick={() => scrollToSection(item.sectionId, item.name)}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left"
                            >
                                <item.icon size={20} />
                                {item.name}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* FOOTER */}
                <div className="border-t border-white/10 p-6">
                    <button
                        onClick={handleLogout}
                        className="flex w-full items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-semibold bg-slate-800 text-white hover:bg-slate-700 transition"
                    >
                        <LogOut size={14} />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* ✅ LOGOUT MODAL */}
            {showLogoutModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-[300px] text-center shadow-lg">

                        <h2 className="text-lg font-semibold text-gray-800 mb-2">
                            Confirm Logout
                        </h2>

                        <p className="text-sm text-gray-500 mb-5">
                            Are you sure you want to log off?
                        </p>

                        <div className="flex justify-center gap-3">
                            <button
                                onClick={cancelLogout}
                                className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-sm"
                            >
                                No
                            </button>

                            <button
                                onClick={confirmLogout}
                                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm"
                            >
                                Yes
                            </button>
                        </div>

                    </div>
                </div>
            )}
        </>
    )
}

export default StaffSidebar