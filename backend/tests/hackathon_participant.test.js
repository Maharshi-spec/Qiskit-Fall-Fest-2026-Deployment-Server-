const assert = require('node:assert/strict')
const { test, before, after } = require('node:test')
const http = require('node:http')
const jwt = require('jsonwebtoken')
const app = require('../src/app')
const { pool } = require('../src/config/database')
const { initializeDatabase } = require('../src/config/database-init')

let server
let baseUrl
let organizerToken

const TEST_PREFIX = 'QHP_'

const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '1h' })
}

const createParticipant = async (suffix) => {
  const regId = `${TEST_PREFIX}REG_${suffix}`
  const email = `part_test_${suffix.toLowerCase()}@example.com`
  await pool.query(
    `INSERT INTO registrations (registration_id, full_name, email, mobile_number, role, institute_name, status, id_card_url)
     VALUES ($1, $2, $3, '9876543210', 'STUDENT', 'Test College', 'CONFIRMED', 'https://example.com/id.jpg')
     ON CONFLICT (registration_id) DO NOTHING;`,
    [regId, `Participant ${suffix}`, email]
  )
  const token = generateToken({
    registrationId: regId,
    email,
    role: 'STUDENT',
  })
  return { regId, email, token }
}

const createTeamWithMembers = async (suffix, members = [], eventId = 'day-3') => {
  const teamName = `${TEST_PREFIX}Team_${suffix}`
  const lead = members[0]

  const teamRes = await pool.query(
    `INSERT INTO teams (event_id, team_name, team_lead_registration_id)
     VALUES ($1, $2, $3)
     ON CONFLICT (event_id, team_name) DO UPDATE SET team_lead_registration_id = EXCLUDED.team_lead_registration_id
     RETURNING id;`,
    [eventId, teamName, lead.regId]
  )
  const teamId = teamRes.rows[0].id

  for (const m of members) {
    await pool.query(
      `INSERT INTO team_members (team_id, registration_id)
       VALUES ($1, $2)
       ON CONFLICT (team_id, registration_id) DO NOTHING;`,
      [teamId, m.regId]
    )
  }

  return { teamId, teamName, lead, members }
}

