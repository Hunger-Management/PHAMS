import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'

const barangayOptions = [
  { name: 'Aguho', path: '/barangays/aguho' },
  { name: 'Magtanggol', path: '/barangays/magtanggol' },
  { name: "Martires del '96", path: '/barangays/martires-del-96' },
  { name: 'Poblacion', path: '/barangays/poblacion' },
  { name: 'San Pedro', path: '/barangays/san-pedro' },
  { name: 'San Roque', path: '/barangays/san-roque' },
  { name: 'Santa Ana', path: '/barangays/santa-ana' },
  { name: 'Santo Rosario-Kanluran', path: '/barangays/santo-rosario-kanluran' },
  { name: 'Santo Rosario-Silangan', path: '/barangays/santo-rosario-silangan' },
  { name: 'Tabacalera', path: '/barangays/tabacalera' },
]

function SiteHeader({ isDarkMode, toggleDarkMode }) {
  const [isBarangaysOpen, setIsBarangaysOpen] = useState(false)
  const dropdownRef = useRef(null)
  const location = useLocation()
  const isBarangaysRoute = location.pathname.startsWith('/barangays')

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsBarangaysOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

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
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  `transition-colors ${
                    isActive
                      ? isDarkMode
                        ? 'text-blue-300'
                        : 'text-blue-700'
                      : isDarkMode
                        ? 'text-slate-300 hover:text-slate-200'
                        : 'text-slate-700 hover:text-blue-900'
                  }`
                }
              >
                Home
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/about"
                className={({ isActive }) =>
                  `transition-colors ${
                    isActive
                      ? isDarkMode
                        ? 'text-blue-300'
                        : 'text-blue-700'
                      : isDarkMode
                        ? 'text-slate-300 hover:text-slate-200'
                        : 'text-slate-700 hover:text-blue-900'
                  }`
                }
              >
                About Us
              </NavLink>
            </li>
            <li className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsBarangaysOpen((prev) => !prev)}
                className={`transition-colors ${
                  isBarangaysRoute
                    ? isDarkMode
                      ? 'text-blue-300'
                      : 'text-blue-700'
                    : isDarkMode
                      ? 'text-slate-300 hover:text-slate-200'
                      : 'text-slate-700 hover:text-blue-900'
                } text-[12px] md:text-[13px] font-semibold uppercase`}
                aria-haspopup="menu"
                aria-expanded={isBarangaysOpen}
              >
                Barangays ▾
              </button>

              {isBarangaysOpen ? (
                <div
                  className={`absolute left-1/2 z-20 mt-2 w-64 -translate-x-1/2 rounded-md border shadow-lg normal-case ${
                    isDarkMode
                      ? 'border-slate-600 bg-slate-900'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <ul className="max-h-72 overflow-y-auto py-1 text-sm font-semibold">
                    {barangayOptions.map((barangay) => (
                      <li key={barangay.path}>
                        <Link
                          to={barangay.path}
                          className={`block px-4 py-2 transition-colors ${
                            isDarkMode
                              ? 'text-slate-200 hover:bg-slate-800 hover:text-blue-300'
                              : 'text-slate-700 hover:bg-slate-100 hover:text-blue-700'
                          }`}
                        >
                          {barangay.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </li>
            <li>
              <NavLink
                to="/transparency"
                className={({ isActive }) =>
                  `transition-colors ${
                    isActive
                      ? isDarkMode
                        ? 'text-blue-300'
                        : 'text-blue-700'
                      : isDarkMode
                        ? 'text-slate-300 hover:text-slate-200'
                        : 'text-slate-700 hover:text-blue-900'
                  }`
                }
              >
                Transparency
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/donation"
                className={({ isActive }) =>
                  `transition-colors ${
                    isActive
                      ? isDarkMode
                        ? 'text-blue-300'
                        : 'text-blue-700'
                      : isDarkMode
                        ? 'text-slate-300 hover:text-slate-200'
                        : 'text-slate-700 hover:text-blue-900'
                  }`
                }
              >
                Donation
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/contact"
                className={({ isActive }) =>
                  `transition-colors ${
                    isActive
                      ? isDarkMode
                        ? 'text-blue-300'
                        : 'text-blue-700'
                      : isDarkMode
                        ? 'text-slate-300 hover:text-slate-200'
                        : 'text-slate-700 hover:text-blue-900'
                  }`
                }
              >
                Contact Us
              </NavLink>
            </li>
          </ul>
        </div>
      </nav>
    </header>
  )
}

export default SiteHeader
