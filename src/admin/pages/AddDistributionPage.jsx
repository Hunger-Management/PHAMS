import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, CheckCircle } from 'lucide-react'
import { useDarkMode } from '../../hooks/useDarkMode'
import AdminSidebar from '../components/AdminSidebar'
import { apiFetch } from '../../api/api'

const DEFAULT_FORM = {
  recipient_type: 'Family',
  family_id: '',
  individual_id: '',
  barangay_id: '',
  food_id: '',
  quantity: '',
  date_given: '',
  status: 'Pending',
}

function AddDistributionPage() {
  const { isDarkMode, toggleDarkMode } = useDarkMode()
  const navigate = useNavigate()

  const [formData, setFormData] = useState(DEFAULT_FORM)
  const [families, setFamilies] = useState([])
  const [individuals, setIndividuals] = useState([])
  const [barangays, setBarangays] = useState([])
  const [foodSupplies, setFoodSupplies] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingError, setLoadingError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      setLoadingError('')
      try {
        const [familiesData, individualsData, barangaysData, foodsData] = await Promise.all([
          apiFetch('/api/families'),
          apiFetch('/api/individuals'),
          apiFetch('/api/barangays'),
          apiFetch('/api/food-supplies'),
        ])

        setFamilies(Array.isArray(familiesData) ? familiesData : [])
        setIndividuals(Array.isArray(individualsData) ? individualsData : [])
        setBarangays(Array.isArray(barangaysData) ? barangaysData : [])
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

    if (name === 'recipient_type') {
      setFormData((prev) => ({
        ...prev,
        recipient_type: value,
        family_id: value === 'Family' ? prev.family_id : '',
        individual_id: value === 'Individual' ? prev.individual_id : '',
      }))
      return
    }

    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')

    const needsFamily = formData.recipient_type === 'Family'
    const needsIndividual = formData.recipient_type === 'Individual'

    if (
      !formData.recipient_type ||
      !formData.barangay_id ||
      !formData.food_id ||
      !formData.quantity ||
      !formData.date_given ||
      !formData.status ||
      (needsFamily && !formData.family_id) ||
      (needsIndividual && !formData.individual_id)
    ) {
      setErrorMessage('Please complete all required fields before submitting.')
      return
    }

    setSubmitting(true)

    try {
      const payload = {
        recipient_type: formData.recipient_type,
        family_id: needsFamily ? Number(formData.family_id) : null,
        individual_id: needsIndividual ? Number(formData.individual_id) : null,
        barangay_id: Number(formData.barangay_id),
        food_id: Number(formData.food_id),
        quantity: Number(formData.quantity),
        date_given: formData.date_given,
        status: formData.status,
      }

      await apiFetch('/api/distributions', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      setSuccessMessage('Distribution recorded successfully.')
      setFormData(DEFAULT_FORM)
      window.scrollTo({ top: 0, behavior: 'smooth' })

      setTimeout(() => {
        navigate('/admin/transparency')
      }, 700)
    } catch (err) {
      setErrorMessage(err.message || 'Failed to record distribution.')
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
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                Record Distribution
              </h2>
              <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Log food assistance distribution details.
              </p>
            </div>
            <button
              onClick={() => navigate('/admin/transparency')}
              className={`text-sm font-medium px-4 py-2 rounded-lg transition ${isDarkMode
                ? 'text-slate-300 hover:bg-white/10'
                : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              ← Back to Transparency
            </button>
          </div>

          {successMessage ? (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              <CheckCircle size={16} className="mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold">Distribution recorded</p>
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
                Distribution Details
              </h3>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className={labelClass}>Recipient Type *</label>
                  <select
                    name="recipient_type"
                    value={formData.recipient_type}
                    onChange={handleChange}
                    className={inputClass}
                  >
                    <option value="Family">Family</option>
                    <option value="Individual">Individual</option>
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
                  <label className={labelClass}>Family *</label>
                  <select
                    name="family_id"
                    value={formData.family_id}
                    onChange={handleChange}
                    className={inputClass}
                    disabled={formData.recipient_type !== 'Family' || loading}
                  >
                    <option value="">Select family</option>
                    {families.map((family) => (
                      <option key={family.family_id} value={family.family_id}>
                        {family.family_name || `Family ${family.family_id}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Individual *</label>
                  <select
                    name="individual_id"
                    value={formData.individual_id}
                    onChange={handleChange}
                    className={inputClass}
                    disabled={formData.recipient_type !== 'Individual' || loading}
                  >
                    <option value="">Select individual</option>
                    {individuals.map((individual) => (
                      <option key={individual.individual_id} value={individual.individual_id}>
                        {individual.name || `Individual ${individual.individual_id}`}
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
                    <option value="">Select food item</option>
                    {foodSupplies.map((food) => (
                      <option key={food.food_id} value={food.food_id}>
                        {food.food_name}
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
                  <label className={labelClass}>Status *</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className={inputClass}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Received">Received</option>
                  </select>
                </div>
              </div>

              {loading ? (
                <p className={`mt-4 text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Loading dropdown data...
                </p>
              ) : null}
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate('/admin/transparency')}
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
                {submitting ? 'Saving...' : 'Record Distribution'}
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

export default AddDistributionPage
