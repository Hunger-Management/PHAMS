import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { AlertTriangle, CheckCircle } from 'lucide-react'
import { useDarkMode } from '../../hooks/useDarkMode'
import AdminSidebar from '../components/AdminSidebar'
import StaffSidebar from '../../pages/staff/StaffSidebar'
import { apiFetch } from '../../api/api'
import { getCurrentStaffActor } from '../../utils/staffActivity'
import { useStaffAuth } from '../../context/StaffAuthContext'

const DEFAULT_FORM = {
  distribution_type: 'Food',
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
  const location = useLocation()
  const { staffUser } = useStaffAuth()

  const isStaffView = location.pathname.startsWith('/staff/')
  const transparencyPath = isStaffView ? '/staff/dashboard' : '/admin/transparency'
  const transparencyState = isStaffView
    ? { scrollTo: 'transparency-section', selectedNav: 'Transparency' }
    : { selectedNav: 'Transparency' }

  const goToTransparency = () => {
    navigate(transparencyPath, { state: transparencyState })
  }

  const [formData, setFormData] = useState(DEFAULT_FORM)
  const [imageFile, setImageFile] = useState(null)
  const [families, setFamilies] = useState([])
  const [individuals, setIndividuals] = useState([])
  const [barangays, setBarangays] = useState([])
  const [foodSupplies, setFoodSupplies] = useState([])
  const [distributions, setDistributions] = useState([])
  const [donations, setDonations] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingError, setLoadingError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const staffBarangayId = staffUser?.barangay_id ? String(staffUser.barangay_id) : ''
  const isStaffLockedBarangay = isStaffView && Boolean(staffBarangayId)

  const availableRecipients = formData.recipient_type === 'Individual'
    ? individuals
    : families

  const loadFoodSupplies = async (barangayId) => {
    const query = barangayId ? `?barangay_id=${barangayId}` : ''
    const foodsData = await apiFetch(`/api/food-supplies${query}`)
    setFoodSupplies(Array.isArray(foodsData) ? foodsData : [])
  }

  const loadDistributions = async () => {
    const distributionsData = await apiFetch('/api/distributions')
    setDistributions(Array.isArray(distributionsData) ? distributionsData : [])
  }

  const loadDonations = async () => {
    const donationsData = await apiFetch('/api/donations')
    setDonations(Array.isArray(donationsData) ? donationsData : [])
  }

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      setLoadingError('')
        try {
          const initialBarangayId = isStaffLockedBarangay ? staffBarangayId : null
          const foodQuery = initialBarangayId ? `?barangay_id=${initialBarangayId}` : ''
          const [familiesData, individualsData, barangaysData, foodsData, distributionsData, donationsData] = await Promise.all([
            apiFetch('/api/families'),
            apiFetch('/api/individuals'),
            apiFetch('/api/barangays'),
            apiFetch(`/api/food-supplies${foodQuery}`),
            apiFetch('/api/distributions'),
            apiFetch('/api/donations'),
          ])

          setFamilies(Array.isArray(familiesData) ? familiesData : [])
          setIndividuals(Array.isArray(individualsData) ? individualsData : [])
          setBarangays(Array.isArray(barangaysData) ? barangaysData : [])
          setFoodSupplies(Array.isArray(foodsData) ? foodsData : [])
          setDistributions(Array.isArray(distributionsData) ? distributionsData : [])
          setDonations(Array.isArray(donationsData) ? donationsData : [])
      } catch (err) {
        setLoadingError(err.message || 'Failed to load dropdown data.')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  useEffect(() => {
    if (isStaffLockedBarangay) return
    loadFoodSupplies(formData.barangay_id || null)
  }, [formData.barangay_id, isStaffLockedBarangay])

  useEffect(() => {
    if (!isStaffLockedBarangay) return

    setFormData((prev) => (
      prev.barangay_id === staffBarangayId
        ? prev
        : { ...prev, barangay_id: staffBarangayId }
    ))
  }, [isStaffLockedBarangay, staffBarangayId])

  // Prefill form when navigated from staff view with a family or barangay
  useEffect(() => {
    if (!location.state) return
    const { familyId, barangayId } = location.state
    setFormData((prev) => ({
      ...prev,
      family_id: familyId || prev.family_id,
      barangay_id: isStaffLockedBarangay ? staffBarangayId : (barangayId || prev.barangay_id),
      recipient_type: familyId ? 'Family' : prev.recipient_type,
    }))
  }, [location.state, isStaffLockedBarangay, staffBarangayId])

  useEffect(() => {
    setFormData((prev) => {
      if (prev.recipient_type === 'Family') {
        return prev.individual_id ? { ...prev, individual_id: '' } : prev
      }

      if (prev.recipient_type === 'Individual') {
        return prev.family_id ? { ...prev, family_id: '' } : prev
      }

      return prev
    })
  }, [formData.recipient_type])

  const handleChange = (event) => {
    const { name, value } = event.target

    if (name === 'distribution_type') {
      setFormData((prev) => ({
        ...prev,
        distribution_type: value,
        food_id: value === 'Food' ? prev.food_id : '',
      }))
      return
    }

    if (name === 'recipient_type') {
      setFormData((prev) => ({
        ...prev,
        recipient_type: value,
        family_id: '',
        individual_id: '',
      }))
      return
    }

    if (name === 'family_id') {
      setFormData((prev) => ({
        ...prev,
        family_id: value,
        recipient_type: value ? 'Family' : prev.recipient_type,
        individual_id: value ? '' : prev.individual_id,
      }))
      return
    }

    if (name === 'individual_id') {
      setFormData((prev) => ({
        ...prev,
        individual_id: value,
        recipient_type: value ? 'Individual' : prev.recipient_type,
        family_id: value ? '' : prev.family_id,
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
    const needsFood = formData.distribution_type === 'Food'

    if (
      !formData.distribution_type ||
      !formData.recipient_type ||
      !formData.barangay_id ||
      !formData.quantity ||
      !formData.date_given ||
      !formData.status ||
      (needsFood && !formData.food_id) ||
      (needsFamily && !formData.family_id) ||
      (needsIndividual && !formData.individual_id)
    ) {
      setErrorMessage('Please complete all required fields before submitting.')
      return
    }

    if (needsFood && formData.food_id) {
      const selected = foodSupplies.find((f) => String(f.food_id) === String(formData.food_id))
      const available = selected ? Number(selected.total_quantity || 0) : 0
      if (Number(formData.quantity) > available) {
        setErrorMessage(`Insufficient stock. Available: ${available} ${selected?.unit || ''}, Requested: ${formData.quantity}`)
        return
      }
    }

    setSubmitting(true)

    try {
      const payload = new FormData()
      payload.append('distribution_type', formData.distribution_type)
      payload.append('recipient_type', formData.recipient_type)
      payload.append('family_id', needsFamily ? String(Number(formData.family_id)) : '')
      payload.append('individual_id', needsIndividual ? String(Number(formData.individual_id)) : '')
      payload.append('barangay_id', String(Number(isStaffLockedBarangay ? staffBarangayId : formData.barangay_id)))
      payload.append('food_id', needsFood ? String(Number(formData.food_id)) : '')
      payload.append('quantity', String(Number(formData.quantity)))
      payload.append('date_given', formData.date_given)
      payload.append('status', formData.status)
      const actor = getCurrentStaffActor(isStaffView ? 'staff' : 'admin')
      payload.append('staff_user_id', actor.staff_user_id || '')
      payload.append('staff_name', actor.staff_name || '')
      payload.append('staff_email', actor.staff_email || '')
      payload.append('staff_role', actor.staff_role || '')
      if (imageFile) {
        payload.append('image', imageFile)
      }

      await apiFetch('/api/distributions', {
        method: 'POST',
        body: payload,
      })

      setSuccessMessage('Distribution recorded successfully.')
      setFormData(DEFAULT_FORM)
      setImageFile(null)
      loadFoodSupplies().catch(() => {})
      await Promise.all([loadDistributions().catch(() => {}), loadDonations().catch(() => {})])
      window.scrollTo({ top: 0, behavior: 'smooth' })

      setTimeout(() => {
        goToTransparency()
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

  const monetaryDistributions = distributions
    .filter((item) => String(item.distribution_type || 'Food').toLowerCase() === 'monetary')
    .slice()
    .sort((a, b) => new Date(b.date_given || 0).getTime() - new Date(a.date_given || 0).getTime())

  const totalMonetaryDistributed = monetaryDistributions.reduce((sum, item) => sum + Number(item.quantity || 0), 0)
  const totalMonetaryDonations = (donations || []).reduce((sum, d) => sum + Number(d.quantity || 0), 0)
  const fundBalance = totalMonetaryDonations - totalMonetaryDistributed

  const formatPhpAmount = (value) => {
    const amount = Number(value)
    if (!Number.isFinite(amount) || amount <= 0) return '₱0.00'

    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  const resetMonetaryTotal = async () => {
    if (!confirm('Reset monetary fund? This will remove monetary donations (mock) or delete them on the backend.')) return
    try {
      const isMock = String(import.meta.env.VITE_USE_MOCK_API || '').toLowerCase() === 'true'
      // Delete monetary donations (those without a food_id)
      const monetaryDonations = (donations || []).filter((x) => !x.food_id || Number(x.food_id) === 0)
      for (const d of monetaryDonations) {
        await apiFetch(`/api/donations/${d.donation_id}`, { method: 'DELETE' })
      }

      await Promise.all([loadDonations(), loadDistributions()])
      setSuccessMessage('Monetary fund reset.')
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (err) {
      setErrorMessage(err.message || 'Failed to reset monetary fund.')
      setTimeout(() => setErrorMessage(''), 5000)
    }
  }

  return (
    <div className={`flex min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-[#0b1220] text-slate-100' : 'bg-[#e5e7eb] text-slate-900'}`}>
      {isStaffView ? (
        <StaffSidebar isDarkMode={isDarkMode} />
      ) : (
        <AdminSidebar isDarkMode={isDarkMode} />
      )}

      <main className={`flex-1 pt-16 px-4 pb-4 md:p-8 overflow-auto ${isStaffView ? 'ml-72' : 'md:ml-64'}`}>
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
                  <label className={labelClass}>Distribution Type *</label>
                  <select
                    name="distribution_type"
                    value={formData.distribution_type}
                    onChange={handleChange}
                    className={inputClass}
                  >
                    <option value="Food">Food</option>
                    <option value="Monetary">Monetary</option>
                  </select>
                </div>

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
                    value={isStaffLockedBarangay ? staffBarangayId : formData.barangay_id}
                    onChange={handleChange}
                    className={`${inputClass} appearance-none pr-10`}
                    disabled={loading || isStaffLockedBarangay}
                  >
                    <option value="">{isStaffLockedBarangay ? 'Assigned barangay' : 'Select barangay'}</option>
                    {barangays.map((barangay) => (
                      <option key={barangay.barangay_id} value={barangay.barangay_id}>
                        {barangay.name}
                      </option>
                    ))}
                  </select>
                  {isStaffLockedBarangay ? (
                    <p className={`mt-1 text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      Locked to your assigned barangay: {staffUser?.barangay || staffUser?.barangay_name || 'Assigned barangay'}
                    </p>
                  ) : null}
                </div>

                <div>
                  <label className={labelClass}>{formData.recipient_type === 'Individual' ? 'Individual *' : 'Family *'}</label>
                  <select
                    name={formData.recipient_type === 'Individual' ? 'individual_id' : 'family_id'}
                    value={formData.recipient_type === 'Individual' ? formData.individual_id : formData.family_id}
                    onChange={handleChange}
                    className={inputClass}
                    disabled={loading}
                  >
                    <option value="">{formData.recipient_type === 'Individual' ? 'Select individual' : 'Select family'}</option>
                    {availableRecipients.map((recipient) => (
                      <option
                        key={formData.recipient_type === 'Individual' ? recipient.individual_id : recipient.family_id}
                        value={formData.recipient_type === 'Individual' ? recipient.individual_id : recipient.family_id}
                      >
                        {formData.recipient_type === 'Individual'
                          ? (recipient.name || `Individual ${recipient.individual_id}`)
                          : (recipient.family_name || `Family ${recipient.family_id}`)}
                      </option>
                    ))}
                  </select>
                </div>
              
                {formData.distribution_type === 'Food' ? (
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
                        <option key={food.food_id} value={food.food_id} disabled={Number(food.total_quantity || 0) <= 0}>
                          {food.food_name} — {Number(food.total_quantity || 0)} {food.unit || ''} available
                          {Number(food.total_quantity || 0) <= 0 ? ' (out of stock)' : ''}
                        </option>
                      ))}
                    </select>
                    {formData.food_id && (() => {
                      const selected = foodSupplies.find((f) => String(f.food_id) === String(formData.food_id))
                      if (!selected) return null
                      return (
                        <p className={`mt-1 text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                          Available: <span className="font-semibold">{Number(selected.total_quantity || 0)} {selected.unit || ''}</span>
                        </p>
                      )
                    })()}
                  </div>
                ) : null}

                <div>
                  <label className={labelClass}>{formData.distribution_type === 'Monetary' ? 'Amount (PHP) *' : 'Quantity *'}</label>
                  <input
                    name="quantity"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={formData.quantity}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder={formData.distribution_type === 'Monetary' ? 'Enter amount in PHP' : 'Enter quantity'}
                  />
                  {formData.distribution_type === 'Food' && formData.food_id && formData.quantity && (() => {
                    const selected = foodSupplies.find((f) => String(f.food_id) === String(formData.food_id))
                    const available = selected ? Number(selected.total_quantity || 0) : 0
                    const requested = Number(formData.quantity)
                    if (requested > available) {
                      return (
                        <p className="mt-1 text-xs text-red-600 font-semibold">
                          Exceeds available stock ({available} {selected?.unit || ''})
                        </p>
                      )
                    }
                    return null
                  })()}
                  {formData.distribution_type === 'Monetary' ? (
                    <p className={`mt-2 text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      Recorded amount: <span className="font-semibold">{formatPhpAmount(formData.quantity)}</span>
                    </p>
                  ) : null}
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
                    <option value="Completed">Completed</option>
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Photo (Optional)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) => setImageFile(event.target.files?.[0] || null)}
                    className={inputClass}
                  />
                </div>
              </div>

              {loading ? (
                <p className={`mt-4 text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Loading dropdown data...
                </p>
              ) : null}
            </div>

            {formData.distribution_type === 'Food' ? (
              <div className={`mt-6 rounded-2xl border p-6 shadow-sm ${isDarkMode ? 'border-white/10 bg-[#111c2e]' : 'border-slate-200 bg-white'}`}>
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div>
                    <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                      Available Food Supplies
                    </h3>
                    <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      Current quantities will go down automatically after you record a food distribution.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => loadFoodSupplies().catch(() => {})}
                    className={`rounded-full px-4 py-2 text-xs font-semibold transition ${isDarkMode ? 'bg-slate-800 text-slate-200 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                  >
                    Refresh
                  </button>
                </div>

                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {foodSupplies.length > 0 ? foodSupplies.map((food) => (
                    <div key={food.food_id} className={`rounded-xl border px-4 py-3 ${isDarkMode ? 'border-white/10 bg-[#0b1220]' : 'border-slate-200 bg-slate-50'}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className={`font-semibold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>{food.food_name}</p>
                          <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Unit: {food.unit || 'unit'}</p>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-xs font-bold ${isDarkMode ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-100 text-emerald-700'}`}>
                          {Number(food.total_quantity || 0)}
                        </span>
                      </div>
                    </div>
                  )) : (
                    <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>No food supplies available.</p>
                  )}
                </div>
              </div>
            ) : (
              <div className={`mt-6 rounded-2xl border p-6 shadow-sm ${isDarkMode ? 'border-white/10 bg-[#111c2e]' : 'border-slate-200 bg-white'}`}>
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div>
                    <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                      Monetary Total
                    </h3>
                    <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      Fund balance: total donations minus monetary distributions.
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`rounded-full px-3 py-1 text-sm font-bold ${isDarkMode ? 'bg-amber-500/20 text-amber-300' : 'bg-amber-100 text-amber-700'}`}>
                      {formatPhpAmount(fundBalance)}
                    </span>
                    <button
                      type="button"
                      onClick={resetMonetaryTotal}
                      className={`rounded-full px-3 py-1 text-xs font-semibold transition ${isDarkMode ? 'bg-red-700 text-white hover:bg-red-600' : 'bg-red-100 text-red-800 hover:bg-red-200'}`}
                    >
                      Reset
                    </button>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {monetaryDistributions.length > 0 ? monetaryDistributions.slice(0, 6).map((item) => (
                    <div key={item.distribution_id} className={`rounded-xl border px-4 py-3 ${isDarkMode ? 'border-white/10 bg-[#0b1220]' : 'border-slate-200 bg-slate-50'}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className={`font-semibold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                            {item.family_name || item.individual_name || item.recipient_type || 'Recipient'}
                          </p>
                          <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                            {item.barangay_name || 'Unknown barangay'} • {item.date_given || 'No date'}
                          </p>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-xs font-bold ${isDarkMode ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-100 text-emerald-700'}`}>
                          {formatPhpAmount(item.quantity)}
                        </span>
                      </div>
                    </div>
                  )) : (
                    <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      No monetary distributions recorded yet.
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={goToTransparency}
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
