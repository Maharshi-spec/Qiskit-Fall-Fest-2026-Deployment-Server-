const test = require('node:test')
const assert = require('node:assert/strict')
process.env.NODE_ENV = 'test'
const http = require('node:http')
const jwt = require('jsonwebtoken')
const ExcelJS = require('exceljs')
const app = require('../src/app')
const { pool } = require('../src/config/database')
const { initializeDatabase } = require('../src/config/database-init')
const { runWithProfile } = require('../src/middleware/profile.middleware')
const registrationService = require('../src/services/registration.service')

let server
let baseUrl
let organizerToken
let originalPostConfig = null

const generateOrganizerToken = (role = 'ORGANIZER') => {
  return jwt.sign(
    {
      userId: 1,
      organizerId: 1,
      email: 'admin@qiskitfallfest.com',
      role,
    },
    process.env.JWT_SECRET || 'dev-secret',
    { expiresIn: '1h' },
  )
}

const fakeFile = {
  originalname: 'idcard.jpg',
  mimetype: 'image/jpeg',
  buffer: Buffer.from('fake-id-card-content'),
  size: 200,
}

const timestamp = Date.now()
const preEmails = {
  alice: `exp_alice_${timestamp}@example.com`,
  bob: `exp_bob_${timestamp}@example.com`,
  charlie: `exp_charlie_${timestamp}@example.com`,
}
const postEmails = {
  david: `exp_david_${timestamp}@example.com`,
}

test.before(async () => {
  await initializeDatabase()
  server = http.createServer(app)
  await new Promise((resolve) => server.listen(0, resolve))
  baseUrl = `http://127.0.0.1:${server.address().port}`
  organizerToken = generateOrganizerToken('ORGANIZER')

  // Save current post_qiskit_config
  const confRes = await pool.query('SELECT * FROM post_qiskit_config ORDER BY id ASC LIMIT 1')
  originalPostConfig = confRes.rows[0] || null

  // Ensure Post-Qiskit is enabled & registration open
  await pool.query(`
    UPDATE post_qiskit_config
    SET enabled = TRUE, registration_open = TRUE
    WHERE id = (SELECT id FROM post_qiskit_config ORDER BY id ASC LIMIT 1)
  `)

  // Register Pre-Qiskit participants
  // 1. Alice: Accommodation = Yes, Transport = Yes
  await registrationService.registerUser(
    {
      fullName: 'Alice Quantum',
      email: preEmails.alice,
      mobileNumber: '09876543210',
      role: 'STUDENT',
      instituteName: 'CUTMAP Institute',
      department: 'CSE',
      knowsPython: true,
      aicteQuantumCourse: false,
      knowsQuantumBasics: true,
      usedQiskitBefore: false,
      accommodation_required: true,
      local_transport_required: true,
    },
    fakeFile,
  )

  // 2. Bob: Accommodation = No, Transport = Yes
  await registrationService.registerUser(
    {
      fullName: 'Bob Physics',
      email: preEmails.bob,
      mobileNumber: '09123456789',
      role: 'FACULTY',
      instituteName: 'Andhra University',
      department: 'Physics',
      knowsPython: true,
      aicteQuantumCourse: true,
      knowsQuantumBasics: true,
      usedQiskitBefore: true,
      accommodation_required: false,
      local_transport_required: true,
    },
    fakeFile,
  )

  // 3. Charlie: Accommodation = Yes, Transport = No
  await registrationService.registerUser(
    {
      fullName: 'Charlie Tech',
      email: preEmails.charlie,
      mobileNumber: '9988776655',
      role: 'PROFESSIONAL',
      instituteName: 'Tech Corp',
      department: 'R&D',
      knowsPython: false,
      aicteQuantumCourse: false,
      knowsQuantumBasics: false,
      usedQiskitBefore: false,
      accommodation_required: true,
      local_transport_required: false,
    },
    fakeFile,
  )

  // Register Post-Qiskit participant (David)
  await runWithProfile('post-qiskit', async () => {
    await registrationService.registerUser(
      {
        fullName: 'David Post',
        email: postEmails.david,
        mobileNumber: '08877665544',
        role: 'STUDENT',
        instituteName: 'Post Qiskit Academy',
        department: 'Mathematics',
        knowsPython: true,
        aicteQuantumCourse: false,
        knowsQuantumBasics: true,
        usedQiskitBefore: false,
        accommodation_required: false,
        local_transport_required: false,
      },
      fakeFile,
    )
  })
})