before(async () => {
  try {
    await initializeDatabase()
  } catch (_) {
    // Database already initialized by another runner
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

  // Clean test tables
  await pool.query(`DELETE FROM hackathon_problem_selections WHERE team_id IN (SELECT id FROM teams WHERE team_name LIKE '${TEST_PREFIX}%') OR problem_statement_id IN (SELECT id FROM hackathon_problem_statements WHERE title LIKE 'PartTest Problem%');`)
  await pool.query("DELETE FROM hackathon_problem_statements WHERE title LIKE 'PartTest Problem%';")
})

after(async () => {
  await pool.query(`DELETE FROM hackathon_problem_selections WHERE team_id IN (SELECT id FROM teams WHERE team_name LIKE '${TEST_PREFIX}%') OR problem_statement_id IN (SELECT id FROM hackathon_problem_statements WHERE title LIKE 'PartTest Problem%');`)
  await pool.query("DELETE FROM hackathon_problem_statements WHERE title LIKE 'PartTest Problem%';")
  await pool.query(`DELETE FROM team_members WHERE registration_id LIKE '${TEST_PREFIX}%';`)
  await pool.query(`DELETE FROM teams WHERE team_name LIKE '${TEST_PREFIX}%';`)
  await pool.query(`DELETE FROM registrations WHERE registration_id LIKE '${TEST_PREFIX}%';`)
  await pool.query("DELETE FROM events WHERE event_id = 'day-hack-part-alt';")

  if (server) {
    await new Promise((resolve) => server.close(resolve))
  }
})

let activeProblemId
let inactiveProblemId
let limitedProblemId
let unlimitedProblemId

test('Setup problem statements for tests', async () => {
  // Active limited problem (capacity: 2)
  const res1 = await fetch(`${baseUrl}/api/v1/hackathon/problem-statements`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${organizerToken}` },
    body: JSON.stringify({
      title: 'PartTest Problem: Active Problem',
      description: 'Active problem statement for testing.',
      maxCapacity: 2,
      isActive: true,
      eventId: 'day-3',
    }),
  })
  const d1 = await res1.json()
  limitedProblemId = d1.data.id
  activeProblemId = d1.data.id

  // Inactive problem
  const res2 = await fetch(`${baseUrl}/api/v1/hackathon/problem-statements`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${organizerToken}` },
    body: JSON.stringify({
      title: 'PartTest Problem: Inactive Problem',
      description: 'Inactive problem statement for testing.',
      maxCapacity: 5,
      isActive: false,
      eventId: 'day-3',
    }),
  })
  const d2 = await res2.json()
  inactiveProblemId = d2.data.id

  // Unlimited problem
  const res3 = await fetch(`${baseUrl}/api/v1/hackathon/problem-statements`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${organizerToken}` },
    body: JSON.stringify({
      title: 'PartTest Problem: Unlimited Problem',
      description: 'Unlimited problem statement for testing.',
      maxCapacity: null,
      isActive: true,
      eventId: 'day-3',
    }),
  })
  const d3 = await res3.json()
  unlimitedProblemId = d3.data.id
})

test('1. Participant can view active problem statements', async () => {
  const p = await createParticipant('VIEW_1')
  const res = await fetch(`${baseUrl}/api/v1/hackathon/problem-statements`, {
    headers: { Authorization: `Bearer ${p.token}` },
  })
  assert.equal(res.status, 200)
  const body = await res.json()
  assert.equal(body.success, true)
  assert.ok(Array.isArray(body.data))
  const found = body.data.find((item) => item.id === String(activeProblemId))
  assert.ok(found)
  assert.equal(found.title, 'PartTest Problem: Active Problem')
})

test('2. Participant cannot view inactive problems as selectable (excluded by activeOnly)', async () => {
  const p = await createParticipant('VIEW_2')
  const res = await fetch(`${baseUrl}/api/v1/hackathon/problem-statements?activeOnly=true`, {
    headers: { Authorization: `Bearer ${p.token}` },
  })
  assert.equal(res.status, 200)
  const body = await res.json()
  const inactiveFound = body.data.find((item) => item.id === String(inactiveProblemId))
  assert.equal(inactiveFound, undefined)
})

test('3. Participant without team cannot select', async () => {
  const noTeamUser = await createParticipant('NOTEAM_1')
  const res = await fetch(`${baseUrl}/api/v1/hackathon/problem-statements/${activeProblemId}/select`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${noTeamUser.token}` },
  })
  assert.equal(res.status, 400)
  const body = await res.json()
  assert.equal(body.error?.code, 'TEAM_NOT_FOUND')
})

test('4. Team can select one problem', async () => {
  const pLead = await createParticipant('LEAD_1')
  const pMem = await createParticipant('MEM_1')
  const team = await createTeamWithMembers('T1', [pLead, pMem])

  const res = await fetch(`${baseUrl}/api/v1/hackathon/problem-statements/${limitedProblemId}/select`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${pLead.token}` },
  })
  assert.equal(res.status, 201)
  const body = await res.json()
  assert.equal(body.success, true)
  assert.equal(body.data.teamId, String(team.teamId))
  assert.equal(body.data.problemStatementId, String(limitedProblemId))
})

test('5. Team cannot select second problem', async () => {
  // Try to select unlimited problem with same team lead
  const pLead = await createParticipant('LEAD_1') // uses same email/reg
  const res = await fetch(`${baseUrl}/api/v1/hackathon/problem-statements/${unlimitedProblemId}/select`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${pLead.token}` },
  })
  assert.equal(res.status, 409)
  const body = await res.json()
  assert.equal(body.error?.code, 'ALREADY_SELECTED')
})

