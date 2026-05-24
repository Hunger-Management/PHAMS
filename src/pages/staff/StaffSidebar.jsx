import { Home, MapPin, UserPlus, Users, User, Eye, FileText, LogOut } from 'lucide-react'
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
        navigate('/staff/login', { replace: true, state: { forceRoleChoice: true } })
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
        { name: 'Families List', icon: Users, path: '/staff/dashboard', sectionId: 'families-list-section' },
        { name: 'Add Family', icon: UserPlus, path: '/staff/dashboard', sectionId: 'add-family-section' },
        { name: 'Individuals (NPA)', icon: User, path: '/staff/individuals/no-address' },
        { name: 'Add Distribution', icon: FileText, path: '/staff/distributions/add' },
        { name: 'Transparency', icon: Eye, path: '/staff/dashboard', sectionId: 'transparency-section' },
    ]

    const scrollToSection = (item) => {
        const { sectionId, name, path } = item

        if (!sectionId) {
            setSelectedNav(name)
            navigate(path, { state: { selectedNav: name } })
            return
        }

        setSelectedNav(name)

        if (location.pathname !== '/staff/dashboard') {
            navigate('/staff/dashboard', {
                state: {
                    scrollTo: sectionId,
                    selectedNav: name,
                },
            })
            return
        }

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
                selectedNav: name,
            },
        })
    }

    return (
        <aside className="fixed top-0 left-0 w-64 h-screen bg-[#0a2f4f] text-white flex flex-col justify-between flex-shrink-0 overflow-hidden z-20">
            <div className="p-6">
                <div className="flex items-center gap-3 mb-10">
                    <div className="bg-green-600 p-2 rounded-lg text-lg">🌽</div>
                    <div>
                        <h1 className="text-lg font-semibold">Zero Hunger</h1>
                        <p className="text-xs opacity-70">Management System</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 mb-8">
                    <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center font-bold text-sm">
                        {getInitials(staffUser?.name)}
                    </div>
                    <div>
                        <p className="text-sm font-semibold leading-tight">
                            {staffUser?.name || 'Staff User'}
                        </p>
                        <span className="text-[10px] bg-blue-600 px-2 py-0.5 rounded">
                            STAFF
                        </span>
                        <p className="text-xs opacity-70">
                            {staffUser?.barangay || staffUser?.barangay_name || 'Unassigned'}
                        </p>
                    </div>
                </div>

                <nav className="space-y-1 text-sm">
                    {navItems.map((item) => {
                        const Icon = item.icon
                        const isActive = selectedNav === item.name

                        return (
                            <button
                                key={item.name}
                                onClick={() => {
                                    scrollToSection(item)
                                }}
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
                    Barangay Staff Portal
                </p>
            </div>
        </aside>
    )
}

export default StaffSidebar