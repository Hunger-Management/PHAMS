import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { apiFetch } from '../../api/api'
import { useDarkMode } from '../../hooks/useDarkMode'
import { useStaffAuth } from '../../context/StaffAuthContext'
import StaffSidebar from './StaffSidebar'

// Barangay ID mapping - must match database exactly
const BARANGAY_MAP = {
  'Aguho': 1,
  'Magtanggol': 2,
  'Martires del 96': 3,
  'Poblacion': 4,
  'San Pedro': 5,
  'San Roque': 6,
  'Santa Ana': 7,
  'Santo Rosario-Kanluran': 8,
  'Santo Rosario-Silangan': 9,
  'Tabacalera': 10,
}

function StaffDashboardPage() {
  const { isDarkMode, toggleDarkMode } = useDarkMode()
  const { staffUser } = useStaffAuth()
  const [families, setFamilies] = useState([])
  const [distributions, setDistributions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [formSubmitting, setFormSubmitting] = useState(false)
  const [formSuccess, setFormSuccess] = useState('')
  const [formError, setFormError] = useState('')

  const [staffBarangayName, setStaffBarangayName] = useState(staffUser?.barangay || 'Aguho')

  // Ensure we have a barangay name for the logged-in staff user.
  useEffect(() => {
    if (staffUser?.barangay) {
      setStaffBarangayName(staffUser.barangay)
      return
    }

    // If only barangay_id exists, fetch the barangay name
    if (staffUser?.barangay_id) {
      apiFetch(`/api/barangays/${staffUser.barangay_id}`)
        .then((b) => {
          if (b && b.name) setStaffBarangayName(b.name)
        })
        .catch(() => {
          // ignore
        })
    }
  }, [staffUser?.barangay, staffUser?.barangay_id])

  const staffBarangay = staffBarangayName || 'Aguho'

  useEffect(() => {
    Promise.all([
      apiFetch('/api/families'),
      apiFetch('/api/distributions'),
    ])
      .then(([familiesData, distributionsData]) => {
        setFamilies(Array.isArray(familiesData) ? familiesData : [])
        setDistributions(Array.isArray(distributionsData) ? distributionsData : [])
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message || 'Failed to load staff dashboard data.')
        setLoading(false)
      })
  }, [])

  // Recalculate barangay stats when families or distributions change
  useEffect(() => {
    if (formSuccess) {
      // Refresh data after successful submission with a small delay to ensure DB commit
      const timer = setTimeout(() => {
        Promise.all([
          apiFetch('/api/families'),
          apiFetch('/api/distributions'),
        ])
          .then(([familiesData, distributionsData]) => {
            console.log('Data refreshed after family submission:', familiesData)
            setFamilies(Array.isArray(familiesData) ? familiesData : [])
            setDistributions(Array.isArray(distributionsData) ? distributionsData : [])
          })
          .catch((err) => {
            console.error('Error refreshing data:', err)
          })
      }, 500)
      
      return () => clearTimeout(timer)
    }
  }, [formSuccess])

  const filteredFamilies = useMemo(
    () => families.filter((family) => (family.barangay_name || '').toLowerCase() === staffBarangay.toLowerCase()),
    [families, staffBarangay],
  )

  const filteredDistributions = useMemo(
    () => distributions.filter((dist) => (dist.barangay_name || '').toLowerCase() === staffBarangay.toLowerCase()),
    [distributions, staffBarangay],
  )

  const assistedFamilyIds = useMemo(() => {
    const ids = new Set()
    filteredDistributions.forEach((dist) => {
      if (dist.family_id !== null && dist.family_id !== undefined) {
        ids.add(dist.family_id)
      }
    })
    return ids
  }, [filteredDistributions])

  const thisMonthCompleted = useMemo(() => {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    return filteredDistributions.filter((dist) => {
      if (!dist.date_given) return false
      const date = new Date(dist.date_given)
      if (Number.isNaN(date.getTime())) return false
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear
    }).length
  }, [filteredDistributions])

  const pendingDistributions = useMemo(
    () => filteredDistributions.filter((dist) => String(dist.status || '').toLowerCase() === 'pending').length,
    [filteredDistributions],
  )

  const summaryCards = useMemo(() => ([
    {
      label: 'Families in Barangay',
      value: filteredFamilies.length.toString(),
      sub: `Barangay ${staffBarangay}`,
      iconBg: 'bg-blue-100',
      iconText: 'text-blue-600',
      icon: '👥',
    },
    {
      label: 'Assisted Families',
      value: assistedFamilyIds.size.toString(),
      sub: filteredFamilies.length
        ? `${Math.round((assistedFamilyIds.size / filteredFamilies.length) * 100)}% coverage`
        : '0% coverage',
      iconBg: 'bg-emerald-100',
      iconText: 'text-emerald-600',
      icon: '🍃',
    },
    {
      label: 'Pending Verification',
      value: pendingDistributions.toString(),
      sub: 'Awaiting review',
      iconBg: 'bg-amber-100',
      iconText: 'text-amber-600',
      icon: '⏳',
    },
    {
      label: 'Verified This Month',
      value: thisMonthCompleted.toString(),
      sub: 'Recently processed',
      iconBg: 'bg-violet-100',
      iconText: 'text-violet-600',
      icon: '◉',
    },
  ]), [assistedFamilyIds.size, filteredFamilies.length, pendingDistributions, staffBarangay, thisMonthCompleted])

  const quickActions = [
    { label: 'Add family record', to: '/staff/dashboard', tone: 'bg-blue-600 hover:bg-blue-700' },
    { label: 'View barangay lists', to: '/barangays', tone: 'bg-emerald-600 hover:bg-emerald-700' },
    { label: 'Open reports', to: '/transparency', tone: 'bg-slate-700 hover:bg-slate-600' },
  ]

  const activityFeed = useMemo(() => {
    if (filteredDistributions.length === 0) {
      return [
        'Checked new family submission from Poblacion',
        'Updated assistance status for 3 households',
        'Reviewed pending verification for senior citizens',
        'Logged today\'s field visit notes',
      ]
    }

    return filteredDistributions
      .slice(0, 4)
      .map((dist) => {
        const recipient = dist.family_name || dist.individual_name || 'recipient'
        const status = dist.status ? dist.status.toLowerCase() : 'updated'
        return `Distribution ${status} for ${recipient}`
      })
  }, [filteredDistributions])

  const nutritionalSlices = [
    { label: 'Normal 42%', width: '42%', color: '#27c18d' },
    { label: 'Underweight 18%', width: '18%', color: '#6fb7ff' },
    { label: 'Overweight 21%', width: '21%', color: '#f6c45f' },
    { label: 'Severe 19%', width: '19%', color: '#f28b82' },
  ]

  const navigate = useNavigate()
  const [familyForm, setFamilyForm] = useState({
    familyName: '',
    barangay: staffUser?.barangay || 'Aguho',
    address: '',
    headOfFamily: '',
    contactNumber: '',
    monthlyIncome: '',
    programs: [],
    noPermanentAddress: false,
  })

  const [individualForm, setIndividualForm] = useState({
    name: '',
    age: '',
    gender: 'Male',
    barangay: staffUser?.barangay || 'Aguho',
    status: 'Registered',
  })
  const [individualSubmitting, setIndividualSubmitting] = useState(false)
  const [individualSuccess, setIndividualSuccess] = useState('')
  const [individualError, setIndividualError] = useState('')

  // Initialize form with staff user's barangay name when available
  useEffect(() => {
    if (staffBarangayName) {
      setFamilyForm((prev) => ({
        ...prev,
        barangay: staffBarangayName,
      }))
      setIndividualForm((prev) => ({
        ...prev,
        barangay: staffBarangayName,
      }))
    }
  }, [staffBarangayName])

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

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')
    setFormSuccess('')
    setFormSubmitting(true)

    try {
      const barangayId = BARANGAY_MAP[familyForm.barangay] || 1

      // Use placeholder address if NPA is selected
      const addressValue = familyForm.noPermanentAddress ? 'No Permanent Address (NPA)' : familyForm.address

      const payload = {
        family_name: familyForm.familyName,
        barangay_id: barangayId,
        address: addressValue,
        head_of_family: familyForm.headOfFamily,
        phone: familyForm.contactNumber,
        members: [], // Staff can add family without members initially
      }

      // Validate required fields
      if (!payload.family_name.trim()) {
        throw new Error('Family name is required')
      }
      if (!addressValue.trim()) {
        throw new Error('Please provide an address or mark as No Permanent Address (NPA)')
      }

      const data = await apiFetch('/api/families', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      setFormSuccess(`✓ Family "${familyForm.familyName}" registered successfully!`)

      // Reset form
      setFamilyForm({
        familyName: '',
        barangay: staffUser?.barangay || 'Aguho',
        address: '',
        headOfFamily: '',
        contactNumber: '',
        monthlyIncome: '',
        programs: [],
        noPermanentAddress: false,
      })

      // Clear success message after 3 seconds
      setTimeout(() => {
        setFormSuccess('')
      }, 3000)
    } catch (err) {
      setFormError(err.message || 'Failed to add family. Please try again.')
    } finally {
      setFormSubmitting(false)
    }
  }

  function handleIndividualChange(e) {
    const { name, value } = e.target
    setIndividualForm((s) => ({ ...s, [name]: value }))
  }

  async function handleIndividualSubmit(e) {
    e.preventDefault()
    setIndividualError('')
    setIndividualSuccess('')
    setIndividualSubmitting(true)

    try {
      const barangayId = BARANGAY_MAP[individualForm.barangay] || 1

      if (!individualForm.name.trim()) {
        throw new Error('Full name is required')
      }
      if (!individualForm.age || Number(individualForm.age) < 0) {
        throw new Error('Valid age is required')
      }

      const payload = {
        name: individualForm.name,
        age: Number(individualForm.age),
        gender: individualForm.gender,
        barangay_id: barangayId,
        status: individualForm.status,
      }

      await apiFetch('/api/individuals', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      setIndividualSuccess(`✓ Individual "${individualForm.name}" registered successfully!`)

      setIndividualForm({
        name: '',
        age: '',
        gender: 'Male',
        barangay: staffUser?.barangay || 'Aguho',
        status: 'Registered',
      })

      setTimeout(() => {
        setIndividualSuccess('')
      }, 3000)
    } catch (err) {
      setIndividualError(err.message || 'Failed to add individual. Please try again.')
    } finally {
      setIndividualSubmitting(false)
    }
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
              Managing data for Barangay {staffBarangay}
            </p>
          </div>

          <section className={`mb-10 rounded-2xl px-8 py-10 shadow-[0_2px_8px_rgba(15,23,42,0.08)] ${isDarkMode ? 'border border-slate-700 bg-slate-800' : 'border border-slate-200 bg-white'}`}>
            <div className="flex items-center gap-5">
              <div className="grid h-14 w-14 place-items-center rounded-full bg-emerald-50 text-2xl text-emerald-700">
                👤
              </div>
              <div>
                <p className={`text-2xl font-bold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>Staff Access</p>
                <p className={`${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>Limited to Barangay {staffBarangay} data management</p>
              </div>
            </div>
          </section>

          {error && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {loading && (
            <p className={`mb-6 text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              Loading staff dashboard data...
            </p>
          )}

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

          <section className="mt-10 grid gap-6 xl:grid-cols-1">
            <article id="barangays-section" className={`rounded-2xl px-7 py-7 shadow-[0_2px_8px_rgba(15,23,42,0.08)] ${isDarkMode ? 'border border-slate-700 bg-slate-800' : 'border border-slate-200 bg-white'}`}>
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <h3 className={`text-2xl font-bold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                    Barangay {staffUser?.barangay || 'Aguho'}
                  </h3>
                  <p className={`${isDarkMode ? 'mt-1 text-slate-300' : 'mt-1 text-slate-500'}`}>Viewing your assigned barangay: Barangay {staffUser?.barangay || 'Aguho'}</p>
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
                  <strong className={`text-lg font-bold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>{filteredFamilies.length}</strong>
                </div>

                <div className="flex items-center justify-between text-[1rem]">
                  <div className="flex items-center gap-3">
                    <span className={`text-xl ${isDarkMode ? 'text-slate-300' : 'text-rose-500'}`}>📍</span>
                    <span className={`${isDarkMode ? 'text-slate-200' : 'text-slate-600'}`}>Families Assisted</span>
                  </div>
                  <strong className="text-lg font-bold text-emerald-600">{assistedFamilyIds.size}</strong>
                </div>

                <div className="pt-2">
                  <div className={`mb-2 flex items-center justify-between text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                    <span>Assistance Coverage</span>
                    <span>{filteredFamilies.length > 0 ? Math.round((assistedFamilyIds.size / filteredFamilies.length) * 100) : 0}%</span>
                  </div>
                  <div className={`h-3 rounded-full ${isDarkMode ? 'bg-slate-700' : 'bg-slate-100'}`}>
                    <div 
                      className="h-3 rounded-full bg-[#3c9452]" 
                      style={{ width: filteredFamilies.length > 0 ? `${(assistedFamilyIds.size / filteredFamilies.length) * 100}%` : '0%' }}
                    />
                  </div>
                </div>
              </div>
            </article>
          </section>

          <section className="mt-10 grid gap-6">
            <article id="families-list-section" className={`rounded-2xl px-7 py-7 shadow-[0_2px_8px_rgba(15,23,42,0.08)] ${isDarkMode ? 'border border-slate-700 bg-slate-800' : 'border border-slate-200 bg-white'}`}>
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h3 className={`text-2xl font-black ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>Families in {staffBarangay}</h3>
                  <p className={`${isDarkMode ? 'text-slate-300' : 'text-slate-500'} mt-1`}>Active and registered families in your barangay</p>
                </div>
                <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${isDarkMode ? 'bg-slate-900 text-slate-300' : 'bg-slate-100 text-slate-700'}`}>
                  Total: {filteredFamilies.length}
                </span>
              </div>

              {filteredFamilies.length > 0 ? (
                <div className={`rounded-xl overflow-hidden border ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className={`${isDarkMode ? 'bg-slate-900 border-b border-slate-700' : 'bg-slate-50 border-b border-slate-200'}`}>
                        <th className={`px-6 py-3 text-left font-semibold ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>Family Name</th>
                        <th className={`px-6 py-3 text-left font-semibold ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>Head of Family</th>
                        <th className={`px-6 py-3 text-left font-semibold ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>Address</th>
                        <th className={`px-6 py-3 text-left font-semibold ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>Members</th>
                        <th className={`px-6 py-3 text-left font-semibold ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>Status</th>
                        <th className={`px-6 py-3 text-left font-semibold ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>Contact</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredFamilies.map((family, idx) => {
                        const isAssisted = assistedFamilyIds.has(family.family_id)
                        return (
                          <tr key={family.family_id} className={`border-b ${idx % 2 === 0 ? (isDarkMode ? 'bg-slate-900/30' : 'bg-slate-50/50') : ''} ${isDarkMode ? 'border-slate-700/50 hover:bg-slate-900/50' : 'border-slate-100 hover:bg-slate-100/50'} transition`}>
                            <td className={`px-6 py-3 font-medium ${isDarkMode ? 'text-slate-200' : 'text-slate-900'}`}>{family.family_name}</td>
                            <td className={`px-6 py-3 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>{family.head_of_family || 'N/A'}</td>
                            <td className={`px-6 py-3 max-w-xs truncate ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`} title={family.address}>{family.address || 'N/A'}</td>
                            <td className={`px-6 py-3 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                              <span className={`inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-semibold ${isDarkMode ? 'bg-blue-900/40 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>
                                {family.member_count || 0}
                              </span>
                            </td>
                            <td className={`px-6 py-3`}>
                              <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${isAssisted ? (isDarkMode ? 'bg-emerald-900/40 text-emerald-300' : 'bg-emerald-100 text-emerald-700') : (isDarkMode ? 'bg-slate-700/50 text-slate-300' : 'bg-slate-200 text-slate-700')}`}>
                                {isAssisted ? '✓ Assisted' : 'Registered'}
                              </span>
                            </td>
                            <td className={`px-6 py-3 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{family.phone || '—'}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className={`rounded-lg p-8 text-center ${isDarkMode ? 'bg-slate-900 border border-slate-700' : 'bg-slate-50 border border-slate-200'}`}>
                  <p className={`${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>No families registered in this barangay yet.</p>
                </div>
              )}
            </article>
          </section>

          <section className="mt-10 grid gap-6">
            <article id="add-family-section" className={`rounded-2xl px-7 py-7 shadow-[0_2px_8px_rgba(15,23,42,0.08)] ${isDarkMode ? 'border border-slate-700 bg-slate-900' : 'border border-slate-200 bg-white'}`}>
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h3 className={`text-2xl font-black ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>Register New Family</h3>
                  <p className={`${isDarkMode ? 'text-slate-300' : 'text-slate-500'} mt-1`}>Fill in all required fields. Priority score is computed automatically.</p>
                </div>
                <Link to="/admin/families" className={`text-sm ${isDarkMode ? 'text-slate-300 hover:text-slate-100' : 'text-slate-600 hover:text-slate-900'}`}>← View All Families</Link>
              </div>

              {formSuccess && (
                <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {formSuccess}
                </div>
              )}

              {formError && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {formError}
                </div>
              )}

              <form onSubmit={handleSubmit} className="rounded-2xl p-1" aria-label="Register family form">
                <div className={cardClass}>
                  <div className={`grid gap-4 grid-cols-1 lg:grid-cols-2`}> 
                  <div>
                    <label className={labelClass}>Family Name *</label>
                    <input name="familyName" value={familyForm.familyName} onChange={handleChange} placeholder="e.g. Dela Cruz" className={`${inputClass} mt-2`} required />
                  </div>

                  <div>
                    <label className={labelClass}>Barangay *</label>
                    <select name="barangay" value={familyForm.barangay} onChange={handleChange} className={`${inputClass} mt-2`}>
                      <option>{staffUser?.barangay || 'Aguho'}</option>
                      <option>Aguho</option>
                      <option>Magtanggol</option>
                      <option>Martires del 96</option>
                      <option>Poblacion</option>
                      <option>San Pedro</option>
                      <option>San Roque</option>
                      <option>Santa Ana</option>
                      <option>Santo Rosario-Kanluran</option>
                      <option>Santo Rosario-Silangan</option>
                      <option>Tabacalera</option>
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
                    <button 
                      type="button" 
                      onClick={() => {
                        setFamilyForm({
                          familyName: '',
                          barangay: staffUser?.barangay || 'Aguho',
                          address: '',
                          headOfFamily: '',
                          contactNumber: '',
                          monthlyIncome: '',
                          programs: [],
                          noPermanentAddress: false,
                        })
                        setFormError('')
                        setFormSuccess('')
                      }}
                      disabled={formSubmitting}
                      className={`rounded-full px-5 py-2 text-sm ${isDarkMode ? 'bg-slate-800 border border-slate-700 text-slate-300' : 'bg-slate-100 border border-slate-200 text-slate-900'}`}
                    >
                      Clear
                    </button>
                    <button 
                      type="submit" 
                      disabled={formSubmitting}
                      className={`rounded-full px-5 py-2 text-sm font-semibold ${formSubmitting 
                        ? (isDarkMode ? 'bg-emerald-600/50 text-white' : 'bg-emerald-600/50 text-white') 
                        : (isDarkMode ? 'bg-emerald-600 text-white hover:bg-emerald-500' : 'bg-emerald-600 text-white hover:bg-emerald-700')
                      }`}
                    >
                      {formSubmitting ? 'Adding...' : 'Add Family'}
                    </button>
                  </div>
                </div>
                </div>
              </form>
            </article>
          </section>
          

          <section className="mt-10 grid gap-6">
            <article id="add-individual-section" className={`rounded-2xl px-7 py-7 shadow-[0_2px_8px_rgba(15,23,42,0.08)] ${isDarkMode ? 'border border-slate-700 bg-slate-900' : 'border border-slate-200 bg-white'}`}>
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h3 className={`text-2xl font-black ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>Register New Individual</h3>
                  <p className={`${isDarkMode ? 'text-slate-300' : 'text-slate-500'} mt-1`}>Add a new individual beneficiary record.</p>
                </div>
              </div>

              {individualSuccess && (
                <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {individualSuccess}
                </div>
              )}

              {individualError && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {individualError}
                </div>
              )}

              <form onSubmit={handleIndividualSubmit} className="rounded-2xl p-1" aria-label="Register individual form">
                <div className={cardClass}>
                  <div className={`grid gap-4 grid-cols-1 lg:grid-cols-2`}>
                    <div className="lg:col-span-2">
                      <label className={labelClass}>Full Name *</label>
                      <input name="name" value={individualForm.name} onChange={handleIndividualChange} placeholder="e.g. Maria Santos" className={`${inputClass} mt-2`} required />
                    </div>

                    <div>
                      <label className={labelClass}>Age *</label>
                      <input type="number" min="0" name="age" value={individualForm.age} onChange={handleIndividualChange} placeholder="Enter age" className={`${inputClass} mt-2`} required />
                    </div>

                    <div>
                      <label className={labelClass}>Gender *</label>
                      <select name="gender" value={individualForm.gender} onChange={handleIndividualChange} className={`${inputClass} mt-2`}>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className={labelClass}>Barangay *</label>
                      <select name="barangay" value={individualForm.barangay} onChange={handleIndividualChange} className={`${inputClass} mt-2`}>
                        <option>{staffUser?.barangay || 'Aguho'}</option>
                        <option>Aguho</option>
                        <option>Magtanggol</option>
                        <option>Martires del 96</option>
                        <option>Poblacion</option>
                        <option>San Pedro</option>
                        <option>San Roque</option>
                        <option>Santa Ana</option>
                        <option>Santo Rosario-Kanluran</option>
                        <option>Santo Rosario-Silangan</option>
                        <option>Tabacalera</option>
                      </select>
                    </div>

                    <div>
                      <label className={labelClass}>Status *</label>
                      <select name="status" value={individualForm.status} onChange={handleIndividualChange} className={`${inputClass} mt-2`}>
                        <option value="Registered">Registered</option>
                        <option value="Received">Received</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between">
                  <div className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}></div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setIndividualForm({
                          name: '',
                          age: '',
                          gender: 'Male',
                          barangay: staffUser?.barangay || 'Aguho',
                          status: 'Registered',
                        })
                        setIndividualError('')
                        setIndividualSuccess('')
                      }}
                      disabled={individualSubmitting}
                      className={`rounded-full px-5 py-2 text-sm ${isDarkMode ? 'bg-slate-800 border border-slate-700 text-slate-300' : 'bg-slate-100 border border-slate-200 text-slate-900'}`}
                    >
                      Clear
                    </button>
                    <button
                      type="submit"
                      disabled={individualSubmitting}
                      className={`rounded-full px-5 py-2 text-sm font-semibold ${individualSubmitting
                        ? (isDarkMode ? 'bg-emerald-600/50 text-white' : 'bg-emerald-600/50 text-white')
                        : (isDarkMode ? 'bg-emerald-600 text-white hover:bg-emerald-500' : 'bg-emerald-600 text-white hover:bg-emerald-700')
                      }`}
                    >
                      {individualSubmitting ? 'Adding...' : 'Register Individual'}
                    </button>
                  </div>
                </div>
              </form>
            </article>
          </section>

            <section id="transparency-section" className={`mt-10 rounded-2xl px-7 py-7 shadow-[0_2px_8px_rgba(15,23,42,0.08)] ${isDarkMode ? 'border border-slate-700 bg-slate-800' : 'border border-slate-200 bg-white'}`}>
            <h3 className={`text-xl font-bold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>Transparency & System Overview</h3>
            <p className={`mt-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>Current status for {staffUser?.barangay || 'Aguho'}</p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className={`rounded-lg p-4 ${isDarkMode ? 'bg-slate-900 border border-slate-700' : 'bg-slate-50 border border-slate-200'}`}>
                <p className={`text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>Total Registered Families</p>
                <p className={`mt-2 text-3xl font-bold ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>{filteredFamilies.length}</p>
              </div>

              <div className={`rounded-lg p-4 ${isDarkMode ? 'bg-slate-900 border border-slate-700' : 'bg-slate-50 border border-slate-200'}`}>
                <p className={`text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>Active Distributions</p>
                <p className={`mt-2 text-3xl font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>{filteredDistributions.length}</p>
              </div>

              <div className={`rounded-lg p-4 ${isDarkMode ? 'bg-slate-900 border border-slate-700' : 'bg-slate-50 border border-slate-200'}`}>
                <p className={`text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>Verified This Month</p>
                <p className={`mt-2 text-3xl font-bold ${isDarkMode ? 'text-violet-400' : 'text-violet-600'}`}>{thisMonthCompleted}</p>
              </div>

              <div className={`rounded-lg p-4 ${isDarkMode ? 'bg-slate-900 border border-slate-700' : 'bg-slate-50 border border-slate-200'}`}>
                <p className={`text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>Pending Verification</p>
                <p className={`mt-2 text-3xl font-bold ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`}>{pendingDistributions}</p>
              </div>

              <div className={`rounded-lg p-4 ${isDarkMode ? 'bg-slate-900 border border-slate-700' : 'bg-slate-50 border border-slate-200'}`}>
                <p className={`text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>Families Assisted</p>
                <p className={`mt-2 text-3xl font-bold ${isDarkMode ? 'text-pink-400' : 'text-pink-600'}`}>{assistedFamilyIds.size}</p>
              </div>

              <div className={`rounded-lg p-4 ${isDarkMode ? 'bg-slate-900 border border-slate-700' : 'bg-slate-50 border border-slate-200'}`}>
                <p className={`text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>Coverage Rate</p>
                <p className={`mt-2 text-3xl font-bold ${isDarkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>{filteredFamilies.length > 0 ? Math.round((assistedFamilyIds.size / filteredFamilies.length) * 100) : 0}%</p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
              <h4 className={`font-semibold ${isDarkMode ? 'text-slate-200' : 'text-slate-900'}`}>Recent Activity</h4>
              <ul className={`mt-3 space-y-2 text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                {filteredDistributions.slice(0, 5).map((dist, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="mt-1 text-lg">→</span>
                    <span>{dist.family_name || dist.individual_name || 'Unknown'} - {dist.status || 'Updated'}</span>
                  </li>
                ))}
                {filteredDistributions.length === 0 && (
                  <li className={isDarkMode ? 'text-slate-500' : 'text-slate-400'}>No recent activity</li>
                )}
              </ul>
            </div>
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
