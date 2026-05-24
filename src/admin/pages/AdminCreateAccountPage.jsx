import { useState, useEffect } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { useStaffAuth } from '../../context/StaffAuthContext'
import AdminSidebar from '../components/AdminSidebar'
import { useDarkMode } from '../../hooks/useDarkMode'
import { apiFetch } from '../../api/api'

const barangayOptions = [
  { id: 1, name: 'Aguho' },
  { id: 2, name: 'Magtanggol' },
  { id: 3, name: "Martires del '96" },
  { id: 4, name: 'Poblacion' },
  { id: 5, name: 'San Pedro' },
  { id: 6, name: 'San Roque' },
  { id: 7, name: 'Santa Ana' },
  { id: 8, name: 'Santo Rosario-Kanluran' },
  { id: 9, name: 'Santo Rosario-Silangan' },
  { id: 10, name: 'Tabacalera' },
]

export default function AdminCreateAccountPage() {
  const { isDarkMode, toggleDarkMode } = useDarkMode()
  const [staffFormData, setStaffFormData] = useState({
    name: '',
    email: '',
    password: '',
    barangay_id: barangayOptions[0].id,
  })
  const [staffFormMessage, setStaffFormMessage] = useState('')
  const [staffFormError, setStaffFormError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [staffAccounts, setStaffAccounts] = useState([])
  const [staffLoading, setStaffLoading] = useState(true)
  const { refreshStaffAccounts } = useStaffAuth()

  const fetchStaffAccounts = async () => {
    try {
      const users = await apiFetch('/api/users')
      setStaffAccounts(Array.isArray(users) ? users.filter((u) => String(u.role).toLowerCase() === 'staff') : [])
    } catch {
      setStaffAccounts([])
    } finally {
      setStaffLoading(false)
    }
  }

  useEffect(() => { fetchStaffAccounts() }, [])

  const handleStaffInputChange = (event) => {
    const { name, value } = event.target
    setStaffFormData((current) => ({
      ...current,
      [name]: value,
    }))
  }

  const handleCreateStaffAccount = async (event) => {
    event.preventDefault()
    setStaffFormMessage('')
    setStaffFormError('')

    try {
      // Client-side check to avoid creating duplicate staff for a barangay
      if (staffFormData.barangay_id) {
        try {
          const users = await apiFetch('/api/users')
          const exists = Array.isArray(users) && users.some((u) => String(u.role).toLowerCase() === 'staff' && Number(u.barangay_id) === Number(staffFormData.barangay_id))
          if (exists) {
            setStaffFormError('This barangay already has an assigned staff account.')
            return
          }
        } catch (e) {
          // ignore — server will enforce too
        }
      }
      const payload = {
        name: staffFormData.name,
        email: staffFormData.email,
        password: staffFormData.password,
        role: 'Staff',
        barangay_id: Number(staffFormData.barangay_id),
      }

      await apiFetch('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      setStaffFormMessage('Staff account created successfully.')
      setStaffFormData({
        name: '',
        email: '',
        password: '',
        barangay_id: barangayOptions[0].id,
      })
      fetchStaffAccounts()
      try {
        if (refreshStaffAccounts) await refreshStaffAccounts()
      } catch {}
    } catch (err) {
      setStaffFormError(err.message || 'Failed to create staff account.')
    }
  }

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        isDarkMode ? 'bg-[#0b1220] text-slate-100' : 'bg-[#e5e7eb] text-slate-900'
      }`}
    >
      <AdminSidebar isDarkMode={isDarkMode} />

      <main className="ml-64 p-10">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h2 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              User Management
            </h2>
            <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Create and manage staff accounts
            </p>
          </div>

          <section className="grid gap-6 lg:grid-cols-2">
            {/* Create Staff Account Form */}
            <article className={`p-6 rounded-2xl border shadow-sm ${
              isDarkMode
                ? 'bg-[#111c2e] border-white/10'
                : 'bg-white border-slate-200'
            }`}>
              <h3 className={`font-semibold mb-4 ${
                isDarkMode ? 'text-white' : 'text-slate-900'
              }`}>
                Create Staff Account
              </h3>

              <form onSubmit={handleCreateStaffAccount} className="space-y-3">
                <div>
                  <label className={`mb-1 block text-xs font-semibold uppercase tracking-[0.08em] ${
                    isDarkMode ? 'text-slate-300' : 'text-slate-600'
                  }`} htmlFor="staffName">
                    Full Name
                  </label>
                  <input
                    id="staffName"
                    name="name"
                    value={staffFormData.name}
                    onChange={handleStaffInputChange}
                    required
                    className={`w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/40 ${
                      isDarkMode
                        ? 'border-slate-600 bg-slate-900 text-slate-100'
                        : 'border-slate-300 bg-white text-slate-900'
                    }`}
                    placeholder="e.g. Staff Aguho"
                  />
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <label className={`mb-1 block text-xs font-semibold uppercase tracking-[0.08em] ${
                      isDarkMode ? 'text-slate-300' : 'text-slate-600'
                    }`} htmlFor="staffUsername">
                      Email
                    </label>
                    <input
                      id="staffUsername"
                      name="email"
                      type="email"
                      value={staffFormData.email}
                      onChange={handleStaffInputChange}
                      required
                      className={`w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/40 ${
                        isDarkMode
                          ? 'border-slate-600 bg-slate-900 text-slate-100'
                          : 'border-slate-300 bg-white text-slate-900'
                      }`}
                      placeholder="e.g. staff-aguho@pateros.gov.ph"
                    />
                  </div>

                  <div className="relative">
                    <label className={`mb-1 block text-xs font-semibold uppercase tracking-[0.08em] ${
                      isDarkMode ? 'text-slate-300' : 'text-slate-600'
                    }`} htmlFor="staffPassword">
                      Password
                    </label>
                    <input
                      id="staffPassword"
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={staffFormData.password}
                      onChange={handleStaffInputChange}
                      required
                      className={`w-full rounded-md border px-3 py-2 pr-10 text-sm outline-none focus:ring-2 focus:ring-blue-500/40 ${
                        isDarkMode
                          ? 'border-slate-600 bg-slate-900 text-slate-100'
                          : 'border-slate-300 bg-white text-slate-900'
                      }`}
                      placeholder="Create password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="absolute right-2 top-8 p-1 text-slate-400"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className={`mb-1 block text-xs font-semibold uppercase tracking-[0.08em] ${
                    isDarkMode ? 'text-slate-300' : 'text-slate-600'
                  }`} htmlFor="staffBarangay">
                    Assigned Barangay
                  </label>
                  <select
                    id="staffBarangay"
                    name="barangay_id"
                    value={staffFormData.barangay_id}
                    onChange={handleStaffInputChange}
                    className={`w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/40 ${
                      isDarkMode
                        ? 'border-slate-600 bg-slate-900 text-slate-100'
                        : 'border-slate-300 bg-white text-slate-900'
                    }`}
                  >
                    {barangayOptions.map((barangay) => (
                      <option key={barangay.id} value={barangay.id}>
                        {barangay.name}
                      </option>
                    ))}
                  </select>
                </div>

                {staffFormError ? (
                  <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {staffFormError}
                  </p>
                ) : null}

                {staffFormMessage ? (
                  <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                    {staffFormMessage}
                  </p>
                ) : null}

                <button
                  type="submit"
                  className="w-full rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  Create Staff Account
                </button>
              </form>
            </article>

            {/* Staff Assignments */}
            <article className={`p-6 rounded-2xl border shadow-sm ${
              isDarkMode
                ? 'bg-[#111c2e] border-white/10'
                : 'bg-white border-slate-200'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  Staff Assignments
                </h3>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  isDarkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'
                }`}>
                  {staffAccounts.length} / 10
                </span>
              </div>

              {staffLoading ? (
                <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Loading...</p>
              ) : staffAccounts.length === 0 ? (
                <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>No staff accounts yet.</p>
              ) : (
                <ul className="space-y-2">
                  {staffAccounts
                    .slice()
                    .sort((a, b) => (a.barangay_id ?? 99) - (b.barangay_id ?? 99))
                    .map((staff) => {
                      const brgy = barangayOptions.find((b) => b.id === Number(staff.barangay_id))
                      return (
                        <li key={staff.user_id ?? staff.id ?? staff.email} className={`flex items-center justify-between rounded-lg px-3 py-2.5 ${
                          isDarkMode ? 'bg-slate-800' : 'bg-slate-50'
                        }`}>
                          <div>
                            <p className={`text-sm font-medium ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                              {staff.name}
                            </p>
                            <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                              {staff.email}
                            </p>
                          </div>
                          <span className="ml-3 shrink-0 rounded-full bg-blue-600 px-2.5 py-0.5 text-xs font-medium text-white">
                            {brgy ? brgy.name : '—'}
                          </span>
                        </li>
                      )
                    })}
                </ul>
              )}
            </article>
          </section>
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
