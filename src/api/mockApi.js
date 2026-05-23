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

function normalizeActor(rawActor = {}) {
  const staffUserId = rawActor.staff_user_id ?? rawActor.staffId ?? rawActor.staff_id ?? null
  const staffName = rawActor.staff_name || rawActor.staffName || rawActor.name || 'System'

  return {
    staff_user_id: staffUserId !== null && staffUserId !== undefined && staffUserId !== '' ? String(staffUserId) : null,
    staff_name: String(staffName || 'System'),
    staff_email: rawActor.staff_email || rawActor.email || null,
    staff_role: rawActor.staff_role || rawActor.role || 'Staff',
  }
}

function formatDistributionDetails(distribution) {
  if (!distribution) return 'Distribution details unavailable.'

  const recipient = distribution.family_name || distribution.individual_name || distribution.recipient_type || 'Unknown recipient'
  const barangay = distribution.barangay_name || 'Unknown barangay'
  const itemName = distribution.food_name || 'Food supply'
  const quantity = distribution.quantity !== null && distribution.quantity !== undefined && distribution.quantity !== ''
    ? `${distribution.quantity} ${distribution.unit || ''}`.trim()
    : '—'
  const status = distribution.status || 'Unknown status'
  const recordLabel = distribution.distribution_id ? `Distribution #${distribution.distribution_id}` : 'Distribution record'

  return `${recordLabel} • ${recipient} • ${barangay} • ${itemName}${quantity !== '—' ? ` (${quantity})` : ''} • Status: ${status}`
}

function determineDistributionAction(status, fallback = 'created') {
  const normalizedStatus = String(status || '').trim().toLowerCase()

  if (!normalizedStatus) return fallback
  if (normalizedStatus === 'completed' || normalizedStatus === 'distributed') return 'distributed'
  if (normalizedStatus === 'pending') return fallback
  return 'updated'
}

function createActivityLogEntry(db, distribution, action, actor) {
  const activity_id = nextId(db.activityLogs || [], 'activity_id')
  return {
    activity_id,
    distribution_id: distribution?.distribution_id ?? null,
    action,
    staff_user_id: actor?.staff_user_id || null,
    staff_name: actor?.staff_name || 'System',
    staff_email: actor?.staff_email || null,
    distribution_details: formatDistributionDetails(distribution),
    performed_at: nowIso(),
  }
}

