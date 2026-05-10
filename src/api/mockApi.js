const MOCK_DB_STORAGE_KEY = 'phams-mock-db-v1'

const BARANGAYS = [
  { barangay_id: 1, name: 'Aguho' },
  { barangay_id: 2, name: 'Magtanggol' },
  { barangay_id: 3, name: "Martires del '96" },
  { barangay_id: 4, name: 'Poblacion' },
  { barangay_id: 5, name: 'San Pedro' },
  { barangay_id: 6, name: 'San Roque' },
  { barangay_id: 7, name: 'Santa Ana' },
  { barangay_id: 8, name: 'Santo Rosario-Kanluran' },
  { barangay_id: 9, name: 'Santo Rosario-Silangan' },
  { barangay_id: 10, name: 'Tabacalera' },
]

function nowIso() {
  return new Date().toISOString()
}

function getBarangayName(barangayId) {
  return BARANGAYS.find((item) => item.barangay_id === Number(barangayId))?.name || 'Unknown'
}

function buildSeedDb() {
  return {
    users: [
      {
        user_id: 1,
        name: 'Administrator',
        full_name: 'Administrator',
        email: 'admin@pateros.gov.ph',
        password: 'admin123',
        role: 'Admin',
        barangay_id: null,
        barangay_name: null,
        created_at: nowIso(),
      },
      {
        user_id: 2,
        name: 'Aguho Staff',
        full_name: 'Aguho Staff',
        email: 'staff@pateros.gov.ph',
        password: 'staff123',
        role: 'Staff',
        barangay_id: 1,
        barangay_name: 'Aguho',
        created_at: nowIso(),
      },
    ],
    families: [
      {
        family_id: 1,
        family_name: 'Dela Cruz Family',
        household_id: 'H-0001',
        address: 'Main Street, Aguho',
        head_of_family: 'Juan Dela Cruz',
        phone: '09171234567',
        barangay_id: 1,
        barangay_name: 'Aguho',
        member_count: 5,
        priority_score: 82,
        food_assistance_status: '4Ps',
        is_npa: 0,
      },
      {
        family_id: 2,
        family_name: 'Santos Household',
        household_id: 'H-0002',
        address: 'Riverbank, Poblacion',
        head_of_family: 'Maria Santos',
        phone: '09179876543',
        barangay_id: 4,
        barangay_name: 'Poblacion',
        member_count: 4,
        priority_score: 76,
        food_assistance_status: 'Senior Citizen',
        is_npa: 0,
      },
    ],
    individuals: [
      {
        individual_id: 1,
        name: 'Pedro Ramos',
        age: 67,
        gender: 'Male',
        barangay_id: 1,
        barangay_name: 'Aguho',
        status: 'Registered',
      },
      {
        individual_id: 2,
        name: 'Ana Villanueva',
        age: 34,
        gender: 'Female',
        barangay_id: 4,
        barangay_name: 'Poblacion',
        status: 'Received',
      },
    ],
    donors: [
      { donor_id: 1, donor_name: 'Barangay Council', contact_info: 'N/A' },
      { donor_id: 2, donor_name: 'Private Citizen', contact_info: 'N/A' },
    ],
    foodSupplies: [
      { food_id: 1, food_name: 'Rice', unit: 'kg', total_quantity: 1200 },
      { food_id: 2, food_name: 'Canned Goods', unit: 'packs', total_quantity: 450 },
      { food_id: 3, food_name: 'Noodles', unit: 'boxes', total_quantity: 320 },
    ],
    donations: [
      {
        donation_id: 1,
        donor_id: 1,
        food_id: 1,
        quantity: 200,
        date_given: nowIso(),
      },
    ],
    distributions: [
      {
        distribution_id: 1,
        recipient_type: 'Family',
        family_id: 1,
        individual_id: null,
        barangay_id: 1,
        food_id: 1,
        quantity: 30,
        date_given: nowIso(),
        status: 'Completed',
      },
      {
        distribution_id: 2,
        recipient_type: 'Individual',
        family_id: null,
        individual_id: 1,
        barangay_id: 1,
        food_id: 2,
        quantity: 5,
        date_given: nowIso(),
        status: 'Pending',
      },
    ],
  }
}