test.after(async () => {
  // Clean up Pre-Qiskit test registrations
  const allPreEmails = Object.values(preEmails)
  await pool.query('DELETE FROM registrations WHERE email = ANY($1::text[])', [allPreEmails])

  // Clean up Post-Qiskit test registrations
  const allPostEmails = Object.values(postEmails)
  await pool.query('DELETE FROM post_qiskit_registrations WHERE email = ANY($1::text[])', [allPostEmails])

  // Restore post_qiskit_config
  if (originalPostConfig) {
    await pool.query(
      `UPDATE post_qiskit_config
       SET enabled = $1, registration_open = $2
       WHERE id = $3`,
      [originalPostConfig.enabled, originalPostConfig.registration_open, originalPostConfig.id],
    )
  }

  if (server) {
    await new Promise((resolve) => server.close(resolve))
  }
})

// Test 1: GET /admin/participants returns phone property alongside mobileNumber
test('1. GET /api/v1/admin/participants returns phone property alongside mobileNumber', async () => {
  const res = await fetch(`${baseUrl}/api/v1/admin/participants`, {
    headers: {
      Authorization: `Bearer ${organizerToken}`,
      'X-Event-Profile': 'pre-qiskit',
    },
  })
  assert.equal(res.status, 200)
  const body = await res.json()
  assert.equal(body.success, true)
  assert.ok(Array.isArray(body.data))

  const alice = body.data.find((p) => p.email === preEmails.alice)
  assert.ok(alice, 'Alice should be returned in participants list')
  assert.equal(alice.phone, '09876543210')
  assert.equal(alice.mobileNumber, '09876543210')
  assert.equal(alice.accommodation_required, true)
  assert.equal(alice.local_transport_required, true)
})

// Test 2: GET /admin/participants returns phone for Post-Qiskit participants
test('2. GET /api/v1/admin/participants returns phone for Post-Qiskit participants', async () => {
  const res = await fetch(`${baseUrl}/api/v1/admin/participants`, {
    headers: {
      Authorization: `Bearer ${organizerToken}`,
      'X-Event-Profile': 'post-qiskit',
    },
  })
  assert.equal(res.status, 200)
  const body = await res.json()
  assert.equal(body.success, true)

  const david = body.data.find((p) => p.email === postEmails.david)
  assert.ok(david, 'David should be in Post-Qiskit participants')
  assert.equal(david.phone, '08877665544')
  assert.equal(david.mobileNumber, '08877665544')
})

// Test 3: Profile isolation in participants API
test('3. Pre-Qiskit and Post-Qiskit participants remain strictly isolated in API', async () => {
  const preRes = await fetch(`${baseUrl}/api/v1/admin/participants`, {
    headers: {
      Authorization: `Bearer ${organizerToken}`,
      'X-Event-Profile': 'pre-qiskit',
    },
  })
  const preBody = await preRes.json()
  assert.ok(!preBody.data.some((p) => p.email === postEmails.david), 'Post participant must not appear in Pre-Qiskit')

  const postRes = await fetch(`${baseUrl}/api/v1/admin/participants`, {
    headers: {
      Authorization: `Bearer ${organizerToken}`,
      'X-Event-Profile': 'post-qiskit',
    },
  })
  const postBody = await postRes.json()
  assert.ok(!postBody.data.some((p) => p.email === preEmails.alice), 'Pre participant must not appear in Post-Qiskit')
})

// Test 4: Export endpoint requires authentication (401 without auth)
test('4. GET /api/v1/admin/participants/export returns 401 without authorization header', async () => {
  const res = await fetch(`${baseUrl}/api/v1/admin/participants/export`)
  assert.equal(res.status, 401)
  const body = await res.json()
  assert.equal(body.success, false)
  assert.equal(body.error.code, 'UNAUTHORIZED')
})

