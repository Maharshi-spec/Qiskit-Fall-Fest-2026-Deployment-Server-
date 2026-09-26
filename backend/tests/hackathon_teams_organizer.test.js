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

let server
let baseUrl
let organizerToken
let participantToken

const TEST_PREFIX = 'HTO_'
const timestamp = Date.now()

const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '1h' })
}

let ps1Id, ps2Id
let teamAId, teamBId, teamCId

test.before(async () => {
  await initializeDatabase()
  server = http.createServer(app)
  await new Promise((resolve) => server.listen(0, resolve))
  baseUrl = `http://127.0.0.1:${server.address().port}`

  organizerToken = generateToken({
    userId: 1,
    organizerId: 1,
    email: 'admin@qiskitfallfest.com',
    role: 'ORGANIZER',
  })

  participantToken = generateToken({
    userId: 999,
    registrationId: `${TEST_PREFIX}REG_STUDENT`,
    email: 'student@example.com',
    role: 'STUDENT',
  })

  // Setup test data in post_qiskit tables using runWithProfile
  await runWithProfile('post-qiskit', async () => {
    // Clean up any stale test records
    await pool.query(`DELETE FROM hackathon_problem_selections WHERE team_id IN (SELECT id FROM teams WHERE team_name LIKE '${TEST_PREFIX}%');`)
    await pool.query(`DELETE FROM hackathon_problem_statements WHERE title LIKE '${TEST_PREFIX}%';`)
    await pool.query(`DELETE FROM team_members WHERE registration_id LIKE '${TEST_PREFIX}%';`)
    await pool.query(`DELETE FROM teams WHERE team_name LIKE '${TEST_PREFIX}%';`)
    await pool.query(`DELETE FROM registrations WHERE registration_id LIKE '${TEST_PREFIX}%';`)

    // Insert 2 Problem Statements
    const psRes1 = await pool.query(`
      INSERT INTO hackathon_problem_statements (title, description, max_capacity, is_active, event_id)
      VALUES ($1, 'Test description 1', 10, TRUE, 'day-3')
      RETURNING id;
    `, [`${TEST_PREFIX}Problem Quantum Crypto`])
    ps1Id = psRes1.rows[0].id

    const psRes2 = await pool.query(`
      INSERT INTO hackathon_problem_statements (title, description, max_capacity, is_active, event_id)
      VALUES ($1, 'Test description 2', 5, TRUE, 'day-3')
      RETURNING id;
    `, [`${TEST_PREFIX}Problem VQE Chemistry`])
    ps2Id = psRes2.rows[0].id

    // Insert Registrations
    const regList = [
      { id: `${TEST_PREFIX}REG_A1`, name: 'Alice Leader', email: `alice_${timestamp}@test.com`, role: 'STUDENT' },
      { id: `${TEST_PREFIX}REG_A2`, name: 'Bob Member', email: `bob_${timestamp}@test.com`, role: 'STUDENT' },
      { id: `${TEST_PREFIX}REG_B1`, name: 'Charlie Leader', email: `charlie_${timestamp}@test.com`, role: 'FACULTY' },
      { id: `${TEST_PREFIX}REG_C1`, name: 'Dana Leader', email: `dana_${timestamp}@test.com`, role: 'PROFESSIONAL' },
      { id: `${TEST_PREFIX}REG_C2`, name: 'Evan Member', email: `evan_${timestamp}@test.com`, role: 'STUDENT' },
      { id: `${TEST_PREFIX}REG_C3`, name: 'Fiona Member', email: `fiona_${timestamp}@test.com`, role: 'STUDENT' },
    ]

    for (const r of regList) {
      await pool.query(`
        INSERT INTO registrations (registration_id, full_name, email, mobile_number, role, institute_name, status, id_card_url)
        VALUES ($1, $2, $3, '9876543210', $4, 'Test Inst', 'CONFIRMED', 'https://example.com/id.jpg')
        ON CONFLICT (registration_id) DO NOTHING;
      `, [r.id, r.name, r.email, r.role])
    }

    // Insert Team A (2 members, selected PS1)
    const tARes = await pool.query(`
      INSERT INTO teams (event_id, team_name, team_lead_registration_id)
      VALUES ('day-3', $1, $2)
      RETURNING id;
    `, [`${TEST_PREFIX}Team Alpha`, `${TEST_PREFIX}REG_A1`])
    teamAId = tARes.rows[0].id

    await pool.query(`INSERT INTO team_members (team_id, registration_id) VALUES ($1, $2), ($1, $3);`,
      [teamAId, `${TEST_PREFIX}REG_A1`, `${TEST_PREFIX}REG_A2`])

    await pool.query(`INSERT INTO hackathon_problem_selections (event_id, problem_statement_id, team_id) VALUES ('day-3', $1, $2);`,
      [ps1Id, teamAId])

    // Insert Team B (1 member, selected PS2)
    const tBRes = await pool.query(`
      INSERT INTO teams (event_id, team_name, team_lead_registration_id)
      VALUES ('day-3', $1, $2)
      RETURNING id;
    `, [`${TEST_PREFIX}Team Beta`, `${TEST_PREFIX}REG_B1`])
    teamBId = tBRes.rows[0].id

    await pool.query(`INSERT INTO team_members (team_id, registration_id) VALUES ($1, $2);`,
      [teamBId, `${TEST_PREFIX}REG_B1`])

    await pool.query(`INSERT INTO hackathon_problem_selections (event_id, problem_statement_id, team_id) VALUES ('day-3', $1, $2);`,
      [ps2Id, teamBId])

    // Insert Team C (3 members, NO problem selection)
    const tCRes = await pool.query(`
      INSERT INTO teams (event_id, team_name, team_lead_registration_id)
      VALUES ('day-3', $1, $2)
      RETURNING id;
    `, [`${TEST_PREFIX}Team Gamma`, `${TEST_PREFIX}REG_C1`])
    teamCId = tCRes.rows[0].id

    await pool.query(`INSERT INTO team_members (team_id, registration_id) VALUES ($1, $2), ($1, $3), ($1, $4);`,
      [teamCId, `${TEST_PREFIX}REG_C1`, `${TEST_PREFIX}REG_C2`, `${TEST_PREFIX}REG_C3`])
  })
})

