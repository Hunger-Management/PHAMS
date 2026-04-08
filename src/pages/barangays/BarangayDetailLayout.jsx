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
    captain: 'Jose A. Egonia',
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
    captain: 'Angel O. Mallorca Jr.',
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
    captain: 'Alma R. Otero',
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
    captain: 'Violeta S. Lorenzo',
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
    captain: 'Maria Dolores R. Custodio ',
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
    captain: 'Beatriz J. Santos',
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
    captain: 'Arthur C. Cortez',
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
    captain: 'Eduardo G. Masinloc',
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
    captain: 'Richard R. Palican',
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
    { label: 'Individuals With Pending Assistance (IWPA)', value: profile.iwpaCount, icon: '⚠', iconBg: 'bg-amber-50 text-amber-600' },
    { label: 'Active Distributions', value: profile.activeDistributions, icon: '📦', iconBg: 'bg-emerald-50 text-emerald-600' },
    { label: 'Total Households', value: profile.households, icon: '↗', iconBg: 'bg-violet-50 text-violet-600' },
  ]

  const monthlyFamilies = [
    { month: 'Jan', value: 86 },
    { month: 'Feb', value: 93 },
    { month: 'Mar', value: 89 },
    { month: 'Apr', value: 96 },
    { month: 'May', value: 91 },
    { month: 'Jun', value: 88 },
  ]

  const assistanceTypes = [
    { label: 'Food Packs', value: 45, color: '#3b82f6' },
    { label: 'Rice Distribution', value: 30, color: '#f59e0b' },
    { label: 'Cash Assistance', value: 15, color: '#10b981' },
    { label: 'Medical', value: 10, color: '#6366f1' },
  ]

  const recentActivities = [
    { title: 'Food Pack Distribution', detail: 'Distributed to 50 families - 2 days ago', color: 'bg-blue-500' },
    { title: 'Rice Allocation Received', detail: '100 sacks received from municipal - 5 days ago', color: 'bg-emerald-500' },
    { title: 'New Family Registrations', detail: '8 new families registered - 1 week ago', color: 'bg-amber-500' },
  ]

  const inventoryItems = [
    { label: 'Rice (Sacks)', value: '45' },
    { label: 'Canned Goods', value: '320 units' },
    { label: 'Instant Noodles', value: '150 packs' },
    { label: 'Hygiene Kits', value: '80 sets' },
  ]

  const pieSegments = assistanceTypes
    .map((item, index) => {
      const start = assistanceTypes.slice(0, index).reduce((sum, current) => sum + current.value, 0)
      const end = start + item.value
      return `${item.color} ${start}% ${end}%`
    })
    .join(', ')

  return (
    <main className={`min-h-screen transition-colors ${
      isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-[#eaf1ef] text-slate-900'
    }`}>
      <SiteHeader isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />

      <section className="mx-auto w-[95%] max-w-7xl py-5 md:py-6 lg:py-8">
        <article className={`rounded-2xl p-5 sm:p-6 md:p-8 lg:p-10 shadow-lg transition-colors ${
          isDarkMode
            ? 'bg-gradient-to-r from-gray-900 to-blue-700'
            : 'bg-gradient-to-r from-blue-600 to-blue-800'
        }`}>
          <div className="flex flex-col gap-5 md:gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <h2
                className="font-display text-2xl sm:text-3xl md:text-5xl font-bold text-white"
              >
                Barangay {barangayName}
              </h2>
              <p className="mt-3 md:mt-4 max-w-3xl text-base sm:text-lg leading-relaxed text-blue-100">
                {profile.description}
              </p>

              <div className="mt-4 md:mt-6 flex flex-wrap items-center gap-x-4 md:gap-x-6 gap-y-2 text-blue-100">
                <p className="text-base sm:text-lg">👥 {profile.residents} residents</p>
                <p className="text-base sm:text-lg">📍 {profile.households} households</p>
              </div>
            </div>

            <aside className="w-full max-w-sm rounded-xl border border-white/20 bg-white/10 p-4 md:p-5 backdrop-blur-sm">
              <p className="text-sm font-semibold tracking-wide text-blue-100">Barangay Captain</p>
              <p className="font-display mt-2 text-2xl sm:text-3xl font-bold text-white">
                {profile.captain}
              </p>
              <p className="mt-4 text-base sm:text-lg text-blue-100">📞 {profile.phone}</p>
              <p className="mt-2 text-base sm:text-lg text-blue-100">✉ {profile.email}</p>
            </aside>
          </div>
        </article>

        <div className="mt-5 md:mt-6 grid grid-cols-1 gap-3 md:gap-4 md:grid-cols-2 xl:grid-cols-4">
          {statCards.map((card) => (
            <article
              key={card.label}
              className={`rounded-2xl border p-5 md:p-6 shadow-sm transition-colors ${
                isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'
              }`}
            >
              <div className={`mb-3 md:mb-4 inline-flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-xl text-xl sm:text-2xl ${card.iconBg}`}>
                {card.icon}
              </div>
              <p className={`text-lg sm:text-xl md:text-2xl font-semibold ${isDarkMode ? 'text-slate-200' : 'text-slate-600'}`}>{card.label}</p>
              <p
                className={`font-display mt-2 text-3xl sm:text-4xl md:text-5xl font-bold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}
              >
                {card.value}
              </p>
            </article>
          ))}
        </div>

        <div className="mt-5 md:mt-6 grid grid-cols-1 gap-3 md:gap-4 xl:grid-cols-2">
          <article className={`rounded-2xl border p-5 md:p-6 shadow-sm transition-colors ${
            isDarkMode ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'
          }`}>
            <h3 className="font-display text-2xl sm:text-3xl font-bold">Monthly Families Assisted</h3>
            <p className={`mt-1 text-base sm:text-lg ${isDarkMode ? 'text-slate-300' : 'text-slate-500'}`}>
              Number of families receiving assistance per month
            </p>

            <div className="mt-6 md:mt-8">
              <div className="grid grid-cols-6 items-end gap-3 sm:gap-4 md:gap-5">
                {monthlyFamilies.map((entry) => (
                  <div key={entry.month} className="flex flex-col items-center gap-2">
                    <div className={`flex h-44 sm:h-52 md:h-56 w-full items-end rounded-xl ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
                      <div
                        className="w-full rounded-xl bg-blue-500"
                        style={{ height: `${entry.value}%` }}
                      />
                    </div>
                    <p className={`text-sm sm:text-base font-semibold ${isDarkMode ? 'text-slate-300' : 'text-slate-500'}`}>{entry.month}</p>
                  </div>
                ))}
              </div>
            </div>
          </article>

          <article className={`rounded-2xl border p-5 md:p-6 shadow-sm transition-colors ${
            isDarkMode ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'
          }`}>
            <h3 className="font-display text-2xl sm:text-3xl font-bold">Assistance Types</h3>
            <p className={`mt-1 text-base sm:text-lg ${isDarkMode ? 'text-slate-300' : 'text-slate-500'}`}>Distribution breakdown</p>

            <div className="mt-6 md:mt-8 flex flex-col items-center justify-center gap-5 md:gap-6 lg:flex-row">
              <div
                className="h-56 w-56 rounded-full border"
                style={{
                  background: `conic-gradient(${pieSegments})`,
                  borderColor: isDarkMode ? '#334155' : '#cbd5e1',
                }}
              />
              <div className="w-full space-y-2 md:space-y-3">
                {assistanceTypes.map((item) => (
                  <div key={item.label} className="flex items-center justify-between rounded-lg px-3 py-2" style={{ backgroundColor: isDarkMode ? '#0f172a' : '#f8fafc' }}>
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className={`font-semibold ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>{item.label}</span>
                    </div>
                    <span className={`font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </article>

          <article className={`rounded-2xl border p-5 md:p-6 shadow-sm transition-colors ${
            isDarkMode ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl text-xl ${
                isDarkMode ? 'bg-blue-900/40 text-blue-300' : 'bg-blue-100 text-blue-600'
              }`}>
                📅
              </div>
              <h3 className="font-display text-2xl sm:text-3xl font-bold">Recent Activities</h3>
            </div>

            <div className="mt-5 md:mt-6 space-y-2.5 md:space-y-3">
              {recentActivities.map((activity) => (
                <div
                  key={activity.title}
                  className={`rounded-xl border p-3.5 md:p-4 ${
                    isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-slate-100 bg-slate-50'
                  }`}
                >
                  <div className="flex items-start gap-2.5 md:gap-3">
                    <span className={`mt-2 h-2.5 w-2.5 rounded-full ${activity.color}`} />
                    <div>
                      <p className={`text-lg sm:text-xl md:text-2xl font-semibold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>{activity.title}</p>
                      <p className={`text-sm sm:text-base ${isDarkMode ? 'text-slate-300' : 'text-slate-500'}`}>{activity.detail}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className={`rounded-2xl border p-5 md:p-6 shadow-sm transition-colors ${
            isDarkMode ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl text-xl ${
                isDarkMode ? 'bg-emerald-900/40 text-emerald-300' : 'bg-emerald-100 text-emerald-600'
              }`}>
                📦
              </div>
              <h3 className="font-display text-2xl sm:text-3xl font-bold">Current Inventory</h3>
            </div>

            <div className="mt-5 md:mt-6 space-y-2.5 md:space-y-3">
              {inventoryItems.map((item) => (
                <div
                  key={item.label}
                  className={`flex items-center justify-between rounded-xl border px-3 py-2.5 md:px-4 md:py-3 ${
                    isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-slate-100 bg-slate-50'
                  }`}
                >
                  <p className={`text-lg sm:text-xl md:text-2xl font-semibold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>{item.label}</p>
                  <p className={`font-display text-lg sm:text-xl md:text-2xl font-bold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>{item.value}</p>
                </div>
              ))}
            </div>
          </article>
        </div>
      </section>
    </main>
  )
}

export default BarangayDetailLayout
