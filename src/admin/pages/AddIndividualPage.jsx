import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, CheckCircle } from 'lucide-react'
import { useDarkMode } from '../../hooks/useDarkMode'
import AdminSidebar from '../components/AdminSidebar'
import { apiFetch } from '../../api/api'

const DEFAULT_FORM = {
  name: '',
  age: '',
  gender: 'Male',
  barangay_id: '',
  status: 'Registered',
}

function AddIndividualPage() {
  const { isDarkMode, toggleDarkMode } = useDarkMode()
  const navigate = useNavigate()

  const [formData, setFormData] = useState(DEFAULT_FORM)
  const [barangays, setBarangays] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingError, setLoadingError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const loadBarangays = async () => {
      setLoading(true)
      setLoadingError('')
      try {
        const data = await apiFetch('/api/barangays')
        setBarangays(Array.isArray(data) ? data : [])
      } catch (err) {
        setLoadingError(err.message || 'Failed to load barangays.')
      } finally {
        setLoading(false)
      }
    }

    loadBarangays()
  }, [])

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')

    if (!formData.name || !formData.age || !formData.gender || !formData.barangay_id || !formData.status) {
      setErrorMessage('Please complete all required fields before submitting.')
      return
    }

    setSubmitting(true)

    try {
      const payload = {
        name: formData.name,
        age: Number(formData.age),
        gender: formData.gender,
        barangay_id: Number(formData.barangay_id),
        status: formData.status,
      }

      await apiFetch('/api/individuals', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      setSuccessMessage('Individual registered successfully.')
      setFormData(DEFAULT_FORM)
      window.scrollTo({ top: 0, behavior: 'smooth' })

      setTimeout(() => {
        navigate('/admin/families')
      }, 700)
    } catch (err) {
      setErrorMessage(err.message || 'Failed to register individual.')
    } finally {
      setSubmitting(false)
    }
  }

  const inputClass = `w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/40 transition ${isDarkMode
    ? 'border-white/10 bg-[#0b1220] text-slate-100 placeholder-slate-500'
    : 'border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400'
  }`

  const labelClass = `mb-1.5 block text-xs font-semibold uppercase tracking-[0.08em] ${isDarkMode
    ? 'text-slate-400'
    : 'text-slate-500'
  }`

  const cardClass = `rounded-2xl border p-6 shadow-sm ${isDarkMode
    ? 'border-white/10 bg-[#111c2e]'
    : 'border-slate-200 bg-white'
  }`

  return (
    <div className={`flex min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-[#0b1220] text-slate-100' : 'bg-[#e5e7eb] text-slate-900'}`}>
      <AdminSidebar isDarkMode={isDarkMode} />

      <main className="flex-1 p-8 overflow-auto ml-64">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                Register Individual
              </h2>
              <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Add a new individual beneficiary record.
              </p>
            </div>
            <button
              onClick={() => navigate('/admin/families')}
              className={`text-sm font-medium px-4 py-2 rounded-lg transition ${isDarkMode
                ? 'text-slate-300 hover:bg-white/10'
                : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              ← Back to Families
            </button>
          </div>

          {successMessage ? (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              <CheckCircle size={16} className="mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold">Individual registered</p>
                <p className="mt-0.5">{successMessage}</p>
              </div>
            </div>
          ) : null}

          {errorMessage ? (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              {errorMessage}
            </div>
          ) : null}

          {loadingError ? (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              {loadingError}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className={cardClass}>
              <h3 className={`font-semibold mb-5 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                Individual Details
              </h3>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className={labelClass}>Full Name *</label>
                  <input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="e.g. Maria Santos"
                  />
                </div>

                <div>
                  <label className={labelClass}>Age *</label>
                  <input
                    name="age"
                    type="number"
                    min="0"
                    value={formData.age}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="Enter age"
                  />
                </div>

                <div>
                  <label className={labelClass}>Gender *</label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className={inputClass}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Barangay *</label>
                  <select
                    name="barangay_id"
                    value={formData.barangay_id}
                    onChange={handleChange}
                    className={inputClass}
                    disabled={loading}
                  >
                    <option value="">Select barangay</option>
                    {barangays.map((barangay) => (
                      <option key={barangay.barangay_id} value={barangay.barangay_id}>
                        {barangay.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Status *</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className={inputClass}
                  >
                    <option value="Registered">Registered</option>
                    <option value="Received">Received</option>
                  </select>
                </div>
              </div>

              {loading ? (
                <p className={`mt-4 text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Loading barangays...
                </p>
              ) : null}
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate('/admin/families')}
                className={`rounded-full px-5 py-2 text-sm ${isDarkMode
                  ? 'bg-slate-800 border border-slate-700 text-slate-300'
                  : 'bg-slate-100 border border-slate-200 text-slate-900'
                }`}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
              >
                {submitting ? 'Saving...' : 'Register Individual'}
              </button>
            </div>
          </form>
        </div>
      </main>

      <button
        onClick={toggleDarkMode}
        className={`fixed bottom-5 right-5 z-50 h-12 w-12 rounded-full shadow-lg transition-colors grid place-items-center text-lg font-bold ${isDarkMode
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

export default AddIndividualPage
