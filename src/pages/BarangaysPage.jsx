import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useDarkMode } from '../hooks/useDarkMode'
import SiteHeader from '../components/SiteHeader'

function BarangaysPage() {
  const { isDarkMode, toggleDarkMode } = useDarkMode()
  const [barangays, setBarangays] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/barangays')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch barangays')
        return res.json()
      })
      .then((data) => {
        setBarangays(data)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

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
            {loading && (
              <p className={`${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                Loading barangays...
              </p>
            )}
            {error && (
              <p className="text-red-500">Error: {error}</p>
            )}

            {!loading && !error && (
              <div className="overflow-hidden rounded-xl border">
                <table className="w-full text-sm">
                  <thead className={`${isDarkMode ? 'bg-slate-900/40 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">ID</th>
                      <th className="px-4 py-3 text-left font-semibold">Barangay</th>
                    </tr>
                  </thead>
                  <tbody>
                    {barangays.map((b) => (
                      <tr key={b.barangay_id} className={`${isDarkMode ? 'border-slate-700' : 'border-slate-200'} border-t`}>
                        <td className="px-4 py-3">{b.barangay_id}</td>
                        <td className="px-4 py-3">{b.name}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
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

export default BarangaysPage
