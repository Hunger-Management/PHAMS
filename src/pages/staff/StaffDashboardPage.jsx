import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useDarkMode } from '../../hooks/useDarkMode'
import { useStaffAuth } from '../../context/StaffAuthContext'
import StaffSidebar from './StaffSidebar'

function StaffDashboardPage() {
  const { isDarkMode, toggleDarkMode } = useDarkMode()
  const { staffUser } = useStaffAuth()

  const summaryCards = [
    { label: 'Families in Barangay', value: '156', sub: `Barangay ${staffUser?.barangay || 'San Jose'}`, iconBg: 'bg-blue-100', iconText: 'text-blue-600', icon: '👥' },
    { label: 'Assisted Families', value: '89', sub: '57% coverage', iconBg: 'bg-emerald-100', iconText: 'text-emerald-600', icon: '🍃' },
    { label: 'Pending Verification', value: '12', sub: 'Awaiting review', iconBg: 'bg-amber-100', iconText: 'text-amber-600', icon: '⏳' },
    { label: 'Verified This Month', value: '28', sub: 'Recently processed', iconBg: 'bg-violet-100', iconText: 'text-violet-600', icon: '◉' },
  ]

  const quickActions = [
    { label: 'Add family record', to: '/staff/dashboard', tone: 'bg-blue-600 hover:bg-blue-700' },
    { label: 'View barangay lists', to: '/barangays', tone: 'bg-emerald-600 hover:bg-emerald-700' },
    { label: 'Open reports', to: '/transparency', tone: 'bg-slate-700 hover:bg-slate-600' },
  ]

  const activityFeed = [
    'Checked new family submission from Poblacion',
    'Updated assistance status for 3 households',
    'Reviewed pending verification for senior citizens',
    'Logged today\'s field visit notes',
  ]

  const nutritionalSlices = [
    { label: 'Normal 42%', width: '42%', color: '#27c18d' },
    { label: 'Underweight 18%', width: '18%', color: '#6fb7ff' },
    { label: 'Overweight 21%', width: '21%', color: '#f6c45f' },
    { label: 'Severe 19%', width: '19%', color: '#f28b82' },
  ]

  const navigate = useNavigate()
  const [familyForm, setFamilyForm] = useState({
    familyName: '',
    barangay: staffUser?.barangay || '',
    address: '',
    headOfFamily: '',
    contactNumber: '',
    monthlyIncome: '',
    programs: [],
    noPermanentAddress: false,
  })

  function toggleProgram(program) {
    setFamilyForm((s) => ({
      ...s,
      programs: s.programs.includes(program) ? s.programs.filter((p) => p !== program) : [...s.programs, program],
    }))
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    if (type === 'checkbox' && name === 'noPermanentAddress') {
      setFamilyForm((s) => ({ ...s, [name]: checked }))
      return
    }
    setFamilyForm((s) => ({ ...s, [name]: value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    // Navigate to the admin Add Family page with prefilled data
    navigate('/admin/families/add', { state: { prefill: familyForm } })
  }

  // Reuse admin input/card styles for pixel parity
  const inputClass = `w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/40 transition ${isDarkMode
    ? 'border-white/10 bg-[#0b1220] text-slate-100 placeholder-slate-500'
    : 'border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400'
  }`

  const labelClass = `mb-1.5 block text-xs font-semibold uppercase tracking-[0.08em] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`

  const cardClass = `rounded-2xl border p-6 shadow-sm ${isDarkMode ? 'border-white/10 bg-[#111c2e]' : 'border-slate-200 bg-white'}`

  return (
    <main className={`min-h-screen transition-colors ${
      isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-[#eef5f2] text-slate-900'
    }`}>
      <StaffSidebar isDarkMode={isDarkMode} />

      <main className="ml-72 min-h-screen p-8">
        <div className="mx-auto max-w-[1450px]">
          <div id="dashboard-top" className="mb-8">
            <h2 className={`text-5xl font-black leading-tight tracking-tight ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
              Welcome, {staffUser?.name || 'Staff User'}
            </h2>
            <p className={`mt-2 text-lg ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              Managing data for Barangay {staffUser?.barangay || 'San Jose'}
            </p>
          </div>

          <section className={`mb-10 rounded-2xl px-8 py-10 shadow-[0_2px_8px_rgba(15,23,42,0.08)] ${isDarkMode ? 'border border-slate-700 bg-slate-800' : 'border border-slate-200 bg-white'}`}>
            <div className="flex items-center gap-5">
              <div className="grid h-14 w-14 place-items-center rounded-full bg-emerald-50 text-2xl text-emerald-700">
                👤
              </div>
              <div>
                <p className={`text-2xl font-bold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>Staff Access</p>
                <p className={`${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>Limited to Barangay {staffUser?.barangay || 'San Jose'} data management</p>
              </div>
            </div>
          </section>

          <section id="summary-section" className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
            {summaryCards.map((card) => (
              <article
                key={card.label}
                className={`transform rounded-2xl px-7 py-8 shadow-[0_2px_8px_rgba(15,23,42,0.08)] transition hover:-translate-y-1 hover:shadow-lg ${isDarkMode ? 'border border-slate-700 bg-slate-800' : 'border border-slate-200 bg-white'}`}>
                <div className="mb-5 flex items-start justify-between gap-4">
                  <h3 className={`max-w-[70%] text-base font-medium ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>{card.label}</h3>
                  <div className={`flex h-12 w-12 items-center justify-center rounded-full ${card.iconBg} ${card.iconText} text-lg`}>{card.icon}</div>
                </div>

                <div className={`text-4xl font-black tracking-tight ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>{card.value}</div>
                <p className={`mt-3 text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{card.sub}</p>
              </article>
            ))}
          </section>

          <section className="mt-10 grid gap-6">
            <article className={`rounded-2xl px-7 py-7 shadow-[0_2px_8px_rgba(15,23,42,0.08)] ${isDarkMode ? 'border border-slate-700 bg-slate-800' : 'border border-slate-200 bg-white'}`}>
              <h3 className={`text-xl font-bold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>Nutritional Status Distribution</h3>
              <p className={`mt-1 ${isDarkMode ? 'text-slate-300' : 'text-slate-500'}`}>Family members by health status</p>

              <div className={`mt-10 flex min-h-[260px] items-end justify-center gap-4 overflow-hidden rounded-xl px-4 py-6 ${isDarkMode ? 'bg-slate-900' : 'bg-slate-50'}`}>
                <div className="relative h-44 w-44 rounded-full bg-[conic-gradient(#27c18d_0_42%,#6fb7ff_42%_60%,#f6c45f_60%_81%,#f28b82_81%_100%)] shadow-inner">
                  <div className={`absolute inset-5 rounded-full ${isDarkMode ? 'bg-slate-900' : 'bg-slate-50'}`} />
                </div>

                <div className={`flex flex-col gap-3 text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                  {nutritionalSlices.map((slice) => (
                    <div key={slice.label} className="flex items-center gap-3">
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: slice.color }} />
                      <span>{slice.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </article>

            <article className={`rounded-2xl px-7 py-7 shadow-[0_2px_8px_rgba(15,23,42,0.08)] ${isDarkMode ? 'border border-slate-700 bg-slate-800' : 'border border-slate-200 bg-white'}`}>
              <h3 className={`text-xl font-bold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>Monthly Trend</h3>
              <p className={`mt-1 ${isDarkMode ? 'text-slate-300' : 'text-slate-500'}`}>Family registrations and assistance provided</p>

              <div className={`mt-8 rounded-xl p-4 ${isDarkMode ? 'border border-slate-700 bg-slate-800' : 'border border-slate-200 bg-white'}`}>
                <div className="flex h-64 items-end gap-4">
                  {[52, 58, 65, 71, 74, 78].map((value, index) => (
                    <div key={index} className="flex flex-1 flex-col items-center gap-3">
                      <div
                        className="w-full rounded-t-lg bg-blue-500/80 shadow-sm"
                        style={{ height: `${value}%`, minHeight: '48px' }}
                      />
                      <span className={`text-xs ${isDarkMode ? 'text-slate-300' : 'text-slate-500'}`}>{index + 1}</span>
                    </div>
                  ))}
                </div>
              </div>
            </article>
          </section>

          <section className="mt-10 grid gap-6 xl:grid-cols-2">
            <article id="barangays-section" className={`rounded-none px-7 py-7 ${isDarkMode ? 'border border-slate-700 bg-slate-800 shadow-[0_2px_8px_rgba(15,23,42,0.08)]' : 'border border-slate-200 bg-white shadow-sm'}`}>
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <h3 className={`text-2xl font-bold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                    Barangay {staffUser?.barangay || 'San Jose'}
                  </h3>
                  <p className={`${isDarkMode ? 'mt-1 text-slate-300' : 'mt-1 text-slate-500'}`}>Viewing your assigned barangay: Barangay {staffUser?.barangay || 'San Jose'}</p>
                </div>

                <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
                  Active
                </span>
              </div>

              <div className="space-y-5">
                <div className="flex items-center justify-between text-[1rem]">
                  <div className="flex items-center gap-3">
                    <span className={`text-2xl ${isDarkMode ? 'text-slate-300' : 'text-violet-600'}`}>👥</span>
                    <span className={`${isDarkMode ? 'text-slate-200' : 'text-slate-600'}`}>Total Families</span>
                  </div>
                  <strong className={`text-lg font-bold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>156</strong>
                </div>

                <div className="flex items-center justify-between text-[1rem]">
                  <div className="flex items-center gap-3">
                    <span className={`text-xl ${isDarkMode ? 'text-slate-300' : 'text-rose-500'}`}>📍</span>
                    <span className={`${isDarkMode ? 'text-slate-200' : 'text-slate-600'}`}>Families Assisted</span>
                  </div>
                  <strong className="text-lg font-bold text-emerald-600">89</strong>
                </div>

                <div className="pt-2">
                  <div className={`mb-2 flex items-center justify-between text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                    <span>Assistance Coverage</span>
                    <span>57%</span>
                  </div>
                  <div className={`h-3 rounded-full ${isDarkMode ? 'bg-slate-700' : 'bg-slate-100'}`}>
                    <div className="h-3 w-[57%] rounded-full bg-[#3c9452]" />
                  </div>
                </div>
              </div>
            </article>

            <article id="add-family-section" className={`rounded-2xl px-7 py-7 shadow-[0_2px_8px_rgba(15,23,42,0.08)] ${isDarkMode ? 'border border-slate-700 bg-slate-900' : 'border border-slate-200 bg-white'}`}>
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h3 className={`text-2xl font-black ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>Register New Family</h3>
                  <p className={`${isDarkMode ? 'text-slate-300' : 'text-slate-500'} mt-1`}>Fill in all required fields. Priority score is computed automatically.</p>
                </div>
                <Link to="/admin/families" className={`text-sm ${isDarkMode ? 'text-slate-300 hover:text-slate-100' : 'text-slate-600 hover:text-slate-900'}`}>← View All Families</Link>
              </div>

              <form onSubmit={handleSubmit} className="rounded-2xl p-1" aria-label="Register family form">
                <div className={cardClass}>
                  <div className={`grid gap-4 grid-cols-1 lg:grid-cols-2`}> 
                  <div>
                    <label className={labelClass}>Family Name *</label>
                    <input name="familyName" value={familyForm.familyName} onChange={handleChange} placeholder="e.g. Dela Cruz" className={`${inputClass} mt-2`} />
                  </div>

                  <div>
                    <label className={labelClass}>Barangay *</label>
                    <select name="barangay" value={familyForm.barangay} onChange={handleChange} className={`${inputClass} mt-2`}>
                      <option>{staffUser?.barangay || 'Aguho'}</option>
                      <option>Aguho</option>
                      <option>Magtanggol</option>
                      <option>Poblacion</option>
                      <option>San Pedro</option>
                    </select>
                  </div>

                  <div className="lg:col-span-2">
                    <label className={labelClass}>Complete Address</label>
                    <input name="address" value={familyForm.address} onChange={handleChange} placeholder="House No., Street, Purok" className={`${inputClass} mt-2`} />
                    <div className="mt-2 flex items-center gap-2 text-sm">
                      <input id="npa" name="noPermanentAddress" type="checkbox" checked={familyForm.noPermanentAddress} onChange={handleChange} className="h-4 w-4" />
                      <label htmlFor="npa" className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>No Permanent Address (NPA)</label>
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>Head of Family</label>
                    <input name="headOfFamily" value={familyForm.headOfFamily} onChange={handleChange} placeholder="Full name" className={`${inputClass} mt-2`} />
                  </div>

                  <div>
                    <label className={labelClass}>Contact Number</label>
                    <input name="contactNumber" value={familyForm.contactNumber} onChange={handleChange} placeholder="09XX XXX XXXX" className={`${inputClass} mt-2`} />
                  </div>

                  <div>
                    <label className={labelClass}>Monthly Income (PHP)</label>
                    <input name="monthlyIncome" value={familyForm.monthlyIncome} onChange={handleChange} placeholder="Leave blank if unknown" className={`${inputClass} mt-2`} />
                    <p className={`mt-2 text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>NCR poverty threshold: ₱12,082/month. Affects priority score.</p>
                  </div>

                  <div className="lg:col-span-2">
                    <label className={`${labelClass} mt-4`}>Food Assistance Program Enrollment</label>
                    <p className={`mt-1 text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Select all programs this family is currently enrolled in.</p>

                    <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {['4Ps', 'Solo Parent', 'PWD Assistance', 'Senior Citizen', 'Pregnant/Lactating'].map((p) => (
                        <button key={p} type="button" onClick={() => toggleProgram(p)} className={`rounded-lg border px-4 py-3 text-left text-sm ${familyForm.programs.includes(p) ? (isDarkMode ? 'bg-emerald-700 text-white' : 'bg-emerald-600 text-white') : (isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700')}`}>
                          <div className="flex items-center gap-3">
                            <input readOnly checked={familyForm.programs.includes(p)} className="h-4 w-4" />
                            <span>{p}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                    <p className={`mt-3 text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>No program selected — family will be marked as not enrolled in any assistance program.</p>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between">
                  <div className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>Priority score is computed automatically.</div>
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={() => navigate('/admin/families')} className={`rounded-full px-5 py-2 text-sm ${isDarkMode ? 'bg-slate-800 border border-slate-700 text-slate-300' : 'bg-slate-100 border border-slate-200 text-slate-900'}`}>Cancel</button>
                    <button type="submit" className={`rounded-full px-5 py-2 text-sm font-semibold ${isDarkMode ? 'bg-emerald-600 text-white hover:bg-emerald-500' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}>Add Family</button>
                  </div>
                </div>
                </div>
              </form>
            </article>
          </section>

            <section id="transparency-section" className={`mt-10 rounded-2xl px-7 py-7 shadow-[0_2px_8px_rgba(15,23,42,0.08)] ${isDarkMode ? 'border border-slate-700 bg-slate-800' : 'border border-slate-200 bg-white'}`}>
            <h3 className={`text-xl font-bold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>Transparency Notes</h3>
            <p className={`mt-2 max-w-4xl text-sm leading-6 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              This staff dashboard is now styled to match the admin screen: a dark left sidebar, a large greeting header,
              rounded summary cards, and dashboard panels for charts and activity.
            </p>
          </section>
        </div>
      </main>

      <button
        onClick={toggleDarkMode}
        className={`fixed bottom-5 right-5 z-50 h-12 w-12 rounded-full shadow-lg transition-colors grid place-items-center text-lg font-bold ${
          isDarkMode ? 'bg-slate-700 text-yellow-300 hover:bg-slate-600' : 'bg-blue-900 text-white hover:bg-blue-800'
        }`}
        aria-label="Toggle dark mode"
      >
        {isDarkMode ? '☀️' : '🌙'}
      </button>
    </main>
  )
}

export default StaffDashboardPage