// Test 5: Export endpoint rejects non-organizer role (403 Forbidden)
test('5. GET /api/v1/admin/participants/export returns 403 with non-organizer role', async () => {
  const studentToken = generateOrganizerToken('STUDENT')
  const res = await fetch(`${baseUrl}/api/v1/admin/participants/export`, {
    headers: { Authorization: `Bearer ${studentToken}` },
  })
  assert.equal(res.status, 403)
  const body = await res.json()
  assert.equal(body.success, false)
  assert.equal(body.error.code, 'FORBIDDEN')
})

// Test 6: Export endpoint returns 200, XLSX mime type, and Content-Disposition header
test('6. GET /api/v1/admin/participants/export returns 200 with XLSX headers and filename', async () => {
  const res = await fetch(`${baseUrl}/api/v1/admin/participants/export`, {
    headers: {
      Authorization: `Bearer ${organizerToken}`,
      'X-Event-Profile': 'pre-qiskit',
    },
  })
  assert.equal(res.status, 200)
  assert.equal(res.headers.get('content-type'), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  const contentDisp = res.headers.get('content-disposition') || ''
  assert.ok(contentDisp.includes('attachment; filename="Qiskit-Fall-Fest-2026-Participants-'))
  assert.ok(contentDisp.endsWith('.xlsx"'))
})

// Test 7: Exported file is a valid Excel workbook loadable by ExcelJS
test('7. Exported file is a valid Excel workbook parseable by ExcelJS', async () => {
  const res = await fetch(`${baseUrl}/api/v1/admin/participants/export`, {
    headers: {
      Authorization: `Bearer ${organizerToken}`,
      'X-Event-Profile': 'pre-qiskit',
    },
  })
  const arrayBuffer = await res.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(buffer)
  assert.ok(workbook.worksheets.length > 0, 'Workbook must contain at least one worksheet')
})

// Test 8: Worksheet is named "Participants" with frozen header and auto-filter
test('8. Worksheet has sheet name Participants, frozen top row, and auto-filter enabled', async () => {
  const res = await fetch(`${baseUrl}/api/v1/admin/participants/export`, {
    headers: {
      Authorization: `Bearer ${organizerToken}`,
      'X-Event-Profile': 'pre-qiskit',
    },
  })
  const buffer = Buffer.from(await res.arrayBuffer())
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(buffer)

  const sheet = workbook.getWorksheet('Participants')
  assert.ok(sheet, 'Worksheet named Participants must exist')
  assert.ok(sheet.views && sheet.views.some((v) => v.ySplit === 1), 'Header row must be frozen (ySplit = 1)')
  assert.ok(sheet.autoFilter, 'Auto-filter must be enabled')
})

// Test 9: Correct 13 columns in exact order with styled header
test('9. Export contains all 13 required columns in exact order with purple header styling', async () => {
  const res = await fetch(`${baseUrl}/api/v1/admin/participants/export`, {
    headers: {
      Authorization: `Bearer ${organizerToken}`,
      'X-Event-Profile': 'pre-qiskit',
    },
  })
  const buffer = Buffer.from(await res.arrayBuffer())
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(buffer)
  const sheet = workbook.getWorksheet('Participants')

  const expectedHeaders = [
    'Registration ID',
    'Full Name',
    'Email',
    'Phone Number',
    'College / Institution',
    'Department',
    'Year',
    'Gender',
    'Accommodation Required',
    'Local Transport Required',
    'Registration Date',
    'Event / Profile',
    'Registration Status',
  ]

  const headerRow = sheet.getRow(1)
  expectedHeaders.forEach((expected, idx) => {
    const cell = headerRow.getCell(idx + 1)
    assert.equal(cell.value, expected, `Column ${idx + 1} header should be ${expected}`)
    assert.ok(cell.font?.bold, `Header ${expected} should be bold`)
    assert.equal(cell.font?.color?.argb?.toUpperCase(), 'FFFFFFFF', 'Header font should be white')
    assert.equal(cell.fill?.fgColor?.argb?.toUpperCase(), 'FF3D2F59', 'Header background should be #3D2F59')
  })
})

// Test 10: Phone Number and Registration ID formatted/stored as TEXT to preserve zeroes
test('10. Phone Number and Registration ID are formatted as text (@) preventing scientific notation', async () => {
  const res = await fetch(`${baseUrl}/api/v1/admin/participants/export`, {
    headers: {
      Authorization: `Bearer ${organizerToken}`,
      'X-Event-Profile': 'pre-qiskit',
    },
  })
  const buffer = Buffer.from(await res.arrayBuffer())
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(buffer)
  const sheet = workbook.getWorksheet('Participants')

  // Find row for Alice (phone: '09876543210')
  let aliceRow = null
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1 && row.getCell(3).value === preEmails.alice) {
      aliceRow = row
    }
  })

  assert.ok(aliceRow, 'Alice row must be found in sheet')
  const regIdCell = aliceRow.getCell(1)
  const phoneCell = aliceRow.getCell(4)

  assert.equal(typeof phoneCell.value, 'string', 'Phone value must be string')
  assert.equal(phoneCell.value, '09876543210', 'Leading zero in phone must be preserved')
  assert.equal(phoneCell.numFmt, '@', 'Phone cell numFmt should be text format @')
  assert.equal(typeof regIdCell.value, 'string', 'Registration ID value must be string')
  assert.equal(regIdCell.numFmt, '@', 'Registration ID numFmt should be text format @')
})