test('6. Team cannot change problem', async () => {
  // Re-selecting the same or different problem is permanently rejected with ALREADY_SELECTED
  const pLead = await createParticipant('LEAD_1')
  const res = await fetch(`${baseUrl}/api/v1/hackathon/problem-statements/${limitedProblemId}/select`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${pLead.token}` },
  })
  assert.equal(res.status, 409)
  const body = await res.json()
  assert.equal(body.error?.code, 'ALREADY_SELECTED')
})

test('7. Another team can select same problem if capacity remains', async () => {
  // limitedProblemId has capacity 2, 1 team selected it so 1 slot remains
  const pLead2 = await createParticipant('LEAD_2')
  const team2 = await createTeamWithMembers('T2', [pLead2])

  const res = await fetch(`${baseUrl}/api/v1/hackathon/problem-statements/${limitedProblemId}/select`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${pLead2.token}` },
  })
  assert.equal(res.status, 201)
  const body = await res.json()
  assert.equal(body.success, true)
  assert.equal(body.data.teamId, String(team2.teamId))
})

test('8. Full problem cannot be selected', async () => {
  // limitedProblemId now has 2/2 selections, should be FULL
  const pLead3 = await createParticipant('LEAD_3')
  await createTeamWithMembers('T3', [pLead3])

  const res = await fetch(`${baseUrl}/api/v1/hackathon/problem-statements/${limitedProblemId}/select`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${pLead3.token}` },
  })
  assert.equal(res.status, 409)
  const body = await res.json()
  assert.equal(body.error?.code, 'PROBLEM_STATEMENT_FULL')
})

test('9. Unlimited problem accepts selections', async () => {
  const pLead4 = await createParticipant('LEAD_4')
  const team4 = await createTeamWithMembers('T4', [pLead4])

  const res = await fetch(`${baseUrl}/api/v1/hackathon/problem-statements/${unlimitedProblemId}/select`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${pLead4.token}` },
  })
  assert.equal(res.status, 201)
  const body = await res.json()
  assert.equal(body.success, true)
  assert.equal(body.data.teamId, String(team4.teamId))
})

test('10. Concurrent selection cannot exceed capacity', async () => {
  // Create problem with capacity 1
  const pres = await fetch(`${baseUrl}/api/v1/hackathon/problem-statements`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${organizerToken}` },
    body: JSON.stringify({
      title: 'PartTest Problem: Tight Race Problem',
      description: 'Capacity 1 test problem',
      maxCapacity: 1,
      isActive: true,
      eventId: 'day-3',
    }),
  })
  const pdata = await pres.json()
  const tightProbId = pdata.data.id

  const pTeamA = await createParticipant('RACE_A')
  await createTeamWithMembers('RACE_A', [pTeamA])

  const pTeamB = await createParticipant('RACE_B')
  await createTeamWithMembers('RACE_B', [pTeamB])

  // Fire both requests concurrently
  const [resA, resB] = await Promise.all([
    fetch(`${baseUrl}/api/v1/hackathon/problem-statements/${tightProbId}/select`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${pTeamA.token}` },
    }),
    fetch(`${baseUrl}/api/v1/hackathon/problem-statements/${tightProbId}/select`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${pTeamB.token}` },
    }),
  ])

  const statuses = [resA.status, resB.status].sort()
  assert.deepEqual(statuses, [201, 409])
})

test('11. All team members see the same selected problem', async () => {
  // Member 1 from Team 1
  const pMem1 = await createParticipant('MEM_1')
  const res = await fetch(`${baseUrl}/api/v1/hackathon/my-team/problem-selection`, {
    headers: { Authorization: `Bearer ${pMem1.token}` },
  })
  assert.equal(res.status, 200)
  const body = await res.json()
  assert.equal(body.success, true)
  assert.equal(body.data.hasSelection, true)
  assert.equal(body.data.selection.problemStatementId, String(limitedProblemId))
  assert.equal(body.data.selection.problemTitle, 'PartTest Problem: Active Problem')
})

test('12. Unauthorized participant cannot select for another team', async () => {
  // User cannot forge a team_id in the body; selection is derived strictly from JWT
  const intruder = await createParticipant('INTRUDER')
  const res = await fetch(`${baseUrl}/api/v1/hackathon/problem-statements/${unlimitedProblemId}/select`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${intruder.token}`,
    },
    body: JSON.stringify({ teamId: 999999 }),
  })
  // Intruder has no team in DB, so it rejects with TEAM_NOT_FOUND
  assert.equal(res.status, 400)
  const body = await res.json()
  assert.equal(body.error?.code, 'TEAM_NOT_FOUND')
})

