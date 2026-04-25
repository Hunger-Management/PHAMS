import { useState } from 'react'
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
    '4Ps', 'Solo Parent', 'PWD', 'Senior Citizen', 'Pregnant/Lactating', 'None'
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
        food_assistance_status: 'None',
    })

    const [members, setMembers] = useState([emptyMember()])

    // ── Family field handlers ────────────────────────────────
    const handleFamilyChange = (e) => {
        const { name, value, type, checked } = e.target
        setFamilyData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }))
    }

    // ── Member field handlers ────────────────────────────────
    const handleMemberChange = (index, e) => {
        const { name, value, type, checked } = e.target
        setMembers((prev) =>
            prev.map((m, i) =>
                i === index
                    ? { ...m, [name]: type === 'checkbox' ? checked : value }
                    : m
            )
        )
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
                members: members.map((m) => ({
                    ...m,
                    is_pwd: m.is_pwd ? 1 : 0,
                    date_of_birth: m.date_of_birth || null,
                })),
            }

            const data = await apiFetch('/api/families', {
                method: 'POST',
                body: JSON.stringify(payload),
            })

            setSuccessMessage(
                `Family "${familyData.family_name}" registered successfully (ID: ${data.family_id}).`
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
                food_assistance_status: 'None',
            })
            setMembers([emptyMember()])

            // Scroll to top to show success message
            window.scrollTo({ top: 0, behavior: 'smooth' })

        } catch (err) {
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

    return (
        <div className={`flex min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-[#0b1220] text-slate-100' : 'bg-[#e5e7eb] text-slate-900'
            }`}>
            <AdminSidebar isDarkMode={isDarkMode} />

            <main className="flex-1 p-8 overflow-auto">
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
                                </div>

                                <div>
                                    <label className={labelClass}>Food Assistance Status</label>
                                    <select
                                        name="food_assistance_status"
                                        value={familyData.food_assistance_status}
                                        onChange={handleFamilyChange}
                                        className={inputClass}
                                    >
                                        {FOOD_ASSISTANCE_OPTIONS.map((opt) => (
                                            <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                    </select>
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
                                            <p className={`text-xs font-semibold uppercase tracking-wide ${isDarkMode ? 'text-slate-400' : 'text-slate-500'
                                                }`}>
                                                Member {index + 1}
                                            </p>
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