test.after(async () => {
  await runWithProfile('post-qiskit', async () => {
    await pool.query(`DELETE FROM hackathon_problem_selections WHERE team_id IN (SELECT id FROM teams WHERE team_name LIKE '${TEST_PREFIX}%');`)
    await pool.query(`DELETE FROM hackathon_problem_statements WHERE title LIKE '${TEST_PREFIX}%';`)
    await pool.query(`DELETE FROM team_members WHERE registration_id LIKE '${TEST_PREFIX}%';`)
    await pool.query(`DELETE FROM teams WHERE team_name LIKE '${TEST_PREFIX}%';`)
    await pool.query(`DELETE FROM registrations WHERE registration_id LIKE '${TEST_PREFIX}%';`)
  })

  if (server) {
    await new Promise((resolve) => server.close(resolve))
  }
})

// 1. Organizer can fetch teams (200, array)
test('1. Organizer can fetch hackathon teams list with status 200', async () => {
  const res = await fetch(`${baseUrl}/api/v1/admin/hackathon/teams`, {
    headers: {
      Authorization: `Bearer ${organizerToken}`,
      'X-Event-Profile': 'post-qiskit',
    },
  })

  assert.equal(res.status, 200)
  const body = await res.json()
  assert.equal(body.success, true)
  assert.ok(Array.isArray(body.data.teams), 'data.teams should be an array')
  assert.ok(body.data.stats, 'data.stats should be present')
  assert.ok(body.data.stats.totalTeams >= 3)
})

// 2. Unauthenticated user cannot access teams (401)
test('2. Unauthenticated request to /admin/hackathon/teams returns 401', async () => {
  const res = await fetch(`${baseUrl}/api/v1/admin/hackathon/teams`, {
    headers: { 'X-Event-Profile': 'post-qiskit' },
  })
  assert.equal(res.status, 401)
})