function loadDb() {
  if (typeof window === 'undefined') {
    return buildSeedDb()
  }

  const raw = localStorage.getItem(MOCK_DB_STORAGE_KEY)
  if (!raw) {
    const seed = buildSeedDb()
    localStorage.setItem(MOCK_DB_STORAGE_KEY, JSON.stringify(seed))
    return seed
  }

  try {
    const parsed = JSON.parse(raw)
    return {
      ...buildSeedDb(),
      ...parsed,
    }
  } catch {
    const seed = buildSeedDb()
    localStorage.setItem(MOCK_DB_STORAGE_KEY, JSON.stringify(seed))
    return seed
  }
}

function saveDb(db) {
  if (typeof window === 'undefined') return
  localStorage.setItem(MOCK_DB_STORAGE_KEY, JSON.stringify(db))
}

function nextId(items, key) {
  const max = items.reduce((acc, item) => {
    const value = Number(item[key])
    return Number.isFinite(value) && value > acc ? value : acc
  }, 0)
  return max + 1
}

function withJoins(db) {
  const donorsById = Object.fromEntries(db.donors.map((item) => [item.donor_id, item]))
  const foodsById = Object.fromEntries(db.foodSupplies.map((item) => [item.food_id, item]))
  const familiesById = Object.fromEntries(db.families.map((item) => [item.family_id, item]))
  const individualsById = Object.fromEntries(db.individuals.map((item) => [item.individual_id, item]))

  const donations = db.donations.map((item) => {
    const donor = donorsById[item.donor_id]
    const food = foodsById[item.food_id]
    return {
      ...item,
      donor_name: donor?.donor_name || 'Unknown donor',
      food_name: food?.food_name || 'Unknown food',
      unit: food?.unit || 'unit',
    }
  })

  const distributions = db.distributions.map((item) => {
    const food = foodsById[item.food_id]
    const family = item.family_id ? familiesById[item.family_id] : null
    const individual = item.individual_id ? individualsById[item.individual_id] : null
    return {
      ...item,
      barangay_name: getBarangayName(item.barangay_id),
      family_name: family?.family_name || null,
      individual_name: individual?.name || null,
      food_name: food?.food_name || 'Unknown food',
      unit: food?.unit || 'unit',
    }
  })

  return { donations, distributions }
}

function parseBody(options) {
  if (!options?.body) return {}
  if (typeof options.body === 'string') {
    try {
      return JSON.parse(options.body)
    } catch {
      return {}
    }
  }
  return options.body
}

function normalizePath(path) {
  const clean = String(path || '').split('?')[0]
  return clean.endsWith('/') && clean.length > 1 ? clean.slice(0, -1) : clean
}

function makeError(message, status = 400) {
  const error = new Error(message)
  error.status = status
  return error
}

function updateFoodQuantity(db, foodId, delta) {
  db.foodSupplies = db.foodSupplies.map((item) => {
    if (item.food_id !== Number(foodId)) return item
    return {
      ...item,
      total_quantity: Math.max(0, Number(item.total_quantity || 0) + Number(delta || 0)),
    }
  })
}

function getStats(db) {
  return {
    totalFamilies: db.families.length,
    totalIndividuals: db.individuals.length,
    pendingDistributions: db.distributions.filter((item) => String(item.status).toLowerCase() === 'pending').length,
    totalFoodSupply: db.foodSupplies.reduce((sum, item) => sum + (Number(item.total_quantity) || 0), 0),
  }
}

function handleGet(path, db) {
  const joins = withJoins(db)

  if (path === '/api/barangays') return BARANGAYS
  if (path === '/api/stats') return getStats(db)
  if (path === '/api/families') return db.families
  if (path === '/api/individuals') return db.individuals
  if (path === '/api/donors') return db.donors
  if (path === '/api/food-supplies') return db.foodSupplies
  if (path === '/api/donations') return joins.donations
  if (path === '/api/distributions') return joins.distributions
  if (path === '/api/users') {
    return db.users.map(({ password, ...safe }) => safe)
  }

  throw makeError('Endpoint not found.', 404)
}

