const express = require('express')
const mysql = require('mysql2')
const cors = require('cors')
const path = require('path')
const bcrypt = require('bcryptjs')
const multer = require('multer')
require('dotenv').config({ path: path.join(__dirname, '.env') })

const app = express()
app.use(cors())
app.use(express.json())

const upload = multer({ storage: multer.memoryStorage() })

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`)
  next()
})

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT || 3306),
}

function encodeImage(row) {
  if (!row) return row
  return {
    ...row,
    image: row.image ? row.image.toString('base64') : null,
  }
}

function encodeImageList(rows) {
  return Array.isArray(rows) ? rows.map(encodeImage) : []
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

function getRequestActor(req) {
  return normalizeActor({
    ...(req.body || {}),
    staff_user_id: req.body?.staff_user_id ?? req.headers['x-staff-user-id'],
    staff_name: req.body?.staff_name ?? req.headers['x-staff-name'],
    staff_email: req.body?.staff_email ?? req.headers['x-staff-email'],
    staff_role: req.body?.staff_role ?? req.headers['x-staff-role'],
  })
}

// Extract user_id from simple token format: phams-{userId}-token
function getTokenUserId(req) {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'] || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader
  const match = token.match(/^phams-(\d+)-token$/)
  return match ? Number(match[1]) : null
}

// Look up user by token and call cb(err, user) where user has .role, .user_id, .barangay_id
function getUserFromToken(req, db, cb) {
  const userId = getTokenUserId(req)
  if (!userId) return cb(null, null)
  db.query('SELECT user_id, role, barangay_id, name, email FROM users WHERE user_id = ?', [userId], (err, rows) => {
    if (err) return cb(err, null)
    cb(null, rows && rows[0] ? rows[0] : null)
  })
}

function generateTrackingNumber() {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `DON-${datePart}-${suffix}`
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

function persistActivityLog(db, distribution, action, actor, callback) {
  const sql = `
    INSERT INTO distribution_activity_logs
    (distribution_id, action, staff_user_id, staff_name, staff_email, distribution_details, performed_at)
    VALUES (?, ?, ?, ?, ?, ?, NOW())
  `

  const params = [
    distribution?.distribution_id || null,
    action,
    actor?.staff_user_id || null,
    actor?.staff_name || 'System',
    actor?.staff_email || null,
    formatDistributionDetails(distribution),
  ]

  db.query(sql, params, (err) => {
    if (callback) callback(err || null)
  })
}

// ─── PRIORITY SCORE ──────────────────────────────────────────────────────────
// Five-component formula (0–100) plus NPA bonus:
//   (1) Income vs NCR poverty line   — 35 pts
//   (2) Malnourished member ratio    — 30 pts
//   (3) Vulnerable member ratio      — 20 pts  (age <5, age ≥60, or PWD)
//   (4) Non-working-age ratio        — 10 pts  (age <15 or age ≥65)
//   (5) Days since last distribution —  5 pts
//   (+) NPA bonus                    — +10 pts (capped at 100)
//
// SDG 2 design decisions that differ from the documented formula:
//   • Null income → treated as 0 → max income score. Informal workers and NPA
//     families rarely have documented income; penalising them for it would
//     exclude the most vulnerable from assistance.
//   • Missing date_of_birth → member counted as vulnerable. Unknown age is
//     treated conservatively — better to over-include than to leave someone out.
//   • is_npa = 1 adds +10 pts. The documentation omits NPA from scoring, but
//     individuals without a permanent address are among the hardest to reach
//     and most systematically excluded from aid programs.
//   • daysSinceLastDist is passed in so recalculation after a completed
//     distribution automatically reduces a family's score (equity rotation).
function calculatePriorityScore({ monthly_income, is_npa, members = [], daysSinceLastDist = 90 }) {
  const POVERTY_LINE = 12082

  // (1) Income — 35 pts
  const income = (monthly_income !== undefined && monthly_income !== null && monthly_income !== '')
    ? Number(monthly_income) : 0
  const incomeScore = Math.min(35, Math.max(0, 35 * (1 - income / POVERTY_LINE)))

  // (2–4) Member-based components
  const total = members.length
  let malnourished = 0, vulnerable = 0, nonWorkingAge = 0

  for (const m of members) {
    if (['underweight', 'severely underweight'].includes(String(m.nutritional_status || '').toLowerCase())) {
      malnourished++
    }

    let age = null
    if (m.date_of_birth) {
      const dob = new Date(m.date_of_birth)
      const now = new Date()
      age = now.getFullYear() - dob.getFullYear()
      const mo = now.getMonth() - dob.getMonth()
      if (mo < 0 || (mo === 0 && now.getDate() < dob.getDate())) age--
    }

    const isPwd = m.is_pwd === 1 || m.is_pwd === '1' || m.is_pwd === true
    // Missing DOB → count as vulnerable (conservative/inclusive)
    if (isPwd || age === null || age < 5 || age >= 60) vulnerable++
    if (age !== null && (age < 15 || age >= 65)) nonWorkingAge++
  }

  const malnutScore = total > 0 ? 30 * malnourished / total : 0
  const vulnScore   = total > 0 ? Math.min(20, 20 * vulnerable / total) : 0
  const depScore    = total > 0 ? Math.min(10, 10 * nonWorkingAge / total) : 0

  // (5) Days since last distribution — 5 pts; new families default to 90 → full 5 pts
  const distScore = Math.min(5, 5 * Math.min(daysSinceLastDist, 90) / 90)

  // NPA bonus — capped at 100 overall
  const npaBonus = (is_npa === 1 || is_npa === '1' || is_npa === true) ? 10 : 0

  return parseFloat(Math.min(100, incomeScore + malnutScore + vulnScore + depScore + distScore + npaBonus).toFixed(2))
}

// Recalculates and saves a family's priority score using live DB data.
// Called after any distribution status change so the score stays current.
function recalculateFamilyPriorityScore(familyId, db) {
  if (!familyId) return
  db.query('SELECT monthly_income, is_npa FROM families WHERE family_id = ?', [familyId], (err, familyRows) => {
    if (err || !familyRows.length) return
    const { monthly_income, is_npa } = familyRows[0]

    db.query(
      'SELECT date_of_birth, nutritional_status, is_pwd FROM family_members WHERE family_id = ?',
      [familyId],
      (err2, members) => {
        if (err2) return
        db.query(
          "SELECT DATEDIFF(CURDATE(), MAX(date_given)) AS days_since FROM distribution WHERE family_id = ? AND status = 'Completed'",
          [familyId],
          (err3, distRows) => {
            if (err3) return
            const daysSince = distRows[0]?.days_since !== null && distRows[0]?.days_since !== undefined
              ? Number(distRows[0].days_since) : 90
            const score = calculatePriorityScore({ monthly_income, is_npa, members: members || [], daysSinceLastDist: daysSince })
            db.query('UPDATE families SET priority_score = ? WHERE family_id = ?', [score, familyId], () => {})
          }
        )
      }
    )
  })
}

// ─── HOUSEHOLD ID ────────────────────────────────────────────────────────────
const BARANGAY_CODES = {
  1: 'AGU', 2: 'MAG', 3: 'MAR', 4: 'POB', 5: 'SNP',
  6: 'SNR', 7: 'SNA', 8: 'SRK', 9: 'SRS', 10: 'TAB',
}

function generateHouseholdId(barangayId, familyId) {
  const code = BARANGAY_CODES[Number(barangayId)] || 'UNK'
  const year = new Date().getFullYear()
  const seq = String(familyId).padStart(4, '0')
  return `${code}-${year}-${seq}`
}

// ─── DB CONNECTION ───────────────────────────────────────────────────────────
const db = mysql.createPool(dbConfig)

db.query('SELECT 1', (err) => {
  if (err) {
    console.error('❌ Database pool test failed:', err)
    return
  }
  console.log(`✅ Connected to ${process.env.DB_NAME} database at ${process.env.DB_HOST}`)
})

// ─── BARANGAYS ───────────────────────────────────────────────────────────────

// GET all barangays
app.get('/api/barangays', (req, res) => {
  db.query('SELECT * FROM barangays', (err, results) => {
    if (err) return res.status(500).json({ error: err.message })
    res.json(results)
  })
})

// GET single barangay
app.get('/api/barangays/:id', (req, res) => {
  db.query('SELECT * FROM barangays WHERE barangay_id = ?', [req.params.id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message })
    res.json(results[0])
  })
})

// ─── FAMILIES ────────────────────────────────────────────────────────────────

// GET all families (with barangay name)
app.get('/api/families', (req, res) => {
  const sql = `
    SELECT
      f.family_id,
      f.barangay_id,
      f.household_id,
      f.family_name,
      f.address,
      f.head_of_family,
      f.phone,
      f.monthly_income,
      f.food_assistance_status,
      f.is_npa,
      f.priority_score,
      f.is_active,
      f.created_at,
      b.name AS barangay_name,
      (SELECT COUNT(*) FROM family_members fm WHERE fm.family_id = f.family_id) AS member_count
    FROM families f
    LEFT JOIN barangays b ON f.barangay_id = b.barangay_id
  `
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err.message })
    res.json(results)
  })
})

// GET single family
app.get('/api/families/:id', (req, res) => {
  const sql = `
    SELECT
      f.family_id,
      f.barangay_id,
      f.household_id,
      f.family_name,
      f.address,
      f.head_of_family,
      f.phone,
      f.monthly_income,
      f.food_assistance_status,
      f.is_npa,
      f.priority_score,
      f.is_active,
      f.created_at,
      b.name AS barangay_name,
      (SELECT COUNT(*) FROM family_members fm WHERE fm.family_id = f.family_id) AS member_count
    FROM families f
    LEFT JOIN barangays b ON f.barangay_id = b.barangay_id
    WHERE f.family_id = ?
  `
  db.query(sql, [req.params.id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message })
    res.json(results[0])
  })
})

// POST add new family
app.post('/api/families', (req, res) => {
  const {
    barangay_id, family_name, address, head_of_family, phone,
    monthly_income, food_assistance_status, is_npa, priority_score,
  } = req.body
  const monthlyIncomeValue = monthly_income === undefined || monthly_income === null || monthly_income === '' ? null : Number(monthly_income)
  const isNpaValue = is_npa === 1 || is_npa === '1' || is_npa === true ? 1 : 0
  const assistanceStatus = food_assistance_status || 'None'

  let members = []
  if (Array.isArray(req.body.members)) {
    members = req.body.members
  } else if (req.body.members) {
    try {
      const parsed = JSON.parse(req.body.members)
      members = Array.isArray(parsed) ? parsed : []
    } catch {
      members = []
    }
  }

  // Auto-calculate priority score if not explicitly provided
  const priorityScoreValue = (priority_score !== undefined && priority_score !== null && priority_score !== '')
    ? Number(priority_score)
    : calculatePriorityScore({ monthly_income, is_npa, members })

  const familySql = `
    INSERT INTO families
      (barangay_id, family_name, address, head_of_family, phone,
       monthly_income, food_assistance_status, is_npa, priority_score)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `

  db.getConnection((connErr, connection) => {
    if (connErr) return res.status(500).json({ error: connErr.message })

    connection.beginTransaction((txErr) => {
      if (txErr) {
        connection.release()
        return res.status(500).json({ error: txErr.message })
      }

      connection.query(
        familySql,
        [barangay_id, family_name, address, head_of_family, phone,
         monthlyIncomeValue, assistanceStatus, isNpaValue, priorityScoreValue],
        (familyErr, familyResult) => {
          if (familyErr) {
            return connection.rollback(() => {
              connection.release()
              res.status(500).json({ error: familyErr.message })
            })
          }

          const familyId = familyResult.insertId
          const householdId = generateHouseholdId(barangay_id, familyId)

          connection.query(
            'UPDATE families SET household_id = ? WHERE family_id = ?',
            [householdId, familyId],
            (hhErr) => {
              if (hhErr) console.error('Failed to set household_id:', hhErr)
            },
          )

          const memberRows = Array.isArray(members)
            ? members
                .filter((m) => m && (m.first_name || m.last_name))
                .map((m) => [
                  familyId,
                  m.first_name || null,
                  m.last_name || null,
                  m.date_of_birth || null,
                  m.gender || 'Other',
                  m.relationship || 'Other',
                  m.is_pwd ? 1 : 0,
                  m.height_cm !== undefined && m.height_cm !== null && m.height_cm !== '' ? Number(m.height_cm) : null,
                  m.weight_kg !== undefined && m.weight_kg !== null && m.weight_kg !== '' ? Number(m.weight_kg) : null,
                  m.nutritional_status || 'Unknown',
                ])
            : []

          if (memberRows.length === 0) {
            return connection.commit((commitErr) => {
              if (commitErr) {
                return connection.rollback(() => {
                  connection.release()
                  res.status(500).json({ error: commitErr.message })
                })
              }
              connection.release()
              res.json({ message: 'Family added!', family_id: familyId, household_id: householdId })
            })
          }

          const memberSql = `
            INSERT INTO family_members
              (family_id, first_name, last_name, date_of_birth, gender,
               relationship, is_pwd, height_cm, weight_kg, nutritional_status)
            VALUES ?
          `

          connection.query(memberSql, [memberRows], (memberErr) => {
            if (memberErr) {
              return connection.rollback(() => {
                connection.release()
                res.status(500).json({ error: memberErr.message })
              })
            }

            connection.commit((commitErr) => {
              if (commitErr) {
                return connection.rollback(() => {
                  connection.release()
                  res.status(500).json({ error: commitErr.message })
                })
              }
              connection.release()
              res.json({ message: 'Family added!', family_id: familyId, household_id: householdId })
            })
          })
        },
      )
    })
  })
})

// PUT update family
app.put('/api/families/:id', (req, res) => {
  const {
    barangay_id, family_name, address, head_of_family, phone,
    monthly_income, food_assistance_status, is_npa, priority_score,
  } = req.body
  const monthlyIncomeValue = monthly_income === undefined || monthly_income === null || monthly_income === '' ? null : Number(monthly_income)
  const isNpaValue = is_npa !== undefined ? (is_npa === 1 || is_npa === '1' || is_npa === true ? 1 : 0) : undefined
  const priorityScoreValue = priority_score !== undefined && priority_score !== null && priority_score !== '' ? Number(priority_score) : undefined
  const assistanceStatus = food_assistance_status

  let sql = `
    UPDATE families SET barangay_id=?, family_name=?, address=?, head_of_family=?, phone=?,
      monthly_income=?, food_assistance_status=?, is_npa=?, priority_score=?
  `
  const params = [
    barangay_id, family_name, address, head_of_family, phone,
    monthlyIncomeValue,
    assistanceStatus ?? 'None',
    isNpaValue ?? 0,
    priorityScoreValue ?? 0,
  ]

  sql += ' WHERE family_id=?'
  params.push(req.params.id)

  db.query(sql, params, (err) => {
    if (err) return res.status(500).json({ error: err.message })
    res.json({ message: 'Family updated!' })
  })
})

// DELETE family
app.delete('/api/families/:id', (req, res) => {
  db.query('DELETE FROM families WHERE family_id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message })
    res.json({ message: 'Family deleted!' })
  })
})

// ─── FAMILY MEMBERS ──────────────────────────────────────────────────────────

// GET all members of a family
app.get('/api/families/:id/members', (req, res) => {
  db.query('SELECT * FROM family_members WHERE family_id = ?', [req.params.id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message })
    res.json(results)
  })
})

// POST add member to a family
app.post('/api/families/:id/members', (req, res) => {
  const {
    first_name, last_name, date_of_birth, gender,
    relationship, is_pwd, height_cm, weight_kg, nutritional_status,
  } = req.body
  const sql = `
    INSERT INTO family_members
      (family_id, first_name, last_name, date_of_birth, gender,
       relationship, is_pwd, height_cm, weight_kg, nutritional_status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `
  const heightValue = height_cm !== undefined && height_cm !== null && height_cm !== '' ? Number(height_cm) : null
  const weightValue = weight_kg !== undefined && weight_kg !== null && weight_kg !== '' ? Number(weight_kg) : null
  db.query(
    sql,
    [
      req.params.id, first_name, last_name, date_of_birth || null, gender || 'Other',
      relationship || 'Other', is_pwd ? 1 : 0, heightValue, weightValue, nutritional_status || 'Unknown',
    ],
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message })
      res.json({ message: 'Member added!', member_id: results.insertId })
    },
  )
})

// PUT update family member
app.put('/api/members/:id', (req, res) => {
  const { first_name, last_name, date_of_birth, gender, relationship, is_pwd, height_cm, weight_kg, nutritional_status } = req.body
  const heightValue = height_cm !== undefined && height_cm !== null && height_cm !== '' ? Number(height_cm) : null
  const weightValue = weight_kg !== undefined && weight_kg !== null && weight_kg !== '' ? Number(weight_kg) : null
  db.query(
    `UPDATE family_members SET first_name=?, last_name=?, date_of_birth=?, gender=?, relationship=?, is_pwd=?, height_cm=?, weight_kg=?, nutritional_status=? WHERE member_id=?`,
    [first_name, last_name, date_of_birth || null, gender || 'Other', relationship || 'Other', is_pwd ? 1 : 0, heightValue, weightValue, nutritional_status || 'Unknown', req.params.id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message })
      res.json({ message: 'Member updated!' })
    },
  )
})

// DELETE family member
app.delete('/api/members/:id', (req, res) => {
  db.query('DELETE FROM family_members WHERE member_id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message })
    res.json({ message: 'Member deleted!' })
  })
})

// ─── INDIVIDUALS ─────────────────────────────────────────────────────────────

// GET all individuals (with barangay name)
app.get('/api/individuals', (req, res) => {
  const sql = `
    SELECT i.*, b.name AS barangay_name
    FROM individuals i
    LEFT JOIN barangays b ON i.barangay_id = b.barangay_id
  `
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err.message })
    res.json(encodeImageList(results))
  })
})

// POST add individual
app.post('/api/individuals', upload.single('image'), (req, res) => {
  const { name, date_of_birth, gender, barangay_id, registered_by_barangay_id, status, height_cm, weight_kg } = req.body
  const image = req.file ? req.file.buffer : null
  const dobValue = date_of_birth || null
  const barangayValue = barangay_id === undefined || barangay_id === null || barangay_id === '' ? null : Number(barangay_id)
  const registeredByValue = registered_by_barangay_id === undefined || registered_by_barangay_id === null || registered_by_barangay_id === '' ? null : Number(registered_by_barangay_id)
  const heightValue = height_cm !== undefined && height_cm !== null && height_cm !== '' ? Number(height_cm) : null
  const weightValue = weight_kg !== undefined && weight_kg !== null && weight_kg !== '' ? Number(weight_kg) : null
  const sql = `
    INSERT INTO individuals (name, date_of_birth, gender, barangay_id, registered_by_barangay_id, status, height_cm, weight_kg, image)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `
  db.query(sql, [name, dobValue, gender, barangayValue, registeredByValue, status, heightValue, weightValue, image], (err, results) => {
    if (err) return res.status(500).json({ error: err.message })
    res.json({ message: 'Individual registered!', individual_id: results.insertId })
  })
})

// PUT update individual
app.put('/api/individuals/:id', upload.single('image'), (req, res) => {
  const { name, date_of_birth, gender, barangay_id, status, height_cm, weight_kg, registered_by_barangay_id } = req.body
  const image = req.file ? req.file.buffer : null
  const dobValue = date_of_birth || null
  const barangayValue = barangay_id === undefined || barangay_id === null || barangay_id === '' ? null : Number(barangay_id)
  const registeredByBarangayValue = registered_by_barangay_id === undefined || registered_by_barangay_id === null || registered_by_barangay_id === '' ? null : Number(registered_by_barangay_id)
  const heightValue = height_cm !== undefined && height_cm !== null && height_cm !== '' ? Number(height_cm) : null
  const weightValue = weight_kg !== undefined && weight_kg !== null && weight_kg !== '' ? Number(weight_kg) : null
  let sql = `
    UPDATE individuals SET name=?, date_of_birth=?, gender=?, barangay_id=?, status=?, height_cm=?, weight_kg=?, registered_by_barangay_id=?
  `
  const params = [name, dobValue, gender, barangayValue, status, heightValue, weightValue, registeredByBarangayValue]

  if (image) {
    sql += ', image=?'
    params.push(image)
  }

  sql += ' WHERE individual_id=?'
  params.push(req.params.id)

  db.query(sql, params, (err) => {
    if (err) return res.status(500).json({ error: err.message })
    res.json({ message: 'Individual updated!' })
  })
})

// DELETE individual
app.delete('/api/individuals/:id', (req, res) => {
  db.query('DELETE FROM individuals WHERE individual_id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message })
    res.json({ message: 'Individual deleted!' })
  })
})

// GET nutritional status counts for all members in a barangay
app.get('/api/members/nutritional-stats', (req, res) => {
  const barangayId = req.query.barangay_id ? Number(req.query.barangay_id) : null
  if (!barangayId) return res.status(400).json({ error: 'barangay_id is required' })
  const sql = `
    SELECT fm.nutritional_status, COUNT(*) AS count
    FROM family_members fm
    JOIN families f ON fm.family_id = f.family_id
    WHERE f.barangay_id = ? AND f.is_active = 1
    GROUP BY fm.nutritional_status
  `
  db.query(sql, [barangayId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message })
    res.json(results)
  })
})

// ─── FOOD SUPPLIES ───────────────────────────────────────────────────────────

// GET all food supplies (optionally filtered by barangay_id)
app.get('/api/food-supplies', (req, res) => {
  const barangayId = req.query.barangay_id ? Number(req.query.barangay_id) : null
  const sql = barangayId
    ? 'SELECT * FROM food_supplies WHERE barangay_id = ?'
    : 'SELECT * FROM food_supplies'
  const params = barangayId ? [barangayId] : []
  db.query(sql, params, (err, results) => {
    if (err) return res.status(500).json({ error: err.message })
    res.json(results)
  })
})

// POST add food supply
app.post('/api/food-supplies', (req, res) => {
  const { food_name, unit, total_quantity, barangay_id } = req.body
  const barangayValue = barangay_id ? Number(barangay_id) : null
  const sql = `INSERT INTO food_supplies (food_name, unit, total_quantity, barangay_id) VALUES (?, ?, ?, ?)`
  db.query(sql, [food_name, unit, total_quantity, barangayValue], (err, results) => {
    if (err) return res.status(500).json({ error: err.message })
    res.json({ message: 'Food supply added!', food_id: results.insertId })
  })
})

// PUT update food supply
app.put('/api/food-supplies/:id', (req, res) => {
  const { food_name, unit, total_quantity, barangay_id } = req.body
  const barangayValue = barangay_id ? Number(barangay_id) : null
  const sql = `UPDATE food_supplies SET food_name=?, unit=?, total_quantity=?, barangay_id=? WHERE food_id=?`
  db.query(sql, [food_name, unit, total_quantity, barangayValue, req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message })
    res.json({ message: 'Food supply updated!' })
  })
})

// DELETE food supply
app.delete('/api/food-supplies/:id', (req, res) => {
  db.query('DELETE FROM food_supplies WHERE food_id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message })
    res.json({ message: 'Food supply deleted!' })
  })
})

// ─── DONORS ──────────────────────────────────────────────────────────────────

// GET all donors
app.get('/api/donors', (req, res) => {
  db.query('SELECT * FROM donors', (err, results) => {
    if (err) return res.status(500).json({ error: err.message })
    res.json(results)
  })
})

// POST add donor (with deduplication by name + email/phone)
app.post('/api/donors', (req, res) => {
  const { donor_name, contact_info, email, phone } = req.body
  const nameNorm = String(donor_name || '').trim()
  const emailNorm = email ? String(email).trim().toLowerCase() : null
  const phoneNorm = phone ? String(phone).trim() : null
  const contactNorm = contact_info ? String(contact_info).trim() : null

  // Try to find an existing donor with the same name + at least one matching contact field
  const conditions = ['LOWER(TRIM(donor_name)) = LOWER(TRIM(?))']
  const dedupParams = [nameNorm]
  const contactConditions = []
  if (emailNorm) { contactConditions.push('email = ?'); dedupParams.push(emailNorm) }
  if (phoneNorm) { contactConditions.push('phone = ?'); dedupParams.push(phoneNorm) }
  if (contactNorm) { contactConditions.push('contact_info = ?'); dedupParams.push(contactNorm) }

  if (contactConditions.length > 0) {
    conditions.push(`(${contactConditions.join(' OR ')})`)
  }

  const dedupSql = `SELECT donor_id FROM donors WHERE ${conditions.join(' AND ')} LIMIT 1`
  db.query(dedupSql, dedupParams, (findErr, rows) => {
    if (findErr) return res.status(500).json({ error: findErr.message })
    if (rows && rows[0]) {
      return res.json({ message: 'Existing donor found.', donor_id: rows[0].donor_id, existing: true })
    }
    db.query(
      'INSERT INTO donors (donor_name, contact_info, email, phone) VALUES (?, ?, ?, ?)',
      [nameNorm, contactNorm, emailNorm, phoneNorm],
      (err, results) => {
        if (err) return res.status(500).json({ error: err.message })
        res.json({ message: 'Donor added!', donor_id: results.insertId, existing: false })
      },
    )
  })
})

// ─── DONATIONS ───────────────────────────────────────────────────────────────

// GET all donations (with donor, food, and barangay names)
// ?include_archived=true returns archived records too (admin use)
app.get('/api/donations', (req, res) => {
  const includeArchived = req.query.include_archived === 'true'
  const sql = `
    SELECT dn.*, d.donor_name, f.food_name, f.unit, b.name AS barangay_name
    FROM donations dn
    LEFT JOIN donors d ON dn.donor_id = d.donor_id
    LEFT JOIN food_supplies f ON dn.food_id = f.food_id
    LEFT JOIN barangays b ON dn.barangay_id = b.barangay_id
    ${includeArchived ? '' : 'WHERE dn.is_archived = 0'}
  `
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err.message })
    res.json(encodeImageList(results))
  })
})

// POST add donation
app.post('/api/donations', upload.single('image'), (req, res) => {
  const { donor_id, food_id, food_description, donation_type, quantity, quantity_unit, date_given, barangay_id, payment_method, donor_message } = req.body
  const image = req.file ? req.file.buffer : null
  const donorValue = donor_id === undefined || donor_id === null || donor_id === '' ? null : Number(donor_id)
  const quantityValue = quantity === undefined || quantity === null || quantity === '' ? null : Number(quantity)
  const typedFoodDescription = String(food_description || '').trim()
  const unitValue = String(quantity_unit || 'unit').trim() || 'unit'
  const parsedFoodId = food_id === undefined || food_id === null || food_id === '' ? null : Number(food_id)
  const barangayValue = barangay_id === undefined || barangay_id === null || barangay_id === '' ? null : Number(barangay_id)
  const donationTypeValue = ['food', 'monetary', 'equipment'].includes(String(donation_type || '').toLowerCase())
    ? String(donation_type).toLowerCase() : 'food'
  const paymentMethodValue = payment_method ? String(payment_method).trim() : null
  const donorMessageValue = donor_message ? String(donor_message).trim() : null

  getUserFromToken(req, db, (authErr, reqUser) => {
    if (authErr) return res.status(500).json({ error: authErr.message })
    const isAdmin = reqUser && reqUser.role === 'Admin'
    // Admin-submitted donations are auto-approved; public submissions are pending
    const initialStatus = isAdmin ? 'approved' : 'pending'
    const approvedBy = isAdmin ? reqUser.user_id : null
    const approvedAt = isAdmin ? new Date() : null

    const finalizeDonation = (resolvedFoodId) => {
      const tracking = generateTrackingNumber()
      const sql = `
        INSERT INTO donations
          (donor_id, food_id, food_description, donation_type, quantity, quantity_unit, date_given, image, barangay_id, status, tracking_number, approved_by, approved_at, payment_method, donor_message)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
      db.query(
        sql,
        [donorValue, resolvedFoodId, typedFoodDescription || null, donationTypeValue, quantityValue, unitValue, date_given, image, barangayValue, initialStatus, tracking, approvedBy, approvedAt, paymentMethodValue, donorMessageValue],
        (err, results) => {
          if (err) return res.status(500).json({ error: err.message })

          // Only update food inventory when approved AND it's a food/equipment donation
          if (isAdmin && resolvedFoodId && quantityValue && donationTypeValue !== 'monetary') {
            db.query(
              'UPDATE food_supplies SET total_quantity = total_quantity + ? WHERE food_id = ?',
              [quantityValue, resolvedFoodId],
              (foodErr) => {
                if (foodErr) {
                  console.error('Failed to update food supply on approved donation:', foodErr)
                  return res.status(500).json({ error: foodErr.message })
                }
                res.json({ message: 'Donation recorded!', donation_id: results.insertId, tracking_number: tracking, status: initialStatus })
              },
            )
            return
          }

          res.json({ message: 'Donation recorded!', donation_id: results.insertId, tracking_number: tracking, status: initialStatus })
        },
      )
    }

    // Monetary donations never touch food_supply
    if (donationTypeValue === 'monetary') {
      finalizeDonation(null)
      return
    }

    if (parsedFoodId) {
      finalizeDonation(parsedFoodId)
      return
    }

    if (!typedFoodDescription) {
      finalizeDonation(null)
      return
    }

    // Look up or create food_supply row for this item + barangay
    const lookupSql = barangayValue
      ? 'SELECT food_id FROM food_supplies WHERE LOWER(TRIM(food_name)) = LOWER(TRIM(?)) AND barangay_id = ? LIMIT 1'
      : 'SELECT food_id FROM food_supplies WHERE LOWER(TRIM(food_name)) = LOWER(TRIM(?)) AND barangay_id IS NULL LIMIT 1'
    const lookupParams = barangayValue ? [typedFoodDescription, barangayValue] : [typedFoodDescription]
    const typeForSupply = donationTypeValue === 'equipment' ? 'equipment' : 'food'

    db.query(lookupSql, lookupParams, (findErr, rows) => {
      if (findErr) return res.status(500).json({ error: findErr.message })

      if (rows && rows[0] && rows[0].food_id) {
        finalizeDonation(Number(rows[0].food_id))
        return
      }

      db.query(
        'INSERT INTO food_supplies (food_name, unit, total_quantity, barangay_id, type) VALUES (?, ?, 0, ?, ?)',
        [typedFoodDescription, unitValue, barangayValue, typeForSupply],
        (insertFoodErr, insertFoodResult) => {
          if (insertFoodErr) return res.status(500).json({ error: insertFoodErr.message })
          finalizeDonation(Number(insertFoodResult.insertId))
        },
      )
    })
  })
})

