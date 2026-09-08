const assert = require('node:assert/strict')
const { test, before, after } = require('node:test')
const http = require('node:http')
const jwt = require('jsonwebtoken')
const app = require('../src/app')
const { pool } = require('../src/config/database')
const { initializeDatabase } = require('../src/config/database-init')
const hackathonService = require('../src/services/hackathon.service')

let server
let baseUrl
let organizerToken
let participantToken

const TEST_PREFIX = 'QHK_'

const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '1h' })
}

const createTestRegistrationAndTeam = async (suffix, eventId = 'day-3') => {
  const regId = `${TEST_PREFIX}REG_${suffix}`
  const email = `hack_test_${suffix.toLowerCase()}@example.com`
  const teamName = `${TEST_PREFIX}Team_${suffix}`

  await pool.query(
    `INSERT INTO registrations (registration_id, full_name, email, mobile_number, role, institute_name, status, id_card_url)
     VALUES ($1, $2, $3, '9876543210', 'STUDENT', 'Test University', 'CONFIRMED', 'https://example.com/id.jpg')
     ON CONFLICT (registration_id) DO NOTHING;`,
    [regId, `Test Member ${suffix}`, email]
  )

  const teamRes = await pool.query(
    `INSERT INTO teams (event_id, team_name, team_lead_registration_id)
     VALUES ($1, $2, $3)
     ON CONFLICT (event_id, team_name) DO UPDATE SET team_lead_registration_id = EXCLUDED.team_lead_registration_id
     RETURNING id;`,
    [eventId, teamName, regId]
  )
  const teamId = teamRes.rows[0].id

  await pool.query(
    `INSERT INTO team_members (team_id, registration_id)
     VALUES ($1, $2)
     ON CONFLICT (team_id, registration_id) DO NOTHING;`,
    [teamId, regId]
  )

  return { regId, email, teamId, teamName }
}

before(async () => {
  try {
    await initializeDatabase()
  } catch (_) {
    // Database already initialized
  }

  server = http.createServer(app)
  await new Promise((resolve) => server.listen(0, resolve))
  const port = server.address().port
  baseUrl = `http://127.0.0.1:${port}`

  organizerToken = generateToken({
    userId: 1,
    organizerId: 1,
    email: 'admin@qiskitfallfest.com',
    role: 'ORGANIZER',
  })

  participantToken = generateToken({
    userId: 101,
    registrationId: `${TEST_PREFIX}REG_PARTICIPANT`,
    email: 'participant@example.com',
    role: 'STUDENT',
  })

  // Clean test tables
  await pool.query(`DELETE FROM hackathon_problem_selections WHERE team_id IN (SELECT id FROM teams WHERE team_name LIKE '${TEST_PREFIX}%') OR problem_statement_id IN (SELECT id FROM hackathon_problem_statements WHERE title LIKE 'Test Problem%');`)
  await pool.query("DELETE FROM hackathon_problem_statements WHERE title LIKE 'Test Problem%';")
})

after(async () => {
  await pool.query(`DELETE FROM hackathon_problem_selections WHERE team_id IN (SELECT id FROM teams WHERE team_name LIKE '${TEST_PREFIX}%') OR problem_statement_id IN (SELECT id FROM hackathon_problem_statements WHERE title LIKE 'Test Problem%');`)
  await pool.query("DELETE FROM hackathon_problem_statements WHERE title LIKE 'Test Problem%';")
  await pool.query(`DELETE FROM team_members WHERE registration_id LIKE '${TEST_PREFIX}%';`)
  await pool.query(`DELETE FROM teams WHERE team_name LIKE '${TEST_PREFIX}%';`)
  await pool.query(`DELETE FROM registrations WHERE registration_id LIKE '${TEST_PREFIX}%';`)
  await pool.query("DELETE FROM events WHERE event_id = 'day-hack-alt';")

  if (server) {
    await new Promise((resolve) => server.close(resolve))
  }
})

