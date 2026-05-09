require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })
const path = require('path')
const mysql = require('mysql2/promise')

async function main() {
  const url = 'http://localhost:3000/api/auth/register'
  const email = `testuser_${Date.now()}@barangay.gov.ph`
  const body = { name: 'Test User', email, password: 'Test1234', role: 'Staff' }

  console.log('POSTing to', url, 'with email', email)
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    const text = await res.text()
    let data
    try { data = text ? JSON.parse(text) : {} } catch { data = text }
    console.log('Register response status', res.status)
    console.log('Register response body:', data)
  } catch (err) {
    console.error('Register request failed:', err)
  }

  // Wait briefly to ensure DB commit
  await new Promise((r) => setTimeout(r, 500))

  const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } = process.env
  if (!DB_HOST || !DB_USER || !DB_NAME) {
    console.error('Missing DB env vars; check backend/.env')
    process.exit(1)
  }

  const conn = await mysql.createConnection({
    host: DB_HOST,
    port: Number(DB_PORT || 3306),
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
  })

  const [rows] = await conn.execute('SELECT user_id, name, email, role FROM users WHERE email = ?', [email])
  console.log('DB lookup result:', rows)
  await conn.end()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
