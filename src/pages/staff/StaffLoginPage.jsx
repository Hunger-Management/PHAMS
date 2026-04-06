import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useDarkMode } from '../../hooks/useDarkMode'
import { useStaffAuth } from '../../context/StaffAuthContext'

function StaffLoginPage() {
  const { isDarkMode, toggleDarkMode } = useDarkMode()
  const { login, isAuthenticated } = useStaffAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const redirectPath = location.state?.from?.pathname || '/staff/dashboard'

  const [formData, setFormData] = useState({ username: '', password: '' })
  const [errorMessage, setErrorMessage] = useState('')

  if (isAuthenticated) {
    return <Navigate to={redirectPath} replace />
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    setErrorMessage('')

    const result = login(formData.username, formData.password)
    if (!result.ok) {
      setErrorMessage(result.message)
      return
    }

    navigate(redirectPath, { replace: true })
  }

  return (
    <main className={`min-h-screen transition-colors ${
      isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-[#eef5f2] text-slate-900'
    }`}>
      <header className={`transition-colors ${
        isDarkMode ? 'bg-slate-900 border-b border-slate-700' : 'bg-[#f6f8f9] border-b border-slate-200'
      }`}>
        <div className="mx-auto flex w-[95%] max-w-7xl items-center justify-between px-3 py-3 md:px-5">
          <Link
            to="/"
            className={`text-xs font-bold uppercase tracking-[0.12em] ${isDarkMode ? 'text-blue-300' : 'text-blue-900'}`}
          >
            Pateros Hunger Management
          </Link>
          <button
            onClick={toggleDarkMode}
            className={`h-8 w-8 rounded-md grid place-items-center text-[10px] font-bold ${
              isDarkMode ? 'bg-slate-700 text-yellow-300 hover:bg-slate-600' : 'bg-blue-900 text-white hover:bg-blue-800'
            }`}
            aria-label="Toggle dark mode"
          >
            {isDarkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </header>

      <section className="mx-auto flex w-[95%] max-w-7xl items-center justify-center py-12 md:py-16">
        <article className={`w-full max-w-md rounded-2xl border p-6 shadow-sm md:p-8 ${
          isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'
        }`}>
          <h1
            className={`text-3xl font-black ${isDarkMode ? 'text-slate-100' : 'text-[#011d49]'}`}
            style={{ fontFamily: 'Arial Black, Trebuchet MS, sans-serif' }}
          >
            Staff Login
          </h1>
          <p className={`mt-2 text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
            Enter staff credentials to access the internal dashboard.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="username" className={`mb-1.5 block text-xs font-semibold uppercase tracking-[0.08em] ${
                isDarkMode ? 'text-slate-300' : 'text-slate-600'
              }`}>
                Username
              </label>
              <input
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                autoComplete="username"
                required
                className={`w-full rounded-md border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/40 ${
                  isDarkMode
                    ? 'border-slate-600 bg-slate-900 text-slate-100 placeholder-slate-500'
                    : 'border-slate-300 bg-white text-slate-900 placeholder-slate-400'
                }`}
                placeholder="Enter username"
              />
            </div>

            <div>
              <label htmlFor="password" className={`mb-1.5 block text-xs font-semibold uppercase tracking-[0.08em] ${
                isDarkMode ? 'text-slate-300' : 'text-slate-600'
              }`}>
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                autoComplete="current-password"
                required
                className={`w-full rounded-md border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/40 ${
                  isDarkMode
                    ? 'border-slate-600 bg-slate-900 text-slate-100 placeholder-slate-500'
                    : 'border-slate-300 bg-white text-slate-900 placeholder-slate-400'
                }`}
                placeholder="Enter password"
              />
            </div>

            {errorMessage ? (
              <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {errorMessage}
              </p>
            ) : null}

            <button
              type="submit"
              className={`w-full rounded-md px-4 py-2.5 text-sm font-semibold text-white transition-colors ${
                isDarkMode ? 'bg-blue-700 hover:bg-blue-600' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              Sign In
            </button>
          </form>

          <p className={`mt-5 text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Demo account: <span className="font-semibold">staff</span> / <span className="font-semibold">staff123</span>
          </p>
        </article>
      </section>
    </main>
  )
}

export default StaffLoginPage
