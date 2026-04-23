import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAdminAuth } from '../../context/AdminAuthContext'

function AdminProtectedRoute() {
  const { isAuthenticated } = useAdminAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/staff/login" replace state={{ from: location }} />
  }

  return <Outlet />
}

export default AdminProtectedRoute