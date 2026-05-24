import { useEffect, useState } from 'react'
import StaffSidebar from './StaffSidebar'
import { useDarkMode } from '../../hooks/useDarkMode'
import { apiFetch } from '../../api/api'

function IndividualsNoAddressPage() {
  const { isDarkMode, toggleDarkMode } = useDarkMode()
  const [individuals, setIndividuals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ name: '', gender: 'Male', date_of_birth: '' })
  const [imageFile, setImageFile] = useState(null)
  const [imageInputKey, setImageInputKey] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState('')
  const [formError, setFormError] = useState('')

  useEffect(() => {
    setLoading(true)
    apiFetch('/api/individuals')
      .then((data) => {
        const list = Array.isArray(data) ? data : []
        const filtered = list.filter((i) => !i.barangay_id || !i.barangay_name || i.barangay_name === 'Unknown')
        setIndividuals(filtered)
      })
      .catch((err) => setError(err.message || 'Failed to load individuals'))
      .finally(() => setLoading(false))
  }, [])

  function handleFormChange(e) {
    const { name, value } = e.target
    setForm((s) => ({ ...s, [name]: value }))
    setFormError('')
  }

  function getAgeInYears(dob) {
    if (!dob) return ''
    const today = new Date()
    const birth = new Date(dob)
    let age = today.getFullYear() - birth.getFullYear()
    const m = today.getMonth() - birth.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
    return String(age)
  }

  async function handleRegister(e) {
    e.preventDefault()
    setFormError('')
    setSuccess('')
    if (!form.name || !form.name.trim()) {
      setFormError('Full name is required')
      return
    }
    setSubmitting(true)
    try {
      const payload = new FormData()
      payload.append('name', form.name.trim())
      payload.append('gender', form.gender || 'Male')
      payload.append('date_of_birth', form.date_of_birth || '')
      payload.append('age', getAgeInYears(form.date_of_birth))
      payload.append('barangay_id', '')
      payload.append('status', 'Registered')
      if (imageFile) {
        payload.append('image', imageFile)
      }

      await apiFetch('/api/individuals', { method: 'POST', body: payload })

      // refresh list to include newly registered NPA individual
      const data = await apiFetch('/api/individuals')
      const list = Array.isArray(data) ? data : []
      const filtered = list.filter((i) => !i.barangay_id || !i.barangay_name || i.barangay_name === 'Unknown')
      setIndividuals(filtered)

      setSuccess('Individual registered')
      setForm({ name: '', gender: 'Male', date_of_birth: '' })
      setImageFile(null)
      setImageInputKey((prev) => prev + 1)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setFormError(err.message || 'Failed to register individual')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className={`min-h-screen transition-colors ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-[#eef5f2] text-slate-900'}`}>
      <StaffSidebar isDarkMode={isDarkMode} />
      <div className="ml-72 p-8">
        <div className="max-w-4xl">
          <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Individuals without Permanent Address</h2>
          <p className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>List of individual records that have no barangay assigned (NPA)</p>

          <div className="mt-6">
            <div className={`mb-6 rounded-lg p-5 ${isDarkMode ? 'bg-slate-900 border border-slate-700' : 'bg-white border border-slate-200'}`}>
              <h3 className={`text-lg font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Register NPA Individual</h3>
              <form onSubmit={handleRegister} className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="block text-xs text-slate-500 mb-1">Full name *</label>
                    <input name="name" value={form.name} onChange={handleFormChange} placeholder="Juan Dela Cruz" className="w-full rounded-md border px-3 py-2 bg-transparent" required />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Gender *</label>
                    <select name="gender" value={form.gender} onChange={handleFormChange} className="w-full rounded-md border px-3 py-2 bg-transparent" required>
                      <option>Male</option>
                      <option>Female</option>
                      <option>Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Date of Birth</label>
                    <input name="date_of_birth" type="date" max={new Date().toISOString().split('T')[0]} value={form.date_of_birth} onChange={handleFormChange} className="w-full rounded-md border px-3 py-2 bg-transparent" />
                    <p className="text-xs text-slate-400 mt-1">Optional</p>
                  </div>
                </div>

                <div className="sm:col-span-2">
                  {formError && <div className="text-sm text-red-600">{formError}</div>}
                  {success && <div className="text-sm text-emerald-600">{success}</div>}
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs text-slate-500 mb-1">Photo (Optional)</label>
                  <input
                    key={imageInputKey}
                    type="file"
                    accept="image/*"
                    onChange={(event) => setImageFile(event.target.files?.[0] || null)}
                    className="w-full rounded-md border px-3 py-2 bg-transparent"
                  />
                </div>

                <div className="text-right">
                  <button type="submit" disabled={submitting} className="rounded-md bg-emerald-600 text-white px-4 py-2">{submitting ? 'Registering...' : 'Register'}</button>
                </div>
              </form>
            </div>
            {loading ? (
              <p className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>Loading...</p>
            ) : error ? (
              <div className="text-sm text-red-600">{error}</div>
            ) : individuals.length === 0 ? (
              <div className={`rounded-lg p-6 ${isDarkMode ? 'bg-slate-900 border border-slate-700' : 'bg-slate-50 border border-slate-200'}`}>
                <p className={`${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>No individuals without a permanent address found.</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {individuals.map((ind) => (
                  <div key={ind.individual_id} className={`rounded-lg p-4 flex flex-col justify-between ${isDarkMode ? 'bg-slate-900 border border-slate-700' : 'bg-white border border-slate-200'}`}>
                    <div className="flex items-start gap-4">
                      {ind.image ? (
                        <img
                          src={`data:image/jpeg;base64,${ind.image}`}
                          alt={ind.name}
                          className="h-16 w-16 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-16 w-16 rounded-full bg-slate-300 grid place-items-center text-lg font-semibold text-slate-700">{(ind.name || 'U').split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()}</div>
                      )}
                      <div className="flex-1">
                        <div className="font-semibold text-sm">{ind.name || '—'}</div>
                        <div className="text-xs text-slate-500 mt-1">ID: {ind.individual_id || '—'}</div>
                        <div className="text-xs text-slate-500">{ind.gender || '—'} • {ind.date_of_birth ? getAgeInYears(ind.date_of_birth) : '—'} yrs</div>
                        {(ind.height_cm || ind.weight_kg) && (
                          <div className="text-xs text-slate-500 mt-1">
                            {ind.height_cm ? `${ind.height_cm} cm` : '—'} • {ind.weight_kg ? `${ind.weight_kg} kg` : '—'}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <div className="text-xs text-slate-500">{ind.status || ''}</div>
                      <div className="flex items-center gap-2">
                        <button className="text-sm text-slate-600 hover:underline">View</button>
                        <button className="text-sm text-emerald-600">Edit</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <button onClick={toggleDarkMode} className={`fixed bottom-5 right-5 z-50 h-12 w-12 rounded-full shadow-lg transition-colors grid place-items-center text-lg font-bold ${isDarkMode ? 'bg-slate-700 text-yellow-300 hover:bg-slate-600' : 'bg-blue-900 text-white hover:bg-blue-800'}`} aria-label="Toggle dark mode">{isDarkMode ? '☀️' : '🌙'}</button>
    </main>
  )
}

export default IndividualsNoAddressPage
