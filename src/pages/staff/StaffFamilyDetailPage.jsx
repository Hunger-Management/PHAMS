import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { apiFetch } from '../../api/api'
import { useDarkMode } from '../../hooks/useDarkMode'
import StaffSidebar from './StaffSidebar'

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

  useEffect(() => {
    Promise.all([
      apiFetch(`/api/families/${familyId}`),
      apiFetch(`/api/families/${familyId}/members`),
    ])
      .then(([familyData, membersData]) => {
        setFamily(familyData)
        setMembers(Array.isArray(membersData) ? membersData : [])
      })
      .catch((err) => setError(err.message || 'Failed to load family details.'))
      .finally(() => setLoading(false))
  }, [familyId])

  const cardClass = `rounded-2xl border p-6 shadow-sm ${isDarkMode ? 'border-white/10 bg-[#111c2e]' : 'border-slate-200 bg-white'}`
  const labelClass = `text-xs font-semibold uppercase tracking-[0.08em] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`
  const valueClass = `mt-0.5 text-sm ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`

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
                <h3 className={`font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Family Information</h3>
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
                                {m.relationship}
                                {m.is_pwd ? ' · PWD' : ''}
                              </p>
                            </div>
                            <NutritionalBadge status={m.nutritional_status} isDarkMode={isDarkMode} />
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
    </div>
  )
}
