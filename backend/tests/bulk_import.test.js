const { test, describe, before, after } = require('node:test')
const assert = require('node:assert/strict')
const { pool } = require('../src/config/database')
const registrationService = require('../src/services/registration.service')

describe('Bulk Student Registration Test Suite', () => {
  const testEmails = [
    `bulk_test_1_${Date.now()}@example.com`,
    `bulk_test_2_${Date.now()}@example.com`,
    `bulk_test_3_${Date.now()}@example.com`,
  ]

  after(async () => {
    // Cleanup created test registrations
    await pool.query('DELETE FROM registrations WHERE email = ANY($1::text[])', [testEmails])
  })

  test('1. Dry run validates records without writing to database or generating IDs', async () => {
    const students = [
      {
        name: 'Dry Run Student 1',
        college: 'Test University',
        phone: '09876543210',
        email: testEmails[0],
      },
      {
        name: 'Dry Run Student 2',
        college: 'Another College',
        phone: '01234567890',
        email: testEmails[1],
      },
    ]

    const result = await registrationService.bulkImportStudents(students, { dryRun: true })
    assert.equal(result.success, true)
    assert.equal(result.data.dryRun, true)
    assert.equal(result.data.summary.totalRecords, 2)
    assert.equal(result.data.summary.newlyRegistered, 2)
    assert.equal(result.data.summary.alreadyRegistered, 0)
    assert.equal(result.data.summary.invalidRecords, 0)

    // Verify nothing was written to DB
    const dbCheck = await pool.query('SELECT * FROM registrations WHERE email = ANY($1::text[])', [[testEmails[0], testEmails[1]]])
    assert.equal(dbCheck.rows.length, 0)
  })

  test('2. Real import creates valid registrations with system-generated IDs and role STUDENT', async () => {
    const students = [
      {
        name: 'Real Import Student 1',
        college: 'Quantum Institute',
        phone: '08330968388',
        email: testEmails[0],
      },
    ]

    const result = await registrationService.bulkImportStudents(students, { dryRun: false })
    assert.equal(result.success, true)
    assert.equal(result.data.summary.newlyRegistered, 1)

    const record = result.data.results[0]
    assert.equal(record.email, testEmails[0].toLowerCase())
    assert.match(record.registrationId, /^QFF26-R-\d{5}$/)
    assert.equal(record.status, 'SUCCESS')
    assert.equal(record.emailStatus, 'SENT')

    // Verify DB insertion
    const dbRow = await pool.query('SELECT * FROM registrations WHERE email = $1', [testEmails[0]])
    assert.equal(dbRow.rows.length, 1)
    assert.equal(dbRow.rows[0].full_name, 'Real Import Student 1')
    assert.equal(dbRow.rows[0].role, 'STUDENT')
    assert.equal(dbRow.rows[0].institute_name, 'Quantum Institute')
    assert.equal(dbRow.rows[0].mobile_number, '08330968388')
    assert.equal(dbRow.rows[0].status, 'CONFIRMED')
  })

  test('3. Duplicate email detection prevents re-registration and returns existing registration ID', async () => {
    const students = [
      {
        name: 'Duplicate Attempt',
        college: 'Duplicate College',
        phone: '09999999999',
        email: testEmails[0], // Already registered in test 2
      },
    ]

    const result = await registrationService.bulkImportStudents(students, { dryRun: false })
    assert.equal(result.success, true)
    assert.equal(result.data.summary.alreadyRegistered, 1)
    assert.equal(result.data.summary.newlyRegistered, 0)

    const record = result.data.results[0]
    assert.equal(record.status, 'ALREADY_REGISTERED')
    assert.match(record.registrationId, /^QFF26-R-\d{5}$/)
    assert.equal(record.emailStatus, 'NOT_SENT')
  })

  test('4. Invalid records are rejected without stopping processing of valid records', async () => {
    const students = [
      {
        name: 'A', // Invalid name (< 2 chars)
        college: 'Some College',
        phone: '1234567890',
        email: 'invalid_name@example.com',
      },
      {
        name: 'Invalid Email Person',
        college: 'Some College',
        phone: '1234567890',
        email: 'not-an-email',
      },
      {
        name: 'Missing Phone Person',
        college: 'Some College',
        phone: '',
        email: 'missing_phone@example.com',
      },
      {
        name: 'Valid Student In Batch',
        college: 'Some College',
        phone: '09876543210',
        email: testEmails[2],
      },
    ]

    const result = await registrationService.bulkImportStudents(students, { dryRun: false })
    assert.equal(result.success, true)
    assert.equal(result.data.summary.invalidRecords, 3)
    assert.equal(result.data.summary.newlyRegistered, 1)

    // Check individual statuses
    assert.equal(result.data.results[0].status, 'FAILED')
    assert.equal(result.data.results[1].status, 'FAILED')
    assert.equal(result.data.results[2].status, 'FAILED')
    assert.equal(result.data.results[3].status, 'SUCCESS')
    assert.equal(result.data.results[3].email, testEmails[2].toLowerCase())
  })

  test('5. Imported student can authenticate as a normal participant', async () => {
    // Student registered in test 2
    const dbRow = await pool.query('SELECT * FROM registrations WHERE email = $1', [testEmails[0]])
    const student = dbRow.rows[0]

    const loginRes = await registrationService.loginParticipant({
      email: student.email,
      registrationId: student.registration_id,
    })

    assert.equal(loginRes.success, true)
    assert.ok(loginRes.data.token)
    assert.equal(loginRes.data.registration.email, student.email)
    assert.equal(loginRes.data.registration.registrationId, student.registration_id)
  })

  test('6. Pre-Qiskit isolation: Post-Qiskit registrations remain untouched', async () => {
    const postQiskitCheck = await pool.query('SELECT * FROM post_qiskit_registrations WHERE email = ANY($1::text[])', [testEmails])
    assert.equal(postQiskitCheck.rows.length, 0)
  })
})
