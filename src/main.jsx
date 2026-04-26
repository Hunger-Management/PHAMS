import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { StaffAuthProvider } from './context/StaffAuthContext'
import { AdminAuthProvider } from './context/AdminAuthContext'
import { BarangayProvider } from './context/BarangayContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AdminAuthProvider>
      <StaffAuthProvider>
        <BarangayProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </BarangayProvider>
      </StaffAuthProvider>
    </AdminAuthProvider>
  </StrictMode>,
)