// 3. Non-admin user cannot access teams (403)
test('3. Non-admin participant token to /admin/hackathon/teams returns 403', async () => {
  const res = await fetch(`${baseUrl}/api/v1/admin/hackathon/teams`, {
    headers: {
      Authorization: `Bearer ${participantToken}`,
      'X-Event-Profile': 'post-qiskit',
    },
  })
  assert.equal(res.status, 403)
})

// 4. Correct team names returned
test('4. Correct team names are returned in the response', async () => {
  const res = await fetch(`${baseUrl}/api/v1/admin/hackathon/teams?search=${TEST_PREFIX}`, {
    headers: {
      Authorization: `Bearer ${organizerToken}`,
      'X-Event-Profile': 'post-qiskit',
    },
  })
  const body = await res.json()
  const teamNames = body.data.teams.map((t) => t.teamName)

  assert.ok(teamNames.includes(`${TEST_PREFIX}Team Alpha`), 'Team Alpha should be present')
  assert.ok(teamNames.includes(`${TEST_PREFIX}Team Beta`), 'Team Beta should be present')
  assert.ok(teamNames.includes(`${TEST_PREFIX}Team Gamma`), 'Team Gamma should be present')
})

// 5. Correct team leader returned
test('5. Correct team leader details are returned for each team', async () => {
  const res = await fetch(`${baseUrl}/api/v1/admin/hackathon/teams?search=${TEST_PREFIX}Team Alpha`, {
    headers: {
      Authorization: `Bearer ${organizerToken}`,
      'X-Event-Profile': 'post-qiskit',
    },
  })
  const body = await res.json()
  const teamA = body.data.teams.find((t) => t.teamName === `${TEST_PREFIX}Team Alpha`)

  assert.ok(teamA, 'Team Alpha must be returned')
  assert.equal(teamA.teamLeader.registrationId, `${TEST_PREFIX}REG_A1`)
  assert.equal(teamA.teamLeader.fullName, 'Alice Leader')
  assert.equal(teamA.teamLeader.email, `alice_${timestamp}@test.com`)
})

// 6. Correct member count returned
test('6. Correct member count returned for each team', async () => {
  const res = await fetch(`${baseUrl}/api/v1/admin/hackathon/teams?search=${TEST_PREFIX}`, {
    headers: {
      Authorization: `Bearer ${organizerToken}`,
      'X-Event-Profile': 'post-qiskit',
    },
  })
  const body = await res.json()
  const teamA = body.data.teams.find((t) => t.teamName === `${TEST_PREFIX}Team Alpha`)
  const teamB = body.data.teams.find((t) => t.teamName === `${TEST_PREFIX}Team Beta`)
  const teamC = body.data.teams.find((t) => t.teamName === `${TEST_PREFIX}Team Gamma`)

  assert.equal(teamA.memberCount, 2, 'Team Alpha should have 2 members')
  assert.equal(teamB.memberCount, 1, 'Team Beta should have 1 member')
  assert.equal(teamC.memberCount, 3, 'Team Gamma should have 3 members')
})

// 7. All team members returned in members array
test('7. All team members returned in the members array', async () => {
  const res = await fetch(`${baseUrl}/api/v1/admin/hackathon/teams?search=${TEST_PREFIX}Team Alpha`, {
    headers: {
      Authorization: `Bearer ${organizerToken}`,
      'X-Event-Profile': 'post-qiskit',
    },
  })
  const body = await res.json()
  const teamA = body.data.teams.find((t) => t.teamName === `${TEST_PREFIX}Team Alpha`)

  assert.equal(teamA.members.length, 2)
  const regIds = teamA.members.map((m) => m.registrationId)
  assert.ok(regIds.includes(`${TEST_PREFIX}REG_A1`))
  assert.ok(regIds.includes(`${TEST_PREFIX}REG_A2`))
})

// 8. Member emails returned
test('8. Member emails are correctly returned', async () => {
  const res = await fetch(`${baseUrl}/api/v1/admin/hackathon/teams?search=${TEST_PREFIX}Team Alpha`, {
    headers: {
      Authorization: `Bearer ${organizerToken}`,
      'X-Event-Profile': 'post-qiskit',
    },
  })
  const body = await res.json()
  const teamA = body.data.teams.find((t) => t.teamName === `${TEST_PREFIX}Team Alpha`)
  const bob = teamA.members.find((m) => m.registrationId === `${TEST_PREFIX}REG_A2`)

  assert.ok(bob)
  assert.equal(bob.email, `bob_${timestamp}@test.com`)
  assert.equal(bob.isLead, false)
})

