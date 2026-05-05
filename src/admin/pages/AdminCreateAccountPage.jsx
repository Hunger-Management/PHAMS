import { useState } from 'react'
import AdminSidebar from '../components/AdminSidebar'
import { useDarkMode } from '../../hooks/useDarkMode'
import { useStaffAuth } from '../../context/StaffAuthContext'

const barangayOptions = [
  'Aguho',
  'Magtanggol',
  "Martires del '96",
  'Poblacion',
  'San Pedro',
  'San Roque',
  'Santa Ana',
  'Santo Rosario-Kanluran',
  'Santo Rosario-Silangan',
  'Tabacalera',
]

export default function AdminCreateAccountPage() {
  const { isDarkMode, toggleDarkMode } = useDarkMode()
  const { createStaffAccount, deleteStaffAccount, staffAccounts } = useStaffAuth()
  const [staffFormData, setStaffFormData] = useState({
    name: '',
    username: '',
    password: '',
    barangay: barangayOptions[0],
  })
  const [staffFormMessage, setStaffFormMessage] = useState('')
  const [staffFormError, setStaffFormError] = useState('')

  const handleStaffInputChange = (event) => {
    const { name, value } = event.target
    setStaffFormData((current) => ({
      ...current,
      [name]: value,
    }))
  }

  const handleCreateStaffAccount = (event) => {
    event.preventDefault()
    setStaffFormMessage('')
    setStaffFormError('')

    const result = createStaffAccount(staffFormData)

    if (!result.ok) {
      setStaffFormError(result.message)
      return
    }

    setStaffFormMessage('Staff account created successfully.')
    setStaffFormData({
      name: '',
      username: '',
      password: '',
      barangay: barangayOptions[0],
    })
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
                    placeholder="Enter staff full name"
                  />
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <label className={`mb-1 block text-xs font-semibold uppercase tracking-[0.08em] ${
                      isDarkMode ? 'text-slate-300' : 'text-slate-600'
                    }`} htmlFor="staffUsername">
                      Username
                    </label>
                    <input
                      id="staffUsername"
                      name="username"
                      value={staffFormData.username}
                      onChange={handleStaffInputChange}
                      required
                      className={`w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/40 ${
                        isDarkMode
                          ? 'border-slate-600 bg-slate-900 text-slate-100'
                          : 'border-slate-300 bg-white text-slate-900'
                      }`}
                      placeholder="Create username"
                    />
                  </div>

                  <div>
                    <label className={`mb-1 block text-xs font-semibold uppercase tracking-[0.08em] ${
                      isDarkMode ? 'text-slate-300' : 'text-slate-600'
                    }`} htmlFor="staffPassword">
                      Password
                    </label>
                    <input
                      id="staffPassword"
                      type="password"
                      name="password"
                      value={staffFormData.password}
                      onChange={handleStaffInputChange}
                      required
                      className={`w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/40 ${
                        isDarkMode
                          ? 'border-slate-600 bg-slate-900 text-slate-100'
                          : 'border-slate-300 bg-white text-slate-900'
                      }`}
                      placeholder="Create password"
                    />
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
                    name="barangay"
                    value={staffFormData.barangay}
                    onChange={handleStaffInputChange}
                    className={`w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/40 ${
                      isDarkMode
                        ? 'border-slate-600 bg-slate-900 text-slate-100'
                        : 'border-slate-300 bg-white text-slate-900'
                    }`}
                  >
                    {barangayOptions.map((barangay) => (
                      <option key={barangay} value={barangay}>
                        {barangay}
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
              <h3 className={`font-semibold mb-4 ${
                isDarkMode ? 'text-white' : 'text-slate-900'
              }`}>
                Staff Assignments
              </h3>

              {staffAccounts.length === 0 ? (
                <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  No created staff accounts yet.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[420px] text-left text-sm">
                    <thead>
                      <tr className={`${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        <th className="pb-2 font-semibold">Name</th>
                        <th className="pb-2 font-semibold">Username</th>
                        <th className="pb-2 font-semibold">Barangay</th>
                        <th className="pb-2 font-semibold">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {staffAccounts.map((staff) => (
                        <tr key={staff.username} className="border-t border-slate-200/20">
                          <td className={`py-2 ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                            {staff.name}
                          </td>
                          <td className={`py-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                            {staff.username}
                          </td>
                          <td className={`py-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                            {staff.barangay}
                          </td>
                          <td className="py-2">
                            <button
                              onClick={() => {
                                if (confirm(`Delete staff account "${staff.name}"?`)) {
                                  deleteStaffAccount(staff.username)
                                }
                              }}
                              className="text-xs font-semibold px-3 py-1 rounded bg-red-600 hover:bg-red-700 text-white transition"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
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