// PUT approve donation (admin only)
app.put('/api/donations/:id/approve', (req, res) => {
  getUserFromToken(req, db, (authErr, reqUser) => {
    if (authErr) return res.status(500).json({ error: authErr.message })
    if (!reqUser || reqUser.role !== 'Admin') return res.status(403).json({ error: 'Admin access required.' })

    db.query(
      'SELECT donation_id, food_id, quantity, donation_type, status FROM donations WHERE donation_id = ?',
      [req.params.id],
      (fetchErr, rows) => {
        if (fetchErr) return res.status(500).json({ error: fetchErr.message })
        const donation = rows && rows[0] ? rows[0] : null
        if (!donation) return res.status(404).json({ error: 'Donation not found.' })
        if (donation.status === 'approved') return res.status(400).json({ error: 'Donation is already approved.' })

        db.query(
          'UPDATE donations SET status = ?, approved_by = ?, approved_at = NOW() WHERE donation_id = ?',
          ['approved', reqUser.user_id, req.params.id],
          (updateErr) => {
            if (updateErr) return res.status(500).json({ error: updateErr.message })

            // Add to food inventory only for food/equipment donations
            if (donation.food_id && donation.quantity && donation.donation_type !== 'monetary') {
              db.query(
                'UPDATE food_supplies SET total_quantity = total_quantity + ? WHERE food_id = ?',
                [donation.quantity, donation.food_id],
                (foodErr) => {
                  if (foodErr) console.error('Failed to update food supply on donation approval:', foodErr)
                },
              )
            }

            res.json({ message: 'Donation approved.' })
          },
        )
      },
    )
  })
})