// 9. Registration IDs returned
test('9. Registration IDs returned for leader and all team members', async () => {
  const res = await fetch(`${baseUrl}/api/v1/admin/hackathon/teams?search=${TEST_PREFIX}Team Gamma`, {
    headers: {
      Authorization: `Bearer ${organizerToken}`,
      'X-Event-Profile': 'post-qiskit',
    },
  })
  const body = await res.json()
  const teamC = body.data.teams.find((t) => t.teamName === `${TEST_PREFIX}Team Gamma`)

  assert.equal(teamC.teamLeader.registrationId, `${TEST_PREFIX}REG_C1`)
  const memberRegIds = teamC.members.map((m) => m.registrationId).sort()
  assert.deepEqual(memberRegIds, [
    `${TEST_PREFIX}REG_C1`,
    `${TEST_PREFIX}REG_C2`,
    `${TEST_PREFIX}REG_C3`,
  ].sort())
})

// 10. Selected problem statement returned
test('10. Selected problem statement returned with id and title', async () => {
  const res = await fetch(`${baseUrl}/api/v1/admin/hackathon/teams?search=${TEST_PREFIX}Team Alpha`, {
    headers: {
      Authorization: `Bearer ${organizerToken}`,
      'X-Event-Profile': 'post-qiskit',
    },
  })
  const body = await res.json()
  const teamA = body.data.teams.find((t) => t.teamName === `${TEST_PREFIX}Team Alpha`)

  assert.ok(teamA.problemStatement)
  assert.equal(teamA.problemStatement.id, ps1Id)
  assert.equal(teamA.problemStatement.title, `${TEST_PREFIX}Problem Quantum Crypto`)
})

// 11. Unselected team returns problemStatement: null
test('11. Unselected team returns problemStatement: null', async () => {
  const res = await fetch(`${baseUrl}/api/v1/admin/hackathon/teams?search=${TEST_PREFIX}Team Gamma`, {
    headers: {
      Authorization: `Bearer ${organizerToken}`,
      'X-Event-Profile': 'post-qiskit',
    },
  })
  const body = await res.json()
  const teamC = body.data.teams.find((t) => t.teamName === `${TEST_PREFIX}Team Gamma`)

  assert.equal(teamC.problemStatement, null, 'Team C should have null problemStatement')
})

// 12. Search filter works across team name
test('12. Search filter matches team name', async () => {
  const res = await fetch(`${baseUrl}/api/v1/admin/hackathon/teams?search=Alpha`, {
    headers: {
      Authorization: `Bearer ${organizerToken}`,
      'X-Event-Profile': 'post-qiskit',
    },
  })
  const body = await res.json()
  assert.ok(body.data.teams.some((t) => t.teamName === `${TEST_PREFIX}Team Alpha`))
  assert.ok(!body.data.teams.some((t) => t.teamName === `${TEST_PREFIX}Team Beta`))
})

// 13. Search filter works across team leader name
test('13. Search filter matches team leader full name', async () => {
  const res = await fetch(`${baseUrl}/api/v1/admin/hackathon/teams?search=Charlie Leader`, {
    headers: {
      Authorization: `Bearer ${organizerToken}`,
      'X-Event-Profile': 'post-qiskit',
    },
  })
  const body = await res.json()
  assert.ok(body.data.teams.some((t) => t.teamName === `${TEST_PREFIX}Team Beta`))
  assert.ok(!body.data.teams.some((t) => t.teamName === `${TEST_PREFIX}Team Alpha`))
})