function handlePost(path, db, body) {
  if (path === '/api/auth/login') {
    const email = String(body.email || '').trim().toLowerCase()
    const password = String(body.password || '')
    const user = db.users.find((item) => {
      const byEmail = item.email.toLowerCase() === email
      const byName = item.name.toLowerCase() === email
      return (byEmail || byName) && item.password === password
    })

    if (!user) {
      throw makeError('Invalid email or password.', 401)
    }

    const { password: _ignored, ...safeUser } = user
    return {
      token: `mock-token-${user.user_id}`,
      user: safeUser,
    }
  }

  if (path === '/api/auth/register') {
    const role = body.role || 'Staff'
    const email = String(body.email || '').trim().toLowerCase()
    if (!body.name || !email || !body.password) {
      throw makeError('Name, email, and password are required.', 400)
    }

    if (db.users.some((item) => item.email.toLowerCase() === email)) {
      throw makeError('Email already exists.', 409)
    }

    const user_id = nextId(db.users, 'user_id')
    const barangay_id = body.barangay_id ? Number(body.barangay_id) : null
    const created = {
      user_id,
      name: body.name,
      full_name: body.name,
      email,
      password: body.password,
      role,
      barangay_id,
      barangay_name: barangay_id ? getBarangayName(barangay_id) : null,
      created_at: nowIso(),
    }
    db.users.unshift(created)
    saveDb(db)

    const { password, ...safeUser } = created
    return { message: 'User registered successfully.', user: safeUser }
  }

  if (path === '/api/families') {
    const family_id = nextId(db.families, 'family_id')
    const barangay_id = Number(body.barangay_id) || 1
    const item = {
      family_id,
      family_name: body.family_name || `Family ${family_id}`,
      household_id: `H-${String(family_id).padStart(4, '0')}`,
      address: body.address || '',
      head_of_family: body.head_of_family || '',
      phone: body.phone || '',
      barangay_id,
      barangay_name: getBarangayName(barangay_id),
      member_count: Array.isArray(body.members) ? body.members.length : Number(body.member_count || 1),
      priority_score: Number(body.priority_score || 0),
      food_assistance_status: body.food_assistance_status || 'None',
      is_npa: body.is_npa ? 1 : 0,
    }
    db.families.unshift(item)
    saveDb(db)
    return item
  }

  if (path === '/api/individuals') {
    const individual_id = nextId(db.individuals, 'individual_id')
    const barangay_id = Number(body.barangay_id) || 1
    const item = {
      individual_id,
      name: body.name || `Individual ${individual_id}`,
      age: body.age === null ? null : Number(body.age || 0),
      gender: body.gender || 'Male',
      barangay_id,
      barangay_name: getBarangayName(barangay_id),
      status: body.status || 'Registered',
    }
    db.individuals.unshift(item)
    saveDb(db)
    return item
  }

  if (path === '/api/donors') {
    const donor_id = nextId(db.donors, 'donor_id')
    const item = {
      donor_id,
      donor_name: body.donor_name || `Donor ${donor_id}`,
      contact_info: body.contact_info || '',
    }
    db.donors.unshift(item)
    saveDb(db)
    return item
  }

  if (path === '/api/donations') {
    const donation_id = nextId(db.donations, 'donation_id')
    const item = {
      donation_id,
      donor_id: Number(body.donor_id),
      food_id: Number(body.food_id),
      quantity: Number(body.quantity || 0),
      date_given: body.date_given || nowIso(),
    }
    db.donations.unshift(item)
    updateFoodQuantity(db, item.food_id, item.quantity)
    saveDb(db)
    return item
  }

  if (path === '/api/distributions') {
    const distribution_id = nextId(db.distributions, 'distribution_id')
    const item = {
      distribution_id,
      recipient_type: body.recipient_type || 'Family',
      family_id: body.family_id ? Number(body.family_id) : null,
      individual_id: body.individual_id ? Number(body.individual_id) : null,
      barangay_id: Number(body.barangay_id) || 1,
      food_id: Number(body.food_id),
      quantity: Number(body.quantity || 0),
      date_given: body.date_given || nowIso(),
      status: body.status || 'Pending',
    }
    db.distributions.unshift(item)
    updateFoodQuantity(db, item.food_id, -item.quantity)
    saveDb(db)
    return item
  }

  throw makeError('Endpoint not found.', 404)
}

