import { Link } from 'react-router-dom'
import { useDarkMode } from '../../hooks/useDarkMode'
import { useStaffAuth } from '../../context/StaffAuthContext'

function StaffDashboardPage() {
  const { isDarkMode, toggleDarkMode } = useDarkMode()
  const { staffUser, logout } = useStaffAuth()

  return (
    <main className={`min-h-screen transition-colors ${
      isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-[#eef5f2] text-slate-900'
    }`}>
      <header className={`transition-colors ${
        isDarkMode ? 'bg-slate-900 border-b border-slate-700' : 'bg-[#f6f8f9] border-b border-slate-200'
      }`}>
        <div className="mx-auto flex w-[95%] max-w-7xl items-center justify-between px-3 py-3 md:px-5">
          <h1 className={`text-xs font-bold uppercase tracking-[0.12em] ${isDarkMode ? 'text-blue-300' : 'text-blue-900'}`}>
            Staff Dashboard
          </h1>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleDarkMode}
              className={`h-8 w-8 rounded-md grid place-items-center text-[10px] font-bold ${
                isDarkMode ? 'bg-slate-700 text-yellow-300 hover:bg-slate-600' : 'bg-blue-900 text-white hover:bg-blue-800'
              }`}
              aria-label="Toggle dark mode"
            >
              {isDarkMode ? '☀️' : '🌙'}
            </button>
            <button
              onClick={logout}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold ${
                isDarkMode ? 'bg-slate-700 text-slate-100 hover:bg-slate-600' : 'bg-slate-800 text-white hover:bg-slate-700'
              }`}
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto w-[95%] max-w-7xl py-10 md:py-14">
        <article className={`rounded-2xl border p-6 shadow-sm md:p-8 ${
          isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'
        }`}>
          <p className={`text-xs uppercase tracking-[0.08em] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Welcome
          </p>
          <h2
            className={`mt-2 text-3xl font-black ${isDarkMode ? 'text-slate-100' : 'text-[#011d49]'}`}
            style={{ fontFamily: 'Arial Black, Trebuchet MS, sans-serif' }}
          >
            {staffUser?.name || 'Staff User'}
          </h2>
          <p className={`mt-2 text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
            Role: {staffUser?.role || 'Operations Staff'}
          </p>
          <p className={`mt-4 text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
            This is a protected area for staff operations. You can now add internal tools and reporting modules here.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/"
              className={`inline-flex items-center rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
                isDarkMode ? 'bg-blue-700 text-white hover:bg-blue-600' : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              Back to Public Site
            </Link>
          </div>
        </article>
      </section>
    </main>
  )
}

export default StaffDashboardPage
