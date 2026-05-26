import { useEffect, useState } from 'react'
import StaffSidebar from './StaffSidebar'
import { useDarkMode } from '../../hooks/useDarkMode'
import { apiFetch } from '../../api/api'
import { useStaffAuth } from '../../context/StaffAuthContext'

function getAgeInYears(dob) {
  if (!dob) return null
  const today = new Date()
  const birth = new Date(dob)
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

function formatDOB(dob) {
  if (!dob) return '—'
  return new Date(dob).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })
}

function IndividualsNoAddressPage() {
  const { isDarkMode, toggleDarkMode } = useDarkMode()
  const { staffUser } = useStaffAuth()
  const [individuals, setIndividuals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // register form
  const [form, setForm] = useState({ name: '', gender: 'Male', date_of_birth: '', height_cm: '', weight_kg: '' })
  const [imageFile, setImageFile] = useState(null)
  // 2. Preview URL derived from the selected image file
  const [imagePreview, setImagePreview] = useState(null)
  const [imageInputKey, setImageInputKey] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState('')
  const [formError, setFormError] = useState('')

  // view modal
  const [viewingIndividual, setViewingIndividual] = useState(null)

  // edit modal
  const [editingIndividual, setEditingIndividual] = useState(null)
  const [editForm, setEditForm] = useState({ name: '', gender: 'Male', date_of_birth: '', status: 'Registered' })
  const [editImageFile, setEditImageFile] = useState(null)
  const [editImageInputKey, setEditImageInputKey] = useState(0)
  const [savingEdit, setSavingEdit] = useState(false)
  const [editError, setEditError] = useState('')

  async function fetchList() {
    setLoading(true)
    try {
      const data = await apiFetch('/api/individuals')
      const list = Array.isArray(data) ? data : []
      const myBarangayId = staffUser?.barangay_id
      setIndividuals(list.filter((i) => {
        const hasNoBarangay = !i.barangay_id && !i.barangay_name
        const isRegisteredByMyBarangay = !myBarangayId || i.registered_by_barangay_id === myBarangayId
        return hasNoBarangay && isRegisteredByMyBarangay
      }))
    } catch (err) {
      setError(err.message || 'Failed to load individuals')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchList() }, [])

  function handleFormChange(e) {
    const { name, value } = e.target
    setForm((s) => ({ ...s, [name]: value }))
    setFormError('')
  }

  // 3. Update image handler to also generate a local preview URL
  function handleImageChange(e) {
    const file = e.target.files?.[0] || null
    setImageFile(file)
    if (file) {
      const url = URL.createObjectURL(file)
      setImagePreview(url)
    } else {
      setImagePreview(null)
    }
  }

  async function handleRegister(e) {
    e.preventDefault()
    setFormError('')
    setSuccess('')
    if (!form.name || !form.name.trim()) { setFormError('Full name is required'); return }
    setSubmitting(true)
    try {
      const payload = new FormData()
      payload.append('name', form.name.trim())
      payload.append('gender', form.gender || 'Male')
      payload.append('date_of_birth', form.date_of_birth || '')
      payload.append('height_cm', form.height_cm || '')
      payload.append('weight_kg', form.weight_kg || '')
      payload.append('barangay_id', '')
      payload.append('registered_by_barangay_id', staffUser?.barangay_id ?? '')
      payload.append('status', 'Registered')
      if (imageFile) payload.append('image', imageFile)
      await apiFetch('/api/individuals', { method: 'POST', body: payload })
      await fetchList()
      setSuccess('Individual registered')
      setForm({ name: '', gender: 'Male', date_of_birth: '', height_cm: '', weight_kg: '' })
      setImageFile(null)
      setImagePreview(null)
      setImageInputKey((prev) => prev + 1)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setFormError(err.message || 'Failed to register individual')
    } finally {
      setSubmitting(false)
    }
  }

  function openEdit(ind) {
    setEditingIndividual(ind)
    setEditForm({
      name: ind.name || '',
      gender: ind.gender || 'Male',
      date_of_birth: ind.date_of_birth ? ind.date_of_birth.split('T')[0] : '',
      status: ind.status || 'Registered',
      height_cm: ind.height_cm ?? '',
      weight_kg: ind.weight_kg ?? '',
    })
    setEditImageFile(null)
    setEditImageInputKey((k) => k + 1)
    setEditError('')
  }

  function handleEditChange(e) {
    const { name, value } = e.target
    setEditForm((s) => ({ ...s, [name]: value }))
    setEditError('')
  }

  async function handleEditSubmit(e) {
    e.preventDefault()
    if (!editingIndividual) return
    if (!editForm.name.trim()) { setEditError('Full name is required'); return }
    setSavingEdit(true)
    setEditError('')
    try {
      const payload = new FormData()
      payload.append('name', editForm.name.trim())
      payload.append('gender', editForm.gender)
      payload.append('date_of_birth', editForm.date_of_birth || '')
      payload.append('barangay_id', '')
      payload.append('registered_by_barangay_id', editingIndividual.registered_by_barangay_id ?? staffUser?.barangay_id ?? '')
      payload.append('status', editForm.status)
      payload.append('height_cm', editForm.height_cm ?? '')
      payload.append('weight_kg', editForm.weight_kg ?? '')
      if (editImageFile) payload.append('image', editImageFile)
      await apiFetch(`/api/individuals/${editingIndividual.individual_id}`, { method: 'PUT', body: payload })
      await fetchList()
      setEditingIndividual(null)
    } catch (err) {
      setEditError(err.message || 'Failed to save changes')
    } finally {
      setSavingEdit(false)
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

                {/* Photo preview + upload — shown at the top so it feels like a profile setup */}
                <div className="flex items-center gap-4">
                  <div className="h-20 w-20 rounded-full overflow-hidden bg-slate-200 flex-shrink-0 grid place-items-center">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-2xl text-slate-400">👤</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-slate-500 mb-1">Profile Photo</label>
                    <input
                      key={imageInputKey}
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="w-full rounded-md border px-3 py-2 bg-transparent text-sm"
                    />
                    <p className="text-xs text-slate-400 mt-1">Selected profile photo will appear above.</p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {/* Name — full width */}
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

                  {/* Height */}
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Height (cm)</label>
                    <input
                      name="height_cm"
                      type="number"
                      min="0"
                      max="300"
                      value={form.height_cm}
                      onChange={handleFormChange}
                      placeholder="e.g. 165"
                      className="w-full rounded-md border px-3 py-2 bg-transparent"
                    />
                    <p className="text-xs text-slate-400 mt-1">Optional</p>
                  </div>

                  {/* Weight */}
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Weight (kg)</label>
                    <input
                      name="weight_kg"
                      type="number"
                      min="0"
                      max="500"
                      step="0.1"
                      value={form.weight_kg}
                      onChange={handleFormChange}
                      placeholder="e.g. 60.5"
                      className="w-full rounded-md border px-3 py-2 bg-transparent"
                    />
                    <p className="text-xs text-slate-400 mt-1">Optional</p>
                  </div>
                </div>
                <div className="sm:col-span-2">
                  {formError && <div className="text-sm text-red-600">{formError}</div>}
                  {success && <div className="text-sm text-emerald-600">{success}</div>}
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
                        <img src={`data:image/jpeg;base64,${ind.image}`} alt={ind.name} className="h-16 w-16 rounded-full object-cover flex-shrink-0" />
                      ) : (
                        <div className="h-16 w-16 rounded-full bg-slate-300 grid place-items-center text-lg font-semibold text-slate-700 flex-shrink-0">{(ind.name || 'U').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}</div>
                      )}
                      <div className="flex-1">
                        <div className="font-semibold text-sm">{ind.name || '—'}</div>
                        <div className="text-xs text-slate-500 mt-1">ID: {ind.individual_id || '—'}</div>
                        <div className="text-xs text-slate-500">{ind.gender || '—'} • {ind.date_of_birth ? `${getAgeInYears(ind.date_of_birth)} yrs` : '—'}</div>
                        {(ind.height_cm || ind.weight_kg) && (
                          <div className="text-xs text-slate-500 mt-1">{ind.height_cm ? `${ind.height_cm} cm` : '—'} • {ind.weight_kg ? `${ind.weight_kg} kg` : '—'}</div>
                        )}
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <div className="text-xs text-slate-500">{ind.status || ''}</div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setViewingIndividual(ind)} className="text-sm text-slate-600 hover:underline">View</button>
                        <button onClick={() => openEdit(ind)} className="text-sm text-emerald-600 hover:underline">Edit</button>
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

      {/* View modal */}
      {viewingIndividual && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setViewingIndividual(null)}>
          <div className={`w-full max-w-md rounded-2xl border p-6 shadow-xl ${isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'}`} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-5">
              <h3 className="text-lg font-bold">Individual Details</h3>
              <button onClick={() => setViewingIndividual(null)} className={`text-xs font-semibold px-3 py-1 rounded ${isDarkMode ? 'bg-slate-700 text-slate-200 hover:bg-slate-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>Close</button>
            </div>
            <div className="flex items-center gap-4 mb-5">
              {viewingIndividual.image ? (
                <img src={`data:image/jpeg;base64,${viewingIndividual.image}`} alt={viewingIndividual.name} className="h-20 w-20 rounded-full object-cover" />
              ) : (
                <div className="h-20 w-20 rounded-full bg-slate-300 grid place-items-center text-2xl font-bold text-slate-700">{(viewingIndividual.name || 'U').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}</div>
              )}
              <div>
                <div className="text-xl font-bold">{viewingIndividual.name || '—'}</div>
                <div className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>ID: {viewingIndividual.individual_id}</div>
              </div>
            </div>
            <dl className="space-y-2 text-sm">
              {[
                ['Gender', viewingIndividual.gender || '—'],
                ['Date of Birth', formatDOB(viewingIndividual.date_of_birth)],
                ['Age', viewingIndividual.date_of_birth ? `${getAgeInYears(viewingIndividual.date_of_birth)} years old` : '—'],
                ['Height', viewingIndividual.height_cm ? `${viewingIndividual.height_cm} cm` : '—'],
                ['Weight', viewingIndividual.weight_kg ? `${viewingIndividual.weight_kg} kg` : '—'],
                ['Status', viewingIndividual.status || 'Registered'],
                ['Barangay', 'None (NPA)'],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4">
                  <dt className={`font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{label}</dt>
                  <dd className="text-right">{value}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-5 text-right">
              <button onClick={() => { setViewingIndividual(null); openEdit(viewingIndividual) }} className="rounded-md bg-emerald-600 text-white px-4 py-2 text-sm font-semibold hover:bg-emerald-700">Edit</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editingIndividual && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setEditingIndividual(null)}>
          <div className={`w-full max-w-md rounded-2xl border p-6 shadow-xl ${isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'}`} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold">Edit Individual</h3>
              <button onClick={() => setEditingIndividual(null)} className={`text-xs font-semibold px-3 py-1 rounded ${isDarkMode ? 'bg-slate-700 text-slate-200 hover:bg-slate-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>Close</button>
            </div>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Full Name *</label>
                <input name="name" value={editForm.name} onChange={handleEditChange} required className={`w-full rounded-md border px-3 py-2 text-sm outline-none ${isDarkMode ? 'border-slate-600 bg-slate-800 text-slate-100' : 'border-slate-300 bg-white text-slate-900'}`} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Gender *</label>
                  <select name="gender" value={editForm.gender} onChange={handleEditChange} className={`w-full rounded-md border px-3 py-2 text-sm outline-none ${isDarkMode ? 'border-slate-600 bg-slate-800 text-slate-100' : 'border-slate-300 bg-white text-slate-900'}`}>
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Status</label>
                  <select name="status" value={editForm.status} onChange={handleEditChange} className={`w-full rounded-md border px-3 py-2 text-sm outline-none ${isDarkMode ? 'border-slate-600 bg-slate-800 text-slate-100' : 'border-slate-300 bg-white text-slate-900'}`}>
                    <option value="Registered">Registered</option>
                    <option value="Received">Received</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Date of Birth</label>
                <input name="date_of_birth" type="date" max={new Date().toISOString().split('T')[0]} value={editForm.date_of_birth} onChange={handleEditChange} className={`w-full rounded-md border px-3 py-2 text-sm outline-none ${isDarkMode ? 'border-slate-600 bg-slate-800 text-slate-100' : 'border-slate-300 bg-white text-slate-900'}`} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Height (cm)</label>
                  <input name="height_cm" type="number" min="0" max="300" step="0.1" value={editForm.height_cm} onChange={handleEditChange} placeholder="e.g. 165" className={`w-full rounded-md border px-3 py-2 text-sm outline-none ${isDarkMode ? 'border-slate-600 bg-slate-800 text-slate-100' : 'border-slate-300 bg-white text-slate-900'}`} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Weight (kg)</label>
                  <input name="weight_kg" type="number" min="0" max="500" step="0.1" value={editForm.weight_kg} onChange={handleEditChange} placeholder="e.g. 60.5" className={`w-full rounded-md border px-3 py-2 text-sm outline-none ${isDarkMode ? 'border-slate-600 bg-slate-800 text-slate-100' : 'border-slate-300 bg-white text-slate-900'}`} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Replace Photo (Optional)</label>
                {editingIndividual.image && (
                  <img src={`data:image/jpeg;base64,${editingIndividual.image}`} alt="current" className="h-12 w-12 rounded-full object-cover mb-2" />
                )}
                <input key={editImageInputKey} type="file" accept="image/*" onChange={(e) => setEditImageFile(e.target.files?.[0] || null)} className="w-full rounded-md border px-3 py-2 bg-transparent text-sm" />
              </div>
              {editError && <div className="text-sm text-red-600">{editError}</div>}
              <div className="flex items-center justify-end gap-3 pt-1">
                <button type="button" onClick={() => setEditingIndividual(null)} className={`rounded-lg px-4 py-2 text-sm font-semibold ${isDarkMode ? 'bg-slate-700 text-slate-200 hover:bg-slate-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>Cancel</button>
                <button type="submit" disabled={savingEdit} className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-sm font-semibold disabled:opacity-50">{savingEdit ? 'Saving...' : 'Save Changes'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}

export default IndividualsNoAddressPage