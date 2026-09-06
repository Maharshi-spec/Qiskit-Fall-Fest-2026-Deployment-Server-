const assert = require('assert')
const { test } = require('node:test')
const hackathonService = require('../src/services/hackathon.service')
const { pool } = require('../src/config/database')

test('hackathon team size rules (1 to 4 members, lead assignment, and 5+ rejection)', async () => {
  const leadUser = { registrationId: 'QFF26-R-TEST-LEAD', email: 'lead@test.invalid' }

  await pool.query("DELETE FROM team_members WHERE registration_id LIKE 'QFF26-R-TEST-%'")
  await pool.query("DELETE FROM teams WHERE team_name LIKE 'Test %'")
  await pool.query("DELETE FROM registrations WHERE registration_id LIKE 'QFF26-R-TEST-%'")
  await pool.query(
    `INSERT INTO events (event_id, event_name, event_date, status, event_type)
     VALUES ('day-3', 'Day 3: Hackathon', '2026-09-07', 'active', 'HACKATHON')
     ON CONFLICT (event_id) DO NOTHING`
  )

  for (let i = 1; i <= 6; i += 1) {
    const regId = i === 1 ? 'QFF26-R-TEST-LEAD' : `QFF26-R-TEST-${i}`
    const email = i === 1 ? 'lead@test.invalid' : `member${i}@test.invalid`
    await pool.query(
      `INSERT INTO registrations (registration_id, full_name, email, mobile_number, role, institute_name, status, id_card_url)
       VALUES ($1, $2, $3, '1234567890', 'STUDENT', 'Test Institute', 'CONFIRMED', 'https://example.com/test.jpg')`,
      [regId, `Test Participant ${i}`, email],
    )
  }

  // 1. Create 1-member team (Solo Lead)
  const soloUser = { registrationId: 'QFF26-R-TEST-5', email: 'member5@test.invalid' }
  const soloTeam = await hackathonService.createTeam(soloUser, { teamName: 'Test Solo Team', members: [] })
  assert.equal(soloTeam.members.length, 1)
  assert.equal(soloTeam.members[0].isTeamLead, true)

  // 2. Create 4-member team
  const team4 = await hackathonService.createTeam(leadUser, {
    teamName: 'Test 4 Member Team',
    members: [
      { email: 'member2@test.invalid' },
      { email: 'member3@test.invalid' },
      { email: 'member4@test.invalid' },
    ],
  })
  assert.equal(team4.members.length, 4)
  assert.equal(team4.members[0].isTeamLead, true)
  assert.equal(team4.members[0].email, 'lead@test.invalid')

  // 3. Attempt 5-member team (4 additional members from an unassigned user)
  const freshUser = { registrationId: 'QFF26-R-TEST-6', email: 'member6@test.invalid' }
  let rejected5 = false
  try {
    await hackathonService.createTeam(freshUser, {
      teamName: 'Test 5 Member Team',
      members: [
        { email: 'member1@test.invalid' },
        { email: 'member2@test.invalid' },
        { email: 'member3@test.invalid' },
        { email: 'member4@test.invalid' },
      ],
    })
  } catch (err) {
    rejected5 = err.code === 'INVALID_TEAM_SIZE'
  }
  assert.equal(rejected5, true)

  // 4. Attempt duplicate member
  let rejectedDup = false
  try {
    await hackathonService.createTeam(freshUser, {
      teamName: 'Test Dup Team',
      members: [{ email: 'member2@test.invalid' }],
    })
  } catch (err) {
    rejectedDup = err.code === 'MEMBER_ALREADY_IN_TEAM' || err.code === 'ALREADY_IN_TEAM'
  }
  assert.equal(rejectedDup, true)

  // Clean up
  await pool.query("DELETE FROM team_members WHERE registration_id LIKE 'QFF26-R-TEST-%'")
  await pool.query("DELETE FROM teams WHERE team_name LIKE 'Test %'")
  await pool.query("DELETE FROM registrations WHERE registration_id LIKE 'QFF26-R-TEST-%'")
})
