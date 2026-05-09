import { useEffect, useState } from 'react'
import { apiFetch } from '../../api/api'

function CreateStaffAccountSection({ isDarkMode }) {
  const [barangays, setBarangays] = useState([])
  const [loadingBarangays, setLoadingBarangays] = useState(true)
  const [loadingError, setLoadingError] = useState('')
  const [staffFormData, setStaffFormData] = useState({
    name: '',
    email: '',
    password: '',
    barangay_id: '',
  })
  const [staffFormMessage, setStaffFormMessage] = useState('')
  const [staffFormError, setStaffFormError] = useState('')

  useEffect(() => {
    const loadBarangays = async () => {
      setLoadingBarangays(true)
      setLoadingError('')
      try {
        const data = await apiFetch('/api/barangays')
        setBarangays(Array.isArray(data) ? data : [])
      } catch (err) {
        setLoadingError(err.message || 'Failed to load barangays.')
      } finally {
        setLoadingBarangays(false)
      }
    }

    loadBarangays()
  }, [])

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

    if (!staffFormData.name || !staffFormData.email || !staffFormData.password) {
      setStaffFormError('Name, email, and password are required.')
      return
    }

    try {
      const payload = {
        name: staffFormData.name,
        email: staffFormData.email,
        password: staffFormData.password,
        role: 'Staff',
        barangay_id: staffFormData.barangay_id ? Number(staffFormData.barangay_id) : null,
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
        barangay_id: '',
      })
    } catch (err) {
      setStaffFormError(err.message || 'Failed to create staff account.')
    }
  }

  return (
    <section id="create-account-section" className="mt-6 grid gap-6 lg:grid-cols-2">
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
                placeholder="name@example.com"
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
              name="barangay_id"
              value={staffFormData.barangay_id}
              onChange={handleStaffInputChange}
              disabled={loadingBarangays}
              className={`w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/40 ${
                isDarkMode
                  ? 'border-slate-600 bg-slate-900 text-slate-100'
                  : 'border-slate-300 bg-white text-slate-900'
              }`}
            >
              <option value="">Select barangay (optional)</option>
              {barangays.map((barangay) => (
                <option key={barangay.barangay_id} value={barangay.barangay_id}>
                  {barangay.name}
                </option>
              ))}
            </select>
          </div>

          {loadingError ? (
            <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
              {loadingError}
            </p>
          ) : null}

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

        <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          Staff accounts are now created in the database and managed through the admin tools.
        </p>
      </article>
    </section>
  )
}

export default CreateStaffAccountSection