function buildActivityLogsFromDistributions(db) {
  return (db.distributions || [])
    .slice()
    .sort((a, b) => new Date(b.date_given || 0).getTime() - new Date(a.date_given || 0).getTime())
    .map((item, index) => {
      const activity = createActivityLogEntry(db, withJoins({ ...db, distributions: [item] }).distributions[0], determineDistributionAction(item.status, 'created'), {
        staff_user_id: 'seed',
        staff_name: 'Seed Data',
        staff_email: null,
      })

      return {
        ...activity,
        activity_id: index + 1,
        performed_at: item.date_given || nowIso(),
      }
    })
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
        monthly_income: 9500,
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
        monthly_income: 11000,
      },
    ],
    family_members: [
      { member_id: 1, family_id: 1, first_name: 'Juan', last_name: 'Dela Cruz', date_of_birth: '1975-06-12', gender: 'Male', relationship: 'Head', is_pwd: 0, height_cm: 168, weight_kg: 62, nutritional_status: 'Normal' },
      { member_id: 2, family_id: 1, first_name: 'Rosa', last_name: 'Dela Cruz', date_of_birth: '1978-03-25', gender: 'Female', relationship: 'Spouse', is_pwd: 0, height_cm: 155, weight_kg: 50, nutritional_status: 'Normal' },
      { member_id: 3, family_id: 1, first_name: 'Carlo', last_name: 'Dela Cruz', date_of_birth: '2005-09-14', gender: 'Male', relationship: 'Child', is_pwd: 0, height_cm: 160, weight_kg: 45, nutritional_status: 'Underweight' },
      { member_id: 4, family_id: 1, first_name: 'Ana', last_name: 'Dela Cruz', date_of_birth: '2010-01-08', gender: 'Female', relationship: 'Child', is_pwd: 0, height_cm: 138, weight_kg: 30, nutritional_status: 'Underweight' },
      { member_id: 5, family_id: 1, first_name: 'Pedro', last_name: 'Dela Cruz', date_of_birth: '1945-11-30', gender: 'Male', relationship: 'Parent', is_pwd: 0, height_cm: 162, weight_kg: 55, nutritional_status: 'Normal' },
      { member_id: 6, family_id: 2, first_name: 'Maria', last_name: 'Santos', date_of_birth: '1955-04-18', gender: 'Female', relationship: 'Head', is_pwd: 0, height_cm: 152, weight_kg: 48, nutritional_status: 'Normal' },
      { member_id: 7, family_id: 2, first_name: 'Roberto', last_name: 'Santos', date_of_birth: '1952-08-22', gender: 'Male', relationship: 'Spouse', is_pwd: 1, height_cm: 164, weight_kg: 60, nutritional_status: 'Normal' },
      { member_id: 8, family_id: 2, first_name: 'Luisa', last_name: 'Santos', date_of_birth: '1985-12-05', gender: 'Female', relationship: 'Child', is_pwd: 0, height_cm: 158, weight_kg: 55, nutritional_status: 'Normal' },
      { member_id: 9, family_id: 2, first_name: 'Jose', last_name: 'Santos', date_of_birth: '1990-07-14', gender: 'Male', relationship: 'Child', is_pwd: 0, height_cm: 170, weight_kg: 65, nutritional_status: 'Normal' },
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
    activityLogs: [
      {
        activity_id: 1,
        distribution_id: 1,
        action: 'distributed',
        staff_user_id: '2',
        staff_name: 'Aguho Staff',
        staff_email: 'staff@pateros.gov.ph',
        distribution_details: 'Distribution #1 • Dela Cruz Family • Aguho • Rice (30 kg) • Status: Completed',
        performed_at: nowIso(),
      },
      {
        activity_id: 2,
        distribution_id: 2,
        action: 'created',
        staff_user_id: '2',
        staff_name: 'Aguho Staff',
        staff_email: 'staff@pateros.gov.ph',
        distribution_details: 'Distribution #2 • Pedro Ramos • Aguho • Canned Goods (5 packs) • Status: Pending',
        performed_at: nowIso(),
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
    const merged = {
      ...buildSeedDb(),
      ...parsed,
    }

    if (!Array.isArray(parsed.activityLogs) || parsed.activityLogs.length === 0) {
      merged.activityLogs = buildActivityLogsFromDistributions(merged)
    }

    return merged
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
  if (typeof FormData !== 'undefined' && options.body instanceof FormData) {
    const data = {}
    for (const [key, value] of options.body.entries()) {
      if (typeof File !== 'undefined' && value instanceof File) {
        data[key] = null
        continue
      }
      data[key] = value
    }
    if (typeof data.members === 'string') {
      try {
        data.members = JSON.parse(data.members)
      } catch {
        data.members = []
      }
    }
    return data
  }
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

function handleGet(path, db, originalPath = path) {
  const joins = withJoins(db)

  if (path === '/api/barangays') return BARANGAYS

  const barangayMatch = path.match(/^\/api\/barangays\/(\d+)$/)
  if (barangayMatch) {
    const barangayId = Number(barangayMatch[1])
    return BARANGAYS.find((item) => item.barangay_id === barangayId)
  }

  if (path === '/api/stats') return getStats(db)
  if (path === '/api/families') return db.families

  const familyMembersMatch = path.match(/^\/api\/families\/(\d+)\/members$/)
  if (familyMembersMatch) {
    const family_id = Number(familyMembersMatch[1])
    return (db.family_members || []).filter((m) => m.family_id === family_id)
  }

  const familyByIdMatch = path.match(/^\/api\/families\/(\d+)$/)
  if (familyByIdMatch) {
    const family_id = Number(familyByIdMatch[1])
    const family = db.families.find((f) => f.family_id === family_id)
    if (!family) throw makeError('Family not found.', 404)
    return family
  }

  if (path === '/api/individuals') return db.individuals
  if (path === '/api/donors') return db.donors
  if (path === '/api/food-supplies') return db.foodSupplies
  if (path === '/api/donations') return joins.donations
  if (path === '/api/distributions') return joins.distributions
  if (path === '/api/activity-logs') {
    const url = new URL(`http://local${originalPath}`)
    const limit = Math.min(Math.max(Number(url.searchParams.get('limit')) || 20, 1), 100)

    return (db.activityLogs || [])
      .slice()
      .sort((a, b) => new Date(b.performed_at || 0).getTime() - new Date(a.performed_at || 0).getTime())
      .slice(0, limit)
  }
  if (path === '/api/users') {
    // For mock API we return full user records (including `password`) so
    // admin tooling can display assigned staff and — in development only —
    // inspect stored passwords. Real backends MUST NOT return passwords.
    return db.users
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
      // Normalize to match real backend shape: barangay = the name string
      user: { ...safeUser, barangay: safeUser.barangay_name || safeUser.barangay || null },
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

    // Enforce one-staff-per-barangay for Staff role at the mock API level.
    const barangay_id = body.barangay_id ? Number(body.barangay_id) : null
    if (String(role).toLowerCase() === 'staff' && barangay_id) {
      const exists = db.users.some(
        (item) => String(item.role).toLowerCase() === 'staff' && Number(item.barangay_id) === Number(barangay_id)
      )
      if (exists) {
        throw makeError('This barangay already has an assigned staff account.', 409)
      }
    }

    const user_id = nextId(db.users, 'user_id')
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
    const rawMembers = Array.isArray(body.members) ? body.members : []
    const item = {
      family_id,
      family_name: body.family_name || `Family ${family_id}`,
      household_id: `H-${String(family_id).padStart(4, '0')}`,
      address: body.address || '',
      head_of_family: body.head_of_family || '',
      phone: body.phone || '',
      barangay_id,
      barangay_name: getBarangayName(barangay_id),
      member_count: rawMembers.length,
      priority_score: Number(body.priority_score || 0),
      food_assistance_status: body.food_assistance_status || 'None',
      is_npa: body.is_npa ? 1 : 0,
      monthly_income: body.monthly_income != null ? Number(body.monthly_income) : null,
    }
    db.families.unshift(item)

    if (rawMembers.length > 0) {
      const startId = nextId(db.family_members || [], 'member_id')
      const newMembers = rawMembers.map((m, i) => ({
        member_id: startId + i,
        family_id,
        first_name: m.first_name || '',
        last_name: m.last_name || '',
        date_of_birth: m.date_of_birth || null,
        gender: m.gender || 'Male',
        relationship: m.relationship || 'Other',
        is_pwd: m.is_pwd ? 1 : 0,
        height_cm: m.height_cm != null ? parseFloat(m.height_cm) : null,
        weight_kg: m.weight_kg != null ? parseFloat(m.weight_kg) : null,
        nutritional_status: m.nutritional_status || 'Unknown',
      }))
      db.family_members = [...(db.family_members || []), ...newMembers]
    }

    saveDb(db)
    return item
  }

  const addMemberMatch = path.match(/^\/api\/families\/(\d+)\/members$/)
  if (addMemberMatch) {
    const family_id = Number(addMemberMatch[1])
    const family = db.families.find((f) => f.family_id === family_id)
    if (!family) throw makeError('Family not found.', 404)

    const member_id = nextId(db.family_members || [], 'member_id')
    const newMember = {
      member_id,
      family_id,
      first_name: body.first_name || '',
      last_name: body.last_name || '',
      date_of_birth: body.date_of_birth || null,
      gender: body.gender || 'Male',
      relationship: body.relationship || 'Other',
      is_pwd: body.is_pwd ? 1 : 0,
      height_cm: body.height_cm != null ? parseFloat(body.height_cm) : null,
      weight_kg: body.weight_kg != null ? parseFloat(body.weight_kg) : null,
      nutritional_status: body.nutritional_status || 'Unknown',
    }
    db.family_members = [...(db.family_members || []), newMember]

    const memberCount = db.family_members.filter((m) => m.family_id === family_id).length
    db.families = db.families.map((f) =>
      f.family_id === family_id ? { ...f, member_count: memberCount } : f
    )

    saveDb(db)
    return newMember
  }

  if (path === '/api/individuals') {
    const individual_id = nextId(db.individuals, 'individual_id')
    const rawBarangayId = body.barangay_id
    const barangay_id = rawBarangayId === null || rawBarangayId === undefined || rawBarangayId === ''
      ? null
      : Number(rawBarangayId)
    const item = {
      individual_id,
      name: body.name || `Individual ${individual_id}`,
      age: body.age === null || body.age === undefined || body.age === '' ? null : Number(body.age || 0),
      gender: body.gender || 'Male',
      barangay_id,
      barangay_name: barangay_id ? getBarangayName(barangay_id) : 'Unknown',
      status: body.status || 'Registered',
      image: body.image_data || null,
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
    let foodId = Number(body.food_id)
    let foodUnit = 'unit'

    if (!foodId && body.food_description) {
      const foodSupplyId = nextId(db.foodSupplies, 'food_id')
      const newFood = {
        food_id: foodSupplyId,
        food_name: body.food_description,
        unit: body.quantity_unit || 'unit',
        total_quantity: 0,
      }
      db.foodSupplies.unshift(newFood)
      foodId = foodSupplyId
      foodUnit = newFood.unit
    } else if (foodId) {
      const food = db.foodSupplies.find((f) => f.food_id === foodId)
      foodUnit = food?.unit || 'unit'
    }

    const item = {
      donation_id: nextId(db.donations, 'donation_id'),
      donor_id: Number(body.donor_id),
      food_id: foodId,
      food_description: body.food_description || '',
      quantity: Number(body.quantity || 0),
      quantity_unit: foodUnit,
      date_given: body.date_given || nowIso(),
      image: body.image_data || null,
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
      image: body.image_data || null,
    }
    db.distributions.unshift(item)
    updateFoodQuantity(db, item.food_id, -item.quantity)
    const enriched = withJoins(db).distributions.find((distribution) => distribution.distribution_id === distribution_id) || item
    const actor = normalizeActor(body)
    const action = determineDistributionAction(item.status, 'created')
    db.activityLogs = db.activityLogs || []
    db.activityLogs.unshift(createActivityLogEntry(db, enriched, action, actor))
    saveDb(db)
    return item
  }

  throw makeError('Endpoint not found.', 404)
}

function handleDelete(path, db, body = {}) {
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
      const enriched = withJoins({ ...db, distributions: [existing] }).distributions[0] || existing
      const actor = normalizeActor(body)
      db.activityLogs = db.activityLogs || []
      db.activityLogs.unshift(createActivityLogEntry(db, enriched, 'deleted', actor))
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

  match = path.match(/^\/api\/members\/(\d+)$/)
  if (match) {
    const member_id = Number(match[1])
    const existing = (db.family_members || []).find((m) => m.member_id === member_id)
    db.family_members = (db.family_members || []).filter((m) => m.member_id !== member_id)
    if (existing) {
      const memberCount = db.family_members.filter((m) => m.family_id === existing.family_id).length
      db.families = db.families.map((f) =>
        f.family_id === existing.family_id ? { ...f, member_count: memberCount } : f
      )
    }
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
    const existing = db.distributions.find((item) => item.distribution_id === distribution_id)
    db.distributions = db.distributions.map((item) => {
      if (item.distribution_id !== distribution_id) return item
      return {
        ...item,
        status: body.status ?? item.status,
        image: body.image_data || item.image || null,
      }
    })
    if (existing) {
      const updated = db.distributions.find((item) => item.distribution_id === distribution_id) || existing
      const enriched = withJoins({ ...db, distributions: [updated] }).distributions[0] || updated
      const actor = normalizeActor(body)
      db.activityLogs = db.activityLogs || []
      db.activityLogs.unshift(createActivityLogEntry(db, enriched, determineDistributionAction(body.status, 'updated'), actor))
    }
    saveDb(db)
    return { ok: true }
  }

  match = path.match(/^\/api\/members\/(\d+)$/)
  if (match) {
    const member_id = Number(match[1])
    db.family_members = (db.family_members || []).map((m) => {
      if (m.member_id !== member_id) return m
      return {
        ...m,
        first_name: body.first_name ?? m.first_name,
        last_name: body.last_name ?? m.last_name,
        date_of_birth: body.date_of_birth !== undefined ? body.date_of_birth : m.date_of_birth,
        gender: body.gender ?? m.gender,
        relationship: body.relationship ?? m.relationship,
        is_pwd: body.is_pwd !== undefined ? (body.is_pwd ? 1 : 0) : m.is_pwd,
        height_cm: body.height_cm !== undefined ? (body.height_cm != null ? parseFloat(body.height_cm) : null) : m.height_cm,
        weight_kg: body.weight_kg !== undefined ? (body.weight_kg != null ? parseFloat(body.weight_kg) : null) : m.weight_kg,
        nutritional_status: body.nutritional_status ?? m.nutritional_status,
      }
    })
    saveDb(db)
    return { ok: true }
  }

  throw makeError('Endpoint not found.', 404)
}

export async function mockApiFetch(path, options = {}) {
  const method = String(options.method || 'GET').toUpperCase()
  const rawPath = String(path || '')
  const cleanPath = normalizePath(path)
  const body = parseBody(options)
  const db = loadDb()

  await new Promise((resolve) => {
    window.setTimeout(resolve, 120)
  })

  if (method === 'GET') return handleGet(cleanPath, db, rawPath)
  if (method === 'POST') return handlePost(cleanPath, db, body)
  if (method === 'PUT') return handlePut(cleanPath, db, body)
  if (method === 'DELETE') return handleDelete(cleanPath, db, body)

  throw makeError('Method not supported.', 405)
}
