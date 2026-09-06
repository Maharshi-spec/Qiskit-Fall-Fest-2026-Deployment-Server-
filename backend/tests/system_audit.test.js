const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { pool } = require('../src/config/database')
const registrationService = require('../src/services/registration.service')

const projectRoot = path.resolve(__dirname, '../..')

const createTestRegistrationPayload = (email, fullName = 'Audit User') => ({
  fullName,
  email,
  mobileNumber: '9998887770',
  role: 'STUDENT',
  instituteName: 'CUTM',
  department: 'CSE',
  knowsPython: true,
  aicteQuantumCourse: false,
  knowsQuantumBasics: true,
  usedQiskitBefore: false,
})

test('A. Registration & DB Commit', async () => {
  const testEmail = `audit_test_${Date.now()}@example.com`
  const fakeFile = {
    originalname: 'idcard.jpg',
    mimetype: 'image/jpeg',
    buffer: Buffer.from('fake-image-bytes'),
    size: 100,
  }

  const payload = createTestRegistrationPayload(testEmail, 'Audit User')
  const result = await registrationService.registerUser(payload, fakeFile)

  assert.equal(result.success, true)
  assert.ok(result.data.registrationId.startsWith('QFF26-R-'))
  assert.ok(result.data.token)

  // Verify in PostgreSQL
  const dbCheck = await pool.query('SELECT * FROM registrations WHERE email = $1 LIMIT 1', [testEmail])
  assert.equal(dbCheck.rows.length, 1)
  assert.equal(dbCheck.rows[0].registration_id, result.data.registrationId)

  // Cleanup
  await pool.query('DELETE FROM registrations WHERE email = $1', [testEmail])
})

test('B. Duplicate Email returns HTTP 409 EMAIL_ALREADY_REGISTERED', async () => {
  const testEmail = `audit_dup_${Date.now()}@example.com`
  const fakeFile = {
    originalname: 'idcard.jpg',
    mimetype: 'image/jpeg',
    buffer: Buffer.from('fake-image-bytes'),
    size: 100,
  }

  const payload = createTestRegistrationPayload(testEmail, 'Duplicate User')

  // Register first time
  await registrationService.registerUser(payload, fakeFile)

  // Register second time -> must throw AppError with status 409 and EMAIL_ALREADY_REGISTERED
  let thrown = null
  try {
    await registrationService.registerUser(payload, fakeFile)
  } catch (err) {
    thrown = err
  }

  assert.ok(thrown)
  assert.equal(thrown.statusCode, 409)
  assert.equal(thrown.code, 'EMAIL_ALREADY_REGISTERED')
  assert.equal(thrown.message, 'This email is already registered.')

  // Cleanup
  await pool.query('DELETE FROM registrations WHERE email = $1', [testEmail])
})

test('C. Participant Login', async () => {
  const testEmail = `audit_login_${Date.now()}@example.com`
  const fakeFile = {
    originalname: 'idcard.jpg',
    mimetype: 'image/jpeg',
    buffer: Buffer.from('fake-image-bytes'),
    size: 100,
  }

  const payload = createTestRegistrationPayload(testEmail, 'Login User')

  const regRes = await registrationService.registerUser(payload, fakeFile)
  const regId = regRes.data.registrationId

  // Valid credentials
  const loginRes = await registrationService.loginParticipant({ email: testEmail, registrationId: regId })
  assert.equal(loginRes.success, true)
  assert.ok(loginRes.data.token)

  // Invalid registration ID
  let invalidRes = null
  try {
    await registrationService.loginParticipant({ email: testEmail, registrationId: 'QFF26-R-00000-WRONG' })
  } catch (err) {
    invalidRes = err
  }
  assert.ok(invalidRes)
  assert.equal(invalidRes.statusCode, 401)

  // Cleanup
  await pool.query('DELETE FROM registrations WHERE email = $1', [testEmail])
})