// Test 11: Accommodation and Local Transport values formatted as "Yes" or "No"
test('11. Accommodation and Local Transport columns display Yes / No values', async () => {
  const res = await fetch(`${baseUrl}/api/v1/admin/participants/export`, {
    headers: {
      Authorization: `Bearer ${organizerToken}`,
      'X-Event-Profile': 'pre-qiskit',
    },
  })
  const buffer = Buffer.from(await res.arrayBuffer())
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(buffer)
  const sheet = workbook.getWorksheet('Participants')

  let aliceRow, bobRow, charlieRow
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) {
      const email = row.getCell(3).value
      if (email === preEmails.alice) aliceRow = row
      if (email === preEmails.bob) bobRow = row
      if (email === preEmails.charlie) charlieRow = row
    }
  })

  assert.ok(aliceRow && bobRow && charlieRow, 'All test participants should be present')

  // Alice: Acc=Yes, Trans=Yes
  assert.equal(aliceRow.getCell(9).value, 'Yes', 'Alice accommodation should be Yes')
  assert.equal(aliceRow.getCell(10).value, 'Yes', 'Alice transport should be Yes')

  // Bob: Acc=No, Trans=Yes
  assert.equal(bobRow.getCell(9).value, 'No', 'Bob accommodation should be No')
  assert.equal(bobRow.getCell(10).value, 'Yes', 'Bob transport should be Yes')

  // Charlie: Acc=Yes, Trans=No
  assert.equal(charlieRow.getCell(9).value, 'Yes', 'Charlie accommodation should be Yes')
  assert.equal(charlieRow.getCell(10).value, 'No', 'Charlie transport should be No')
})

// Test 12: Year and Gender columns are empty strings (no invented fields)
test('12. Year and Gender columns are empty strings (no invented DB schema columns)', async () => {
  const res = await fetch(`${baseUrl}/api/v1/admin/participants/export`, {
    headers: {
      Authorization: `Bearer ${organizerToken}`,
      'X-Event-Profile': 'pre-qiskit',
    },
  })
  const buffer = Buffer.from(await res.arrayBuffer())
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(buffer)
  const sheet = workbook.getWorksheet('Participants')

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) {
      const yearVal = row.getCell(7).value || ''
      const genderVal = row.getCell(8).value || ''
      assert.equal(yearVal, '', 'Year column must be empty')
      assert.equal(genderVal, '', 'Gender column must be empty')
    }
  })
})

