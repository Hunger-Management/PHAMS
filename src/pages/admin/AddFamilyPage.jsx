import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserPlus, Trash2, AlertTriangle, CheckCircle } from 'lucide-react'
import { useDarkMode } from '../../hooks/useDarkMode'
import AdminSidebar from '../../components/admin/AdminSidebar'
import { apiFetch } from '../../api/api'

const BARANGAY_OPTIONS = [
    { id: 1, name: 'Aguho' },
    { id: 2, name: 'Magtanggol' },
    { id: 3, name: "Martires del '96" },
    { id: 4, name: 'Poblacion' },
    { id: 5, name: 'San Pedro' },
    { id: 6, name: 'San Roque' },
    { id: 7, name: 'Santa Ana' },
    { id: 8, name: 'Santo Rosario-Kanluran' },
    { id: 9, name: 'Santo Rosario-Silangan' },
    { id: 10, name: 'Tabacalera' },
]

const FOOD_ASSISTANCE_OPTIONS = [
    '4Ps', 'Solo Parent', 'PWD Assistance', 'Senior Citizen', 'Pregnant/Lactating'
]

const RELATIONSHIP_OPTIONS = [
    'Head', 'Spouse', 'Child', 'Parent', 'Sibling', 'Relative', 'Other'
]

const NUTRITIONAL_OPTIONS = [
    'Normal', 'Underweight', 'Severely Underweight', 'Overweight', 'Obese', 'Unknown'
]

const emptyMember = () => ({
    first_name: '',
    last_name: '',
    date_of_birth: '',
    gender: 'Male',
    relationship: 'Head',
    is_pwd: false,
    nutritional_status: 'Unknown',
    height_cm: '',
    weight_kg: '',
    _bmi: null,
})

