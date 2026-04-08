import { Link } from 'react-router-dom'
import { useDarkMode } from '../hooks/useDarkMode'
import SiteHeader from '../components/SiteHeader'

function AboutPage() {
  const { isDarkMode, toggleDarkMode } = useDarkMode()

  return (
    <main className={`min-h-screen transition-colors ${
      isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-[#eaf1ef] text-slate-900'
    }`}>
      <SiteHeader isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />

      <section className="mx-auto w-[95%] max-w-7xl py-10 md:py-14">
        <article className={`mb-6 md:mb-8 rounded-2xl border p-6 md:p-8 shadow-sm transition-colors ${
          isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'
        }`}>
          <h2
            className={`text-2xl md:text-3xl font-extrabold ${isDarkMode ? 'text-slate-100' : 'text-[#011d49]'}`}
            style={{ fontFamily: 'Arial Black, Trebuchet MS, sans-serif' }}
          >
            About Pateros Zero Hunger Management System
          </h2>
          <p className={`mt-4 text-base md:text-lg leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
            The Pateros Zero Hunger Management System is dedicated to helping families access timely food assistance through organized operations,
            transparent reporting, and collaboration with local barangays and partner institutions.
          </p>
        </article>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          <article className={`rounded-3xl border p-8 md:p-9 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
            isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'
          }`}>
            <div className={`mx-auto h-20 w-20 rounded-full grid place-items-center ${
              isDarkMode ? 'bg-emerald-900/30' : 'bg-emerald-100'
            }`}>
              <svg viewBox="0 0 24 24" className="h-9 w-9" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="12" cy="12" r="7" className={isDarkMode ? 'text-emerald-300' : 'text-emerald-600'} />
                <circle cx="12" cy="12" r="3" className={isDarkMode ? 'text-emerald-300' : 'text-emerald-600'} />
                <circle cx="12" cy="12" r="1" className={isDarkMode ? 'text-emerald-300' : 'text-emerald-600'} fill="currentColor" />
              </svg>
            </div>
            <h2 className={`mt-7 text-3xl md:text-4xl font-black ${isDarkMode ? 'text-slate-100' : 'text-[#011d49]'}`} style={{ fontFamily: 'Arial Black, Trebuchet MS, sans-serif' }}>
              Our Mission
            </h2>
            <p className={`mt-10 text-lg md:text-xl leading-[1.55] ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`} style={{ fontFamily: 'Trebuchet MS, Segoe UI, sans-serif' }}>
              To eliminate hunger in our community through transparent resource management, efficient distribution, and collaborative community engagement.
            </p>
          </article>

          <article className={`rounded-3xl border p-8 md:p-9 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
            isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'
          }`}>
            <div className={`mx-auto h-20 w-20 rounded-full grid place-items-center ${
              isDarkMode ? 'bg-amber-900/30' : 'bg-amber-100'
            }`}>
              <svg viewBox="0 0 24 24" className={`h-9 w-9 ${isDarkMode ? 'text-amber-300' : 'text-orange-600'}`} fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </div>
            <h2 className={`mt-7 text-3xl md:text-4xl font-black ${isDarkMode ? 'text-slate-100' : 'text-[#011d49]'}`} style={{ fontFamily: 'Arial Black, Trebuchet MS, sans-serif' }}>
              Our Vision
            </h2>
            <p className={`mt-10 text-lg md:text-xl leading-[1.55] ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`} style={{ fontFamily: 'Trebuchet MS, Segoe UI, sans-serif' }}>
              A community where every individual has access to nutritious food, and hunger is no longer a barrier to health and prosperity.
            </p>
          </article>

          <article className={`rounded-3xl border p-8 md:p-9 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
            isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'
          }`}>
            <div className={`mx-auto h-20 w-20 rounded-full grid place-items-center ${
              isDarkMode ? 'bg-blue-900/30' : 'bg-blue-100'
            }`}>
              <svg viewBox="0 0 24 24" className={`h-9 w-9 ${isDarkMode ? 'text-blue-300' : 'text-blue-600'}`} fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M12 21s-7.5-4.3-7.5-10A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 7.5 4c0 5.7-7.5 10-7.5 10z" />
              </svg>
            </div>
            <h2 className={`mt-7 text-3xl md:text-4xl font-black ${isDarkMode ? 'text-slate-100' : 'text-[#011d49]'}`} style={{ fontFamily: 'Arial Black, Trebuchet MS, sans-serif' }}>
              Our Values
            </h2>
            <p className={`mt-10 text-lg md:text-xl leading-[1.55] ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`} style={{ fontFamily: 'Trebuchet MS, Segoe UI, sans-serif' }}>
              Transparency, compassion, efficiency, and community empowerment guide every decision we make in our hunger relief efforts.
            </p>
          </article>
        </div>

        <article className={`mt-8 md:mt-10 rounded-3xl border p-6 md:p-10 shadow-sm transition-colors ${
          isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'
        }`}>
          <h3
            className={`text-center text-4xl md:text-5xl font-black ${isDarkMode ? 'text-slate-100' : 'text-[#011d49]'}`}
            style={{ fontFamily: 'Arial Black, Trebuchet MS, sans-serif' }}
          >
            Our Approach
          </h3>

          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-x-10 gap-y-7">
            <div className="flex items-start gap-4">
              <div className={`h-16 w-16 rounded-2xl grid place-items-center ${isDarkMode ? 'bg-emerald-900/30' : 'bg-emerald-100'}`}>
                <svg viewBox="0 0 24 24" className={`h-8 w-8 ${isDarkMode ? 'text-emerald-300' : 'text-emerald-600'}`} fill="none" stroke="currentColor" strokeWidth="1.8">
                  <circle cx="9" cy="8" r="3" />
                  <path d="M3 19a6 6 0 0 1 12 0" />
                  <path d="M16 7h4m-2-2v4" />
                </svg>
              </div>
              <div>
                <h4 className={`text-2xl font-black ${isDarkMode ? 'text-slate-100' : 'text-[#011d49]'}`} style={{ fontFamily: 'Arial Black, Trebuchet MS, sans-serif' }}>
                  Community-Centered
                </h4>
                <p className={`mt-2 text-lg leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                  We work directly with barangays to understand local needs and ensure resources reach those who need them most.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className={`h-16 w-16 rounded-2xl grid place-items-center ${isDarkMode ? 'bg-blue-900/30' : 'bg-blue-100'}`}>
                <svg viewBox="0 0 24 24" className={`h-8 w-8 ${isDarkMode ? 'text-blue-300' : 'text-blue-600'}`} fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M12 3l7 3v6c0 5-3.5 8-7 9-3.5-1-7-4-7-9V6l7-3z" />
                </svg>
              </div>
              <div>
                <h4 className={`text-2xl font-black ${isDarkMode ? 'text-slate-100' : 'text-[#011d49]'}`} style={{ fontFamily: 'Arial Black, Trebuchet MS, sans-serif' }}>
                  Transparent Operations
                </h4>
                <p className={`mt-2 text-lg leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                  Every transaction and distribution is tracked and publicly available to ensure accountability and trust.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className={`h-16 w-16 rounded-2xl grid place-items-center ${isDarkMode ? 'bg-amber-900/30' : 'bg-amber-100'}`}>
                <svg viewBox="0 0 24 24" className={`h-8 w-8 ${isDarkMode ? 'text-amber-300' : 'text-orange-600'}`} fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M4 16l5-5 4 4 7-7" />
                  <path d="M16 8h4v4" />
                </svg>
              </div>
              <div>
                <h4 className={`text-2xl font-black ${isDarkMode ? 'text-slate-100' : 'text-[#011d49]'}`} style={{ fontFamily: 'Arial Black, Trebuchet MS, sans-serif' }}>
                  Data-Driven
                </h4>
                <p className={`mt-2 text-lg leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                  Real-time tracking and analytics help us optimize distribution and identify emerging needs quickly.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className={`h-16 w-16 rounded-2xl grid place-items-center ${isDarkMode ? 'bg-violet-900/30' : 'bg-violet-100'}`}>
                <svg viewBox="0 0 24 24" className={`h-8 w-8 ${isDarkMode ? 'text-violet-300' : 'text-violet-600'}`} fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M12 21s-7.5-4.3-7.5-10A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 7.5 4c0 5.7-7.5 10-7.5 10z" />
                </svg>
              </div>
              <div>
                <h4 className={`text-2xl font-black ${isDarkMode ? 'text-slate-100' : 'text-[#011d49]'}`} style={{ fontFamily: 'Arial Black, Trebuchet MS, sans-serif' }}>
                  Compassionate Service
                </h4>
                <p className={`mt-2 text-lg leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                  We treat every individual with dignity and respect, ensuring a caring approach to hunger relief.
                </p>
              </div>
            </div>
          </div>
        </article>
      </section>
    </main>
  )
}

export default AboutPage
