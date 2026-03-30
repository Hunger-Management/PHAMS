import { Link } from 'react-router-dom'
import { useDarkMode } from '../../hooks/useDarkMode'
import SiteHeader from '../../components/SiteHeader'

const barangayProfiles = {
  Aguho: {
    description: 'A vibrant community known for its close-knit families and active participation in local programs.',
    residents: '4,250',
    households: '1,180',
    registeredFamilies: '890',
    iwpaCount: '45',
    activeDistributions: '12',
    captain: 'Joven Gatpayat',
    phone: '+63 917 123 4567',
    email: 'aguho@pateros.gov.ph',
  },
  Magtanggol: {
    description: 'A highly coordinated barangay with strong volunteer support and consistent food assistance outreach.',
    residents: '3,980',
    households: '1,070',
    registeredFamilies: '842',
    iwpaCount: '39',
    activeDistributions: '10',
    captain: 'Jun Egonia',
    phone: '+63 917 210 1134',
    email: 'magtanggol@pateros.gov.ph',
  },
  "Martires del '96": {
    description: 'A heritage-focused barangay balancing community growth with responsive social welfare services.',
    residents: '3,510',
    households: '960',
    registeredFamilies: '765',
    iwpaCount: '33',
    activeDistributions: '9',
    captain: 'Boyet Mallorca',
    phone: '+63 917 318 4472',
    email: 'martires96@pateros.gov.ph',
  },
  Poblacion: {
    description: 'The central barangay with dense residential zones and frequent delivery coordination requirements.',
    residents: '5,120',
    households: '1,420',
    registeredFamilies: '1,030',
    iwpaCount: '58',
    activeDistributions: '15',
    captain: 'Leah Mendoza',
    phone: '+63 917 421 8821',
    email: 'poblacion@pateros.gov.ph',
  },
  'San Pedro': {
    description: 'A barangay with growing family registrations and steady collaboration with civic partner groups.',
    residents: '4,030',
    households: '1,120',
    registeredFamilies: '856',
    iwpaCount: '41',
    activeDistributions: '11',
    captain: 'Nestor Flores',
    phone: '+63 917 502 3175',
    email: 'sanpedro@pateros.gov.ph',
  },
  'San Roque': {
    description: 'A resilient and organized barangay with focused support for senior citizens and low-income families.',
    residents: '4,410',
    households: '1,230',
    registeredFamilies: '904',
    iwpaCount: '46',
    activeDistributions: '13',
    captain: 'Carmela Reyes',
    phone: '+63 917 640 9913',
    email: 'sanroque@pateros.gov.ph',
  },
  'Santa Ana': {
    description: 'A community-driven barangay with active youth participation and expanding household assistance records.',
    residents: '3,860',
    households: '1,040',
    registeredFamilies: '810',
    iwpaCount: '36',
    activeDistributions: '10',
    captain: 'Betty Santos',
    phone: '+63 917 712 4406',
    email: 'santaana@pateros.gov.ph',
  },
  'Santo Rosario-Kanluran': {
    description: 'A west-side district with efficient barangay workflows and responsive case tracking for food support.',
    residents: '3,740',
    households: '1,010',
    registeredFamilies: '788',
    iwpaCount: '34',
    activeDistributions: '9',
    captain: 'Arlene Co',
    phone: '+63 917 805 1239',
    email: 'srkanluran@pateros.gov.ph',
  },
  'Santo Rosario-Silangan': {
    description: 'An east-side barangay emphasizing rapid response and transparent records for distribution operations.',
    residents: '3,920',
    households: '1,090',
    registeredFamilies: '825',
    iwpaCount: '38',
    activeDistributions: '11',
    captain: 'Dennis Aquino',
    phone: '+63 917 866 2721',
    email: 'srsilangan@pateros.gov.ph',
  },
  Tabacalera: {
    description: 'A densely settled barangay with strong neighborhood networks and reliable logistics coordination.',
    residents: '4,180',
    households: '1,150',
    registeredFamilies: '870',
    iwpaCount: '44',
    activeDistributions: '12',
    captain: 'Helen Bautista',
    phone: '+63 917 932 5510',
    email: 'tabacalera@pateros.gov.ph',
  },
}

