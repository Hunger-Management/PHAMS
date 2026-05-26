import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, CheckCircle } from 'lucide-react'
import { useDarkMode } from '../../hooks/useDarkMode'
import AdminSidebar from '../components/AdminSidebar'
import { apiFetch } from '../../api/api'

const DEFAULT_FORM = {
  donor_id: '',
  donation_type: 'food',
  food_id: '',
  food_description: '',
  quantity: '',
  quantity_unit: 'kg',
  date_given: '',
  barangay_id: '',
}

function AddDonationPage() {
  const { isDarkMode, toggleDarkMode } = useDarkMode()
  const navigate = useNavigate()

  const [formData, setFormData] = useState(DEFAULT_FORM)
  const [donors, setDonors] = useState([])
  const [foodSupplies, setFoodSupplies] = useState([])
  const [barangays, setBarangays] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingError, setLoadingError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [trackingNumber, setTrackingNumber] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [imageFile, setImageFile] = useState(null)

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      setLoadingError('')
      try {
        const [donorsData, foodsData, barangaysData] = await Promise.all([
          apiFetch('/api/donors'),
          apiFetch('/api/food-supplies'),
          apiFetch('/api/barangays'),
        ])
        setDonors(Array.isArray(donorsData) ? donorsData : [])
        setFoodSupplies(Array.isArray(foodsData) ? foodsData : [])
        setBarangays(Array.isArray(barangaysData) ? barangaysData : [])
      } catch (err) {
        setLoadingError(err.message || 'Failed to load dropdown data.')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const isMonetary = formData.donation_type === 'monetary'

  const handleChange = (event) => {
    const { name, value } = event.target

    if (name === 'donation_type') {
      setFormData((prev) => ({
        ...prev,
        donation_type: value,
        food_id: '',
        food_description: '',
        quantity_unit: value === 'monetary' ? 'PHP' : 'kg',
      }))
      return
    }

    if (name === 'foodName') {
      const match = foodSupplies.find((f) => String(f.food_name) === String(value))
      if (match) {
        setFormData((prev) => ({ ...prev, food_id: match.food_id, food_description: '' }))
      } else {
        setFormData((prev) => ({ ...prev, food_id: '', food_description: value }))
      }
      return
    }

    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')
    setTrackingNumber('')

    if (!formData.donor_id || !formData.quantity || !formData.date_given) {
      setErrorMessage('Please complete all required fields (Donor, Quantity, Date).')
      return
    }

    if (!isMonetary && !formData.food_id && !formData.food_description) {
      setErrorMessage('Please specify the food or supply being donated.')
      return
    }

    setSubmitting(true)

    try {
      const payload = new FormData()
      payload.append('donor_id', String(Number(formData.donor_id)))
      payload.append('donation_type', formData.donation_type)
      if (!isMonetary) {
        if (formData.food_id) {
          payload.append('food_id', String(Number(formData.food_id)))
          payload.append('food_description', '')
        } else {
          payload.append('food_id', '')
          payload.append('food_description', formData.food_description || '')
        }
      }
      payload.append('quantity', String(formData.quantity))
      payload.append('quantity_unit', formData.quantity_unit || (isMonetary ? 'PHP' : 'kg'))
      payload.append('date_given', formData.date_given)
      if (formData.barangay_id) {
        payload.append('barangay_id', String(Number(formData.barangay_id)))
      }
      if (imageFile) {
        payload.append('image', imageFile)
      }
      payload.append('admin_log', 'true')

      const result = await apiFetch('/api/donations', { method: 'POST', body: payload })

      setSuccessMessage('Donation recorded and auto-approved.')
      setTrackingNumber(result?.tracking_number || '')
      setFormData(DEFAULT_FORM)
      setImageFile(null)
      window.scrollTo({ top: 0, behavior: 'smooth' })

      setTimeout(() => {
        navigate('/admin/donations')
      }, 2000)
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

  const labelClass = `mb-1.5 block text-xs font-semibold uppercase tracking-[0.08em] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`

  const cardClass = `rounded-2xl border p-6 shadow-sm ${isDarkMode ? 'border-white/10 bg-[#111c2e]' : 'border-slate-200 bg-white'}`

  return (
    <div className={`flex min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-[#0b1220] text-slate-100' : 'bg-[#e5e7eb] text-slate-900'}`}>
      <AdminSidebar isDarkMode={isDarkMode} />

      <main className="flex-1 pt-16 px-4 pb-4 md:p-8 overflow-auto md:ml-64">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Log Donation</h2>
              <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Record incoming donations. Admin-logged donations are auto-approved and added to inventory.
              </p>
            </div>
            <button
              onClick={() => navigate('/admin/donations')}
              className={`text-sm font-medium px-4 py-2 rounded-lg transition ${isDarkMode ? 'text-slate-300 hover:bg-white/10' : 'text-slate-600 hover:bg-slate-200'}`}
            >
              ← Back to Donations
            </button>
          </div>

          {successMessage && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              <CheckCircle size={16} className="mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold">{successMessage}</p>
                {trackingNumber && (
                  <p className="mt-1">Tracking number: <span className="font-mono font-bold">{trackingNumber}</span></p>
                )}
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              {errorMessage}
            </div>
          )}

          {loadingError && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              {loadingError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <datalist id="admin-food-options">
              {foodSupplies.map((food) => (
                <option key={food.food_id} value={food.food_name} />
              ))}
            </datalist>

            <div className={cardClass}>
              <h3 className={`font-semibold mb-5 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Donation Details</h3>

              <div className="grid gap-4 md:grid-cols-2">
                {/* Donation Type */}
                <div className="md:col-span-2">
                  <label className={labelClass}>Donation Type *</label>
                  <div className="flex gap-3">
                    {['food', 'monetary', 'equipment'].map((type) => (
                      <label key={type} className={`flex items-center gap-2 cursor-pointer px-4 py-2 rounded-lg border text-sm font-medium transition ${formData.donation_type === type
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : isDarkMode ? 'border-white/10 bg-[#0b1220] text-slate-300' : 'border-slate-200 bg-slate-50 text-slate-600'
                      }`}>
                        <input
                          type="radio"
                          name="donation_type"
                          value={type}
                          checked={formData.donation_type === type}
                          onChange={handleChange}
                          className="sr-only"
                        />
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </label>
                    ))}
                  </div>
                  {isMonetary && (
                    <p className={`mt-2 text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      Monetary donations are recorded as fund contributions and do not directly add to food inventory.
                    </p>
                  )}
                </div>

                {/* Donor */}
                <div>
                  <label className={labelClass}>Donor *</label>
                  <select name="donor_id" value={formData.donor_id} onChange={handleChange} className={inputClass} disabled={loading}>
                    <option value="">Select donor</option>
                    {donors.map((donor) => (
                      <option key={donor.donor_id} value={donor.donor_id}>{donor.donor_name}</option>
                    ))}
                  </select>
                </div>

                {/* Barangay (optional) */}
                <div>
                  <label className={labelClass}>Barangay <span className={isDarkMode ? 'text-slate-500' : 'text-slate-400'}>(Optional)</span></label>
                  <select name="barangay_id" value={formData.barangay_id} onChange={handleChange} className={inputClass} disabled={loading}>
                    <option value="">No preference (municipality-wide)</option>
                    {barangays.map((b) => (
                      <option key={b.barangay_id} value={b.barangay_id}>{b.name}</option>
                    ))}
                  </select>
                </div>

                {/* Food Supply — hidden for monetary */}
                {!isMonetary && (
                  <div>
                    <label className={labelClass}>Food / Supply *</label>
                    <input
                      name="foodName"
                      list="admin-food-options"
                      value={formData.food_id ? (foodSupplies.find((f) => Number(f.food_id) === Number(formData.food_id))?.food_name || '') : formData.food_description}
                      onChange={handleChange}
                      className={inputClass}
                      placeholder="Select or type item name"
                      disabled={loading}
                    />
                  </div>
                )}

                {/* Quantity */}
                <div>
                  <label className={labelClass}>{isMonetary ? 'Amount (PHP) *' : 'Quantity *'}</label>
                  <input
                    name="quantity"
                    type="number"
                    min="0"
                    step="any"
                    value={formData.quantity}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder={isMonetary ? 'e.g. 5000' : 'e.g. 50'}
                  />
                </div>

                {/* Unit — hidden for monetary */}
                {!isMonetary && (
                  <div>
                    <label className={labelClass}>Unit *</label>
                    <select name="quantity_unit" value={formData.quantity_unit} onChange={handleChange} className={inputClass}>
                      <option value="kg">Kilograms (kg)</option>
                      <option value="g">Grams (g)</option>
                      <option value="lb">Pounds (lb)</option>
                      <option value="packs">Packs</option>
                      <option value="boxes">Boxes</option>
                      <option value="bags">Bags</option>
                      <option value="units">Units</option>
                      <option value="cans">Cans</option>
                      <option value="bottles">Bottles</option>
                      <option value="liters">Liters (L)</option>
                    </select>
                  </div>
                )}

                {/* Date */}
                <div>
                  <label className={labelClass}>Date Given *</label>
                  <input name="date_given" type="date" value={formData.date_given} onChange={handleChange} className={inputClass} />
                </div>

                {/* Photo */}
                <div>
                  <label className={labelClass}>Proof Photo (Optional)</label>
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