// 14. Search filter works across member email and registration ID
test('14. Search filter matches member email and registration ID', async () => {
  // A. Search by member email
  const resEmail = await fetch(`${baseUrl}/api/v1/admin/hackathon/teams?search=bob_${timestamp}`, {
    headers: {
      Authorization: `Bearer ${organizerToken}`,
      'X-Event-Profile': 'post-qiskit',
    },
  })
  const bodyEmail = await resEmail.json()
  assert.ok(bodyEmail.data.teams.some((t) => t.teamName === `${TEST_PREFIX}Team Alpha`))
  assert.ok(!bodyEmail.data.teams.some((t) => t.teamName === `${TEST_PREFIX}Team Beta`))

  // B. Search by member registration ID
  const resReg = await fetch(`${baseUrl}/api/v1/admin/hackathon/teams?search=${TEST_PREFIX}REG_C3`, {
    headers: {
      Authorization: `Bearer ${organizerToken}`,
      'X-Event-Profile': 'post-qiskit',
    },
  })
  const bodyReg = await resReg.json()
  assert.ok(bodyReg.data.teams.some((t) => t.teamName === `${TEST_PREFIX}Team Gamma`))
  assert.ok(!bodyReg.data.teams.some((t) => t.teamName === `${TEST_PREFIX}Team Alpha`))
})

// 15. Problem statement status filtering works (selected vs unselected)
test('15. Problem statement status filtering works correctly', async () => {
  // Filter selected
  const resSel = await fetch(`${baseUrl}/api/v1/admin/hackathon/teams?search=${TEST_PREFIX}&selectionStatus=selected`, {
    headers: {
      Authorization: `Bearer ${organizerToken}`,
      'X-Event-Profile': 'post-qiskit',
    },
  })
  const bodySel = await resSel.json()
  const selNames = bodySel.data.teams.map((t) => t.teamName)
  assert.ok(selNames.includes(`${TEST_PREFIX}Team Alpha`))
  assert.ok(selNames.includes(`${TEST_PREFIX}Team Beta`))
  assert.ok(!selNames.includes(`${TEST_PREFIX}Team Gamma`))

  // Filter unselected
  const resUnsel = await fetch(`${baseUrl}/api/v1/admin/hackathon/teams?search=${TEST_PREFIX}&selectionStatus=unselected`, {
    headers: {
      Authorization: `Bearer ${organizerToken}`,
      'X-Event-Profile': 'post-qiskit',
    },
  })
  const bodyUnsel = await resUnsel.json()
  const unselNames = bodyUnsel.data.teams.map((t) => t.teamName)
  assert.ok(!unselNames.includes(`${TEST_PREFIX}Team Alpha`))
  assert.ok(!unselNames.includes(`${TEST_PREFIX}Team Beta`))
  assert.ok(unselNames.includes(`${TEST_PREFIX}Team Gamma`))
})

// 16. Excel export returns 200 and has XLSX Content-Type
test('16. Excel export endpoint returns 200 and XLSX Content-Type', async () => {
  const res = await fetch(`${baseUrl}/api/v1/admin/hackathon/teams/export?search=${TEST_PREFIX}`, {
    headers: {
      Authorization: `Bearer ${organizerToken}`,
      'X-Event-Profile': 'post-qiskit',
    },
  })

  assert.equal(res.status, 200)
  const contentType = res.headers.get('content-type')
  assert.ok(
    contentType.includes('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'),
    `Expected XLSX content-type, got: ${contentType}`
  )
})