// PUT reject donation (admin only)
app.put('/api/donations/:id/reject', (req, res) => {
  const { rejection_reason } = req.body
  getUserFromToken(req, db, (authErr, reqUser) => {
    if (authErr) return res.status(500).json({ error: authErr.message })
    if (!reqUser || reqUser.role !== 'Admin') return res.status(403).json({ error: 'Admin access required.' })

    db.query(
      'SELECT donation_id, status FROM donations WHERE donation_id = ?',
      [req.params.id],
      (fetchErr, rows) => {
        if (fetchErr) return res.status(500).json({ error: fetchErr.message })
        const donation = rows && rows[0] ? rows[0] : null
        if (!donation) return res.status(404).json({ error: 'Donation not found.' })
        if (donation.status === 'rejected') return res.status(400).json({ error: 'Donation is already rejected.' })

        db.query(
          'UPDATE donations SET status = ?, rejection_reason = ? WHERE donation_id = ?',
          ['rejected', rejection_reason || null, req.params.id],
          (updateErr) => {
            if (updateErr) return res.status(500).json({ error: updateErr.message })
            res.json({ message: 'Donation rejected.' })
          },
        )
      },
    )
  })
})

// ARCHIVE donation (admin only — soft delete for data retention compliance)
// Records are never hard-deleted; archived records are excluded from normal views.
app.delete('/api/donations/:id', (req, res) => {
  getUserFromToken(req, db, (authErr, reqUser) => {
    if (authErr) return res.status(500).json({ error: authErr.message })
    if (!reqUser || reqUser.role !== 'Admin') return res.status(403).json({ error: 'Admin access required.' })

    db.query(
      'SELECT donation_id, is_archived FROM donations WHERE donation_id = ?',
      [req.params.id],
      (fetchErr, rows) => {
        if (fetchErr) return res.status(500).json({ error: fetchErr.message })
        const existing = rows && rows[0] ? rows[0] : null
        if (!existing) return res.status(404).json({ error: 'Donation not found.' })
        if (existing.is_archived) return res.status(400).json({ error: 'Donation is already archived.' })

        db.query(
          'UPDATE donations SET is_archived = 1, archived_at = NOW(), archived_by = ? WHERE donation_id = ?',
          [reqUser.user_id, req.params.id],
          (err) => {
            if (err) return res.status(500).json({ error: err.message })
            res.json({ message: 'Donation archived.' })
          },
        )
      },
    )
  })
})

