import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, CheckCircle } from 'lucide-react'
import { useDarkMode } from '../../hooks/useDarkMode'
import AdminSidebar from '../components/AdminSidebar'
import { apiFetch } from '../../api/api'

const DEFAULT_FORM = {
  donor_id: '',
  food_id: '',
  quantity: '',
  date_given: '',
}

function AddDonationPage() {
  const { isDarkMode, toggleDarkMode } = useDarkMode()
  const navigate = useNavigate()

  const [formData, setFormData] = useState(DEFAULT_FORM)
  const [donors, setDonors] = useState([])
  const [foodSupplies, setFoodSupplies] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingError, setLoadingError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [imageFile, setImageFile] = useState(null)

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      setLoadingError('')
      try {
        const [donorsData, foodsData] = await Promise.all([
          apiFetch('/api/donors'),
          apiFetch('/api/food-supplies'),
        ])

        setDonors(Array.isArray(donorsData) ? donorsData : [])
        setFoodSupplies(Array.isArray(foodsData) ? foodsData : [])
      } catch (err) {
        setLoadingError(err.message || 'Failed to load dropdown data.')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')

    if (!formData.donor_id || !formData.food_id || !formData.quantity || !formData.date_given) {
      setErrorMessage('Please complete all required fields before submitting.')
      return
    }

    setSubmitting(true)

    try {
      const payload = new FormData()
      payload.append('donor_id', String(Number(formData.donor_id)))
      payload.append('food_id', String(Number(formData.food_id)))
      payload.append('quantity', String(Number(formData.quantity)))
      payload.append('date_given', formData.date_given)
      if (imageFile) {
        payload.append('image', imageFile)
      }

      await apiFetch('/api/donations', {
        method: 'POST',
        body: payload,
      })

      setSuccessMessage('Donation recorded successfully.')
      setFormData(DEFAULT_FORM)
      setImageFile(null)
      window.scrollTo({ top: 0, behavior: 'smooth' })

      setTimeout(() => {
        navigate('/admin/donations')
      }, 700)
    } catch (err) {
      setErrorMessage(err.message || 'Failed to record donation.')
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
                Log Donation
              </h2>
              <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Record incoming food donations.
              </p>
            </div>
            <button
              onClick={() => navigate('/admin/donations')}
              className={`text-sm font-medium px-4 py-2 rounded-lg transition ${isDarkMode
                ? 'text-slate-300 hover:bg-white/10'
                : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              ← Back to Donations
            </button>
          </div>

          {successMessage ? (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              <CheckCircle size={16} className="mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold">Donation recorded</p>
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
                Donation Details
              </h3>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className={labelClass}>Donor *</label>
                  <select
                    name="donor_id"
                    value={formData.donor_id}
                    onChange={handleChange}
                    className={inputClass}
                    disabled={loading}
                  >
                    <option value="">Select donor</option>
                    {donors.map((donor) => (
                      <option key={donor.donor_id} value={donor.donor_id}>
                        {donor.donor_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Food Supply *</label>
                  <select
                    name="food_id"
                    value={formData.food_id}
                    onChange={handleChange}
                    className={inputClass}
                    disabled={loading}
                  >
                    <option value="">Select food</option>
                    {foodSupplies.map((food) => (
                      <option key={food.food_id} value={food.food_id}>
                        {food.food_name} ({food.unit || 'unit'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Quantity *</label>
                  <input
                    name="quantity"
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="Enter quantity"
                  />
                </div>

                <div>
                  <label className={labelClass}>Date Given *</label>
                  <input
                    name="date_given"
                    type="date"
                    value={formData.date_given}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Donation Photo (Optional)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) => setImageFile(event.target.files?.[0] || null)}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 text-sm font-semibold transition disabled:opacity-50"
              >
                {submitting ? 'Saving...' : 'Record Donation'}
              </button>
            </div>
          </form>
        </div>
      </main>

      <button
        onClick={toggleDarkMode}
        className={`fixed bottom-5 right-5 z-50 h-12 w-12 rounded-full shadow-lg transition-colors grid place-items-center text-lg font-bold ${isDarkMode ? 'bg-slate-700 text-yellow-300 hover:bg-slate-600' : 'bg-blue-900 text-white hover:bg-blue-800'}`}
        aria-label="Toggle dark mode"
      >
        {isDarkMode ? '☀️' : '🌙'}
      </button>
    </div>
  )
}

export default AddDonationPage