// 17. Excel Sheet 1 has expected columns and headers
test('17. Excel Sheet 1 ("Hackathon Teams") has correct structure and data', async () => {
  const res = await fetch(`${baseUrl}/api/v1/admin/hackathon/teams/export?search=${TEST_PREFIX}`, {
    headers: {
      Authorization: `Bearer ${organizerToken}`,
      'X-Event-Profile': 'post-qiskit',
    },
  })
  const buffer = Buffer.from(await res.arrayBuffer())
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(buffer)

  const sheet1 = workbook.getWorksheet('Hackathon Teams')
  assert.ok(sheet1, 'Worksheet "Hackathon Teams" must exist')

  // Check header row (row 1)
  const headers = []
  sheet1.getRow(1).eachCell((cell) => {
    headers.push(cell.value)
  })

  assert.ok(headers.includes('Team Name'))
  assert.ok(headers.includes('Team Leader'))
  assert.ok(headers.includes('Team Leader Registration ID'))
  assert.ok(headers.includes('Team Leader Email'))
  assert.ok(headers.includes('Problem Statement'))
  assert.ok(headers.includes('Member Count'))
  assert.ok(headers.includes('Members'))

  // Check data rows
  let alphaRow = null
  let gammaRow = null
  sheet1.eachRow((row, num) => {
    if (num > 1) {
      if (row.getCell(1).value === `${TEST_PREFIX}Team Alpha`) alphaRow = row
      if (row.getCell(1).value === `${TEST_PREFIX}Team Gamma`) gammaRow = row
    }
  })

  assert.ok(alphaRow, 'Team Alpha must be in Sheet 1')
  assert.equal(alphaRow.getCell(2).value, 'Alice Leader')
  assert.equal(alphaRow.getCell(3).value, `${TEST_PREFIX}REG_A1`)
  assert.equal(alphaRow.getCell(5).value, `${TEST_PREFIX}Problem Quantum Crypto`)
  assert.equal(alphaRow.getCell(6).value, 2)

  assert.ok(gammaRow, 'Team Gamma must be in Sheet 1')
  assert.equal(gammaRow.getCell(5).value, 'Problem Statement Not Selected Yet')
  assert.equal(gammaRow.getCell(6).value, 3)
})

// 18. Excel Sheet 2 has all team members
test('18. Excel Sheet 2 ("Team Members") has all team members with correct columns', async () => {
  const res = await fetch(`${baseUrl}/api/v1/admin/hackathon/teams/export?search=${TEST_PREFIX}`, {
    headers: {
      Authorization: `Bearer ${organizerToken}`,
      'X-Event-Profile': 'post-qiskit',
    },
  })
  const buffer = Buffer.from(await res.arrayBuffer())
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(buffer)

  const sheet2 = workbook.getWorksheet('Team Members')
  assert.ok(sheet2, 'Worksheet "Team Members" must exist')

  // Check header row
  const headers = []
  sheet2.getRow(1).eachCell((cell) => {
    headers.push(cell.value)
  })

  assert.ok(headers.includes('Team Name'))
  assert.ok(headers.includes('Member Name'))
  assert.ok(headers.includes('Registration ID'))
  assert.ok(headers.includes('Email'))
  assert.ok(headers.includes('Role'))
  assert.ok(headers.includes('Is Team Leader'))

  // Count rows in test prefix
  let memberCount = 0
  let aliceLeadFound = false
  let bobMemberFound = false

  sheet2.eachRow((row, num) => {
    if (num > 1) {
      const teamName = row.getCell(1).value
      const regId = row.getCell(3).value
      const isLead = row.getCell(6).value

      if (teamName && teamName.startsWith(TEST_PREFIX)) {
        memberCount++
        if (regId === `${TEST_PREFIX}REG_A1`) {
          aliceLeadFound = true
          assert.equal(isLead, 'Yes', 'Alice should be team leader')
        }
        if (regId === `${TEST_PREFIX}REG_A2`) {
          bobMemberFound = true
          assert.equal(isLead, 'No', 'Bob should not be team leader')
        }
      }
    }
  })

  assert.equal(memberCount, 6, 'Total 6 test members across Teams A (2), B (1), C (3) must be in Sheet 2')
  assert.ok(aliceLeadFound, 'Alice should be listed in Sheet 2')
  assert.ok(bobMemberFound, 'Bob should be listed in Sheet 2')
})

// 19. Profile isolation (Pre-Qiskit vs Post-Qiskit)
test('19. Pre-Qiskit profile isolation: Post-Qiskit teams are not visible in Pre-Qiskit profile', async () => {
  const res = await fetch(`${baseUrl}/api/v1/admin/hackathon/teams?search=${TEST_PREFIX}`, {
    headers: {
      Authorization: `Bearer ${organizerToken}`,
      'X-Event-Profile': 'pre-qiskit',
    },
  })
  const body = await res.json()
  assert.equal(res.status, 200)
  assert.equal(body.data.teams.length, 0, 'No post-qiskit test teams should appear in pre-qiskit profile')
})
