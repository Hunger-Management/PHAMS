import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { apiFetch } from '../../api/api'
import { useDarkMode } from '../../hooks/useDarkMode'
import StaffSidebar from './StaffSidebar'

const PROGRAMS = ['4Ps', 'Solo Parent', 'PWD Assistance', 'Senior Citizen', 'Pregnant/Lactating']
const NUTRITIONAL_OPTIONS = ['Normal', 'Underweight', 'Severely Underweight', 'Overweight', 'Obese', 'Unknown']
const RELATIONSHIP_OPTIONS = ['Head', 'Spouse', 'Child', 'Parent', 'Sibling', 'Relative', 'Other']

function getBMI(heightCm, weightKg) {
  const h = parseFloat(heightCm)
  const w = parseFloat(weightKg)
  if (!h || !w || h <= 0 || w <= 0) return null
  return (w / Math.pow(h / 100, 2)).toFixed(1)
}

function getAge(dateOfBirth) {
  if (!dateOfBirth) return null
  const today = new Date()
  const dob = new Date(dateOfBirth)
  let age = today.getFullYear() - dob.getFullYear()
  const m = today.getMonth() - dob.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--
  return age
}

function formatDOB(dateOfBirth) {
  if (!dateOfBirth) return '—'
  const d = new Date(dateOfBirth)
  return d.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })
}

