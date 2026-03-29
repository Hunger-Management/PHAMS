import { Link } from 'react-router-dom'
import { useDarkMode } from '../hooks/useDarkMode'
import SiteHeader from '../components/SiteHeader'

function ContactPage() {
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
            Get In Touch
          </h2>
          <p className={`mt-4 leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
            Reach out to the Pateros Zero Hunger Management team for support, feedback, and coordination concerns.
          </p>

          <div className={`mt-6 space-y-2 text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
            <p>Email: support@pateros-zerohunger.gov.ph</p>
            <p>Phone: (02) 0000 0000</p>
            <p>Office: Pateros Municipal Hall</p>
          </div>

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

export default ContactPage