// Test 13: Export respects active query filters and event profile isolation
test('13. Export respects active filters (accommodation, local transport, search) and profile isolation', async () => {
  // A. Filter by accommodation=required
  const accRes = await fetch(`${baseUrl}/api/v1/admin/participants/export?accommodation=required`, {
    headers: {
      Authorization: `Bearer ${organizerToken}`,
      'X-Event-Profile': 'pre-qiskit',
    },
  })
  const accWb = new ExcelJS.Workbook()
  await accWb.xlsx.load(Buffer.from(await accRes.arrayBuffer()))
  const accSheet = accWb.getWorksheet('Participants')
  const accEmails = []
  accSheet.eachRow((row, num) => {
    if (num > 1) accEmails.push(row.getCell(3).value)
  })
  assert.ok(accEmails.includes(preEmails.alice), 'Alice (Acc=Yes) should be in accommodation filter')
  assert.ok(accEmails.includes(preEmails.charlie), 'Charlie (Acc=Yes) should be in accommodation filter')
  assert.ok(!accEmails.includes(preEmails.bob), 'Bob (Acc=No) must NOT be in accommodation filter')

  // B. Filter by local_transport=required
  const transRes = await fetch(`${baseUrl}/api/v1/admin/participants/export?local_transport=required`, {
    headers: {
      Authorization: `Bearer ${organizerToken}`,
      'X-Event-Profile': 'pre-qiskit',
    },
  })
  const transWb = new ExcelJS.Workbook()
  await transWb.xlsx.load(Buffer.from(await transRes.arrayBuffer()))
  const transSheet = transWb.getWorksheet('Participants')
  const transEmails = []
  transSheet.eachRow((row, num) => {
    if (num > 1) transEmails.push(row.getCell(3).value)
  })
  assert.ok(transEmails.includes(preEmails.alice), 'Alice (Trans=Yes) should be in transport filter')
  assert.ok(transEmails.includes(preEmails.bob), 'Bob (Trans=Yes) should be in transport filter')
  assert.ok(!transEmails.includes(preEmails.charlie), 'Charlie (Trans=No) must NOT be in transport filter')

  // C. Filter by search term matching phone number
  const searchRes = await fetch(`${baseUrl}/api/v1/admin/participants/export?search=09123456789`, {
    headers: {
      Authorization: `Bearer ${organizerToken}`,
      'X-Event-Profile': 'pre-qiskit',
    },
  })
  const searchWb = new ExcelJS.Workbook()
  await searchWb.xlsx.load(Buffer.from(await searchRes.arrayBuffer()))
  const searchSheet = searchWb.getWorksheet('Participants')
  const searchEmails = []
  searchSheet.eachRow((row, num) => {
    if (num > 1) searchEmails.push(row.getCell(3).value)
  })
  assert.ok(searchEmails.includes(preEmails.bob), 'Search by phone should match Bob')
  assert.ok(!searchEmails.includes(preEmails.alice), 'Search by Bob phone should NOT match Alice')

  // D. Post-Qiskit export profile isolation
  const postRes = await fetch(`${baseUrl}/api/v1/admin/participants/export`, {
    headers: {
      Authorization: `Bearer ${organizerToken}`,
      'X-Event-Profile': 'post-qiskit',
    },
  })
  const postWb = new ExcelJS.Workbook()
  await postWb.xlsx.load(Buffer.from(await postRes.arrayBuffer()))
  const postSheet = postWb.getWorksheet('Participants')
  const postEmailsInSheet = []
  postSheet.eachRow((row, num) => {
    if (num > 1) {
      postEmailsInSheet.push(row.getCell(3).value)
      assert.equal(row.getCell(12).value, 'Post-Qiskit', 'Profile column should say Post-Qiskit')
    }
  })
  assert.ok(postEmailsInSheet.includes(postEmails.david), 'Post-Qiskit export must contain David')
  assert.ok(!postEmailsInSheet.includes(preEmails.alice), 'Post-Qiskit export must NOT contain Alice')
})
