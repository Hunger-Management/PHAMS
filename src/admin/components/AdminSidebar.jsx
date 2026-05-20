import { Home, MapPin, Users, UserPlus, FileText, LogOut } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAdminAuth } from '../../context/AdminAuthContext'

function AdminSidebar({ isDarkMode }) {
    const { logout, adminUser } = useAdminAuth()
    const navigate = useNavigate()
    const location = useLocation()

    const [selectedNav, setSelectedNav] = useState(() => location.state?.selectedNav || null)

    // ✅ NEW MODAL STATE
    const [showLogoutModal, setShowLogoutModal] = useState(false)

    useEffect(() => {
        setSelectedNav(location.state?.selectedNav || null)
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
        if (!name) return 'A'
        return name.split(' ').map((n) => n[0]).join('').toUpperCase()
    }

    const navItems = [
        { name: 'Dashboard', icon: Home, path: '/admin/dashboard' },
        {
            name: 'Barangays',
            icon: MapPin,
            path: '/admin/barangays',
            children: [
                { name: 'Add Family', icon: UserPlus, path: '/admin/families/add' },
            ],
        },
        { name: 'Manage Families', icon: Users, path: '/admin/families' },
        { name: 'User Management', icon: Users, path: '/admin/create-account' },
        { name: 'Transparency', icon: FileText, path: '/admin/transparency' },
    ]

    return (
        <aside className="fixed top-0 left-0 w-64 h-screen bg-[#0a2f4f] text-white flex flex-col justify-between flex-shrink-0 overflow-hidden z-20">
            <div className="p-6">

                {/* Logo */}
                <div className="flex items-center gap-3 mb-10">
                    <div className="bg-green-600 p-2 rounded-lg text-lg">🌽</div>
                    <div>
                        <h1 className="text-lg font-semibold">Zero Hunger</h1>
                        <p className="text-xs opacity-70">Management System</p>
                    </div>
                </div>

                {/* User */}
                <div className="flex items-center gap-3 mb-8">
                    <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center font-bold text-sm">
                        {getInitials(adminUser?.full_name)}
                    </div>
                    <div>
                        <p className="text-sm font-semibold">
                            {adminUser?.full_name || 'Administrator'}
                        </p>
                        <span className="text-[10px] bg-blue-600 px-2 py-0.5 rounded">
                            ADMIN
                        </span>
                    </div>
                </div>

                {/* Nav */}
                <nav className="space-y-1 text-sm">
                    {navItems.map((item) => {
                        const Icon = item.icon
                        const isActive = selectedNav
                            ? selectedNav === item.name
                            : location.pathname === item.path

                        const handleNavClick = () => {
                            setSelectedNav(item.name)
                            navigate(item.path, { state: { selectedNav: item.name } })
                        }

                        return (
                            <div key={item.path}>
                                <button
                                    onClick={handleNavClick}
                                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition text-left ${
                                        isActive
                                            ? 'bg-green-600 text-white font-medium'
                                            : 'text-white/80 hover:bg-white/10'
                                    }`}
                                >
                                    <Icon size={18} />
                                    {item.name}
                                </button>
                            </div>
                        )
                    })}
                </nav>
            </div>

            {/* Footer */}
            <div className="p-6">
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 rounded-md px-3 py-2 text-xs font-semibold bg-slate-800 text-white hover:bg-slate-700 transition"
                >
                    <LogOut size={14} />
                    Sign Out
                </button>

                <p className="text-xs text-white/50 text-center mt-3">
                    Barangay Information System
                </p>
            </div>

            {/* ✅ MODAL */}
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
                                Cancel
                            </button>

                            <button
                                onClick={confirmLogout}
                                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm"
                            >
                                Logout
                            </button>
                        </div>

                    </div>
                </div>
            )}
        </aside>
    )
}

export default AdminSidebar