import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { StaffAuthProvider } from './context/StaffAuthContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <StaffAuthProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </StaffAuthProvider>
  </StrictMode>,
)