test('13. Organizer counts update correctly', async () => {
  const res = await fetch(`${baseUrl}/api/v1/hackathon/problem-statements/${limitedProblemId}`, {
    headers: { Authorization: `Bearer ${organizerToken}` },
  })
  assert.equal(res.status, 200)
  const body = await res.json()
  assert.equal(body.data.selectedTeams, 2)
  assert.equal(body.data.isFull, true)
})

test('14. Event isolation works (cannot select problem from another event)', async () => {
  await pool.query(`
    INSERT INTO events (event_id, event_name, description, event_date, status, event_type)
    VALUES ('day-hack-part-alt', 'Part Alt Hackathon', 'Alt Hackathon', '2026-09-11', 'ACTIVE', 'HACKATHON')
    ON CONFLICT (event_id) DO UPDATE SET event_type = 'HACKATHON', status = 'ACTIVE';
  `)

  // Problem in day-hack-part-alt
  const pres = await fetch(`${baseUrl}/api/v1/hackathon/problem-statements`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${organizerToken}` },
    body: JSON.stringify({
      title: 'PartTest Problem: Alt Only Problem',
      description: 'Alt event problem',
      maxCapacity: 10,
      isActive: true,
      eventId: 'day-hack-part-alt',
    }),
  })
  const pdata = await pres.json()
  const altProblemId = pdata.data.id

  // Team in day-3
  const pLeadDay3 = await createParticipant('ISO_DAY3')
  await createTeamWithMembers('ISO_DAY3', [pLeadDay3], 'day-3')

  const res = await fetch(`${baseUrl}/api/v1/hackathon/problem-statements/${altProblemId}/select`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${pLeadDay3.token}` },
  })
  assert.equal(res.status, 400)
  const body = await res.json()
  assert.equal(body.error?.code, 'EVENT_MISMATCH')
})

test('15. Refreshing page does not reset selection (team/me returns problemSelection)', async () => {
  const pLead = await createParticipant('LEAD_1')
  const res = await fetch(`${baseUrl}/api/v1/hackathon/team/me`, {
    headers: { Authorization: `Bearer ${pLead.token}` },
  })
  assert.equal(res.status, 200)
  const body = await res.json()
  assert.ok(body.data.problemSelection)
  assert.equal(body.data.problemSelection.problemStatementId, String(limitedProblemId))
  assert.equal(body.data.problemSelection.problemTitle, 'PartTest Problem: Active Problem')
})

test('16. Selection persists after logout/login (new JWT sees selection)', async () => {
  // Mint a fresh token representing a new login session for the same participant
  const freshLoginToken = generateToken({
    registrationId: `${TEST_PREFIX}REG_LEAD_1`,
    email: 'part_test_lead_1@example.com',
    role: 'STUDENT',
  })

  const res = await fetch(`${baseUrl}/api/v1/hackathon/my-team/problem-selection`, {
    headers: { Authorization: `Bearer ${freshLoginToken}` },
  })
  assert.equal(res.status, 200)
  const body = await res.json()
  assert.equal(body.success, true)
  assert.equal(body.data.hasSelection, true)
  assert.equal(body.data.selection.problemStatementId, String(limitedProblemId))
})
