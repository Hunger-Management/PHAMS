/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo, useState } from 'react'

const BARANGAY_DATA_KEY = 'barangay-data'

const barangayProfiles = {
  Aguho: {
    residents: '4,250',
    households: '1,180',
    registeredFamilies: '890',
    iwpaCount: '45',
    activeDistributions: '12',
    captain: 'Joven Gatpayat',
  },
  Magtanggol: {
    residents: '3,980',
    households: '1,070',
    registeredFamilies: '842',
    iwpaCount: '39',
    activeDistributions: '10',
    captain: 'Jose A. Egonia',
  },
  "Martires del '96": {
    residents: '3,510',
    households: '960',
    registeredFamilies: '765',
    iwpaCount: '33',
    activeDistributions: '9',
    captain: 'Angel O. Mallorca Jr.',
  },
  Poblacion: {
    residents: '5,120',
    households: '1,420',
    registeredFamilies: '1,030',
    iwpaCount: '58',
    activeDistributions: '15',
    captain: 'Alma R. Otero',
  },
  'San Pedro': {
    residents: '4,030',
    households: '1,120',
    registeredFamilies: '856',
    iwpaCount: '41',
    activeDistributions: '11',
    captain: 'Violeta S. Lorenzo',
  },
  'San Roque': {
    residents: '4,410',
    households: '1,230',
    registeredFamilies: '904',
    iwpaCount: '46',
    activeDistributions: '13',
    captain: 'Maria Dolores R. Custodio',
  },
  'Santa Ana': {
    residents: '3,860',
    households: '1,040',
    registeredFamilies: '810',
    iwpaCount: '36',
    activeDistributions: '10',
    captain: 'Beatriz J. Santos',
  },
  'Santo Rosario-Kanluran': {
    residents: '3,740',
    households: '1,010',
    registeredFamilies: '788',
    iwpaCount: '34',
    activeDistributions: '9',
    captain: 'Arthur C. Cortez',
  },
  'Santo Rosario-Silangan': {
    residents: '3,920',
    households: '1,090',
    registeredFamilies: '825',
    iwpaCount: '38',
    activeDistributions: '11',
    captain: 'Eduardo G. Masinloc',
  },
  Tabacalera: {
    residents: '4,180',
    households: '1,150',
    registeredFamilies: '870',
    iwpaCount: '44',
    activeDistributions: '12',
    captain: 'Richard R. Palican',
  },
}

const BarangayContext = createContext(null)

export function BarangayProvider({ children }) {
  const [barangayData, setBarangayData] = useState(() => {
    if (typeof window === 'undefined') {
      return barangayProfiles
    }

    const stored = localStorage.getItem(BARANGAY_DATA_KEY)
    if (!stored) {
      return barangayProfiles
    }

    try {
      return JSON.parse(stored)
    } catch {
      return barangayProfiles
    }
  })

  const getAllBarangays = () => {
    return Object.keys(barangayData).map((name) => ({
      name,
      ...barangayData[name],
    }))
  }

  const getBarangayData = (barangayName) => {
    return barangayData[barangayName] || null
  }

  const value = useMemo(
    () => ({
      barangayData,
      getAllBarangays,
      getBarangayData,
    }),
    [barangayData],
  )

  return (
    <BarangayContext.Provider value={value}>{children}</BarangayContext.Provider>
  )
}

export function useBarangay() {
  const context = useContext(BarangayContext)

  if (!context) {
    throw new Error('useBarangay must be used within a BarangayProvider')
  }

  return context
}