// ─── USERS ───────────────────────────────────────────────────────────────────

// GET all users (with barangay name, no password)
app.get('/api/users', (req, res) => {
  const sql = `
    SELECT
      u.user_id,
      u.name,
      u.email,
      u.role,
      u.barangay_id,
      u.created_at,
      b.name AS barangay_name
    FROM users u
    LEFT JOIN barangays b ON u.barangay_id = b.barangay_id
    ORDER BY u.created_at DESC
  `

  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err.message })
    res.json(results)
  })
})

// DELETE user
app.delete('/api/users/:id', (req, res) => {
  db.query('DELETE FROM users WHERE user_id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message })
    res.json({ message: 'User deleted!' })
  })
})

// ─── DISTRIBUTION ─────────────────────────────────────────────────────────────

// GET activity logs for transparency
app.get('/api/activity-logs', (req, res) => {
  const limitValue = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100)
  const sql = `
    SELECT
      log.activity_id,
      log.distribution_id,
      log.action,
      log.staff_user_id,
      log.staff_name,
      log.staff_email,
      log.distribution_details,
      log.performed_at,
      dist.recipient_type,
      dist.family_id,
      dist.individual_id,
      dist.barangay_id,
      dist.food_id,
      dist.quantity,
      dist.date_given,
      dist.status,
      b.name AS barangay_name,
      f.food_name,
      f.unit,
      fam.family_name,
      i.name AS individual_name
    FROM distribution_activity_logs log
    LEFT JOIN distribution dist ON log.distribution_id = dist.distribution_id
    LEFT JOIN barangays b ON dist.barangay_id = b.barangay_id
    LEFT JOIN food_supplies f ON dist.food_id = f.food_id
    LEFT JOIN families fam ON dist.family_id = fam.family_id
    LEFT JOIN individuals i ON dist.individual_id = i.individual_id
    ORDER BY log.performed_at DESC, log.activity_id DESC
    LIMIT ?
  `

  db.query(sql, [limitValue], (err, results) => {
    if (err) return res.status(500).json({ error: err.message })
    res.json(results)
  })
})