// 1. Organizer can create problem statement
test('1. Organizer can create problem statement', async () => {
  const res = await fetch(`${baseUrl}/api/v1/hackathon/problem-statements`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${organizerToken}`,
    },
    body: JSON.stringify({
      title: 'Test Problem: Quantum Energy Optimization',
      description: 'Develop variational algorithms for smart grid energy optimization.',
      maxCapacity: 10,
      isActive: true,
      eventId: 'day-3',
    }),
  })

  const body = await res.json()
  assert.equal(res.status, 201)
  assert.equal(body.success, true)
  assert.equal(body.data.title, 'Test Problem: Quantum Energy Optimization')
  assert.equal(body.data.maxCapacity, 10)
  assert.equal(body.data.isUnlimited, false)
  assert.equal(body.data.isActive, true)
  assert.equal(body.data.selectedTeams, 0)
})

// 2. Unauthorized user cannot create problem statement
test('2. Unauthorized user cannot create problem statement', async () => {
  // A. No token (401)
  const noAuthRes = await fetch(`${baseUrl}/api/v1/hackathon/problem-statements`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Test Problem: Unauthorized',
      description: 'Should fail with 401.',
      maxCapacity: 5,
    }),
  })
  assert.equal(noAuthRes.status, 401)

  // B. Participant token (403)
  const forbiddenRes = await fetch(`${baseUrl}/api/v1/hackathon/problem-statements`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${participantToken}`,
    },
    body: JSON.stringify({
      title: 'Test Problem: Participant Attempt',
      description: 'Should fail with 403.',
      maxCapacity: 5,
    }),
  })
  assert.equal(forbiddenRes.status, 403)
})

// 3. Organizer can edit problem statement
test('3. Organizer can edit problem statement', async () => {
  const createRes = await fetch(`${baseUrl}/api/v1/hackathon/problem-statements`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${organizerToken}`,
    },
    body: JSON.stringify({
      title: 'Test Problem: Before Edit',
      description: 'Original description here.',
      maxCapacity: 8,
      eventId: 'day-3',
    }),
  })
  const created = (await createRes.json()).data

  const updateRes = await fetch(`${baseUrl}/api/v1/hackathon/problem-statements/${created.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${organizerToken}`,
    },
    body: JSON.stringify({
      title: 'Test Problem: After Edit',
      description: 'Updated description here.',
      maxCapacity: 12,
    }),
  })

  const updated = (await updateRes.json()).data
  assert.equal(updateRes.status, 200)
  assert.equal(updated.title, 'Test Problem: After Edit')
  assert.equal(updated.description, 'Updated description here.')
  assert.equal(updated.maxCapacity, 12)
})

// 4. Organizer can deactivate problem statement
test('4. Organizer can deactivate problem statement', async () => {
  const createRes = await fetch(`${baseUrl}/api/v1/hackathon/problem-statements`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${organizerToken}`,
    },
    body: JSON.stringify({
      title: 'Test Problem: To Deactivate',
      description: 'Testing deactivation toggle.',
      maxCapacity: 5,
      eventId: 'day-3',
    }),
  })
  const created = (await createRes.json()).data

  const deactivateRes = await fetch(`${baseUrl}/api/v1/hackathon/problem-statements/${created.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${organizerToken}`,
    },
    body: JSON.stringify({
      isActive: false,
    }),
  })

  const deactivated = (await deactivateRes.json()).data
  assert.equal(deactivateRes.status, 200)
  assert.equal(deactivated.isActive, false)
})

// 5. Invalid capacity rejected
test('5. Invalid capacity rejected', async () => {
  // Negative capacity
  const negRes = await fetch(`${baseUrl}/api/v1/hackathon/problem-statements`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${organizerToken}`,
    },
    body: JSON.stringify({
      title: 'Test Problem: Invalid Neg Capacity',
      description: 'Capacity is negative.',
      maxCapacity: -4,
      eventId: 'day-3',
    }),
  })
  assert.equal(negRes.status, 400)
  const negBody = await negRes.json()
  assert.equal(negBody.error.code, 'INVALID_CAPACITY')

  // Non-integer string
  const strRes = await fetch(`${baseUrl}/api/v1/hackathon/problem-statements`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${organizerToken}`,
    },
    body: JSON.stringify({
      title: 'Test Problem: Invalid String Capacity',
      description: 'Capacity is non-numeric.',
      maxCapacity: 'not-a-number',
      eventId: 'day-3',
    }),
  })
  assert.equal(strRes.status, 400)
  const strBody = await strRes.json()
  assert.equal(strBody.error.code, 'INVALID_CAPACITY')
})

