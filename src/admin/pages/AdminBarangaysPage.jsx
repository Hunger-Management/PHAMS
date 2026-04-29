import { Home, MapPin, Users, UserPlus, FileText, LogOut } from 'lucide-react'
import { useAdminAuth } from '../../context/AdminAuthContext'
import { useNavigate } from 'react-router-dom'
import { useDarkMode } from '../../hooks/useDarkMode'
import BarangayManagementSection from '../components/BarangayManagementSection'
import { useLocation } from 'react-router-dom'
import { useEffect } from 'react'

export default function AdminBarangaysPage() {
  const { logout, adminUser } = useAdminAuth()
  const navigate = useNavigate()
  const { isDarkMode, toggleDarkMode } = useDarkMode()

  const handleLogout = () => {
    logout()
    navigate('/staff/login')
  }

  const getInitials = (name) => {
    if (!name) return 'A'
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
  }

  const handleSidebarNavClick = (itemName) => {
    if (itemName === 'Dashboard') {
      navigate('/admin/dashboard')
    } else if (itemName === 'Barangays') {
      navigate('/admin/barangays')
    } else if (itemName === 'Transparency') {
      navigate('/admin/transparency')
    } else if (itemName === 'Create Account') {
      navigate('/admin/create-account')
    }
  }

  const location = useLocation()

  useEffect(() => {
    // if navigation passed a scroll target, scroll there smoothly
    if (location?.state?.scrollTo) {
      const id = location.state.scrollTo
      const el = document.getElementById(id)
      if (el) {
        // offset for fixed sidebar/top padding
        const top = el.getBoundingClientRect().top + window.pageYOffset - 24
        window.scrollTo({ top, behavior: 'smooth' })
      }
    }
  }, [location])

  const nav = [
    { name: 'Dashboard', icon: Home },
    { name: 'Barangays', icon: MapPin, active: true },
    { name: 'Transparency', icon: FileText },
    { name: 'Create Account', icon: UserPlus },
  ]

  return (
    <div className={`flex min-h-screen transition-colors duration-300 ${
      isDarkMode
        ? 'bg-[#0b1220] text-slate-100'
        : 'bg-[#e5e7eb] text-slate-900'
    }`}>

      {/* ================= SIDEBAR ================= */}
      <aside className="w-64 bg-[#0a2f4f] text-white flex flex-col justify-between">

        <div className="p-6">

          {/* LOGO */}
          <div className="flex items-center gap-3 mb-10">
            <div className="bg-green-600 p-2 rounded-lg text-lg">
              🌽
            </div>
            <div>
              <h1 className="text-lg font-semibold">Zero Hunger</h1>
              <p className="text-xs opacity-70">Management System</p>
            </div>
          </div>

          {/* USER */}
          <div className="flex items-center gap-3 mb-8">
            <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center font-bold">
              {getInitials(adminUser?.name)}
            </div>
            <div>
              <p className="text-sm font-semibold">
                {adminUser?.name || 'Administrator'}
              </p>
              <span className="text-[10px] bg-blue-600 px-2 py-0.5 rounded">
                ADMIN
              </span>
            </div>
          </div>

          {/* NAV */}
          <nav className="space-y-2 text-sm">
            {nav.map((item, i) => {
              const Icon = item.icon
              return (
                <div
                  key={i}
                  onClick={() => handleSidebarNavClick(item.name)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-lg cursor-pointer transition ${
                    item.active
                      ? isDarkMode
                        ? 'bg-[#1a2a44]'
                        : 'bg-white/20'
                      : 'text-white/80 hover:bg-white/10'
                  }`}
                >
                  <Icon size={18} />
                  {item.name}
                </div>
              )
            })}
          </nav>
        </div>

        {/* FOOTER */}
        <div className="p-6">
          <button
            onClick={handleLogout}
            className="w-full rounded-md px-3 py-2 text-xs font-semibold bg-slate-800 text-white hover:bg-slate-700 transition"
          >
            <LogOut size={16} className="inline mr-1" />
            Sign Out
          </button>

          <p className="text-xs text-white/50 text-center mt-3">
            Barangay Information System
          </p>
        </div>
      </aside>

      {/* ================= MAIN ================= */}
      <main className="flex-1 p-10 ml-64">
        <div className="max-w-7xl mx-auto">
          <BarangayManagementSection isDarkMode={isDarkMode} />
        </div>
      </main>

      {/* ================= FLOATING DARK MODE TOGGLE ================= */}
      <button
        onClick={toggleDarkMode}
        className={`fixed bottom-5 right-5 z-50 h-12 w-12 rounded-full shadow-lg transition-colors grid place-items-center text-lg font-bold ${
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
