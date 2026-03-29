import HomePage from './pages/HomePage'
import AboutPage from './pages/AboutPage'
import BarangaysPage from './pages/BarangaysPage'
import TransparencyPage from './pages/TransparencyPage'
import ContactPage from './pages/ContactPage'
import { Route, Routes } from 'react-router-dom'

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/barangays" element={<BarangaysPage />} />
      <Route path="/transparency" element={<TransparencyPage />} />
      <Route path="/contact" element={<ContactPage />} />
    </Routes>
  )
}

export default App