// 6. Unlimited capacity works
test('6. Unlimited capacity works', async () => {
  const res = await fetch(`${baseUrl}/api/v1/hackathon/problem-statements`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${organizerToken}`,
    },
    body: JSON.stringify({
      title: 'Test Problem: Unlimited Capacity',
      description: 'No selection limit for this problem.',
      maxCapacity: null,
      eventId: 'day-3',
    }),
  })

  assert.equal(res.status, 201)
  const body = await res.json()
  assert.equal(body.data.maxCapacity, null)
  assert.equal(body.data.isUnlimited, true)
  assert.equal(body.data.remainingCapacity, null)

  // Verify stored in PostgreSQL as NULL
  const dbCheck = await pool.query(
    'SELECT max_capacity FROM hackathon_problem_statements WHERE id = $1',
    [body.data.id]
  )
  assert.equal(dbCheck.rows[0].max_capacity, null)
})

// 7. Capacity count is correct
test('7. Capacity count is correct', async () => {
  const createRes = await fetch(`${baseUrl}/api/v1/hackathon/problem-statements`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${organizerToken}`,
    },
    body: JSON.stringify({
      title: 'Test Problem: Counting Capacity',
      description: 'Testing capacity arithmetic.',
      maxCapacity: 5,
      eventId: 'day-3',
    }),
  })
  const problem = (await createRes.json()).data

  const t1 = await createTestRegistrationAndTeam('C1')
  const t2 = await createTestRegistrationAndTeam('C2')

  await hackathonService.selectProblemForTeam(t1.teamId, problem.id)
  await hackathonService.selectProblemForTeam(t2.teamId, problem.id)

  const checkRes = await fetch(`${baseUrl}/api/v1/hackathon/problem-statements/${problem.id}`)
  const updated = (await checkRes.json()).data

  assert.equal(updated.selectedTeams, 2)
  assert.equal(updated.remainingCapacity, 3)
  assert.equal(updated.isFull, false)
})

