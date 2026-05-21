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
      f.*,
      b.name AS barangay_name,
      (SELECT COUNT(*) FROM family_members fm WHERE fm.family_id = f.family_id) AS member_count
    FROM families f
    LEFT JOIN barangays b ON f.barangay_id = b.barangay_id
  `
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err.message })
    res.json(encodeImageList(results))
  })
})

// GET single family
app.get('/api/families/:id', (req, res) => {
  const sql = `
    SELECT
      f.*,
      b.name AS barangay_name,
      (SELECT COUNT(*) FROM family_members fm WHERE fm.family_id = f.family_id) AS member_count
    FROM families f
    LEFT JOIN barangays b ON f.barangay_id = b.barangay_id
    WHERE f.family_id = ?
  `
  db.query(sql, [req.params.id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message })
    res.json(encodeImage(results[0]))
  })
})

// POST add new family
app.post('/api/families', upload.single('image'), (req, res) => {
  const { barangay_id, family_name, address, head_of_family, phone } = req.body
  const image = req.file ? req.file.buffer : null
  let members = []

  if (req.body.members) {
    try {
      const parsed = JSON.parse(req.body.members)
      members = Array.isArray(parsed) ? parsed : []
    } catch {
      members = []
    }
  }
  const familySql = `
    INSERT INTO families (barangay_id, family_name, address, head_of_family, phone, image)
    VALUES (?, ?, ?, ?, ?, ?)
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
        [barangay_id, family_name, address, head_of_family, phone, image],
        (familyErr, familyResult) => {
          if (familyErr) {
            return connection.rollback(() => {
              connection.release()
              res.status(500).json({ error: familyErr.message })
            })
          }

          const familyId = familyResult.insertId
          const memberRows = Array.isArray(members)
            ? members
                .filter((m) => m && (m.first_name || m.last_name))
                .map((m) => [
                  familyId,
                  m.first_name || null,
                  m.last_name || null,
                  m.age ?? null,
                  m.gender || 'Other',
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
              res.json({ message: 'Family added!', family_id: familyId })
            })
          }

          const memberSql = `
            INSERT INTO family_members (family_id, first_name, last_name, age, gender)
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
              res.json({ message: 'Family added!', family_id: familyId })
            })
          })
        },
      )
    })
  })
})

// PUT update family
app.put('/api/families/:id', upload.single('image'), (req, res) => {
  const { barangay_id, family_name, address, head_of_family, phone } = req.body
  const image = req.file ? req.file.buffer : null
  let sql = `
    UPDATE families SET barangay_id=?, family_name=?, address=?, head_of_family=?, phone=?
  `
  const params = [barangay_id, family_name, address, head_of_family, phone]

  if (image) {
    sql += ', image=?'
    params.push(image)
  }

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
  const { first_name, last_name, age, gender } = req.body
  const sql = `
    INSERT INTO family_members (family_id, first_name, last_name, age, gender)
    VALUES (?, ?, ?, ?, ?)
  `
  db.query(sql, [req.params.id, first_name, last_name, age, gender], (err, results) => {
    if (err) return res.status(500).json({ error: err.message })
    res.json({ message: 'Member added!', member_id: results.insertId })
  })
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
  const { name, age, gender, barangay_id, status } = req.body
  const image = req.file ? req.file.buffer : null
  const ageValue = age === undefined || age === null || age === '' ? null : Number(age)
  const barangayValue = barangay_id === undefined || barangay_id === null || barangay_id === '' ? null : Number(barangay_id)
  const sql = `
    INSERT INTO individuals (name, age, gender, barangay_id, status, image)
    VALUES (?, ?, ?, ?, ?, ?)
  `
  db.query(sql, [name, ageValue, gender, barangayValue, status, image], (err, results) => {
    if (err) return res.status(500).json({ error: err.message })
    res.json({ message: 'Individual registered!', individual_id: results.insertId })
  })
})

// PUT update individual
app.put('/api/individuals/:id', upload.single('image'), (req, res) => {
  const { name, age, gender, barangay_id, status } = req.body
  const image = req.file ? req.file.buffer : null
  const ageValue = age === undefined || age === null || age === '' ? null : Number(age)
  const barangayValue = barangay_id === undefined || barangay_id === null || barangay_id === '' ? null : Number(barangay_id)
  let sql = `
    UPDATE individuals SET name=?, age=?, gender=?, barangay_id=?, status=?
  `
  const params = [name, ageValue, gender, barangayValue, status]

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

// ─── FOOD SUPPLIES ───────────────────────────────────────────────────────────

// GET all food supplies
app.get('/api/food-supplies', (req, res) => {
  db.query('SELECT * FROM food_supplies', (err, results) => {
    if (err) return res.status(500).json({ error: err.message })
    res.json(results)
  })
})

// POST add food supply
app.post('/api/food-supplies', (req, res) => {
  const { food_name, unit, total_quantity } = req.body
  const sql = `INSERT INTO food_supplies (food_name, unit, total_quantity) VALUES (?, ?, ?)`
  db.query(sql, [food_name, unit, total_quantity], (err, results) => {
    if (err) return res.status(500).json({ error: err.message })
    res.json({ message: 'Food supply added!', food_id: results.insertId })
  })
})

// PUT update food supply
app.put('/api/food-supplies/:id', (req, res) => {
  const { food_name, unit, total_quantity } = req.body
  const sql = `UPDATE food_supplies SET food_name=?, unit=?, total_quantity=? WHERE food_id=?`
  db.query(sql, [food_name, unit, total_quantity, req.params.id], (err) => {
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

// POST add donor
app.post('/api/donors', (req, res) => {
  const { donor_name, contact_info } = req.body
  const sql = `INSERT INTO donors (donor_name, contact_info) VALUES (?, ?)`
  db.query(sql, [donor_name, contact_info], (err, results) => {
    if (err) return res.status(500).json({ error: err.message })
    res.json({ message: 'Donor added!', donor_id: results.insertId })
  })
})

// ─── DONATIONS ───────────────────────────────────────────────────────────────

// GET all donations (with donor and food names)
app.get('/api/donations', (req, res) => {
  const sql = `
    SELECT dn.*, d.donor_name, f.food_name, f.unit
    FROM donations dn
    LEFT JOIN donors d ON dn.donor_id = d.donor_id
    LEFT JOIN food_supplies f ON dn.food_id = f.food_id
  `
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err.message })
    res.json(encodeImageList(results))
  })
})

// POST add donation
app.post('/api/donations', upload.single('image'), (req, res) => {
  const { donor_id, food_id, quantity, date_given } = req.body
  const image = req.file ? req.file.buffer : null
  const donorValue = donor_id === undefined || donor_id === null || donor_id === '' ? null : Number(donor_id)
  const foodValue = food_id === undefined || food_id === null || food_id === '' ? null : Number(food_id)
  const quantityValue = quantity === undefined || quantity === null || quantity === '' ? null : Number(quantity)
  const sql = `
    INSERT INTO donations (donor_id, food_id, quantity, date_given, image)
    VALUES (?, ?, ?, ?, ?)
  `
  db.query(sql, [donorValue, foodValue, quantityValue, date_given, image], (err, results) => {
    if (err) return res.status(500).json({ error: err.message })

    if (foodValue && quantityValue) {
      db.query(
        'UPDATE food_supplies SET total_quantity = total_quantity + ? WHERE food_id = ?',
        [quantityValue, foodValue],
        (foodErr) => { if (foodErr) console.error('Failed to update food supply on donation:', foodErr) },
      )
    }

    res.json({ message: 'Donation recorded!', donation_id: results.insertId })
  })
})

// DELETE donation
app.delete('/api/donations/:id', (req, res) => {
  db.query('SELECT food_id, quantity FROM donations WHERE donation_id = ?', [req.params.id], (fetchErr, rows) => {
    const existing = rows && rows[0] ? rows[0] : null

    db.query('DELETE FROM donations WHERE donation_id = ?', [req.params.id], (err) => {
      if (err) return res.status(500).json({ error: err.message })

      if (existing && existing.food_id && existing.quantity) {
        db.query(
          'UPDATE food_supplies SET total_quantity = GREATEST(0, total_quantity - ?) WHERE food_id = ?',
          [existing.quantity, existing.food_id],
          (foodErr) => { if (foodErr) console.error('Failed to update food supply on donation delete:', foodErr) },
        )
      }

      res.json({ message: 'Donation deleted!' })
    })
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
  const { recipient_type, family_id, individual_id, barangay_id, food_id, quantity, date_given, status } = req.body
  const image = req.file ? req.file.buffer : null
  const actor = getRequestActor(req)
  const familyValue = family_id === undefined || family_id === null || family_id === '' ? null : Number(family_id)
  const individualValue = individual_id === undefined || individual_id === null || individual_id === '' ? null : Number(individual_id)
  const barangayValue = barangay_id === undefined || barangay_id === null || barangay_id === '' ? null : Number(barangay_id)
  const foodValue = food_id === undefined || food_id === null || food_id === '' ? null : Number(food_id)
  const quantityValue = quantity === undefined || quantity === null || quantity === '' ? null : Number(quantity)
  const sql = `
    INSERT INTO distribution 
    (recipient_type, family_id, individual_id, barangay_id, food_id, quantity, date_given, status, image)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `
  db.query(sql, [recipient_type, familyValue, individualValue, barangayValue, foodValue, quantityValue, date_given, status, image], (err, results) => {
    if (err) return res.status(500).json({ error: err.message })

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

    if (foodValue && quantityValue) {
      db.query(
        'UPDATE food_supplies SET total_quantity = GREATEST(0, total_quantity - ?) WHERE food_id = ?',
        [quantityValue, foodValue],
        (foodErr) => { if (foodErr) console.error('Failed to update food supply on distribution:', foodErr) },
      )
    }

    db.query(selectSql, [results.insertId], (selectErr, rows) => {
      const distribution = rows && rows[0] ? rows[0] : {
        distribution_id: results.insertId,
        recipient_type,
        family_id: familyValue,
        individual_id: individualValue,
        barangay_id: barangayValue,
        food_id: foodValue,
        quantity: quantityValue,
        date_given,
        status,
      }

      persistActivityLog(db, distribution, determineDistributionAction(status, 'created'), actor, (logErr) => {
        if (logErr) console.error('Failed to write distribution activity log:', logErr)
        if (selectErr) console.error('Failed to reload distribution for activity log:', selectErr)
        res.json({ message: 'Distribution recorded!', distribution_id: results.insertId })
      })
    })
  })
})

// PUT update distribution status
app.put('/api/distributions/:id', upload.single('image'), (req, res) => {
  const { status } = req.body
  const image = req.file ? req.file.buffer : null
  const actor = getRequestActor(req)
  let sql = 'UPDATE distribution SET status=?'
  const params = [status]

  if (image) {
    sql += ', image=?'
    params.push(image)
  }

  sql += ' WHERE distribution_id=?'
  params.push(req.params.id)

  db.query(sql, params, (err) => {
    if (err) return res.status(500).json({ error: err.message })

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
      const distribution = rows && rows[0] ? rows[0] : { distribution_id: Number(req.params.id), status }
      persistActivityLog(db, distribution, determineDistributionAction(status, 'updated'), actor, (logErr) => {
        if (logErr) console.error('Failed to write distribution activity log:', logErr)
        if (selectErr) console.error('Failed to reload distribution for activity log:', selectErr)
        res.json({ message: 'Distribution status updated!' })
      })
    })
  })
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

    if (distribution.food_id && distribution.quantity) {
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
