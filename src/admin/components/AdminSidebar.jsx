import { Home, MapPin, Users, FileText, LogOut, Menu, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAdminAuth } from '../../context/AdminAuthContext'

function AdminSidebar({ isDarkMode }) {
    const { logout, adminUser } = useAdminAuth()
    const navigate = useNavigate()
    const location = useLocation()
    const [selectedNav, setSelectedNav] = useState(() => location.state?.selectedNav || null)
    const [isOpen, setIsOpen] = useState(false)

    useEffect(() => {
        setSelectedNav(location.state?.selectedNav || null)
    }, [location.pathname, location.state])

    useEffect(() => {
        setIsOpen(false)
    }, [location.pathname])

    const handleLogout = () => {
        logout()
        navigate('/staff/login')
    }

    const getInitials = (name) => {
        if (!name) return 'A'
        return name.split(' ').map((part) => part[0]).join('').toUpperCase()
    }

    const navItems = [
        { name: 'Dashboard', icon: Home, path: '/admin/dashboard' },
        { name: 'Barangays', icon: MapPin, path: '/admin/barangays' },
        { name: 'Manage Families', icon: Users, path: '/admin/families' },
        { name: 'Manage Individuals', icon: Users, path: '/admin/individuals' },
        { name: 'Manage Donations', icon: Users, path: '/admin/donations' },
        { name: 'Manage Users', icon: Users, path: '/admin/users' },
        { name: 'User Management', icon: Users, path: '/admin/create-account' },
        { name: 'Transparency', icon: FileText, path: '/admin/transparency' },
    ]

    return (
        <>
            {/* Mobile hamburger button — only visible when sidebar is closed */}
            <button
                onClick={() => setIsOpen(true)}
                className="fixed top-4 left-4 z-30 md:hidden bg-[#0a2f4f] text-white p-2 rounded-lg shadow-lg"
                aria-label="Open menu"
            >
                <Menu size={20} />
            </button>

            {/* Mobile overlay — tapping closes the sidebar */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 md:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}

            <aside className={`fixed top-0 left-0 w-64 h-screen bg-[#0a2f4f] text-white flex flex-col justify-between flex-shrink-0 overflow-hidden z-40 transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
                <div className="p-6">
                    <div className="flex items-center justify-between mb-10">
                        <div className="flex items-center gap-3">
                            <div className="bg-green-600 p-2 rounded-lg text-lg">🌽</div>
                            <div>
                                <h1 className="text-lg font-semibold">Zero Hunger</h1>
                                <p className="text-xs opacity-70">Management System</p>
                            </div>
                        </div>
                        {/* Close button — only visible on mobile */}
                        <button
                            onClick={() => setIsOpen(false)}
                            className="md:hidden text-white/70 hover:text-white p-1"
                            aria-label="Close menu"
                        >
                            <X size={18} />
                        </button>
                    </div>

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

                    <nav className="space-y-1 text-sm">
                        {navItems.map((item) => {
                            const Icon = item.icon
                            const isActive = selectedNav
                                ? selectedNav === item.name
                                : location.pathname === item.path

                            const handleNavClick = () => {
                                setIsOpen(false)

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
                                <button
                                    key={item.path}
                                    onClick={handleNavClick}
                                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition text-left ${isActive
                                        ? 'bg-green-600 text-white font-medium'
                                        : 'text-white/80 hover:bg-white/10'
                                    }`}
                                >
                                    <Icon size={18} />
                                    {item.name}
                                </button>
                            )
                        })}
                    </nav>
                </div>

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
        </>
    )
}

export default AdminSidebar