// GET all distributions (with names)
app.get('/api/distributions', (req, res) => {
  const sql = `
    SELECT 
      dist.*,
      b.name AS barangay_name,
      f.food_name, f.unit,
      fam.family_name,
      i.name AS individual_name
    FROM distribution dist
    LEFT JOIN barangays b ON dist.barangay_id = b.barangay_id
    LEFT JOIN food_supplies f ON dist.food_id = f.food_id
    LEFT JOIN families fam ON dist.family_id = fam.family_id
    LEFT JOIN individuals i ON dist.individual_id = i.individual_id
  `
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err.message })
    res.json(encodeImageList(results))
  })
})

// POST add distribution
app.post('/api/distributions', upload.single('image'), (req, res) => {
  const { recipient_type, family_id, individual_id, barangay_id, distribution_type, food_id, quantity, date_given, status } = req.body
  const image = req.file ? req.file.buffer : null
  const actor = getRequestActor(req)
  const familyValue = family_id === undefined || family_id === null || family_id === '' ? null : Number(family_id)
  const individualValue = individual_id === undefined || individual_id === null || individual_id === '' ? null : Number(individual_id)
  const barangayValue = barangay_id === undefined || barangay_id === null || barangay_id === '' ? null : Number(barangay_id)
  const distributionTypeValue = String(distribution_type || 'Food').trim() || 'Food'
  const foodValue = food_id === undefined || food_id === null || food_id === '' ? null : Number(food_id)
  const quantityValue = quantity === undefined || quantity === null || quantity === '' ? null : Number(quantity)
  const statusValue = String(status || 'Pending').trim()

  // Validate available quantity before inserting
  const checkAndInsert = () => {
    const insertAndRespond = () => {
      const sql = `
        INSERT INTO distribution
        (recipient_type, family_id, individual_id, barangay_id, distribution_type, food_id, quantity, date_given, status, image)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
      db.query(
        sql,
        [recipient_type, familyValue, individualValue, barangayValue, distributionTypeValue, distributionTypeValue === 'Food' ? foodValue : null, quantityValue, date_given, statusValue, image],
        (err, results) => {
          if (err) return res.status(500).json({ error: err.message })

          // Deduct inventory only when status is Completed
          if (statusValue === 'Completed' && distributionTypeValue === 'Food' && foodValue && quantityValue) {
            db.query(
              'UPDATE food_supplies SET total_quantity = GREATEST(0, total_quantity - ?) WHERE food_id = ?',
              [quantityValue, foodValue],
              (foodErr) => { if (foodErr) console.error('Failed to update food supply on completed distribution:', foodErr) },
            )
          }

          const selectSql = `
            SELECT
              dist.*,
              b.name AS barangay_name,
              f.food_name,
              f.unit,
              fam.family_name,
              i.name AS individual_name
            FROM distribution dist
            LEFT JOIN barangays b ON dist.barangay_id = b.barangay_id
            LEFT JOIN food_supplies f ON dist.food_id = f.food_id
            LEFT JOIN families fam ON dist.family_id = fam.family_id
            LEFT JOIN individuals i ON dist.individual_id = i.individual_id
            WHERE dist.distribution_id = ?
          `

          db.query(selectSql, [results.insertId], (selectErr, rows) => {
            const distribution = rows && rows[0] ? rows[0] : {
              distribution_id: results.insertId,
              recipient_type,
              family_id: familyValue,
              individual_id: individualValue,
              barangay_id: barangayValue,
              distribution_type: distributionTypeValue,
              food_id: foodValue,
              quantity: quantityValue,
              date_given,
              status: statusValue,
            }

            persistActivityLog(db, distribution, determineDistributionAction(statusValue, 'created'), actor, (logErr) => {
              if (logErr) console.error('Failed to write distribution activity log:', logErr)
              if (selectErr) console.error('Failed to reload distribution for activity log:', selectErr)
              res.json({ message: 'Distribution recorded!', distribution_id: results.insertId })
            })
          })
        },
      )
    }

    if (distributionTypeValue === 'Food' && foodValue && quantityValue) {
      db.query('SELECT total_quantity FROM food_supplies WHERE food_id = ?', [foodValue], (checkErr, rows) => {
        if (checkErr) return res.status(500).json({ error: checkErr.message })
        const available = rows && rows[0] ? Number(rows[0].total_quantity) : 0
        if (quantityValue > available) {
          return res.status(400).json({ error: `Insufficient stock. Available: ${available}, Requested: ${quantityValue}` })
        }
        insertAndRespond()
      })
    } else {
      insertAndRespond()
    }
  }

  checkAndInsert()
})

// PUT update distribution status
app.put('/api/distributions/:id', upload.single('image'), (req, res) => {
  const { status } = req.body
  const image = req.file ? req.file.buffer : null
  const actor = getRequestActor(req)
  const newStatus = String(status || '').trim()

  // Fetch current distribution to check status transition for inventory
  db.query(
    'SELECT distribution_id, status, food_id, quantity, distribution_type FROM distribution WHERE distribution_id = ?',
    [req.params.id],
    (fetchErr, fetchRows) => {
      if (fetchErr) return res.status(500).json({ error: fetchErr.message })
      const current = fetchRows && fetchRows[0] ? fetchRows[0] : null
      const oldStatus = current ? current.status : null

      let sql = 'UPDATE distribution SET status=?'
      const params = [newStatus]
      if (image) { sql += ', image=?'; params.push(image) }
      sql += ' WHERE distribution_id=?'
      params.push(req.params.id)

      db.query(sql, params, (err) => {
        if (err) return res.status(500).json({ error: err.message })

        // Inventory transitions: only adjust for Food distributions
        if (current && current.distribution_type === 'Food' && current.food_id && current.quantity) {
          const wasCompleted = String(oldStatus || '').toLowerCase() === 'completed'
          const isNowCompleted = newStatus.toLowerCase() === 'completed'

          if (!wasCompleted && isNowCompleted) {
            // Transitioning TO Completed → deduct from inventory
            db.query(
              'UPDATE food_supplies SET total_quantity = GREATEST(0, total_quantity - ?) WHERE food_id = ?',
              [current.quantity, current.food_id],
              (foodErr) => { if (foodErr) console.error('Failed to deduct food supply on completion:', foodErr) },
            )
          } else if (wasCompleted && !isNowCompleted) {
            // Reverting FROM Completed → restore inventory
            db.query(
              'UPDATE food_supplies SET total_quantity = total_quantity + ? WHERE food_id = ?',
              [current.quantity, current.food_id],
              (foodErr) => { if (foodErr) console.error('Failed to restore food supply on revert:', foodErr) },
            )
          }
        }

        const selectSql = `
          SELECT
            dist.*,
            b.name AS barangay_name,
            f.food_name,
            f.unit,
            fam.family_name,
            i.name AS individual_name
          FROM distribution dist
          LEFT JOIN barangays b ON dist.barangay_id = b.barangay_id
          LEFT JOIN food_supplies f ON dist.food_id = f.food_id
          LEFT JOIN families fam ON dist.family_id = fam.family_id
          LEFT JOIN individuals i ON dist.individual_id = i.individual_id
          WHERE dist.distribution_id = ?
        `

        db.query(selectSql, [req.params.id], (selectErr, rows) => {
          const distribution = rows && rows[0] ? rows[0] : { distribution_id: Number(req.params.id), status: newStatus }

          // Recalculate priority score for the affected family so score reflects
          // whether they've just been served (equity rotation) or un-served.
          if (distribution.family_id) {
            recalculateFamilyPriorityScore(distribution.family_id, db)
          }

          persistActivityLog(db, distribution, determineDistributionAction(newStatus, 'updated'), actor, (logErr) => {
            if (logErr) console.error('Failed to write distribution activity log:', logErr)
            if (selectErr) console.error('Failed to reload distribution for activity log:', selectErr)
            res.json({ message: 'Distribution status updated!' })
          })
        })
      })
    },
  )
})

// DELETE distribution
app.delete('/api/distributions/:id', (req, res) => {
  const actor = getRequestActor(req)
  const selectSql = `
    SELECT
      dist.*,
      b.name AS barangay_name,
      f.food_name,
      f.unit,
      fam.family_name,
      i.name AS individual_name
    FROM distribution dist
    LEFT JOIN barangays b ON dist.barangay_id = b.barangay_id
    LEFT JOIN food_supplies f ON dist.food_id = f.food_id
    LEFT JOIN families fam ON dist.family_id = fam.family_id
    LEFT JOIN individuals i ON dist.individual_id = i.individual_id
    WHERE dist.distribution_id = ?
  `

  db.query(selectSql, [req.params.id], (selectErr, rows) => {
    const distribution = rows && rows[0] ? rows[0] : { distribution_id: Number(req.params.id) }

    // Only restore inventory if the distribution was actually Completed (inventory was deducted)
    if (distribution.food_id && distribution.quantity && String(distribution.status || '').toLowerCase() === 'completed') {
      db.query(
        'UPDATE food_supplies SET total_quantity = total_quantity + ? WHERE food_id = ?',
        [distribution.quantity, distribution.food_id],
        (foodErr) => { if (foodErr) console.error('Failed to restore food supply on distribution delete:', foodErr) },
      )
    }

    persistActivityLog(db, distribution, 'deleted', actor, (logErr) => {
      if (logErr) console.error('Failed to write distribution activity log:', logErr)
      if (selectErr) console.error('Failed to reload distribution for activity log:', selectErr)

      db.query('DELETE FROM distribution WHERE distribution_id = ?', [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message })
        res.json({ message: 'Distribution deleted!' })
      })
    })
  })
})

// ─── DASHBOARD STATS ─────────────────────────────────────────────────────────

// GET summary stats for AdminDashboardPage
app.get('/api/stats', (req, res) => {
  const queries = {
    totalFamilies: 'SELECT COUNT(*) AS count FROM families',
    totalIndividuals: 'SELECT COUNT(*) AS count FROM individuals',
    pendingDistributions: "SELECT COUNT(*) AS count FROM distribution WHERE status = 'Pending'",
    totalFoodSupply: 'SELECT SUM(total_quantity) AS count FROM food_supplies',
  }

  const results = {}
  let completed = 0
  const keys = Object.keys(queries)

  keys.forEach((key) => {
    db.query(queries[key], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message })
      results[key] = rows[0].count || 0
      completed++
      if (completed === keys.length) {
        res.json(results)
      }
    })
  })
})

// ─── AUTH ───────────────────────────────────────────────────────────────────

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' })
  }

  const userSql = `
    SELECT u.*, b.name AS barangay_name
    FROM users u
    LEFT JOIN barangays b ON u.barangay_id = b.barangay_id
    WHERE u.email = ?
  `

  db.query(userSql, [email], (err, results) => {
    if (err) return res.status(500).json({ message: err.message })
    if (!results || results.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials.' })
    }

    const user = results[0]

    bcrypt.compare(password, user.password, (compareErr, isMatch) => {
      if (compareErr) return res.status(500).json({ message: compareErr.message })
      if (!isMatch) return res.status(401).json({ message: 'Invalid credentials.' })

      return res.json({
        token: `phams-${user.user_id}-token`,
        user: {
          user_id: user.user_id,
          name: user.name,
          full_name: user.name,
          email: user.email,
          role: user.role,
          barangay_id: user.barangay_id,
          barangay: user.barangay_name,
        },
      })
    })
  })
})

// Register new user
app.post('/api/auth/register', (req, res) => {
  const { name, email, password, role, barangay_id } = req.body

  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: 'Name, email, password, and role are required.' })
  }

  if (role !== 'Admin' && role !== 'Staff') {
    return res.status(400).json({ message: 'Role must be Admin or Staff.' })
  }

  const normalizedEmail = String(email).trim().toLowerCase()
  const barangayValue = barangay_id ? Number(barangay_id) : null

  db.query('SELECT user_id FROM users WHERE email = ?', [normalizedEmail], (checkErr, rows) => {
    if (checkErr) return res.status(500).json({ message: checkErr.message })
    if (rows && rows.length > 0) {
      return res.status(409).json({ message: 'Email already exists.' })
    }

    bcrypt.hash(password, 10, (hashErr, hashedPassword) => {
      if (hashErr) return res.status(500).json({ message: hashErr.message })

      const sql = `
        INSERT INTO users (name, email, password, role, barangay_id)
        VALUES (?, ?, ?, ?, ?)
      `

      db.query(sql, [name, normalizedEmail, hashedPassword, role, barangayValue], (insertErr, result) => {
        if (insertErr) return res.status(500).json({ message: insertErr.message })
        res.json({ message: 'User created successfully.', user_id: result.insertId })
      })
    })
  })
})

// ─── START SERVER ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 8080

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
