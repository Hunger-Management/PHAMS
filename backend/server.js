const express = require('express')
const mysql = require('mysql2')
const cors = require('cors')
const path = require('path')
const bcrypt = require('bcryptjs')
require('dotenv').config({ path: path.join(__dirname, '.env') })

const app = express()
app.use(cors())
app.use(express.json())

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`)
  next()
})

// ─── DB CONNECTION ───────────────────────────────────────────────────────────
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
})

db.connect((err) => {
  if (err) {
    console.error('❌ Database connection failed:', err)
    return
  }
  console.log('✅ Connected to zero_hunger database!')
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
    res.json(results)
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
    res.json(results[0])
  })
})

// POST add new family
app.post('/api/families', (req, res) => {
  const { barangay_id, family_name, address, head_of_family, phone, members = [] } = req.body
  const familySql = `
    INSERT INTO families (barangay_id, family_name, address, head_of_family, phone)
    VALUES (?, ?, ?, ?, ?)
  `

  db.beginTransaction((txErr) => {
    if (txErr) return res.status(500).json({ error: txErr.message })

    db.query(
      familySql,
      [barangay_id, family_name, address, head_of_family, phone],
      (familyErr, familyResult) => {
        if (familyErr) {
          return db.rollback(() => res.status(500).json({ error: familyErr.message }))
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
          return db.commit((commitErr) => {
            if (commitErr) {
              return db.rollback(() => res.status(500).json({ error: commitErr.message }))
            }
            res.json({ message: 'Family added!', family_id: familyId })
          })
        }

        const memberSql = `
          INSERT INTO family_members (family_id, first_name, last_name, age, gender)
          VALUES ?
        `

        db.query(memberSql, [memberRows], (memberErr) => {
          if (memberErr) {
            return db.rollback(() => res.status(500).json({ error: memberErr.message }))
          }

          db.commit((commitErr) => {
            if (commitErr) {
              return db.rollback(() => res.status(500).json({ error: commitErr.message }))
            }
            res.json({ message: 'Family added!', family_id: familyId })
          })
        })
      },
    )
  })
})

// PUT update family
app.put('/api/families/:id', (req, res) => {
  const { barangay_id, family_name, address, head_of_family, phone } = req.body
  const sql = `
    UPDATE families SET barangay_id=?, family_name=?, address=?, head_of_family=?, phone=?
    WHERE family_id=?
  `
  db.query(sql, [barangay_id, family_name, address, head_of_family, phone, req.params.id], (err) => {
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
    res.json(results)
  })
})

// POST add individual
app.post('/api/individuals', (req, res) => {
  const { name, age, gender, barangay_id, status } = req.body
  const sql = `
    INSERT INTO individuals (name, age, gender, barangay_id, status)
    VALUES (?, ?, ?, ?, ?)
  `
  db.query(sql, [name, age, gender, barangay_id, status], (err, results) => {
    if (err) return res.status(500).json({ error: err.message })
    res.json({ message: 'Individual registered!', individual_id: results.insertId })
  })
})

// PUT update individual
app.put('/api/individuals/:id', (req, res) => {
  const { name, age, gender, barangay_id, status } = req.body
  const sql = `
    UPDATE individuals SET name=?, age=?, gender=?, barangay_id=?, status=?
    WHERE individual_id=?
  `
  db.query(sql, [name, age, gender, barangay_id, status, req.params.id], (err) => {
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
    res.json(results)
  })
})

// POST add donation
app.post('/api/donations', (req, res) => {
  const { donor_id, food_id, quantity, date_given } = req.body
  const sql = `INSERT INTO donations (donor_id, food_id, quantity, date_given) VALUES (?, ?, ?, ?)`
  db.query(sql, [donor_id, food_id, quantity, date_given], (err, results) => {
    if (err) return res.status(500).json({ error: err.message })
    res.json({ message: 'Donation recorded!', donation_id: results.insertId })
  })
})

// ─── DISTRIBUTION ─────────────────────────────────────────────────────────────

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
    res.json(results)
  })
})

// POST add distribution
app.post('/api/distributions', (req, res) => {
  const { recipient_type, family_id, individual_id, barangay_id, food_id, quantity, date_given, status } = req.body
  const sql = `
    INSERT INTO distribution 
    (recipient_type, family_id, individual_id, barangay_id, food_id, quantity, date_given, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `
  db.query(sql, [recipient_type, family_id, individual_id, barangay_id, food_id, quantity, date_given, status], (err, results) => {
    if (err) return res.status(500).json({ error: err.message })
    res.json({ message: 'Distribution recorded!', distribution_id: results.insertId })
  })
})

// PUT update distribution status
app.put('/api/distributions/:id', (req, res) => {
  const { status } = req.body
  db.query('UPDATE distribution SET status=? WHERE distribution_id=?', [status, req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message })
    res.json({ message: 'Distribution status updated!' })
  })
})

// DELETE distribution
app.delete('/api/distributions/:id', (req, res) => {
  db.query('DELETE FROM distribution WHERE distribution_id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message })
    res.json({ message: 'Distribution deleted!' })
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

  db.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
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
app.listen(process.env.PORT || 3000, () => {
  console.log(`🚀 Server running on http://192.168.1.5:${process.env.PORT || 3000}`)
})
