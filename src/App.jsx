import HomePage from './pages/HomePage'
import AboutPage from './pages/AboutPage'
import BarangaysPage from './pages/BarangaysPage'
import AguhoPage from './pages/barangays/AguhoPage'
import MagtanggolPage from './pages/barangays/MagtanggolPage'
import MartiresDel96Page from './pages/barangays/MartiresDel96Page'
import PoblacionPage from './pages/barangays/PoblacionPage'
import SanPedroPage from './pages/barangays/SanPedroPage'
import SanRoquePage from './pages/barangays/SanRoquePage'
import SantaAnaPage from './pages/barangays/SantaAnaPage'
import SantoRosarioKanluranPage from './pages/barangays/SantoRosarioKanluranPage'
import SantoRosarioSilanganPage from './pages/barangays/SantoRosarioSilanganPage'
import TabacaleraPage from './pages/barangays/TabacaleraPage'
import TransparencyPage from './pages/TransparencyPage'
import DonationPage from './pages/DonationPage'
import ContactPage from './pages/ContactPage'
import StaffLoginPage from './pages/staff/StaffLoginPage'
import StaffDashboardPage from './pages/staff/StaffDashboardPage'
import StaffProtectedRoute from './components/auth/StaffProtectedRoute'
import AdminDashboardPage from './pages/admin/AdminDashboardPage'
import AdminBarangaysPage from './pages/admin/AdminBarangaysPage'
import AdminTransparencyPage from './pages/admin/AdminTransparencyPage'
import AdminCreateAccountPage from './pages/admin/AdminCreateAccountPage'
import AdminProtectedRoute from './components/auth/AdminProtectedRoute'
import { Route, Routes } from 'react-router-dom'
import FamilyListPage from './pages/admin/FamilyListPage'
import AddFamilyPage from './pages/admin/AddFamilyPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/barangays" element={<BarangaysPage />} />
      <Route path="/barangays/aguho" element={<AguhoPage />} />
      <Route path="/barangays/magtanggol" element={<MagtanggolPage />} />
      <Route path="/barangays/martires-del-96" element={<MartiresDel96Page />} />
      <Route path="/barangays/poblacion" element={<PoblacionPage />} />
      <Route path="/barangays/san-pedro" element={<SanPedroPage />} />
      <Route path="/barangays/san-roque" element={<SanRoquePage />} />
      <Route path="/barangays/santa-ana" element={<SantaAnaPage />} />
      <Route path="/barangays/santo-rosario-kanluran" element={<SantoRosarioKanluranPage />} />
      <Route path="/barangays/santo-rosario-silangan" element={<SantoRosarioSilanganPage />} />
      <Route path="/barangays/tabacalera" element={<TabacaleraPage />} />
      <Route path="/transparency" element={<TransparencyPage />} />
      <Route path="/donation" element={<DonationPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/staff/login" element={<StaffLoginPage />} />
      <Route element={<StaffProtectedRoute />}>
        <Route path="/staff/dashboard" element={<StaffDashboardPage />} />
      </Route>
      <Route element={<AdminProtectedRoute />}>
        <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
        <Route path="/admin/barangays" element={<AdminBarangaysPage />} />
        <Route path="/admin/transparency" element={<AdminTransparencyPage />} />
        <Route path="/admin/create-account" element={<AdminCreateAccountPage />} />
        <Route path="/admin/families" element={<FamilyListPage />} />
        <Route path="/admin/families/add" element={<AddFamilyPage />} />
      </Route>
    </Routes>
  )
}

export default App