function handleDelete(path, db) {
  let match = path.match(/^\/api\/families\/(\d+)$/)
  if (match) {
    const family_id = Number(match[1])
    db.families = db.families.filter((item) => item.family_id !== family_id)
    saveDb(db)
    return { ok: true }
  }

  match = path.match(/^\/api\/individuals\/(\d+)$/)
  if (match) {
    const individual_id = Number(match[1])
    db.individuals = db.individuals.filter((item) => item.individual_id !== individual_id)
    saveDb(db)
    return { ok: true }
  }

  match = path.match(/^\/api\/donations\/(\d+)$/)
  if (match) {
    const donation_id = Number(match[1])
    const existing = db.donations.find((item) => item.donation_id === donation_id)
    db.donations = db.donations.filter((item) => item.donation_id !== donation_id)
    if (existing) {
      updateFoodQuantity(db, existing.food_id, -Number(existing.quantity || 0))
    }
    saveDb(db)
    return { ok: true }
  }

  match = path.match(/^\/api\/distributions\/(\d+)$/)
  if (match) {
    const distribution_id = Number(match[1])
    const existing = db.distributions.find((item) => item.distribution_id === distribution_id)
    db.distributions = db.distributions.filter((item) => item.distribution_id !== distribution_id)
    if (existing) {
      updateFoodQuantity(db, existing.food_id, Number(existing.quantity || 0))
    }
    saveDb(db)
    return { ok: true }
  }

  match = path.match(/^\/api\/users\/(\d+)$/)
  if (match) {
    const user_id = Number(match[1])
    db.users = db.users.filter((item) => item.user_id !== user_id)
    saveDb(db)
    return { ok: true }
  }

  throw makeError('Endpoint not found.', 404)
}

function handlePut(path, db, body) {
  let match = path.match(/^\/api\/families\/(\d+)$/)
  if (match) {
    const family_id = Number(match[1])
    db.families = db.families.map((item) => {
      if (item.family_id !== family_id) return item
      const barangay_id = body.barangay_id ? Number(body.barangay_id) : item.barangay_id
      return {
        ...item,
        family_name: body.family_name ?? item.family_name,
        address: body.address ?? item.address,
        head_of_family: body.head_of_family ?? item.head_of_family,
        phone: body.phone ?? item.phone,
        barangay_id,
        barangay_name: getBarangayName(barangay_id),
      }
    })
    saveDb(db)
    return { ok: true }
  }

  match = path.match(/^\/api\/individuals\/(\d+)$/)
  if (match) {
    const individual_id = Number(match[1])
    db.individuals = db.individuals.map((item) => {
      if (item.individual_id !== individual_id) return item
      const barangay_id = body.barangay_id ? Number(body.barangay_id) : item.barangay_id
      return {
        ...item,
        name: body.name ?? item.name,
        age: body.age ?? item.age,
        gender: body.gender ?? item.gender,
        status: body.status ?? item.status,
        barangay_id,
        barangay_name: getBarangayName(barangay_id),
      }
    })
    saveDb(db)
    return { ok: true }
  }

  match = path.match(/^\/api\/distributions\/(\d+)$/)
  if (match) {
    const distribution_id = Number(match[1])
    db.distributions = db.distributions.map((item) => {
      if (item.distribution_id !== distribution_id) return item
      return {
        ...item,
        status: body.status ?? item.status,
      }
    })
    saveDb(db)
    return { ok: true }
  }

  throw makeError('Endpoint not found.', 404)
}

export async function mockApiFetch(path, options = {}) {
  const method = String(options.method || 'GET').toUpperCase()
  const cleanPath = normalizePath(path)
  const body = parseBody(options)
  const db = loadDb()

  await new Promise((resolve) => {
    window.setTimeout(resolve, 120)
  })

  if (method === 'GET') return handleGet(cleanPath, db)
  if (method === 'POST') return handlePost(cleanPath, db, body)
  if (method === 'PUT') return handlePut(cleanPath, db, body)
  if (method === 'DELETE') return handleDelete(cleanPath, db)

  throw makeError('Method not supported.', 405)
}
