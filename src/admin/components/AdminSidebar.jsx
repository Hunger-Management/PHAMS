import { Home, MapPin, Users, UserPlus, FileText, LogOut } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAdminAuth } from '../../context/AdminAuthContext'

function AdminSidebar({ isDarkMode }) {
    const { logout, adminUser } = useAdminAuth()
    const navigate = useNavigate()
    const location = useLocation()
    const [selectedNav, setSelectedNav] = useState(() => location.state?.selectedNav || null)

    useEffect(() => {
        setSelectedNav(location.state?.selectedNav || null)
    }, [location.pathname, location.state])

    const handleLogout = () => {
        logout()
        navigate('/staff/login')
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
                            if (item.path === '/admin/dashboard') {
                                setSelectedNav('Dashboard')
                                if (location.pathname === '/admin/dashboard') {
                                    window.scrollTo({ top: 0, behavior: 'smooth' })
                                    return
                                }

                                navigate(item.path, { state: { scrollToTop: true, selectedNav: 'Dashboard' } })
                                return
                            }

                            if (item.path === '/admin/barangays') {
                                setSelectedNav('Barangays')
                                const el = document.getElementById('barangay-management-section')
                                if (el) {
                                    const top = el.getBoundingClientRect().top + window.pageYOffset - 24
                                    window.scrollTo({ top, behavior: 'smooth' })
                                    return
                                }

                                navigate('/admin/dashboard', {
                                    state: {
                                        scrollTo: 'barangay-management-section',
                                        selectedNav: 'Barangays',
                                    },
                                })
                                return
                            }

                            if (item.path === '/admin/transparency') {
                                setSelectedNav('Transparency')
                                const el = document.getElementById('transparency-section')
                                if (el) {
                                    const top = el.getBoundingClientRect().top + window.pageYOffset - 24
                                    window.scrollTo({ top, behavior: 'smooth' })
                                    return
                                }

                                navigate('/admin/dashboard', {
                                    state: {
                                        scrollTo: 'transparency-section',
                                        selectedNav: 'Transparency',
                                    },
                                })
                                return
                            }

                            setSelectedNav(item.name)
                            navigate(item.path, { state: { selectedNav: item.name } })
                        }

                        return (
                            <div key={item.path}>
                                <button
                                    onClick={handleNavClick}
                                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition text-left ${isActive
                                        ? 'bg-green-600 text-white font-medium'
                                        : 'text-white/80 hover:bg-white/10'
                                    }`}
                                >
                                    <Icon size={18} />
                                    {item.name}
                                </button>

                                {item.children && item.children.map((child) => {
                                    const childIsActive = selectedNav
                                        ? selectedNav === child.name
                                        : location.pathname === child.path

                                    const handleChildClick = () => {
                                        setSelectedNav(child.name)
                                        navigate(child.path, { state: { selectedNav: child.name } })
                                    }

                                    return (
                                        <button
                                            key={child.path}
                                            onClick={handleChildClick}
                                            className={`w-full flex items-center gap-3 px-8 py-2 rounded-lg transition text-left text-sm ${childIsActive
                                                ? 'bg-green-600 text-white font-medium'
                                                : 'text-white/70 hover:bg-white/10'
                                            }`}
                                        >
                                            <child.icon size={14} />
                                            {child.name}
                                        </button>
                                    )
                                })}
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
        </aside>
    )
}

export default AdminSidebar