function AddFamilyPage() {
    const { isDarkMode, toggleDarkMode } = useDarkMode()
    const navigate = useNavigate()

    const [submitting, setSubmitting] = useState(false)
    const [successMessage, setSuccessMessage] = useState('')
    const [errorMessage, setErrorMessage] = useState('')

    const [familyData, setFamilyData] = useState({
        family_name: '',
        barangay_id: 1,
        address: '',
        is_npa: false,
        head_of_family: '',
        contact_number: '',
        monthly_income: '',
        food_assistance_status: [],
    })

    const [members, setMembers] = useState([emptyMember()])

    // Local storage helpers for offline/no-database mode
    const LOCAL_KEY = 'phams-local-families'
    const loadLocalFamilies = () => {
        try {
            return JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]') || []
        } catch (e) {
            return []
        }
    }

    const saveLocalFamily = (familyObj) => {
        const list = loadLocalFamilies()
        list.unshift(familyObj)
        localStorage.setItem(LOCAL_KEY, JSON.stringify(list))
    }

    const makeLocalId = () => `local-${Date.now()}`

    useEffect(() => {
        const headMember = members.find(m => m.relationship === 'Head')

        if (headMember?.first_name) {
            const fullName =
                `${headMember.first_name} ${headMember.last_name}`.trim()

            setFamilyData(prev => ({
                ...prev,
                head_of_family: fullName
            }))
        }
    }, [members])

    // ── Family field handlers ────────────────────────────────
    const handleAssistanceToggle = (opt) => {
        setFamilyData((prev) => {
            const current = prev.food_assistance_status
            const updated = current.includes(opt)
                ? current.filter((s) => s !== opt)
                : [...current, opt]
            return { ...prev, food_assistance_status: updated }
        })
    }

    // ── Member field handlers ────────────────────────────────
    const handleMemberChange = (index, e) => {
        const { name, value, type, checked } = e.target
        const updatedValue = type === 'checkbox' ? checked : value

        setMembers((prev) => {
            // Special case: only one member can be Head at a time
            if (name === 'relationship' && updatedValue === 'Head') {
                return prev.map((m, i) => {
                    if (i === index) {
                        return { ...m, relationship: 'Head' }
                    }
                    // Demote any other member currently marked as Head
                    if (m.relationship === 'Head') {
                        return { ...m, relationship: 'Other' }
                    }
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
                    const autoStatus = bmiToNutritionalStatus(bmi, updated.date_of_birth)
                    updated.nutritional_status = autoStatus || 'Unknown'
                    updated._bmi = bmi ? bmi.toFixed(1) : null
                }

                if (name === 'date_of_birth' && m.height_cm && m.weight_kg) {
                    const bmi = computeBMI(m.height_cm, m.weight_kg)
                    const autoStatus = bmiToNutritionalStatus(bmi, updatedValue)
                    updated.nutritional_status = autoStatus || m.nutritional_status
                    updated._bmi = bmi ? bmi.toFixed(1) : null
                }

                return updated
            })
        })
    }

    const handleFamilyChange = (e) => {
        const { name, value, type, checked } = e.target
        setFamilyData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }))
    }

    const addMember = () => setMembers((prev) => [...prev, emptyMember()])

    const removeMember = (index) => {
        if (members.length === 1) return // always keep at least one
        setMembers((prev) => prev.filter((_, i) => i !== index))
    }

    // ── Submit ───────────────────────────────────────────────
    const handleSubmit = async (e) => {
        e.preventDefault()
        setErrorMessage('')
        setSuccessMessage('')
        setSubmitting(true)

        try {
            const payload = {
                ...familyData,
                barangay_id: parseInt(familyData.barangay_id),
                monthly_income: familyData.monthly_income === ''
                    ? null
                    : parseFloat(familyData.monthly_income),
                is_npa: familyData.is_npa ? 1 : 0,
                // MySQL SET type accepts comma-separated string
                food_assistance_status: familyData.food_assistance_status.length > 0
                    ? familyData.food_assistance_status.join(',')
                    : 'None',
                members: members.map(({ _bmi, ...m }) => ({
                    ...m,
                    is_pwd: m.is_pwd ? 1 : 0,
                    date_of_birth: m.date_of_birth || null,
                    height_cm: m.height_cm === '' ? null : parseFloat(m.height_cm),
                    weight_kg: m.weight_kg === '' ? null : parseFloat(m.weight_kg),
                })),
            }

            const data = await apiFetch('/api/families', {
                method: 'POST',
                body: JSON.stringify(payload),
            })

            setSuccessMessage(
                `Family "${familyData.family_name}" registered successfully. Household ID: ${data.household_id} (DB ID: ${data.family_id}).`
            )

            // Reset form
            setFamilyData({
                family_name: '',
                barangay_id: 1,
                address: '',
                is_npa: false,
                head_of_family: '',
                contact_number: '',
                monthly_income: '',
                food_assistance_status: [],
            })
            setMembers([emptyMember()])

            // Scroll to top to show success message
            window.scrollTo({ top: 0, behavior: 'smooth' })
            // After a short delay, navigate to Manage Families so user sees the list
            setTimeout(() => {
                // Pass created family back so list can show it immediately if fetch fails
                navigate('/admin/families', { state: { selectedNav: 'Manage Families', newFamily: data } })
            }, 900)

        } catch (err) {
            // If API is down (no DB), fall back to localStorage so user can continue
            const isNetwork = !err.status || /failed to fetch/i.test(err.message || '')
            if (isNetwork) {
                const localId = makeLocalId()
                const localFamily = {
                    family_id: localId,
                    household_id: `H-${localId}`,
                    family_name: familyData.family_name || 'Unnamed',
                    address: familyData.address || null,
                    barangay_id: familyData.barangay_id,
                    barangay_name: BARANGAY_OPTIONS.find(b => b.id === parseInt(familyData.barangay_id))?.name || 'Unknown',
                    member_count: members.length,
                    priority_score: 0,
                    food_assistance_status: familyData.food_assistance_status.join(',') || 'None',
                    is_npa: familyData.is_npa ? 1 : 0,
                    _local: true,
                }

                saveLocalFamily(localFamily)

                setSuccessMessage(`Family "${localFamily.family_name}" saved locally.`)

                // Reset form
                setFamilyData({
                    family_name: '',
                    barangay_id: 1,
                    address: '',
                    is_npa: false,
                    head_of_family: '',
                    contact_number: '',
                    monthly_income: '',
                    food_assistance_status: [],
                })
                setMembers([emptyMember()])

                window.scrollTo({ top: 0, behavior: 'smooth' })

                setTimeout(() => {
                    navigate('/admin/families', { state: { selectedNav: 'Manage Families', newFamily: localFamily } })
                }, 600)

                return
            }

            if (err.status === 409) {
                setErrorMessage(
                    'A family with this name and address already exists in this barangay. Please check for duplicates.'
                )
            } else {
                setErrorMessage(err.message || 'Failed to register family.')
            }
        } finally {
            setSubmitting(false)
        }
    }

    // ── Shared input class ───────────────────────────────────
    const inputClass = `w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/40 transition ${isDarkMode
            ? 'border-white/10 bg-[#0b1220] text-slate-100 placeholder-slate-500'
            : 'border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400'
        }`

    const labelClass = `mb-1.5 block text-xs font-semibold uppercase tracking-[0.08em] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'
        }`

    const cardClass = `rounded-2xl border p-6 shadow-sm ${isDarkMode ? 'border-white/10 bg-[#111c2e]' : 'border-slate-200 bg-white'
        }`
    
    // ── BMI Calculator ───────────────────────────────────────
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

        // Under 5: simplified weight-for-age proxy
        // lower BMI thresholds as children naturally have lower BMI
        if (age !== null && age < 5) {
            if (bmi < 13.0) return 'Severely Underweight'
            if (bmi < 15.0) return 'Underweight'
            if (bmi < 18.0) return 'Normal'
            if (bmi < 20.0) return 'Overweight'
            return 'Obese'
        }

        // School-age and adolescents (5–17)
        // WHO BMI-for-age simplified ranges
        if (age !== null && age < 18) {
            if (bmi < 14.0) return 'Severely Underweight'
            if (bmi < 16.5) return 'Underweight'
            if (bmi < 23.0) return 'Normal'
            if (bmi < 27.5) return 'Overweight'
            return 'Obese'
        }

        // Adults 18+ — Filipino/Asian cutoffs (lower than Western standards)
        // Based on DOH/NNC Philippine Dietary Reference Intakes
        if (bmi < 16.0) return 'Severely Underweight'
        if (bmi < 18.5) return 'Underweight'
        if (bmi < 23.0) return 'Normal'
        if (bmi < 25.0) return 'Overweight'
        return 'Obese'
    }

    return (
        <div className={`flex min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-[#0b1220] text-slate-100' : 'bg-[#e5e7eb] text-slate-900'
            }`}>
            <AdminSidebar isDarkMode={isDarkMode} />

            <main className="flex-1 p-8 overflow-auto ml-64">
                <div className="max-w-4xl mx-auto">

                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                                Register New Family
                            </h2>
                            <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                Fill in all required fields. Priority score is computed automatically.
                            </p>
                        </div>
                        <button
                            onClick={() => navigate('/admin/families')}
                            className={`text-sm font-medium px-4 py-2 rounded-lg transition ${isDarkMode
                                    ? 'text-slate-300 hover:bg-white/10'
                                    : 'text-slate-600 hover:bg-slate-200'
                                }`}
                        >
                            ← View All Families
                        </button>
                    </div>

                    {/* Success */}
                    {successMessage ? (
                        <div className="mb-6 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                            <CheckCircle size={16} className="mt-0.5 shrink-0" />
                            <div>
                                <p className="font-semibold">Family registered successfully</p>
                                <p className="mt-0.5">{successMessage}</p>
                                <button
                                    onClick={() => navigate('/admin/families')}
                                    className="mt-2 font-semibold underline"
                                >
                                    View all families →
                                </button>
                            </div>
                        </div>
                    ) : null}

                    {/* Error */}
                    {errorMessage ? (
                        <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                            {errorMessage}
                        </div>
                    ) : null}

                    <form onSubmit={handleSubmit} className="space-y-6">

                        {/* ── Family Information ── */}
                        <div className={cardClass}>
                            <h3 className={`font-semibold mb-5 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                                Family Information
                            </h3>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <label className={labelClass}>Family Name *</label>
                                    <input
                                        name="family_name"
                                        value={familyData.family_name}
                                        onChange={handleFamilyChange}
                                        required
                                        placeholder="e.g. Dela Cruz"
                                        className={inputClass}
                                    />
                                </div>

                                <div>
                                    <label className={labelClass}>Barangay *</label>
                                    <select
                                        name="barangay_id"
                                        value={familyData.barangay_id}
                                        onChange={handleFamilyChange}
                                        className={inputClass}
                                    >
                                        {BARANGAY_OPTIONS.map((b) => (
                                            <option key={b.id} value={b.id}>{b.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="md:col-span-2">
                                    <div className="flex items-center justify-between mb-1.5">
                                        <label className={labelClass.replace('mb-1.5 ', '')}>
                                            Complete Address
                                        </label>
                                        <label className="flex items-center gap-2 text-xs cursor-pointer">
                                            <input
                                                type="checkbox"
                                                name="is_npa"
                                                checked={familyData.is_npa}
                                                onChange={handleFamilyChange}
                                                className="rounded"
                                            />
                                            <span className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>
                                                No Permanent Address (NPA)
                                            </span>
                                        </label>
                                    </div>
                                    <input
                                        name="address"
                                        value={familyData.address}
                                        onChange={handleFamilyChange}
                                        disabled={familyData.is_npa}
                                        placeholder={
                                            familyData.is_npa
                                                ? 'Not applicable for NPA'
                                                : 'House No., Street, Purok'
                                        }
                                        className={`${inputClass} ${familyData.is_npa ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    />
                                </div>

                                <div>
                                    <label className={labelClass}>Head of Family</label>
                                    <input
                                        name="head_of_family"
                                        value={familyData.head_of_family}
                                        onChange={handleFamilyChange}
                                        placeholder="Full name"
                                        className={inputClass}
                                    />
                                </div>

                                <div>
                                    <label className={labelClass}>Contact Number</label>
                                    <input
                                        name="contact_number"
                                        value={familyData.contact_number}
                                        onChange={handleFamilyChange}
                                        placeholder="09XX XXX XXXX"
                                        className={inputClass}
                                    />
                                </div>

                                <div>
                                    <label className={labelClass}>Monthly Income (PHP)</label>
                                    <input
                                        name="monthly_income"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={familyData.monthly_income}
                                        onChange={handleFamilyChange}
                                        placeholder="Leave blank if unknown"
                                        className={inputClass}
                                    />
                                    <p className={`mt-1 text-xs ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                                        NCR poverty threshold: ₱12,082/month. Affects priority score.
                                    </p>
                                </div>

                                <div className="md:col-span-2">
                                    <label className={labelClass}>Food Assistance Program Enrollment</label>
                                    <p className={`mb-2 text-xs ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                                        Select all programs this family is currently enrolled in.
                                    </p>
                                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                                        {FOOD_ASSISTANCE_OPTIONS.filter(opt => opt !== 'None').map((opt) => (
                                            <label
                                                key={opt}
                                                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm cursor-pointer transition ${familyData.food_assistance_status.includes(opt)
                                                        ? isDarkMode
                                                            ? 'border-blue-500 bg-blue-500/10 text-blue-300'
                                                            : 'border-blue-500 bg-blue-50 text-blue-700'
                                                        : isDarkMode
                                                            ? 'border-white/10 bg-[#0b1220] text-slate-300 hover:border-white/20'
                                                            : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300'
                                                    }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={familyData.food_assistance_status.includes(opt)}
                                                    onChange={() => handleAssistanceToggle(opt)}
                                                    className="sr-only"
                                                />
                                                <span className={`h-4 w-4 rounded border flex items-center justify-center flex-shrink-0 ${familyData.food_assistance_status.includes(opt)
                                                        ? 'bg-blue-500 border-blue-500'
                                                        : isDarkMode
                                                            ? 'border-slate-600'
                                                            : 'border-slate-300'
                                                    }`}>
                                                    {familyData.food_assistance_status.includes(opt) && (
                                                        <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    )}
                                                </span>
                                                {opt}
                                            </label>
                                        ))}
                                    </div>
                                    {familyData.food_assistance_status.length === 0 && (
                                        <p className={`mt-1.5 text-xs ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                                            No program selected — family will be marked as not enrolled in any assistance program.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* ── Family Members ── */}
                        <div className={cardClass}>
                            <div className="flex items-center justify-between mb-5">
                                <div>
                                    <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                                        Family Members
                                    </h3>
                                    <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                        At least one member required. Nutritional status affects priority score.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={addMember}
                                    className="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 transition"
                                >
                                    <UserPlus size={15} />
                                    Add Member
                                </button>
                            </div>

                            <div className="space-y-5">
                                {members.map((member, index) => (
                                    <div
                                        key={index}
                                        className={`rounded-xl border p-4 ${isDarkMode ? 'border-white/10 bg-[#0b1220]' : 'border-slate-100 bg-slate-50'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <p className={`text-xs font-semibold uppercase tracking-wide ${isDarkMode ? 'text-slate-400' : 'text-slate-500'
                                                    }`}>
                                                    Member {index + 1}
                                                </p>
                                                {member.relationship === 'Head' && (
                                                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700">
                                                        Head of Family
                                                    </span>
                                                )}
                                            </div>
                                            {members.length > 1 ? (
                                                <button
                                                    type="button"
                                                    onClick={() => removeMember(index)}
                                                    className="text-red-400 hover:text-red-600 transition"
                                                    aria-label="Remove member"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            ) : null}
                                        </div>

                                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                            <div>
                                                <label className={labelClass}>First Name *</label>
                                                <input
                                                    name="first_name"
                                                    value={member.first_name}
                                                    onChange={(e) => handleMemberChange(index, e)}
                                                    required
                                                    placeholder="First name"
                                                    className={inputClass}
                                                />
                                            </div>

                                            <div>
                                                <label className={labelClass}>Last Name *</label>
                                                <input
                                                    name="last_name"
                                                    value={member.last_name}
                                                    onChange={(e) => handleMemberChange(index, e)}
                                                    required
                                                    placeholder="Last name"
                                                    className={inputClass}
                                                />
                                            </div>

                                            <div>
                                                <label className={labelClass}>Date of Birth</label>
                                                <input
                                                    name="date_of_birth"
                                                    type="date"
                                                    value={member.date_of_birth}
                                                    onChange={(e) => handleMemberChange(index, e)}
                                                    className={inputClass}
                                                />
                                            </div>

                                            <div>
                                                <label className={labelClass}>Height (cm)</label>
                                                <input
                                                    name="height_cm"
                                                    type="number"
                                                    min="30"
                                                    max="250"
                                                    step="0.1"
                                                    value={member.height_cm}
                                                    onChange={(e) => handleMemberChange(index, e)}
                                                    placeholder="e.g. 165"
                                                    className={inputClass}
                                                />
                                            </div>

                                            <div>
                                                <label className={labelClass}>Weight (kg)</label>
                                                <input
                                                    name="weight_kg"
                                                    type="number"
                                                    min="1"
                                                    max="300"
                                                    step="0.1"
                                                    value={member.weight_kg}
                                                    onChange={(e) => handleMemberChange(index, e)}
                                                    placeholder="e.g. 55"
                                                    className={inputClass}
                                                />
                                            </div>

                                            <div>
                                                <label className={labelClass}>Gender *</label>
                                                <select
                                                    name="gender"
                                                    value={member.gender}
                                                    onChange={(e) => handleMemberChange(index, e)}
                                                    className={inputClass}
                                                >
                                                    <option value="Male">Male</option>
                                                    <option value="Female">Female</option>
                                                    <option value="Other">Other</option>
                                                </select>
                                            </div>

                                            {member._bmi ? (
                                                <div className={`sm:col-span-2 lg:col-span-3 rounded-lg px-3 py-2 text-xs ${isDarkMode ? 'bg-blue-500/10 text-blue-300' : 'bg-blue-50 text-blue-700'
                                                    }`}>
                                                    <span className="font-semibold">BMI: {member._bmi}</span>
                                                    {member.date_of_birth && (
                                                        <span className="ml-2 opacity-75">
                                                            ({getAgeInYears(member.date_of_birth) < 5
                                                                ? 'Under-5 classification'
                                                                : getAgeInYears(member.date_of_birth) < 18
                                                                    ? 'Adolescent classification'
                                                                    : 'Adult/Asian cutoff classification'})
                                                        </span>
                                                    )}
                                                    <span className="ml-2">— Nutritional status auto-set. You may override if needed.</span>
                                                </div>
                                            ) : null}

                                            <div>
                                                <label className={labelClass}>Relationship</label>
                                                <select
                                                    name="relationship"
                                                    value={member.relationship}
                                                    onChange={(e) => handleMemberChange(index, e)}
                                                    className={inputClass}
                                                >
                                                    {RELATIONSHIP_OPTIONS.map((r) => (
                                                        <option key={r} value={r}>{r}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label className={labelClass}>Nutritional Status</label>
                                                <select
                                                    name="nutritional_status"
                                                    value={member.nutritional_status}
                                                    onChange={(e) => handleMemberChange(index, e)}
                                                    className={inputClass}
                                                >
                                                    {NUTRITIONAL_OPTIONS.map((n) => (
                                                        <option key={n} value={n}>{n}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="sm:col-span-2 lg:col-span-3">
                                                <label className="flex items-center gap-2 text-sm cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        name="is_pwd"
                                                        checked={member.is_pwd}
                                                        onChange={(e) => handleMemberChange(index, e)}
                                                        className="rounded"
                                                    />
                                                    <span className={isDarkMode ? 'text-slate-300' : 'text-slate-600'}>
                                                        Person with Disability (PWD)
                                                    </span>
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* ── Submit ── */}
                        <div className="flex items-center gap-4 pb-8">
                            <button
                                type="submit"
                                disabled={submitting}
                                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-6 py-3 rounded-xl text-sm font-semibold transition"
                            >
                                <UserPlus size={16} />
                                {submitting ? 'Registering...' : 'Register Family'}
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate('/admin/families')}
                                className={`px-6 py-3 rounded-xl text-sm font-semibold transition ${isDarkMode
                                        ? 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                                        : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                                    }`}
                            >
                                Cancel
                            </button>
                        </div>

                    </form>
                </div>
            </main>

            {/* Dark mode toggle */}
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

export default AddFamilyPage