function NutritionalBadge({ status, isDarkMode }) {
  const styles = {
    Normal: isDarkMode ? 'bg-emerald-900/40 text-emerald-300' : 'bg-emerald-100 text-emerald-700',
    Underweight: isDarkMode ? 'bg-blue-900/40 text-blue-300' : 'bg-blue-100 text-blue-700',
    'Severely Underweight': isDarkMode ? 'bg-red-900/40 text-red-300' : 'bg-red-100 text-red-700',
    Overweight: isDarkMode ? 'bg-amber-900/40 text-amber-300' : 'bg-amber-100 text-amber-700',
    Obese: isDarkMode ? 'bg-red-900/60 text-red-200' : 'bg-red-200 text-red-800',
    Unknown: isDarkMode ? 'bg-slate-700 text-slate-400' : 'bg-slate-100 text-slate-500',
  }
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${styles[status] || styles.Unknown}`}>
      {status || 'Unknown'}
    </span>
  )
}

export default function StaffFamilyDetailPage() {
  const { familyId } = useParams()
  const navigate = useNavigate()
  const { isDarkMode } = useDarkMode()
  const [family, setFamily] = useState(null)
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // edit family modal
  const [editingFamily, setEditingFamily] = useState(false)
  const [familyForm, setFamilyForm] = useState({})
  const [familyPrograms, setFamilyPrograms] = useState([])
  const [savingFamily, setSavingFamily] = useState(false)
  const [familyEditError, setFamilyEditError] = useState('')

  // edit member modal
  const [editingMember, setEditingMember] = useState(null)
  const [memberForm, setMemberForm] = useState({})
  const [savingMember, setSavingMember] = useState(false)
  const [memberEditError, setMemberEditError] = useState('')

  async function loadData() {
    try {
      const [familyData, membersData] = await Promise.all([
        apiFetch(`/api/families/${familyId}`),
        apiFetch(`/api/families/${familyId}/members`),
      ])
      setFamily(familyData)
      setMembers(Array.isArray(membersData) ? membersData : [])
    } catch (err) {
      setError(err.message || 'Failed to load family details.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [familyId])

  function openEditFamily() {
    setFamilyForm({
      family_name: family.family_name || '',
      head_of_family: family.head_of_family || '',
      address: family.address || '',
      phone: family.phone || '',
      monthly_income: family.monthly_income ?? '',
    })
    const existing = (family.food_assistance_status || '').split(',').map((s) => s.trim()).filter(Boolean)
    setFamilyPrograms(existing.filter((p) => p !== 'None'))
    setFamilyEditError('')
    setEditingFamily(true)
  }

  function toggleProgram(p) {
    setFamilyPrograms((prev) => prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p])
  }

  async function handleFamilySubmit(e) {
    e.preventDefault()
    setSavingFamily(true)
    setFamilyEditError('')
    try {
      const payload = new FormData()
      payload.append('family_name', familyForm.family_name)
      payload.append('head_of_family', familyForm.head_of_family)
      payload.append('address', familyForm.address)
      payload.append('phone', familyForm.phone)
      payload.append('monthly_income', familyForm.monthly_income !== '' ? familyForm.monthly_income : '')
      payload.append('food_assistance_status', familyPrograms.length ? familyPrograms.join(',') : 'None')
      payload.append('barangay_id', family.barangay_id)
      payload.append('is_npa', family.is_npa ? '1' : '0')
      payload.append('priority_score', family.priority_score ?? 0)
      await apiFetch(`/api/families/${familyId}`, { method: 'PUT', body: payload })
      await loadData()
      setEditingFamily(false)
    } catch (err) {
      setFamilyEditError(err.message || 'Failed to save changes')
    } finally {
      setSavingFamily(false)
    }
  }

  function openEditMember(m) {
    setEditingMember(m)
    setMemberForm({
      first_name: m.first_name || '',
      last_name: m.last_name || '',
      date_of_birth: m.date_of_birth ? m.date_of_birth.split('T')[0] : '',
      gender: m.gender || 'Male',
      relationship: m.relationship || 'Other',
      is_pwd: Boolean(m.is_pwd),
      height_cm: m.height_cm ?? '',
      weight_kg: m.weight_kg ?? '',
      nutritional_status: m.nutritional_status || 'Unknown',
    })
    setMemberEditError('')
  }

  async function handleMemberSubmit(e) {
    e.preventDefault()
    setSavingMember(true)
    setMemberEditError('')
    try {
      await apiFetch(`/api/members/${editingMember.member_id}`, {
        method: 'PUT',
        body: JSON.stringify({
          ...memberForm,
          height_cm: memberForm.height_cm !== '' ? Number(memberForm.height_cm) : null,
          weight_kg: memberForm.weight_kg !== '' ? Number(memberForm.weight_kg) : null,
          date_of_birth: memberForm.date_of_birth || null,
        }),
      })
      await loadData()
      setEditingMember(null)
    } catch (err) {
      setMemberEditError(err.message || 'Failed to save changes')
    } finally {
      setSavingMember(false)
    }
  }

  const cardClass = `rounded-2xl border p-6 shadow-sm ${isDarkMode ? 'border-white/10 bg-[#111c2e]' : 'border-slate-200 bg-white'}`
  const labelClass = `text-xs font-semibold uppercase tracking-[0.08em] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`
  const valueClass = `mt-0.5 text-sm ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`
  const inputClass = `w-full rounded-md border px-3 py-2 text-sm outline-none ${isDarkMode ? 'border-slate-600 bg-slate-800 text-slate-100' : 'border-slate-300 bg-white text-slate-900'}`

  return (
    <div className={`flex min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-[#0b1220] text-slate-100' : 'bg-[#eef5f2] text-slate-900'}`}>
      <StaffSidebar isDarkMode={isDarkMode} />

      <main className="flex-1 p-8 overflow-auto ml-72">
        <div className="max-w-5xl mx-auto">

          <div className="flex items-center justify-between mb-8">
            <div>
              <button
                onClick={() => navigate('/staff/dashboard')}
                className={`mb-2 text-sm font-medium transition ${isDarkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800'}`}
              >
                ← Back to Dashboard
              </button>
              <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                {loading ? 'Loading…' : (family?.family_name || 'Family Profile')}
              </h2>
              {family && (
                <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  {family.household_id} · Barangay {family.barangay_name}
                </p>
              )}
            </div>
            {family && (
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${isDarkMode ? 'bg-blue-900/40 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>
                Priority Score: {family.priority_score ?? '—'}
              </span>
            )}
          </div>

          {error && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          {loading && (
            <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Loading family data…</p>
          )}

          {!loading && family && (
            <>
              {/* Family Info */}
              <div className={`${cardClass} mb-6`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Family Information</h3>
                  <button
                    onClick={openEditFamily}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${isDarkMode ? 'bg-slate-700 text-slate-200 hover:bg-slate-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                  >
                    Edit
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  <div>
                    <p className={labelClass}>Head of Family</p>
                    <p className={valueClass}>{family.head_of_family || '—'}</p>
                  </div>
                  <div>
                    <p className={labelClass}>Address</p>
                    <p className={valueClass}>{family.is_npa ? 'No Permanent Address' : (family.address || '—')}</p>
                  </div>
                  <div>
                    <p className={labelClass}>Contact</p>
                    <p className={valueClass}>{family.phone || '—'}</p>
                  </div>
                  <div>
                    <p className={labelClass}>Monthly Income</p>
                    <p className={valueClass}>
                      {family.monthly_income != null ? `₱${Number(family.monthly_income).toLocaleString()}` : 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <p className={labelClass}>Assistance Programs</p>
                    <p className={valueClass}>{family.food_assistance_status || 'None'}</p>
                  </div>
                  <div>
                    <p className={labelClass}>Total Members</p>
                    <p className={valueClass}>{family.member_count}</p>
                  </div>
                </div>
              </div>

              {/* Members */}
              <div className={cardClass}>
                <h3 className={`font-semibold mb-5 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  Family Members ({members.length})
                </h3>

                {members.length === 0 ? (
                  <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>No members recorded yet.</p>
                ) : (
                  <div className="space-y-4">
                    {members.map((m) => {
                      const bmi = getBMI(m.height_cm, m.weight_kg)
                      const age = getAge(m.date_of_birth)
                      return (
                        <div
                          key={m.member_id}
                          className={`rounded-xl border p-4 ${isDarkMode ? 'border-white/10 bg-[#0b1220]' : 'border-slate-100 bg-slate-50'}`}
                        >
                          <div className="flex items-start justify-between mb-3 flex-wrap gap-2">
                            <div>
                              <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                                {m.first_name} {m.last_name}
                              </p>
                              <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                {m.relationship}{m.is_pwd ? ' · PWD' : ''}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <NutritionalBadge status={m.nutritional_status} isDarkMode={isDarkMode} />
                              <button
                                onClick={() => openEditMember(m)}
                                className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${isDarkMode ? 'bg-slate-700 text-slate-200 hover:bg-slate-600' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}
                              >
                                Edit
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                            <div>
                              <p className={labelClass}>Date of Birth</p>
                              <p className={valueClass}>{formatDOB(m.date_of_birth)}</p>
                            </div>
                            <div>
                              <p className={labelClass}>Age</p>
                              <p className={valueClass}>{age !== null ? `${age} yrs` : '—'}</p>
                            </div>
                            <div>
                              <p className={labelClass}>Gender</p>
                              <p className={valueClass}>{m.gender || '—'}</p>
                            </div>
                            <div>
                              <p className={labelClass}>Height</p>
                              <p className={valueClass}>{m.height_cm != null ? `${m.height_cm} cm` : '—'}</p>
                            </div>
                            <div>
                              <p className={labelClass}>Weight</p>
                              <p className={valueClass}>{m.weight_kg != null ? `${m.weight_kg} kg` : '—'}</p>
                            </div>
                          </div>

                          {bmi && (
                            <div className={`mt-3 inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs ${isDarkMode ? 'bg-blue-500/10 text-blue-300' : 'bg-blue-50 text-blue-700'}`}>
                              <span className="font-semibold">BMI: {bmi}</span>
                              <span className="opacity-75">
                                ({age !== null && age < 5 ? 'Under-5' : age !== null && age < 18 ? 'Adolescent' : 'Adult/Asian cutoff'} classification)
                              </span>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>

      {/* Edit Family Modal */}
      {editingFamily && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto" onClick={() => setEditingFamily(false)}>
          <div className={`w-full max-w-lg rounded-2xl border p-6 shadow-xl my-8 ${isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'}`} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold">Edit Family</h3>
              <button onClick={() => setEditingFamily(false)} className={`text-xs font-semibold px-3 py-1 rounded ${isDarkMode ? 'bg-slate-700 text-slate-200 hover:bg-slate-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>Close</button>
            </div>
            <form onSubmit={handleFamilySubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Family Name *</label>
                <input value={familyForm.family_name} onChange={(e) => setFamilyForm((s) => ({ ...s, family_name: e.target.value }))} required className={inputClass} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Head of Family</label>
                  <input value={familyForm.head_of_family} onChange={(e) => setFamilyForm((s) => ({ ...s, head_of_family: e.target.value }))} className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Contact Number</label>
                  <input value={familyForm.phone} onChange={(e) => setFamilyForm((s) => ({ ...s, phone: e.target.value }))} className={inputClass} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Address</label>
                <input value={familyForm.address} onChange={(e) => setFamilyForm((s) => ({ ...s, address: e.target.value }))} className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Monthly Income (₱)</label>
                <input type="number" min="0" value={familyForm.monthly_income} onChange={(e) => setFamilyForm((s) => ({ ...s, monthly_income: e.target.value }))} placeholder="Leave blank if unknown" className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-2">Assistance Programs</label>
                <div className="grid grid-cols-2 gap-2">
                  {PROGRAMS.map((p) => (
                    <button key={p} type="button" onClick={() => toggleProgram(p)} className={`rounded-lg border px-3 py-2 text-left text-xs flex items-center gap-2 ${familyPrograms.includes(p) ? (isDarkMode ? 'bg-emerald-700 border-emerald-600 text-white' : 'bg-emerald-600 border-emerald-600 text-white') : (isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700')}`}>
                      <span className={`h-3.5 w-3.5 rounded border flex-shrink-0 flex items-center justify-center text-white ${familyPrograms.includes(p) ? 'bg-white/30 border-white/50' : 'border-current'}`}>{familyPrograms.includes(p) ? '✓' : ''}</span>
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              {familyEditError && <div className="text-sm text-red-600">{familyEditError}</div>}
              <div className="flex justify-end gap-3 pt-1">
                <button type="button" onClick={() => setEditingFamily(false)} className={`rounded-lg px-4 py-2 text-sm font-semibold ${isDarkMode ? 'bg-slate-700 text-slate-200 hover:bg-slate-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>Cancel</button>
                <button type="submit" disabled={savingFamily} className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm font-semibold disabled:opacity-50">{savingFamily ? 'Saving…' : 'Save Changes'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Member Modal */}
      {editingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto" onClick={() => setEditingMember(null)}>
          <div className={`w-full max-w-lg rounded-2xl border p-6 shadow-xl my-8 ${isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'}`} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold">Edit Member</h3>
              <button onClick={() => setEditingMember(null)} className={`text-xs font-semibold px-3 py-1 rounded ${isDarkMode ? 'bg-slate-700 text-slate-200 hover:bg-slate-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>Close</button>
            </div>
            <form onSubmit={handleMemberSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">First Name *</label>
                  <input value={memberForm.first_name} onChange={(e) => setMemberForm((s) => ({ ...s, first_name: e.target.value }))} required className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Last Name *</label>
                  <input value={memberForm.last_name} onChange={(e) => setMemberForm((s) => ({ ...s, last_name: e.target.value }))} required className={inputClass} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Date of Birth</label>
                  <input type="date" max={new Date().toISOString().split('T')[0]} value={memberForm.date_of_birth} onChange={(e) => setMemberForm((s) => ({ ...s, date_of_birth: e.target.value }))} className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Gender</label>
                  <select value={memberForm.gender} onChange={(e) => setMemberForm((s) => ({ ...s, gender: e.target.value }))} className={inputClass}>
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Relationship</label>
                  <select value={memberForm.relationship} onChange={(e) => setMemberForm((s) => ({ ...s, relationship: e.target.value }))} className={inputClass}>
                    {RELATIONSHIP_OPTIONS.map((r) => <option key={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Nutritional Status</label>
                  <select value={memberForm.nutritional_status} onChange={(e) => setMemberForm((s) => ({ ...s, nutritional_status: e.target.value }))} className={inputClass}>
                    {NUTRITIONAL_OPTIONS.map((n) => <option key={n}>{n}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Height (cm)</label>
                  <input type="number" min="0" step="0.1" value={memberForm.height_cm} onChange={(e) => setMemberForm((s) => ({ ...s, height_cm: e.target.value }))} placeholder="e.g. 160" className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Weight (kg)</label>
                  <input type="number" min="0" step="0.1" value={memberForm.weight_kg} onChange={(e) => setMemberForm((s) => ({ ...s, weight_kg: e.target.value }))} placeholder="e.g. 55" className={inputClass} />
                </div>
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                  <input type="checkbox" checked={memberForm.is_pwd} onChange={(e) => setMemberForm((s) => ({ ...s, is_pwd: e.target.checked }))} className="h-4 w-4 rounded" />
                  Person with Disability (PWD)
                </label>
              </div>
              {memberEditError && <div className="text-sm text-red-600">{memberEditError}</div>}
              <div className="flex justify-end gap-3 pt-1">
                <button type="button" onClick={() => setEditingMember(null)} className={`rounded-lg px-4 py-2 text-sm font-semibold ${isDarkMode ? 'bg-slate-700 text-slate-200 hover:bg-slate-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>Cancel</button>
                <button type="submit" disabled={savingMember} className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm font-semibold disabled:opacity-50">{savingMember ? 'Saving…' : 'Save Changes'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
