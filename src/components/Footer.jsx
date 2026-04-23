import { Link } from 'react-router-dom'
import { useStaffAuth } from '../context/StaffAuthContext'

function Footer({ isDarkMode }) {
  const { isAuthenticated } = useStaffAuth()
  const staffRoute = '/staff/login'

  return (
    <footer
      className={`border-t transition-colors ${
        isDarkMode ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-[#f6f8f9]'
      }`}
    >
      <div className="mx-auto w-[95%] max-w-7xl px-3 md:px-5 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <p className={`text-sm transition-colors ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
          Pateros Zero Hunger Management System
        </p>

        <Link
          to={staffRoute}
          state={{ forceRoleChoice: true }}
          className={`inline-flex items-center rounded px-2 py-1 text-xs font-medium transition-colors ${
            isDarkMode
              ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
          }`}
        >
          {isAuthenticated ? 'Staff Dashboard' : 'Staff Login'}
        </Link>
      </div>
    </footer>
  )
}

export default Footer
