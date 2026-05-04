import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useDarkMode } from '../../hooks/useDarkMode'
import { useStaffAuth } from '../../context/StaffAuthContext'
import { useAdminAuth } from '../../context/AdminAuthContext'

function StaffLoginPage() {
    const { isDarkMode, toggleDarkMode } = useDarkMode()
    const { login: staffLogin, isAuthenticated: staffAuthenticated } = useStaffAuth()
    const { login: adminLogin, isAuthenticated: adminAuthenticated } = useAdminAuth()
    const navigate = useNavigate()
    const location = useLocation()
    const forceRoleChoice = location.state?.forceRoleChoice === true

    const [formData, setFormData] = useState({ email: '', password: '' })
    const [errorMessage, setErrorMessage] = useState('')
    const [selectedRole, setSelectedRole] = useState(null)

    if (staffAuthenticated && !forceRoleChoice) {
        return <Navigate to="/staff/dashboard" replace />
    }

    if (adminAuthenticated && !forceRoleChoice) {
        return <Navigate to="/admin/dashboard" replace />
    }

    const handleChange = (event) => {
        const { name, value } = event.target
        setFormData((current) => ({ ...current, [name]: value }))
    }

    const handleSubmit = async (event) => {
        event.preventDefault()
        setErrorMessage('')

        const intendedPath = location.state?.from?.pathname

        if (selectedRole === 'admin') {
                const result = await adminLogin(formData.email, formData.password)

                if (!result.ok) {
                    setErrorMessage(result.message)
                    return
                }

                const redirectTo = intendedPath || '/admin/dashboard'
                navigate(redirectTo, { replace: true })
                return
            }

            const result = await staffLogin(formData.email, formData.password)

            if (!result.ok) {
                setErrorMessage(result.message)
                return
            }

            const redirectTo = intendedPath || '/staff/dashboard'
            navigate(redirectTo, { replace: true })
    }

    return (
        <main className={`min-h-screen transition-colors ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-[#eef5f2] text-slate-900'
            }`}>
            <header
              className={`transition-colors ${
                isDarkMode ? 'bg-slate-900 border-b border-slate-700 shadow-md' : 'bg-[#f6f8f9] border-b border-slate-200 shadow-sm'
              }`}
            >
              <div className="mx-auto w-[95%] max-w-7xl px-3 md:px-5 py-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Link
                      to="/"
                      className={`h-12 w-12 md:h-14 md:w-14 rounded-full border-2 grid place-items-center overflow-hidden transition-colors ${
                        isDarkMode ? 'border-blue-400/20 bg-slate-800' : 'border-blue-900/20 bg-white'
                      }`}
                    >
                      <img
                        src="/pateros-zero-hunger-logo.png"
                        alt="Pateros Zero Hunger logo"
                        className="h-full w-full object-cover"
                      />
                    </Link>
                    <Link
                      to="/"
                      className={`leading-tight uppercase tracking-[0.12em] text-[10px] md:text-xs transition-colors no-underline ${
                        isDarkMode ? 'text-slate-300' : ''
                      }`}
                      style={{ fontFamily: 'Trebuchet MS, Segoe UI, sans-serif' }}
                    >
                      <span className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>Pateros Hunger</span>
                      <br />
                      <span className={`font-bold ${isDarkMode ? 'text-blue-300' : 'text-blue-900'}`}>and Management Systems</span>
                    </Link>
                  </div>

                  <div className="flex items-center gap-2 md:gap-3">
                    <label className="relative hidden sm:block">
                      <input
                        type="search"
                        placeholder="Search"
                        aria-label="Search"
                        className={`w-64 rounded-md border py-1.5 pl-3 pr-8 text-sm outline-none focus:ring-2 focus:ring-blue-500/40 transition-colors ${
                          isDarkMode
                            ? 'border-slate-600 bg-slate-800 text-slate-50 placeholder-slate-500'
                            : 'border-slate-300 bg-white text-slate-900 placeholder-slate-500'
                        }`}
                      />
                      <span className={`absolute right-2 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>⌕</span>
                    </label>
                    <img
                      src="/nu-1900-logo-transparent.png"
                      alt="NU 1900 logo"
                      className="h-12 w-12 object-contain"
                    />
                    <img
                      src="/ccit logo.png"
                      alt="CCT logo"
                      className="h-12 w-12 object-contain"
                    />
                  </div>
                </div>
              </div>
            </header>

            <section className="mx-auto flex w-[95%] max-w-7xl items-center justify-center py-12 md:py-16">
                <div className="w-full">
                    <div className="mx-auto max-w-5xl">
                        {!selectedRole && (
                            <>
                                <div className="text-center">
                                    <h1
                                        className={`text-4xl font-black ${isDarkMode ? 'text-slate-100' : 'text-[#011d49]'}`}
                                        style={{ fontFamily: 'Arial Black, Trebuchet MS, sans-serif' }}
                                    >
                                        Welcome
                                    </h1>
                                    <p className={`mt-3 text-lg ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                                        Select your role to continue to the system
                                    </p>
                                </div>

                                <div className="mt-8 grid gap-5 lg:grid-cols-2">
                                    <article className={`rounded-2xl border p-7 shadow-sm cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 ${isDarkMode ? 'border-slate-700 bg-slate-800 hover:border-blue-500/50 hover:bg-slate-750' : 'border-slate-200 bg-white hover:border-blue-400 hover:bg-blue-50/30'}`}>
                                        <div className={`mx-auto grid h-24 w-24 place-items-center rounded-full text-4xl ${isDarkMode ? 'bg-slate-700 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>
                                            🛡️
                                        </div>
                                        <h2 className={`mt-6 text-center text-4xl font-black ${isDarkMode ? 'text-slate-100' : 'text-[#011d49]'}`}>Administrator</h2>
                                        <p className={`mt-2 text-center text-xl ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                                            Full system access and management
                                        </p>
                                        <ul className={`mt-6 space-y-3 text-lg ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                                            <li>• Access all barangays and records</li>
                                            <li>• View monitoring and analytics</li>
                                            <li>• Manage staff accounts</li>
                                            <li>• Full data export capabilities</li>
                                        </ul>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelectedRole('admin')
                                                setFormData({ username: '', email: '', password: '' })
                                                setErrorMessage('')
                                            }}
                                            className="mt-7 w-full rounded-lg bg-blue-700 px-4 py-3 text-lg font-semibold text-white transition-colors hover:bg-blue-800"
                                        >
                                            Login as Administrator
                                        </button>
                                    </article>

                                    <article className={`rounded-2xl border p-7 shadow-sm cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 ${isDarkMode ? 'border-slate-700 bg-slate-800 hover:border-emerald-500/50 hover:bg-slate-750' : 'border-slate-200 bg-white hover:border-emerald-400 hover:bg-emerald-50/30'}`}>
                                        <div className={`mx-auto grid h-24 w-24 place-items-center rounded-full text-4xl ${isDarkMode ? 'bg-slate-700 text-emerald-300' : 'bg-emerald-100 text-emerald-700'}`}>
                                            👥
                                        </div>
                                        <h2 className={`mt-6 text-center text-4xl font-black ${isDarkMode ? 'text-slate-100' : 'text-[#011d49]'}`}>Barangay Staff</h2>
                                        <p className={`mt-2 text-center text-xl ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                                            Manage assigned barangay data
                                        </p>
                                        <ul className={`mt-6 space-y-3 text-lg ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                                            <li>• Access assigned barangay only</li>
                                            <li>• Add and edit family records</li>
                                            <li>• Limited personal data view</li>
                                            <li>• Update assistance status</li>
                                        </ul>
                                        <button
                                            type="button"
                                            onClick={() => setSelectedRole('staff')}
                                            className="mt-7 w-full rounded-lg bg-emerald-700 px-4 py-3 text-lg font-semibold text-white transition-colors hover:bg-emerald-800"
                                        >
                                            Login as Staff
                                        </button>
                                    </article>
                                </div>
                            </>
                        )}

                        {selectedRole === 'admin' ? (
                            <article className={`mt-8 rounded-3xl border-2 p-8 md:p-12 shadow-lg ${isDarkMode ? 'border-blue-500/30 bg-gradient-to-br from-slate-800 to-slate-850' : 'border-blue-100 bg-gradient-to-br from-white via-blue-50/30 to-white'
                                }`}>

                                <div className="mb-8">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedRole(null)
                                            setFormData({ email: '', password: '' })
                                            setErrorMessage('')
                                        }}
                                        className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${isDarkMode ? 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/70 hover:text-slate-200' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                                    >
                                        ← Back 
                                    </button>
                                </div>

                                <div className="mb-8">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className={`h-12 w-12 rounded-xl grid place-items-center text-xl font-bold ${isDarkMode ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>
                                            🛡️
                                        </div>
                                        <div>
                                            <h3 className={`text-3xl font-black ${isDarkMode ? 'text-slate-100' : 'text-[#011d49]'
                                                }`}>
                                                Administrator Login
                                            </h3>
                                            <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'
                                                }`}>
                                                Access full system management
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-5">

                                    {/* Email */}
                                    <div>
                                        <label
                                            htmlFor="admin-email"
                                            className={`mb-2.5 flex items-center gap-2 text-sm font-semibold ${isDarkMode ? 'text-slate-200' : 'text-slate-700'
                                                }`}
                                        >
                                             Email 
                                        </label>
                                        <input
                                            id="admin-email"
                                            name="email"
                                            type="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            autoComplete="email"
                                            required
                                            className={`w-full rounded-xl border-2 px-4 py-3.5 text-sm outline-none transition-all focus:shadow-lg ${isDarkMode
                                                    ? 'border-slate-600 bg-slate-900/50 text-slate-100 placeholder-slate-500 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/20'
                                                    : 'border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-400/20'
                                                }`}
                                            placeholder="admin@pateros.gov.ph"
                                        />
                                    </div>

                                    {/* Password */}
                                    <div>
                                        <label
                                            htmlFor="admin-password"
                                            className={`mb-2.5 flex items-center gap-2 text-sm font-semibold ${isDarkMode ? 'text-slate-200' : 'text-slate-700'
                                                }`}
                                        >
                                             Password
                                        </label>

                                        <input
                                            id="admin-password"
                                            type="password"
                                            name="password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            autoComplete="current-password"
                                            required
                                            className={`w-full rounded-xl border-2 px-4 py-3.5 text-sm outline-none transition-all focus:shadow-lg ${isDarkMode
                                                    ? 'border-slate-600 bg-slate-900/50 text-slate-100 placeholder-slate-500 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/20'
                                                    : 'border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-400/20'
                                                }`}
                                            placeholder="••••••••"
                                        />
                                    </div>

                                    {/* Error Message */}
                                    {errorMessage && (
                                        <div className={`rounded-xl border-2 p-4 flex items-start gap-3 ${isDarkMode ? 'border-red-500/30 bg-red-500/10 text-red-300' : 'border-red-200 bg-red-50 text-red-700'}`}>
                                            
                                            <p className="text-sm font-medium">{errorMessage}</p>
                                        </div>
                                    )}

                                    {/* Submit Button */}
                                    <button
                                        type="submit"
                                        className={`mt-6 w-full rounded-xl px-6 py-3.5 text-base font-semibold text-white transition-all duration-200 shadow-lg hover:shadow-xl active:scale-95 ${isDarkMode
                                                ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600'
                                                : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800'
                                                }`}
                                    >
                                        Sign In to Admin Dashboard
                                    </button>

                                    {/* Demo Credentials */}
                                    <div className={`mt-6 rounded-xl border-2 p-4 ${isDarkMode ? 'border-slate-700/50 bg-slate-900/30' : 'border-slate-200 bg-slate-50'}`}>
                                        <p className={`text-xs font-semibold uppercase tracking-wider mb-2.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                           Demo Credentials
                                        </p>
                                        <div className={`space-y-1.5 text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                                            <p><span className={`font-semibold ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>Email:</span> admin@pateros.gov.ph</p>
                                            <p><span className={`font-semibold ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>Password:</span> admin123</p>
                                        </div>
                                    </div>
                                </form>
                            </article>
                        ) : null}

                        {selectedRole === 'staff' ? (
                            <article className={`mt-8 rounded-3xl border-2 p-8 md:p-12 shadow-lg ${isDarkMode ? 'border-emerald-500/30 bg-gradient-to-br from-slate-800 to-slate-850' : 'border-emerald-100 bg-gradient-to-br from-white via-emerald-50/30 to-white'
                                }`}>

                                <div className="mb-8">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedRole(null)
                                            setFormData({ email: '', password: '' })
                                            setErrorMessage('')
                                        }}
                                        className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${isDarkMode ? 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/70 hover:text-slate-200' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                                    >
                                        ← Back 
                                    </button>
                                </div>

                                <div className="mb-8">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className={`h-12 w-12 rounded-xl grid place-items-center text-xl font-bold ${isDarkMode ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-100 text-emerald-700'}`}>
                                            👥
                                        </div>
                                        <div>
                                            <h3 className={`text-3xl font-black ${isDarkMode ? 'text-slate-100' : 'text-[#011d49]'}`}>Barangay Staff Login</h3>
                                            <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                                Access your assigned barangay data
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-5">
                                    {/* Email */}
                                    <div>
                                        <label htmlFor="staff-email" className={`mb-2.5 flex items-center gap-2 text-sm font-semibold ${isDarkMode ? 'text-slate-200' : 'text-slate-700'
                                            }`}>
                                           Email 
                                        </label>
                                        <input
                                            id="staff-email"
                                            name="email"
                                            type="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            autoComplete="email"
                                            required
                                            className={`w-full rounded-xl border-2 px-4 py-3.5 text-sm outline-none transition-all focus:shadow-lg ${isDarkMode
                                                    ? 'border-slate-600 bg-slate-900/50 text-slate-100 placeholder-slate-500 focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/20'
                                                    : 'border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-400/20'
                                                }`}
                                            placeholder="your.email@barangay.gov.ph"
                                        />
                                    </div>

                                    {/* Password */}
                                    <div>
                                        <label htmlFor="staff-password" className={`mb-2.5 flex items-center gap-2 text-sm font-semibold ${isDarkMode ? 'text-slate-200' : 'text-slate-700'
                                            }`}>
                                            Password
                                        </label>
                                        <input
                                            id="staff-password"
                                            name="password"
                                            type="password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            autoComplete="current-password"
                                            required
                                            className={`w-full rounded-xl border-2 px-4 py-3.5 text-sm outline-none transition-all focus:shadow-lg ${isDarkMode
                                                    ? 'border-slate-600 bg-slate-900/50 text-slate-100 placeholder-slate-500 focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/20'
                                                    : 'border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-400/20'
                                                }`}
                                            placeholder="••••••••"
                                        />
                                    </div>

                                    {/* Error Message */}
                                    {errorMessage && (
                                        <div className={`rounded-xl border-2 p-4 flex items-start gap-3 ${isDarkMode ? 'border-red-500/30 bg-red-500/10 text-red-300' : 'border-red-200 bg-red-50 text-red-700'}`}>
                                           
                                            <p className="text-sm font-medium">{errorMessage}</p>
                                        </div>
                                    )}

                                    {/* Submit Button */}
                                    <button
                                        type="submit"
                                        className={`mt-6 w-full rounded-xl px-6 py-3.5 text-base font-semibold text-white transition-all duration-200 shadow-lg hover:shadow-xl active:scale-95 ${isDarkMode
                                                ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600'
                                                : 'bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800'
                                                }`}
                                    >
                                        Sign In to Staff Dashboard
                                    </button>

                                    {/* Demo Credentials */}
                                    <div className={`mt-6 rounded-xl border-2 p-4 ${isDarkMode ? 'border-slate-700/50 bg-slate-900/30' : 'border-slate-200 bg-slate-50'}`}>
                                        <p className={`text-xs font-semibold uppercase tracking-wider mb-2.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                           Demo Credentials
                                        </p>
                                        <div className={`space-y-1.5 text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                                            <p><span className={`font-semibold ${isDarkMode ? 'text-emerald-300' : 'text-emerald-700'}`}>Email:</span> staff@barangay.gov.ph</p>
                                            <p><span className={`font-semibold ${isDarkMode ? 'text-emerald-300' : 'text-emerald-700'}`}>Password:</span> staff123</p>
                                        </div>
                                    </div>
                                </form>
                            </article>
                        ) : null}
                    </div>
                </div>
            </section>

            <button
                onClick={toggleDarkMode}
                className={`fixed bottom-5 right-5 z-50 h-12 w-12 rounded-full shadow-lg transition-colors grid place-items-center text-lg font-bold ${isDarkMode ? 'bg-slate-700 text-yellow-300 hover:bg-slate-600' : 'bg-blue-900 text-white hover:bg-blue-800'
                    }`}
                aria-label="Toggle dark mode"
            >
                {isDarkMode ? '☀️' : '🌙'}
            </button>
        </main>
    )
}

export default StaffLoginPage