// 8. Organizer can view selections
test('8. Organizer can view selections', async () => {
  const createRes = await fetch(`${baseUrl}/api/v1/hackathon/problem-statements`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${organizerToken}`,
    },
    body: JSON.stringify({
      title: 'Test Problem: View Selections',
      description: 'Testing roster viewer.',
      maxCapacity: 10,
      eventId: 'day-3',
    }),
  })
  const problem = (await createRes.json()).data

  const t1 = await createTestRegistrationAndTeam('VS1')
  await hackathonService.selectProblemForTeam(t1.teamId, problem.id)

  const selRes = await fetch(`${baseUrl}/api/v1/hackathon/problem-statements/${problem.id}/selections`, {
    headers: { Authorization: `Bearer ${organizerToken}` },
  })

  assert.equal(selRes.status, 200)
  const selBody = await selRes.json()
  assert.equal(selBody.success, true)
  assert.equal(selBody.data.selectedTeamsCount, 1)
  assert.equal(selBody.data.teams[0].teamName, t1.teamName)
  assert.equal(selBody.data.teams[0].teamLead.registrationId, t1.regId)
  assert.ok(selBody.data.teams[0].members.length >= 1)
  assert.ok(selBody.data.teams[0].selectedAt)
})

// 9. Event isolation works
test('9. Event isolation works', async () => {
  // Ensure day-2 is a hackathon event or create test hackathon event
  await pool.query(`
    INSERT INTO events (event_id, event_name, description, event_date, status, event_type)
    VALUES ('day-hack-alt', 'Alternative Hackathon', 'Alt Hackathon', '2026-09-11', 'ACTIVE', 'HACKATHON')
    ON CONFLICT (event_id) DO UPDATE SET event_type = 'HACKATHON', status = 'ACTIVE';
  `)

  // Problem on day-3
  const pDay3Res = await fetch(`${baseUrl}/api/v1/hackathon/problem-statements`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${organizerToken}`,
    },
    body: JSON.stringify({
      title: 'Test Problem: Day 3 Only',
      description: 'This problem is for Day 3.',
      maxCapacity: 10,
      eventId: 'day-3',
    }),
  })
  const pDay3 = (await pDay3Res.json()).data

  // Problem on day-hack-alt
  const pDayAltRes = await fetch(`${baseUrl}/api/v1/hackathon/problem-statements`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${organizerToken}`,
    },
    body: JSON.stringify({
      title: 'Test Problem: Alt Hackathon Only',
      description: 'This problem is for Alt Hackathon.',
      maxCapacity: 10,
      eventId: 'day-hack-alt',
    }),
  })
  const pDayAlt = (await pDayAltRes.json()).data

  // Fetch problems for day-3
  const listDay3Res = await fetch(`${baseUrl}/api/v1/hackathon/problem-statements?eventId=day-3`)
  const listDay3 = (await listDay3Res.json()).data
  const day3Ids = listDay3.map((p) => p.id)

  assert.ok(day3Ids.includes(pDay3.id))
  assert.ok(!day3Ids.includes(pDayAlt.id))

  // Fetch problems for day-hack-alt
  const listAltRes = await fetch(`${baseUrl}/api/v1/hackathon/problem-statements?eventId=day-hack-alt`)
  const listAlt = (await listAltRes.json()).data
  const altIds = listAlt.map((p) => p.id)

  assert.ok(altIds.includes(pDayAlt.id))
  assert.ok(!altIds.includes(pDay3.id))
})

// 9b. Validations for hackathon event selection
test('9b. Validations: eventId required, existence, and hackathon event_type', async () => {
  // Missing eventId
  const missingEventRes = await fetch(`${baseUrl}/api/v1/hackathon/problem-statements`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${organizerToken}`,
    },
    body: JSON.stringify({
      title: 'Test Problem: Missing Event',
      description: 'This problem statement has no eventId.',
      maxCapacity: 10,
    }),
  })
  assert.equal(missingEventRes.status, 400)
  const missingBody = await missingEventRes.json()
  assert.equal(missingBody.error?.code, 'EVENT_REQUIRED')

  // Non-existent event
  const nonExistentRes = await fetch(`${baseUrl}/api/v1/hackathon/problem-statements`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${organizerToken}`,
    },
    body: JSON.stringify({
      title: 'Test Problem: Non-existent Event',
      description: 'This problem statement specifies non-existent event.',
      maxCapacity: 10,
      eventId: 'does-not-exist-xyz',
    }),
  })
  assert.equal(nonExistentRes.status, 404)
  const nonExistentBody = await nonExistentRes.json()
  assert.equal(nonExistentBody.error?.code, 'EVENT_NOT_FOUND')

  // Non-hackathon event (e.g. day-1 is GENERAL)
  const nonHackathonRes = await fetch(`${baseUrl}/api/v1/hackathon/problem-statements`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${organizerToken}`,
    },
    body: JSON.stringify({
      title: 'Test Problem: Non-hackathon Event',
      description: 'This problem statement targets day-1 which is GENERAL.',
      maxCapacity: 10,
      eventId: 'day-1',
    }),
  })
  assert.equal(nonHackathonRes.status, 400)
  const nonHackathonBody = await nonHackathonRes.json()
  assert.equal(nonHackathonBody.error?.code, 'INVALID_EVENT_TYPE')
})