function BarangayDetailLayout({ barangayName }) {
  const { isDarkMode, toggleDarkMode } = useDarkMode()
  const profile = barangayProfiles[barangayName] ?? {
    description: `Community profile for ${barangayName}.`,
    residents: '0',
    households: '0',
    registeredFamilies: '0',
    iwpaCount: '0',
    activeDistributions: '0',
    captain: 'To Be Assigned',
    phone: '+63 900 000 0000',
    email: 'barangay@pateros.gov.ph',
  }

  const statCards = [
    { label: 'Registered Families', value: profile.registeredFamilies, icon: '👥', iconBg: 'bg-blue-50 text-blue-600' },
    { label: 'IWPA Count', value: profile.iwpaCount, icon: '⚠', iconBg: 'bg-amber-50 text-amber-600' },
    { label: 'Active Distributions', value: profile.activeDistributions, icon: '📦', iconBg: 'bg-emerald-50 text-emerald-600' },
    { label: 'Total Households', value: profile.households, icon: '↗', iconBg: 'bg-violet-50 text-violet-600' },
  ]

  return (
    <main className={`min-h-screen transition-colors ${
      isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-[#eaf1ef] text-slate-900'
    }`}>
      <SiteHeader isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />

      <section className="mx-auto w-[95%] max-w-7xl py-6 md:py-8">
        <article className={`rounded-2xl p-6 md:p-10 shadow-lg transition-colors ${
          isDarkMode
            ? 'bg-gradient-to-r from-gray-900 to-blue-700'
            : 'bg-gradient-to-r from-blue-600 to-blue-800'
        }`}>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <h2
                className="text-3xl md:text-5xl font-black text-white"
                style={{ fontFamily: 'Arial Black, Trebuchet MS, sans-serif' }}
              >
                Barangay {barangayName}
              </h2>
              <p className="mt-4 max-w-3xl text-lg leading-relaxed text-blue-100">
                {profile.description}
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-blue-100">
                <p className="text-lg">👥 {profile.residents} residents</p>
                <p className="text-lg">📍 {profile.households} households</p>
              </div>
            </div>

            <aside className="w-full max-w-sm rounded-xl border border-white/20 bg-white/10 p-5 backdrop-blur-sm">
              <p className="text-sm font-semibold tracking-wide text-blue-100">Barangay Captain</p>
              <p className="mt-2 text-3xl font-black text-white" style={{ fontFamily: 'Arial Black, Trebuchet MS, sans-serif' }}>
                {profile.captain}
              </p>
              <p className="mt-4 text-lg text-blue-100">📞 {profile.phone}</p>
              <p className="mt-2 text-lg text-blue-100">✉ {profile.email}</p>
            </aside>
          </div>
        </article>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {statCards.map((card) => (
            <article
              key={card.label}
              className={`rounded-2xl border p-6 shadow-sm transition-colors ${
                isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'
              }`}
            >
              <div className={`mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl text-2xl ${card.iconBg}`}>
                {card.icon}
              </div>
              <p className={`text-2xl font-semibold ${isDarkMode ? 'text-slate-200' : 'text-slate-600'}`}>{card.label}</p>
              <p
                className={`mt-2 text-5xl font-black ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}
                style={{ fontFamily: 'Arial Black, Trebuchet MS, sans-serif' }}
              >
                {card.value}
              </p>
            </article>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to="/barangays"
            className={`inline-flex items-center rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
              isDarkMode ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-slate-200 text-slate-900 hover:bg-slate-300'
            }`}
          >
            Back To Barangays
          </Link>
          <Link
            to="/"
            className={`inline-flex items-center rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
              isDarkMode ? 'bg-blue-700 text-white hover:bg-blue-600' : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            Back To Home
          </Link>
        </div>
      </section>
    </main>
  )
}

export default BarangayDetailLayout
