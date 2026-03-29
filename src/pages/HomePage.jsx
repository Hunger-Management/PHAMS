const stats = [
  { label: 'Total Registered Families', value: '2,186', icon: '👥' },
  { label: '4Ps (No Permanent Address)', value: '243', icon: '📍' },
  { label: 'Active Food Supply (Tons)', value: '87', icon: '📦' },
  { label: 'Pending Distributions', value: '29', icon: '🚚' },
]

const chartMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul']

const priorityAreas = [
  { name: 'Sto. Rosario', width: '72%' },
  { name: 'Aguho', width: '54%' },
  { name: 'San Roque', width: '49%' },
  { name: 'Santa Ana', width: '37%' },
  { name: 'San Pedro', width: '32%' },
]

const recentActivities = [
  {
    type: 'Distribution',
    description: 'Food packs delivered to Aguho',
    time: '2 hours ago',
    status: 'Completed',
  },
  {
    type: 'Donation',
    description: 'Received 50 sacks of rice from Red Cross',
    time: '4 hours ago',
    status: 'Received',
  },
  {
    type: 'Registration',
    description: '12 new families registered in Sto. Rosario',
    time: 'Yesterday',
    status: 'Processed',
  },
  {
    type: 'Distribution',
    description: 'Pending delivery to San Roque',
    time: 'Yesterday',
    status: 'Pending',
  },
]

import { useDarkMode } from '../hooks/useDarkMode'
import Footer from '../components/Footer'
import SiteHeader from '../components/SiteHeader'

const statusClassMap = {
  Completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  Received: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
  Processed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  Pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
}

