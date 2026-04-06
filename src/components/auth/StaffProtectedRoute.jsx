import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useStaffAuth } from '../../context/StaffAuthContext'

function StaffProtectedRoute() {
  const { isAuthenticated } = useStaffAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/staff/login" replace state={{ from: location }} />
  }

  return <Outlet />
}

export default StaffProtectedRoute