test('D. Organizer Login with Bcrypt', async () => {
  const testOrgEmail = `audit_org_${Date.now()}@example.com`
  const plainPassword = 'SecureOrgPass123!'
  const hashedPassword = await bcrypt.hash(plainPassword, 10)

  // Insert test organizer into database
  await pool.query(
    'INSERT INTO organizers (email, password) VALUES ($1, $2) ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password',
    [testOrgEmail, hashedPassword]
  )

  // Login with correct bcrypt password
  const loginRes = await registrationService.loginOrganizer({ email: testOrgEmail, password: plainPassword })
  assert.equal(loginRes.success, true)
  assert.ok(loginRes.data.token)
  assert.equal(loginRes.data.user.role, 'ORGANIZER')

  // Login with incorrect password
  let invalidOrgErr = null
  try {
    await registrationService.loginOrganizer({ email: testOrgEmail, password: 'WrongPassword' })
  } catch (err) {
    invalidOrgErr = err
  }
  assert.ok(invalidOrgErr)
  assert.equal(invalidOrgErr.statusCode, 401)

  // Cleanup
  await pool.query('DELETE FROM organizers WHERE email = $1', [testOrgEmail])
})

test('E. JWT Session & /me endpoint', async () => {
  const testEmail = `audit_jwt_${Date.now()}@example.com`
  const fakeFile = {
    originalname: 'idcard.jpg',
    mimetype: 'image/jpeg',
    buffer: Buffer.from('fake-image-bytes'),
    size: 100,
  }

  const payload = createTestRegistrationPayload(testEmail, 'JWT User')
  const regRes = await registrationService.registerUser(payload, fakeFile)

  const token = regRes.data.token

  // Valid /me
  const meRes = await registrationService.getCurrentParticipant(`Bearer ${token}`)
  assert.equal(meRes.success, true)
  assert.equal(meRes.data.registration.email, testEmail)

  // Invalid token /me
  let invalidMeErr = null
  try {
    await registrationService.getCurrentParticipant('Bearer invalid.jwt.token')
  } catch (err) {
    invalidMeErr = err
  }
  assert.ok(invalidMeErr)
  assert.equal(invalidMeErr.statusCode, 401)

  // Cleanup
  await pool.query('DELETE FROM registrations WHERE email = $1', [testEmail])
})

test('F. Attendance Flow — Zero Runtime DDL', () => {
  const serviceCode = fs.readFileSync(path.resolve(__dirname, '../src/services/registration.service.js'), 'utf8')
  assert.equal(serviceCode.includes('ensureAttendanceTable'), false, 'ensureAttendanceTable must be completely removed from registration.service.js')
  assert.equal(serviceCode.includes('CREATE TABLE IF NOT EXISTS attendance'), false, 'No inline DDL should exist in service files')
})

test('G. Sequence References Scan', () => {
  const backendSrcDir = path.resolve(__dirname, '../src')
  const readAllJsFiles = (dir) => {
    let files = []
    for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, item.name)
      if (item.isDirectory()) {
        files = files.concat(readAllJsFiles(fullPath))
      } else if (item.name.endsWith('.js')) {
        files.push(fullPath)
      }
    }
    return files
  }

  const jsFiles = readAllJsFiles(backendSrcDir)
  for (const file of jsFiles) {
    const code = fs.readFileSync(file, 'utf8')
    assert.equal(
      code.includes('certificates_certificate_number_seq'),
      false,
      `File ${file} contains obsolete sequence certificates_certificate_number_seq`
    )
  }
})

test('H. Supabase Footprint Scan', () => {
  const checkDirs = ['backend/src', 'frontend/src']
  const bannedTerms = ['@supabase', 'createClient', 'SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY']

  const scanDir = (dirRelative) => {
    const absoluteDir = path.resolve(projectRoot, dirRelative)
    if (!fs.existsSync(absoluteDir)) return
    const items = fs.readdirSync(absoluteDir, { recursive: true })
    for (const item of items) {
      const fullPath = path.join(absoluteDir, item)
      if (fs.statSync(fullPath).isFile() && (fullPath.endsWith('.js') || fullPath.endsWith('.jsx') || fullPath.endsWith('.ts') || fullPath.endsWith('.tsx'))) {
        const content = fs.readFileSync(fullPath, 'utf8')
        for (const term of bannedTerms) {
          assert.equal(
            content.includes(term),
            false,
            `File ${fullPath} contains active Supabase reference: ${term}`
          )
        }
      }
    }
  }

  for (const dir of checkDirs) {
    scanDir(dir)
  }
})