function HomePage() {
  const { isDarkMode, toggleDarkMode } = useDarkMode()
  return (
    <main className={`min-h-screen transition-colors ${
      isDarkMode ? 'bg-slate-950 text-slate-50' : 'bg-[#eaf1ef] text-slate-900'
    }`}>
      <SiteHeader isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />

      <section className="mx-auto w-[95%] max-w-7xl py-5 md:py-6">
        <div className={`relative overflow-hidden rounded-xl border shadow-lg transition-colors ${
          isDarkMode ? 'border-slate-700 shadow-slate-900' : 'border-slate-300 shadow-lg'
        }`}>
          <img
            src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1600&q=80"
            alt="Community distribution market"
            className="h-[280px] md:h-[420px] w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/72 via-slate-900/25 to-transparent" />
          <div className="absolute bottom-0 left-0 p-5 md:p-7 max-w-2xl text-white">
            <h2
              className="text-3xl md:text-5xl font-black leading-[1.05]"
              style={{ fontFamily: 'Arial Black, Trebuchet MS, sans-serif' }}
            >
              Pateros Zero Hunger Management
            </h2>
            <p className="mt-2 md:mt-3 text-sm md:text-lg text-slate-100">
              Empowering communities, ensuring food security, and supporting our citizens.
            </p>
          </div>
        </div>

        <div className="flex justify-center gap-2 py-3">
          <span className={`h-1.5 w-1.5 rounded-full transition-colors ${
            isDarkMode ? 'bg-slate-600' : 'bg-slate-400'
          }`} />
          <span className={`h-1.5 w-1.5 rounded-full transition-colors ${
            isDarkMode ? 'bg-slate-700' : 'bg-slate-300'
          }`} />
          <span className={`h-1.5 w-1.5 rounded-full transition-colors ${
            isDarkMode ? 'bg-slate-700' : 'bg-slate-300'
          }`} />
          <span className={`h-1.5 w-1.5 rounded-full transition-colors ${
            isDarkMode ? 'bg-slate-700' : 'bg-slate-300'
          }`} />
        </div>
      </section>

      <section className="mx-auto w-[95%] max-w-7xl pb-10 md:pb-12">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3
              className={`text-2xl font-extrabold transition-colors ${
                isDarkMode ? 'text-slate-100' : 'text-slate-900'
              }`}
              style={{ fontFamily: 'Arial Black, Trebuchet MS, sans-serif' }}
            >
              Dashboard Overview
            </h3>
            <p className={`text-xs mt-1 transition-colors ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Pateros Zero Hunger Management System</p>
          </div>

          <div className="flex items-center gap-2">
            <button className={`rounded-md border px-4 py-2 text-xs md:text-sm font-semibold transition-colors ${
              isDarkMode
                ? 'border-slate-600 bg-slate-800 text-slate-200 hover:bg-slate-700'
                : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
            }`}>
              Download Report
            </button>
            <button className={`rounded-md px-4 py-2 text-xs md:text-sm font-semibold text-white shadow transition-colors ${
              isDarkMode ? 'bg-blue-700 hover:bg-blue-600' : 'bg-blue-600 hover:bg-blue-700'
            }`}>
              New Distribution
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4">
          {stats.map((item) => (
            <article
              key={item.label}
              className={`rounded-xl border p-4 shadow-sm transition-colors ${
                isDarkMode
                  ? 'border-slate-700 bg-slate-800 '
                  : 'border-slate-200 bg-white'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className={`text-xs leading-snug transition-colors ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{item.label}</p>
                <span className={`h-8 w-8 rounded-lg grid place-items-center text-sm transition-colors ${
                  isDarkMode ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-50 text-blue-700'
                }`}>
                  {item.icon}
                </span>
              </div>
              <p
                className={`mt-4 text-3xl font-black transition-colors ${
                  isDarkMode ? 'text-slate-100' : 'text-slate-900'
                }`}
                style={{ fontFamily: 'Arial Black, Trebuchet MS, sans-serif' }}
              >
                {item.value}
              </p>
            </article>
          ))}
        </div>

        <div className="mt-5 grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-4">
          <article className={`rounded-2xl border p-4 md:p-6 shadow-sm transition-colors ${
            isDarkMode
              ? 'border-slate-700 bg-slate-800'
              : 'border-slate-200 bg-white'
          }`}>
            <div className="flex items-center justify-between gap-3">
              <h4
                className={`text-2xl font-extrabold transition-colors ${
                  isDarkMode ? 'text-slate-100' : 'text-slate-900'
                }`}
                style={{ fontFamily: 'Arial Black, Trebuchet MS, sans-serif' }}
              >
                Monthly Food Distribution
              </h4>
              <button className={`text-sm font-medium transition-colors ${
                isDarkMode ? 'text-slate-300 hover:text-slate-200' : 'text-slate-700 hover:text-slate-900'
              }`}>Last 6 Months ▾</button>
            </div>

            <div className={`mt-4 rounded-xl border p-3 md:p-4 transition-colors ${
              isDarkMode ? 'border-slate-700 bg-slate-900' : 'border-slate-100 bg-[#f9fcff]'
            }`}>
              <div className="h-[300px] md:h-[340px] w-full">
                <svg viewBox="0 0 860 340" className="h-full w-full" role="img" aria-label="Monthly food distribution line chart">
                  <g stroke="#e2e8f0" strokeDasharray="4 4">
                    <line x1="70" y1="35" x2="820" y2="35" />
                    <line x1="70" y1="95" x2="820" y2="95" />
                    <line x1="70" y1="155" x2="820" y2="155" />
                    <line x1="70" y1="215" x2="820" y2="215" />
                    <line x1="70" y1="275" x2="820" y2="275" />
                  </g>

                  <path
                    d="M70 35 C130 65, 180 95, 195 112 C235 155, 280 185, 320 150 C360 118, 405 95, 445 128 C485 165, 525 210, 565 208 C610 205, 660 185, 695 160 C735 132, 770 95, 820 62 L820 275 L70 275 Z"
                    fill="rgba(59,130,246,0.16)"
                  />
                  <path
                    d="M70 35 C130 65, 180 95, 195 112 C235 155, 280 185, 320 150 C360 118, 405 95, 445 128 C485 165, 525 210, 565 208 C610 205, 660 185, 695 160 C735 132, 770 95, 820 62"
                    stroke="#3b82f6"
                    strokeWidth="3"
                    fill="none"
                  />

                  <g fill="#64748b" fontSize="14" fontFamily="Trebuchet MS, Segoe UI, sans-serif">
                    <text x="62" y="279" textAnchor="end">0</text>
                    <text x="62" y="219" textAnchor="end">1000</text>
                    <text x="62" y="159" textAnchor="end">2000</text>
                    <text x="62" y="99" textAnchor="end">3000</text>
                    <text x="62" y="39" textAnchor="end">4000</text>
                  </g>

                  <g fill="#64748b" fontSize="14" fontFamily="Trebuchet MS, Segoe UI, sans-serif">
                    {chartMonths.map((month, index) => (
                      <text
                        key={month}
                        x={70 + ((820 - 70) / (chartMonths.length - 1)) * index}
                        y="315"
                        textAnchor="middle"
                      >
                        {month}
                      </text>
                    ))}
                  </g>
                </svg>
              </div>
            </div>
          </article>

          <article className={`rounded-2xl border p-4 md:p-6 shadow-sm transition-colors ${
            isDarkMode
              ? 'border-slate-700 bg-slate-800'
              : 'border-slate-200 bg-white'
          }`}>
            <h4
              className={`text-2xl font-extrabold transition-colors ${
                isDarkMode ? 'text-slate-100' : 'text-slate-900'
              }`}
              style={{ fontFamily: 'Arial Black, Trebuchet MS, sans-serif' }}
            >
              Priority Areas
            </h4>
            <p className={`mt-1 transition-colors ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Families needing assistance</p>

            <div className="mt-6 space-y-6">
              {priorityAreas.map((area) => (
                <div key={area.name} className="grid grid-cols-[80px_1fr] items-center gap-3">
                  <p className={`text-sm text-right leading-tight transition-colors ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{area.name}</p>
                  <div className={`h-9 w-full rounded-md border border-dashed p-1 transition-colors ${
                    isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div
                      className="h-full rounded bg-sky-500"
                      style={{ width: area.width }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </article>
        </div>

        <article className={`mt-4 rounded-2xl border shadow-sm overflow-hidden transition-colors ${
          isDarkMode
            ? 'border-slate-700 bg-slate-800'
            : 'border-slate-200 bg-white'
        }`}>
          <div className={`flex items-center justify-between gap-3 px-5 py-4 border-b transition-colors ${
            isDarkMode
              ? 'bg-slate-700/50 border-slate-700'
              : 'bg-slate-50 border-slate-200'
          }`}>
            <h4
              className={`text-2xl font-extrabold transition-colors ${
                isDarkMode ? 'text-slate-100' : 'text-slate-900'
              }`}
              style={{ fontFamily: 'Arial Black, Trebuchet MS, sans-serif' }}
            >
              Recent System Activity
            </h4>
            <a href="#" className={`text-sm font-semibold transition-colors ${
              isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
            }`}>View All</a>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead className={`border-b transition-colors ${
                isDarkMode ? 'bg-slate-700/50 border-slate-700' : 'bg-slate-100 border-slate-200'
              }`}>
                <tr className={`text-[11px] uppercase tracking-[0.08em] transition-colors ${
                  isDarkMode ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  <th className="px-5 py-3 font-semibold">Type</th>
                  <th className="px-5 py-3 font-semibold">Description</th>
                  <th className="px-5 py-3 font-semibold">Time</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentActivities.map((activity) => (
                  <tr key={`${activity.type}-${activity.description}`} className={`border-b last:border-b-0 transition-colors ${
                    isDarkMode ? 'border-slate-700 hover:bg-slate-700/50' : 'border-slate-200 hover:bg-slate-50'
                  }`}>
                    <td className={`px-5 py-3.5 font-semibold transition-colors ${
                      isDarkMode ? 'text-slate-200' : 'text-slate-900'
                    }`}>{activity.type}</td>
                    <td className={`px-5 py-3.5 transition-colors ${
                      isDarkMode ? 'text-slate-300' : 'text-slate-600'
                    }`}>{activity.description}</td>
                    <td className={`px-5 py-3.5 transition-colors ${
                      isDarkMode ? 'text-slate-400' : 'text-slate-500'
                    }`}>{activity.time}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClassMap[activity.status]}`}>
                        {activity.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </section>

      <Footer isDarkMode={isDarkMode} />
    </main>
  )
}

export default HomePage