// 10. Capacity cannot be exceeded
test('10. Capacity cannot be exceeded', async () => {
  const createRes = await fetch(`${baseUrl}/api/v1/hackathon/problem-statements`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${organizerToken}`,
    },
    body: JSON.stringify({
      title: 'Test Problem: Strict Capacity 1',
      description: 'Only 1 team can take this.',
      maxCapacity: 1,
      eventId: 'day-3',
    }),
  })
  const problem = (await createRes.json()).data

  const t1 = await createTestRegistrationAndTeam('CAP1')
  const t2 = await createTestRegistrationAndTeam('CAP2')

  // First selection succeeds
  const s1 = await hackathonService.selectProblemForTeam(t1.teamId, problem.id)
  assert.ok(s1.selectionId)

  // Second selection must be rejected with PROBLEM_STATEMENT_FULL
  let rejected = null
  try {
    await hackathonService.selectProblemForTeam(t2.teamId, problem.id)
  } catch (err) {
    rejected = err
  }
  assert.ok(rejected)
  assert.equal(rejected.code, 'PROBLEM_STATEMENT_FULL')
  assert.equal(rejected.statusCode, 409)
})

// 11. Concurrent selections cannot exceed capacity
test('11. Concurrent selections cannot exceed capacity', async () => {
  const createRes = await fetch(`${baseUrl}/api/v1/hackathon/problem-statements`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${organizerToken}`,
    },
    body: JSON.stringify({
      title: 'Test Problem: Concurrency Race',
      description: 'Max 2 teams, 5 attempting concurrently.',
      maxCapacity: 2,
      eventId: 'day-3',
    }),
  })
  const problem = (await createRes.json()).data

  const teams = []
  for (let i = 1; i <= 5; i += 1) {
    teams.push(await createTestRegistrationAndTeam(`RACE_${i}`))
  }

  // Fire 5 concurrent selection attempts
  const results = await Promise.allSettled(
    teams.map((t) => hackathonService.selectProblemForTeam(t.teamId, problem.id))
  )

  const succeeded = results.filter((r) => r.status === 'fulfilled')
  const rejected = results.filter((r) => r.status === 'rejected')

  assert.equal(succeeded.length, 2, 'Exactly 2 teams should succeed')
  assert.equal(rejected.length, 3, 'Exactly 3 teams should be rejected')

  for (const r of rejected) {
    assert.equal(r.reason.code, 'PROBLEM_STATEMENT_FULL')
  }

  // Check DB state confirms exactly 2 selections exist
  const dbCheck = await pool.query(
    'SELECT COUNT(*)::int AS count FROM hackathon_problem_selections WHERE problem_statement_id = $1',
    [problem.id]
  )
  assert.equal(dbCheck.rows[0].count, 2)
})

// 12. Existing selections prevent unsafe deletion
test('12. Existing selections prevent unsafe deletion', async () => {
  const createRes = await fetch(`${baseUrl}/api/v1/hackathon/problem-statements`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${organizerToken}`,
    },
    body: JSON.stringify({
      title: 'Test Problem: Safe Deletion Check',
      description: 'Must not be deleted once chosen.',
      maxCapacity: 5,
      eventId: 'day-3',
    }),
  })
  const problem = (await createRes.json()).data

  const t = await createTestRegistrationAndTeam('DEL1')
  await hackathonService.selectProblemForTeam(t.teamId, problem.id)

  // Try to delete: must fail with 409 CANNOT_DELETE_SELECTED_PROBLEM
  const delRes = await fetch(`${baseUrl}/api/v1/hackathon/problem-statements/${problem.id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${organizerToken}` },
  })

  assert.equal(delRes.status, 409)
  const delBody = await delRes.json()
  assert.equal(delBody.error.code, 'CANNOT_DELETE_SELECTED_PROBLEM')

  // Also verify lowering capacity below current selection count is rejected
  const reduceRes = await fetch(`${baseUrl}/api/v1/hackathon/problem-statements/${problem.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${organizerToken}`,
    },
    body: JSON.stringify({ maxCapacity: 0 }),
  })
  assert.equal(reduceRes.status, 400)
  const reduceBody = await reduceRes.json()
  assert.equal(reduceBody.error.code, 'CANNOT_REDUCE_CAPACITY_BELOW_SELECTIONS')
})

// 13. Statistics are accurate
test('13. Statistics are accurate', async () => {
  const statsRes = await fetch(`${baseUrl}/api/v1/hackathon/stats?eventId=day-3`, {
    headers: { Authorization: `Bearer ${organizerToken}` },
  })

  assert.equal(statsRes.status, 200)
  const statsBody = await statsRes.json()
  assert.equal(statsBody.success, true)

  const stats = statsBody.data
  assert.ok(typeof stats.totalProblems === 'number')
  assert.ok(typeof stats.totalTeams === 'number')
  assert.ok(typeof stats.totalSelections === 'number')
  assert.ok(typeof stats.availableProblems === 'number')
  assert.ok(typeof stats.fullProblems === 'number')

  // Verify against raw DB count
  const rawProblems = await pool.query(
    "SELECT COUNT(*)::int AS count FROM hackathon_problem_statements WHERE event_id = 'day-3'"
  )
  assert.equal(stats.totalProblems, rawProblems.rows[0].count)

  const rawSelections = await pool.query(
    "SELECT COUNT(*)::int AS count FROM hackathon_problem_selections WHERE event_id = 'day-3'"
  )
  assert.equal(stats.totalSelections, rawSelections.rows[0].count)
})
