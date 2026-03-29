import { Link } from 'react-router-dom'

function SiteHeader({ isDarkMode, toggleDarkMode }) {
  return (
    <header
      className={`transition-colors ${
        isDarkMode ? 'bg-slate-900 border-b border-slate-700 shadow-md' : 'bg-[#f6f8f9] border-b border-slate-200 shadow-sm'
      }`}
    >
      <div className="mx-auto w-[95%] max-w-7xl px-3 md:px-5 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`h-12 w-12 md:h-14 md:w-14 rounded-full border-2 grid place-items-center overflow-hidden transition-colors ${
                isDarkMode ? 'border-blue-400/20 bg-slate-800' : 'border-blue-900/20 bg-white'
              }`}
            >
              <img
                src="/pateros-zero-hunger-logo.png"
                alt="Pateros Zero Hunger logo"
                className="h-full w-full object-cover"
              />
            </div>
            <p
              className={`leading-tight uppercase tracking-[0.12em] text-[10px] md:text-xs transition-colors ${
                isDarkMode ? 'text-slate-300' : ''
              }`}
              style={{ fontFamily: 'Trebuchet MS, Segoe UI, sans-serif' }}
            >
              <span className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>Pateros Hunger</span>
              <br />
              <span className={`font-bold ${isDarkMode ? 'text-blue-300' : 'text-blue-900'}`}>and Management Systems</span>
            </p>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <label className="relative hidden sm:block">
              <input
                type="search"
                placeholder="Search"
                aria-label="Search"
                className={`w-64 rounded-md border py-1.5 pl-3 pr-8 text-sm outline-none focus:ring-2 focus:ring-blue-500/40 transition-colors ${
                  isDarkMode
                    ? 'border-slate-600 bg-slate-800 text-slate-50 placeholder-slate-500'
                    : 'border-slate-300 bg-white text-slate-900 placeholder-slate-500'
                }`}
              />
              <span className={`absolute right-2 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>⌕</span>
            </label>
            <button
              onClick={toggleDarkMode}
              className={`h-8 w-8 rounded-md transition-colors grid place-items-center text-[10px] font-bold ${
                isDarkMode ? 'bg-slate-700 text-yellow-300 hover:bg-slate-600' : 'bg-blue-900 text-white hover:bg-blue-800'
              }`}
              aria-label="Toggle dark mode"
            >
              {isDarkMode ? '☀️' : '🌙'}
            </button>
            <img
              src="/nu-1900-logo-transparent.png"
              alt="NU 1900 logo"
              className="h-12 w-12 object-contain"
            />
            <img
              src="/ccit logo.png"
              alt="CCT logo"
              className="h-12 w-12 object-contain"
            />
          </div>
        </div>
      </div>

      <nav className={`border-t transition-colors ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-[#ececec] border-slate-200'}`}>
        <div className="mx-auto w-[95%] max-w-7xl px-3 md:px-5 py-3">
          <ul
            className="flex flex-wrap items-center justify-center gap-x-7 gap-y-2 text-[12px] md:text-[13px] font-semibold uppercase"
            style={{ fontFamily: 'Trebuchet MS, Segoe UI, sans-serif' }}
          >
            <li>
              <Link
                to="/"
                className={`transition-colors ${
                  isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-700 hover:text-blue-900'
                }`}
              >
                Home
              </Link>
            </li>
            <li>
              <Link to="/about" className={`transition-colors ${isDarkMode ? 'hover:text-slate-200' : 'hover:text-blue-900'}`}>
                About Us
              </Link>
            </li>
            <li>
              <Link to="/barangays" className={`transition-colors ${isDarkMode ? 'hover:text-slate-200' : 'hover:text-blue-900'}`}>
                Barangays ▾
              </Link>
            </li>
            <li>
              <Link to="/transparency" className={`transition-colors ${isDarkMode ? 'hover:text-slate-200' : 'hover:text-blue-900'}`}>
                Transparency
              </Link>
            </li>
            <li>
              <Link to="/contact" className={`transition-colors ${isDarkMode ? 'hover:text-slate-200' : 'hover:text-blue-900'}`}>
                Contact Us
              </Link>
            </li>
          </ul>
        </div>
      </nav>
    </header>
  )
}

export default SiteHeader
