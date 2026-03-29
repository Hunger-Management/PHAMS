import { Link } from 'react-router-dom'
import { useDarkMode } from '../hooks/useDarkMode'
import SiteHeader from '../components/SiteHeader'

function BarangaysPage() {
  const { isDarkMode, toggleDarkMode } = useDarkMode()

  return (
    <main className={`min-h-screen transition-colors ${
      isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-[#eaf1ef] text-slate-900'
    }`}>
      <SiteHeader isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />

      <section className="mx-auto w-[95%] max-w-4xl py-10 md:py-14">
        <article className={`rounded-2xl border p-6 md:p-8 shadow-sm transition-colors ${
          isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'
        }`}>
          <h2 className="text-2xl md:text-3xl font-extrabold" style={{ fontFamily: 'Arial Black, Trebuchet MS, sans-serif' }}>
            Barangay Coordination
          </h2>
          <p className={`mt-4 leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
            View barangay-level records, monitor food supply requests, and track assistance distribution across local areas.
          </p>

          <div className="mt-6">
            <Link
              to="/"
              className={`inline-flex items-center rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
                isDarkMode ? 'bg-blue-700 text-white hover:bg-blue-600' : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              Back To Home
            </Link>
          </div>
        </article>
      </section>
    </main>
  )
}

export default BarangaysPage
