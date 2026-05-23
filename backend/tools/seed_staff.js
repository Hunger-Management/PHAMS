/**
 * Deletes any existing test staff accounts and registers one staff account
 * per barangay against the live Railway backend.
 *
 * Usage:
 *   node backend/tools/seed_staff.js
 *
 * Default password for all created staff: Staff1234
 */

const API_URL = 'https://web-production-59ac1.up.railway.app'
const PASSWORD = 'Staff1234'

const STAFF = [
  { name: 'Staff Aguho',                  email: 'staff-aguho@pateros.gov.ph',                  barangay: 'Aguho' },
  { name: 'Staff Magtanggol',             email: 'staff-magtanggol@pateros.gov.ph',             barangay: 'Magtanggol' },
  { name: 'Staff Martires del 96',        email: 'staff-martires-del-96@pateros.gov.ph',        barangay: "Martires del '96" },
  { name: 'Staff Poblacion',              email: 'staff-poblacion@pateros.gov.ph',              barangay: 'Poblacion' },
  { name: 'Staff San Pedro',              email: 'staff-san-pedro@pateros.gov.ph',              barangay: 'San Pedro' },
  { name: 'Staff San Roque',              email: 'staff-san-roque@pateros.gov.ph',              barangay: 'San Roque' },
  { name: 'Staff Santa Ana',              email: 'staff-santa-ana@pateros.gov.ph',              barangay: 'Santa Ana' },
  { name: 'Staff Santo Rosario Kanluran', email: 'staff-santo-rosario-kanluran@pateros.gov.ph', barangay: 'Santo Rosario-Kanluran' },
  { name: 'Staff Santo Rosario Silangan', email: 'staff-santo-rosario-silangan@pateros.gov.ph', barangay: 'Santo Rosario-Silangan' },
  { name: 'Staff Tabacalera',             email: 'staff-tabacalera@pateros.gov.ph',             barangay: 'Tabacalera' },
]

async function main() {
  // ── Step 1: Fetch barangay IDs from the live DB ───────────────────────────
  console.log('Fetching barangays from Railway...')
  const barangays = await fetch(`${API_URL}/api/barangays`).then((r) => r.json())
  const barangayMap = {}
  for (const b of barangays) {
    barangayMap[b.name] = b.barangay_id
  }
  console.log('Barangay IDs found:', barangayMap)

  // ── Step 2: Delete existing test / seed staff accounts ────────────────────
  console.log('\nFetching existing users...')
  const users = await fetch(`${API_URL}/api/users`).then((r) => r.json())
  const toDelete = users.filter(
    (u) =>
      u.role === 'Staff' &&
      (u.name === 'Test Staff' ||
        String(u.email).includes('example_staff') ||
        String(u.email).includes('testuser_')),
  )

  if (toDelete.length === 0) {
    console.log('No test staff accounts found to delete.')
  }
  for (const s of toDelete) {
    process.stdout.write(`  Deleting "${s.name}" (${s.email}) [id=${s.user_id}]... `)
    const r = await fetch(`${API_URL}/api/users/${s.user_id}`, { method: 'DELETE' })
    const data = await r.json()
    console.log(r.ok ? `OK — ${data.message}` : `FAILED — ${JSON.stringify(data)}`)
  }

  // ── Step 3: Register one staff account per barangay ───────────────────────
  console.log('\nRegistering staff accounts...')
  for (const staff of STAFF) {
    const barangay_id = barangayMap[staff.barangay]
    if (!barangay_id) {
      console.warn(`  ⚠  No barangay_id for "${staff.barangay}" — skipping`)
      continue
    }

    process.stdout.write(`  Registering ${staff.name} (${staff.email})... `)
    const r = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: staff.name,
        email: staff.email,
        password: PASSWORD,
        role: 'Staff',
        barangay_id,
      }),
    })
    const data = await r.json()
    if (r.ok) {
      console.log(`OK (user_id=${data.user_id}, barangay_id=${barangay_id})`)
    } else {
      console.warn(`FAILED — ${data.message}`)
    }
  }

  console.log('\nDone! All staff accounts seeded.')
  console.log(`Default password for all: ${PASSWORD}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
