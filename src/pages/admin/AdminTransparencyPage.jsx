import AdminSidebar from '../../components/admin/AdminSidebar'
import { useDarkMode } from '../../hooks/useDarkMode'
import TransparencySection from '../../components/admin/TransparencySection'

export default function AdminTransparencyPage() {
  const { isDarkMode, toggleDarkMode } = useDarkMode()

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        isDarkMode ? 'bg-[#0b1220] text-slate-100' : 'bg-[#e5e7eb] text-slate-900'
      }`}
    >
      <AdminSidebar isDarkMode={isDarkMode} />

      <main className="ml-64 p-10">
        <div className="max-w-7xl mx-auto">
          <TransparencySection isDarkMode={isDarkMode} />
        </div>
      </main>

      <button
        onClick={toggleDarkMode}
        className={`fixed bottom-5 right-5 z-50 h-12 w-12 rounded-full shadow-lg transition-colors grid place-items-center text-lg font-bold ${
          isDarkMode ? 'bg-slate-700 text-yellow-300 hover:bg-slate-600' : 'bg-blue-900 text-white hover:bg-blue-800'
        }`}
        aria-label="Toggle dark mode"
      >
        {isDarkMode ? '☀️' : '🌙'}
      </button>
    </div>
  )
}
