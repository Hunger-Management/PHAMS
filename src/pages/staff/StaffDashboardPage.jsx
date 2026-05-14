import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { apiFetch } from '../../api/api'
import { useDarkMode } from '../../hooks/useDarkMode'
import { useStaffAuth } from '../../context/StaffAuthContext'
import StaffSidebar from './StaffSidebar'
import { UserPlus, Trash2 } from 'lucide-react'

const RELATIONSHIP_OPTIONS = ['Head', 'Spouse', 'Child', 'Parent', 'Sibling', 'Relative', 'Other']
const NUTRITIONAL_OPTIONS = ['Normal', 'Underweight', 'Severely Underweight', 'Overweight', 'Obese', 'Unknown']

const emptyMember = () => ({
  first_name: '',
  last_name: '',
  date_of_birth: '',
  gender: 'Male',
  relationship: 'Other',
  is_pwd: false,
  nutritional_status: 'Unknown',
  height_cm: '',
  weight_kg: '',
  _bmi: null,
})

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
  const [individuals, setIndividuals] = useState([])
  const [distributions, setDistributions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [formSubmitting, setFormSubmitting] = useState(false)
  const [formSuccess, setFormSuccess] = useState('')
  const [formError, setFormError] = useState('')

  const [staffBarangayName, setStaffBarangayName] = useState(
    staffUser?.barangay || staffUser?.barangay_name || ''
  )

  useEffect(() => {
    if (staffUser?.barangay || staffUser?.barangay_name) {
      setStaffBarangayName(staffUser.barangay || staffUser.barangay_name)
      return
    }
    if (staffUser?.barangay_id) {
      apiFetch(`/api/barangays/${staffUser.barangay_id}`)
        .then((b) => { if (b?.name) setStaffBarangayName(b.name) })
        .catch(() => {})
    }
  }, [staffUser?.barangay, staffUser?.barangay_name, staffUser?.barangay_id])

  const staffBarangay = staffBarangayName || 'Unknown Barangay'

  useEffect(() => {
    Promise.all([
      apiFetch('/api/families'),
      apiFetch('/api/individuals'),
      apiFetch('/api/distributions'),
    ])
      .then(([familiesData, individualsData, distributionsData]) => {
        setFamilies(Array.isArray(familiesData) ? familiesData : [])
        setIndividuals(Array.isArray(individualsData) ? individualsData : [])
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
          apiFetch('/api/individuals'),
          apiFetch('/api/distributions'),
        ])
          .then(([familiesData, individualsData, distributionsData]) => {
            console.log('Data refreshed after family submission:', familiesData)
            setFamilies(Array.isArray(familiesData) ? familiesData : [])
            setIndividuals(Array.isArray(individualsData) ? individualsData : [])
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

  const filteredIndividuals = useMemo(
    () => individuals.filter((individual) => (individual.barangay_name || '').toLowerCase() === staffBarangay.toLowerCase()),
    [individuals, staffBarangay],
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
      label: 'Registered Individuals',
      value: filteredIndividuals.length.toString(),
      sub: `Recorded in Barangay ${staffBarangay}`,
      iconBg: 'bg-sky-100',
      iconText: 'text-sky-600',
      icon: '🧾',
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
  ]), [assistedFamilyIds.size, filteredFamilies.length, filteredIndividuals.length, pendingDistributions, staffBarangay, thisMonthCompleted])

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
  })
  const [familyImageFile, setFamilyImageFile] = useState(null)

  const [members, setMembers] = useState([{ ...emptyMember(), relationship: 'Head' }])

  useEffect(() => {
    const headMember = members.find(m => m.relationship === 'Head')
    if (headMember?.first_name) {
      const fullName = `${headMember.first_name} ${headMember.last_name}`.trim()
      setFamilyForm(prev => ({ ...prev, headOfFamily: fullName }))
    }
  }, [members])
  const getAgeInYears = (dateOfBirth) => {
    if (!dateOfBirth) return null
    const today = new Date()
    const dob = new Date(dateOfBirth)
    let age = today.getFullYear() - dob.getFullYear()
    const m = today.getMonth() - dob.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--
    return age
  }

  const computeBMI = (heightCm, weightKg) => {
    const h = parseFloat(heightCm)
    const w = parseFloat(weightKg)
    if (!h || !w || h <= 0 || w <= 0) return null
    return w / Math.pow(h / 100, 2)
  }

  const bmiToNutritionalStatus = (bmi, dateOfBirth) => {
    if (bmi === null) return null
    const age = getAgeInYears(dateOfBirth)
    if (age !== null && age < 5) {
      if (bmi < 13.0) return 'Severely Underweight'
      if (bmi < 15.0) return 'Underweight'
      if (bmi < 18.0) return 'Normal'
      if (bmi < 20.0) return 'Overweight'
      return 'Obese'
    }
    if (age !== null && age < 18) {
      if (bmi < 14.0) return 'Severely Underweight'
      if (bmi < 16.5) return 'Underweight'
      if (bmi < 23.0) return 'Normal'
      if (bmi < 27.5) return 'Overweight'
      return 'Obese'
    }
    if (bmi < 16.0) return 'Severely Underweight'
    if (bmi < 18.5) return 'Underweight'
    if (bmi < 23.0) return 'Normal'
    if (bmi < 25.0) return 'Overweight'
    return 'Obese'
  }

  const handleMemberChange = (index, e) => {
    const { name, value, type, checked } = e.target
    const updatedValue = type === 'checkbox' ? checked : value
    setMembers((prev) => {
      if (name === 'relationship' && updatedValue === 'Head') {
        return prev.map((m, i) => {
          if (i === index) return { ...m, relationship: 'Head' }
          if (m.relationship === 'Head') return { ...m, relationship: 'Other' }
          return m
        })
      }
      return prev.map((m, i) => {
        if (i !== index) return m
        const updated = { ...m, [name]: updatedValue }
        if (name === 'height_cm' || name === 'weight_kg') {
          const h = name === 'height_cm' ? updatedValue : m.height_cm
          const w = name === 'weight_kg' ? updatedValue : m.weight_kg
          const bmi = computeBMI(h, w)
          updated.nutritional_status = bmiToNutritionalStatus(bmi, updated.date_of_birth) || 'Unknown'
          updated._bmi = bmi ? bmi.toFixed(1) : null
        }
        if (name === 'date_of_birth' && m.height_cm && m.weight_kg) {
          const bmi = computeBMI(m.height_cm, m.weight_kg)
          updated.nutritional_status = bmiToNutritionalStatus(bmi, updatedValue) || m.nutritional_status
          updated._bmi = bmi ? bmi.toFixed(1) : null
        }
        return updated
      })
    })
  }

  const addMember = () => setMembers((prev) => [...prev, emptyMember()])

  const removeMember = (index) => {
    if (members.length === 1) return
    setMembers((prev) => prev.filter((_, i) => i !== index))
  }

  const [individualForm, setIndividualForm] = useState({
    name: '',
    age: '',
    gender: 'Male',
    barangay: staffUser?.barangay || 'Aguho',
    status: 'Registered',
  })
  const [individualImageFile, setIndividualImageFile] = useState(null)
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
    const { name, value } = e.target
    setFamilyForm((s) => ({ ...s, [name]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')
    setFormSuccess('')
    setFormSubmitting(true)

    try {
      const barangayId = BARANGAY_MAP[staffBarangayName] || 1

      if (!familyForm.familyName.trim()) {
        throw new Error('Family name is required.')
      }
      if (!familyForm.address.trim()) {
        throw new Error('Complete address is required.')
      }

      const membersPayload = members
        .filter((m) => m.first_name.trim())
        .map(({ _bmi, ...m }) => ({
          first_name: m.first_name,
          last_name: m.last_name,
          date_of_birth: m.date_of_birth || null,
          gender: m.gender,
          relationship: m.relationship,
          is_pwd: m.is_pwd ? 1 : 0,
          height_cm: m.height_cm ? parseFloat(m.height_cm) : null,
          weight_kg: m.weight_kg ? parseFloat(m.weight_kg) : null,
          nutritional_status: m.nutritional_status,
        }))

      const payload = new FormData()
      payload.append('family_name', familyForm.familyName)
      payload.append('barangay_id', String(barangayId))
      payload.append('address', familyForm.address)
      payload.append('head_of_family', familyForm.headOfFamily)
      payload.append('phone', familyForm.contactNumber)
      payload.append('monthly_income', familyForm.monthlyIncome ? String(parseFloat(familyForm.monthlyIncome)) : '')
      payload.append('food_assistance_status', familyForm.programs.length ? familyForm.programs.join(',') : 'None')
      payload.append('is_npa', '0')
      payload.append('members', JSON.stringify(membersPayload))
      if (familyImageFile) {
        payload.append('image', familyImageFile)
      }

      const data = await apiFetch('/api/families', {
        method: 'POST',
        body: payload,
      })

      setFormSuccess(`✓ Family "${familyForm.familyName}" registered successfully!`)

      setFamilyForm({
        familyName: '',
        barangay: staffBarangayName,
        address: '',
        headOfFamily: '',
        contactNumber: '',
        monthlyIncome: '',
        programs: [],
      })
      setMembers([{ ...emptyMember(), relationship: 'Head' }])
      setFamilyImageFile(null)

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
      const barangayId = BARANGAY_MAP[staffBarangayName] || 1

      if (!individualForm.name.trim()) {
        throw new Error('Full name is required')
      }
      if (!individualForm.age || Number(individualForm.age) < 0) {
        throw new Error('Valid age is required')
      }

      const payload = new FormData()
      payload.append('name', individualForm.name)
      payload.append('age', String(Number(individualForm.age)))
      payload.append('gender', individualForm.gender)
      payload.append('barangay_id', String(barangayId))
      payload.append('status', individualForm.status)
      if (individualImageFile) {
        payload.append('image', individualImageFile)
      }

      await apiFetch('/api/individuals', {
        method: 'POST',
        body: payload,
      })

      setIndividualSuccess(`✓ Individual "${individualForm.name}" registered successfully!`)

      setIndividualForm({
        name: '',
        age: '',
        gender: 'Male',
        barangay: staffBarangayName,
        status: 'Registered',
      })
      setIndividualImageFile(null)

      setTimeout(() => {
        setIndividualSuccess('')
      }, 3000)

      Promise.all([
        apiFetch('/api/families'),
        apiFetch('/api/individuals'),
        apiFetch('/api/distributions'),
      ])
        .then(([familiesData, individualsData, distributionsData]) => {
          setFamilies(Array.isArray(familiesData) ? familiesData : [])
          setIndividuals(Array.isArray(individualsData) ? individualsData : [])
          setDistributions(Array.isArray(distributionsData) ? distributionsData : [])
        })
        .catch(() => {
          // keep the success state even if refresh fails
        })
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
                        <th className={`px-6 py-3 text-left font-semibold ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>Image</th>
                        <th className={`px-6 py-3 text-left font-semibold ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>Head of Family</th>
                        <th className={`px-6 py-3 text-left font-semibold ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>Address</th>
                        <th className={`px-6 py-3 text-left font-semibold ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>Members</th>
                        <th className={`px-6 py-3 text-left font-semibold ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>Status</th>
                        <th className={`px-6 py-3 text-left font-semibold ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>Contact</th>
                        <th className={`px-6 py-3 text-left font-semibold ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredFamilies.map((family, idx) => {
                        const isAssisted = assistedFamilyIds.has(family.family_id)
                        return (
                          <tr key={family.family_id} className={`border-b ${idx % 2 === 0 ? (isDarkMode ? 'bg-slate-900/30' : 'bg-slate-50/50') : ''} ${isDarkMode ? 'border-slate-700/50 hover:bg-slate-900/50' : 'border-slate-100 hover:bg-slate-100/50'} transition`}>
                            <td className={`px-6 py-3 font-medium ${isDarkMode ? 'text-slate-200' : 'text-slate-900'}`}>{family.family_name}</td>
                            <td className="px-6 py-3">
                              {family.image ? (
                                <img
                                  src={`data:image/jpeg;base64,${family.image}`}
                                  alt={`${family.family_name || 'Family'} photo`}
                                  className="h-10 w-10 rounded-md object-cover"
                                />
                              ) : (
                                <span className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                  —
                                </span>
                              )}
                            </td>
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
                            <td className="px-6 py-3">
                              <Link to={`/staff/families/${family.family_id}`} className="text-xs font-medium text-blue-600 hover:text-blue-700 transition">
                                View →
                              </Link>
                            </td>
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
            <article id="individuals-list-section" className={`rounded-2xl px-7 py-7 shadow-[0_2px_8px_rgba(15,23,42,0.08)] ${isDarkMode ? 'border border-slate-700 bg-slate-800' : 'border border-slate-200 bg-white'}`}>
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h3 className={`text-2xl font-black ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>Individuals in {staffBarangay}</h3>
                  <p className={`${isDarkMode ? 'text-slate-300' : 'text-slate-500'} mt-1`}>Recently added and registered individuals in your barangay</p>
                </div>
                <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${isDarkMode ? 'bg-slate-900 text-slate-300' : 'bg-slate-100 text-slate-700'}`}>
                  Total: {filteredIndividuals.length}
                </span>
              </div>

              {filteredIndividuals.length > 0 ? (
                <div className={`rounded-xl overflow-hidden border ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className={`${isDarkMode ? 'bg-slate-900 border-b border-slate-700' : 'bg-slate-50 border-b border-slate-200'}`}>
                        <th className={`px-6 py-3 text-left font-semibold ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>Name</th>
                        <th className={`px-6 py-3 text-left font-semibold ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>Image</th>
                        <th className={`px-6 py-3 text-left font-semibold ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>Age</th>
                        <th className={`px-6 py-3 text-left font-semibold ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>Gender</th>
                        <th className={`px-6 py-3 text-left font-semibold ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>Barangay</th>
                        <th className={`px-6 py-3 text-left font-semibold ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredIndividuals.map((individual, idx) => (
                        <tr key={individual.individual_id} className={`border-b ${idx % 2 === 0 ? (isDarkMode ? 'bg-slate-900/30' : 'bg-slate-50/50') : ''} ${isDarkMode ? 'border-slate-700/50 hover:bg-slate-900/50' : 'border-slate-100 hover:bg-slate-100/50'} transition`}>
                          <td className={`px-6 py-3 font-medium ${isDarkMode ? 'text-slate-200' : 'text-slate-900'}`}>{individual.name || '—'}</td>
                          <td className="px-6 py-3">
                            {individual.image ? (
                              <img
                                src={`data:image/jpeg;base64,${individual.image}`}
                                alt={`${individual.name || 'Individual'} photo`}
                                className="h-10 w-10 rounded-md object-cover"
                              />
                            ) : (
                              <span className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                —
                              </span>
                            )}
                          </td>
                          <td className={`px-6 py-3 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>{individual.age ?? '—'}</td>
                          <td className={`px-6 py-3 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>{individual.gender || '—'}</td>
                          <td className={`px-6 py-3 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>{individual.barangay_name || '—'}</td>
                          <td className={`px-6 py-3 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                            <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${String(individual.status || '').toLowerCase() === 'received' ? (isDarkMode ? 'bg-emerald-900/40 text-emerald-300' : 'bg-emerald-100 text-emerald-700') : (isDarkMode ? 'bg-slate-700/50 text-slate-300' : 'bg-slate-200 text-slate-700')}`}>
                              {individual.status || 'Registered'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className={`rounded-lg p-8 text-center ${isDarkMode ? 'bg-slate-900 border border-slate-700' : 'bg-slate-50 border border-slate-200'}`}>
                  <p className={`${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>No individuals registered in this barangay yet.</p>
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
                <button
                  type="button"
                  onClick={() => document.getElementById('families-list-section')?.scrollIntoView({ behavior: 'smooth' })}
                  className={`text-sm transition ${isDarkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  View Families ↓
                </button>
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
                    <label className={labelClass}>Barangay</label>
                    <div className={`mt-2 flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm ${isDarkMode ? 'border-white/10 bg-[#0b1220]/50 text-slate-300' : 'border-slate-200 bg-slate-100 text-slate-700'}`}>
                      <span>📍</span>
                      <span className="font-medium">{staffBarangayName}</span>
                      <span className={`ml-auto text-xs ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Assigned</span>
                    </div>
                  </div>

                  <div className="lg:col-span-2">
                    <label className={labelClass}>Complete Address *</label>
                    <input name="address" value={familyForm.address} onChange={handleChange} placeholder="House No., Street, Purok" className={`${inputClass} mt-2`} required />
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
                    <label className={labelClass}>Family Photo (Optional)</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(event) => setFamilyImageFile(event.target.files?.[0] || null)}
                      className={`${inputClass} mt-2`}
                    />
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

                {/* ── Family Members ── */}
                <div className={`mt-6 rounded-xl border p-5 ${isDarkMode ? 'border-white/10 bg-[#0b1220]' : 'border-slate-200 bg-slate-50'}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className={`font-semibold text-sm ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Family Members</h4>
                      <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Nutritional status is auto-computed from height &amp; weight.</p>
                    </div>
                    <button type="button" onClick={addMember} className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 transition">
                      <UserPlus size={13} /> Add Member
                    </button>
                  </div>

                  <div className="space-y-4">
                    {members.map((member, index) => (
                      <div key={index} className={`rounded-xl border p-4 ${isDarkMode ? 'border-white/10 bg-[#111c2e]' : 'border-slate-200 bg-white'}`}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-semibold uppercase tracking-wide ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Member {index + 1}</span>
                            {member.relationship === 'Head' && (
                              <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700">Head of Family</span>
                            )}
                          </div>
                          {members.length > 1 && (
                            <button type="button" onClick={() => removeMember(index)} className="text-red-400 hover:text-red-600 transition" aria-label="Remove member">
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                          <div>
                            <label className={labelClass}>First Name *</label>
                            <input name="first_name" value={member.first_name} onChange={(e) => handleMemberChange(index, e)} placeholder="First name" className={`${inputClass} mt-2`} />
                          </div>
                          <div>
                            <label className={labelClass}>Last Name *</label>
                            <input name="last_name" value={member.last_name} onChange={(e) => handleMemberChange(index, e)} placeholder="Last name" className={`${inputClass} mt-2`} />
                          </div>
                          <div>
                            <label className={labelClass}>Date of Birth</label>
                            <input name="date_of_birth" type="date" value={member.date_of_birth} onChange={(e) => handleMemberChange(index, e)} className={`${inputClass} mt-2`} />
                          </div>
                          <div>
                            <label className={labelClass}>Height (cm)</label>
                            <input name="height_cm" type="number" min="30" max="250" step="0.1" value={member.height_cm} onChange={(e) => handleMemberChange(index, e)} placeholder="e.g. 165" className={`${inputClass} mt-2`} />
                          </div>
                          <div>
                            <label className={labelClass}>Weight (kg)</label>
                            <input name="weight_kg" type="number" min="1" max="300" step="0.1" value={member.weight_kg} onChange={(e) => handleMemberChange(index, e)} placeholder="e.g. 55" className={`${inputClass} mt-2`} />
                          </div>
                          <div>
                            <label className={labelClass}>Gender *</label>
                            <select name="gender" value={member.gender} onChange={(e) => handleMemberChange(index, e)} className={`${inputClass} mt-2`}>
                              <option value="Male">Male</option>
                              <option value="Female">Female</option>
                              <option value="Other">Other</option>
                            </select>
                          </div>

                          {member._bmi && (
                            <div className={`sm:col-span-2 lg:col-span-3 rounded-lg px-3 py-2 text-xs ${isDarkMode ? 'bg-blue-500/10 text-blue-300' : 'bg-blue-50 text-blue-700'}`}>
                              <span className="font-semibold">BMI: {member._bmi}</span>
                              {member.date_of_birth && (
                                <span className="ml-2 opacity-75">
                                  ({getAgeInYears(member.date_of_birth) < 5 ? 'Under-5' : getAgeInYears(member.date_of_birth) < 18 ? 'Adolescent' : 'Adult/Asian cutoff'} classification)
                                </span>
                              )}
                              <span className="ml-2">— Nutritional status auto-set. You may override if needed.</span>
                            </div>
                          )}

                          <div>
                            <label className={labelClass}>Relationship</label>
                            <select name="relationship" value={member.relationship} onChange={(e) => handleMemberChange(index, e)} className={`${inputClass} mt-2`}>
                              {RELATIONSHIP_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                            </select>
                            {member.relationship === 'Head' && member.date_of_birth && getAgeInYears(member.date_of_birth) < 18 && (
                              <p className="mt-1.5 text-xs text-amber-600">
                                ⚠ Note: Selected head of family is a minor ({getAgeInYears(member.date_of_birth)} yrs old). Please verify before submitting.
                              </p>
                            )}
                          </div>
                          <div>
                            <label className={labelClass}>Nutritional Status</label>
                            <select name="nutritional_status" value={member.nutritional_status} onChange={(e) => handleMemberChange(index, e)} className={`${inputClass} mt-2`}>
                              {NUTRITIONAL_OPTIONS.map((n) => <option key={n} value={n}>{n}</option>)}
                            </select>
                          </div>
                          <div className="flex items-center gap-2 pt-5">
                            <input type="checkbox" name="is_pwd" id={`pwd-${index}`} checked={member.is_pwd} onChange={(e) => handleMemberChange(index, e)} className="h-4 w-4 rounded" />
                            <label htmlFor={`pwd-${index}`} className={`text-sm cursor-pointer ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>Person with Disability (PWD)</label>
                          </div>
                        </div>
                      </div>
                    ))}
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
                          barangay: staffBarangayName,
                          address: '',
                          headOfFamily: '',
                          contactNumber: '',
                          monthlyIncome: '',
                          programs: [],
                        })
                        setMembers([{ ...emptyMember(), relationship: 'Head' }])
                        setFamilyImageFile(null)
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
                      <label className={labelClass}>Barangay</label>
                      <div className={`mt-2 flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm ${isDarkMode ? 'border-white/10 bg-[#0b1220]/50 text-slate-300' : 'border-slate-200 bg-slate-100 text-slate-700'}`}>
                        <span>📍</span>
                        <span className="font-medium">{staffBarangayName}</span>
                        <span className={`ml-auto text-xs ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Assigned</span>
                      </div>
                    </div>

                    <div>
                      <label className={labelClass}>Status *</label>
                      <select name="status" value={individualForm.status} onChange={handleIndividualChange} className={`${inputClass} mt-2`}>
                        <option value="Registered">Registered</option>
                        <option value="Received">Received</option>
                      </select>
                    </div>

                    <div>
                      <label className={labelClass}>Photo (Optional)</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(event) => setIndividualImageFile(event.target.files?.[0] || null)}
                        className={`${inputClass} mt-2`}
                      />
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
                        setIndividualImageFile(null)
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
