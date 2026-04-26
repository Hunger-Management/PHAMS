import { Home, MapPin, Users, UserPlus, FileText, LogOut } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAdminAuth } from '../../context/AdminAuthContext'

function AdminSidebar({ isDarkMode }) {
    const { logout, adminUser } = useAdminAuth()
    const navigate = useNavigate()
    const location = useLocation()

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
        { name: 'Barangays', icon: MapPin, path: '/admin/barangays' },
        { name: 'Manage Families', icon: Users, path: '/admin/families' },
        { name: 'Add Family', icon: UserPlus, path: '/admin/families/add' },
        { name: 'User Management', icon: Users, path: '/admin/users' },
        { name: 'Transparency', icon: FileText, path: '/admin/transparency' },
    ]

    return (
        <aside className="w-64 min-h-screen bg-[#0a2f4f] text-white flex flex-col justify-between flex-shrink-0">
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
                        const isActive = location.pathname === item.path

                        return (
                            <button
                                key={item.path}
                                onClick={() => navigate(item.path)}
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