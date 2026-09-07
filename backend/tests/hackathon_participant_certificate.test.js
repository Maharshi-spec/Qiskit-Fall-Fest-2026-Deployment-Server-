const assert = require('assert')
const { test } = require('node:test')
const { pool } = require('../src/config/database')
const certificateService = require('../src/services/certificate.service')
const hackathonService = require('../src/services/hackathon.service')
const { CERTIFICATE_TYPES } = require('../src/utils/certificate.utils')

test('Hackathon Participant Certificate - Eligibility, Generation & Duplicate Prevention', async () => {
  // 1. Setup/Clean database
  await pool.query("DELETE FROM certificates WHERE event_id = 'day-3' AND certificate_type = 'HACKATHON_PARTICIPATION'")
  await pool.query("DELETE FROM team_members WHERE registration_id LIKE 'QFF26-R-CERT-%'")
  await pool.query("DELETE FROM teams WHERE team_name LIKE 'CertTest%'")
  await pool.query("DELETE FROM registrations WHERE registration_id LIKE 'QFF26-R-CERT-%'")

  await pool.query(
    `INSERT INTO events (event_id, event_name, event_date, status, event_type)
     VALUES ('day-3', 'Day 3: Hackathon', '2026-09-09', 'active', 'HACKATHON')
     ON CONFLICT (event_id) DO NOTHING`
  )

  // 2. Insert registrations
  const leadUser = { registrationId: 'QFF26-R-CERT-LEAD', email: 'certlead@test.invalid', fullName: 'Cert Lead' }
  const memberUser = { registrationId: 'QFF26-R-CERT-MEMB', email: 'certmemb@test.invalid', fullName: 'Cert Member' }

  await pool.query(
    `INSERT INTO registrations (registration_id, full_name, email, mobile_number, role, institute_name, status, id_card_url)
     VALUES ($1, $2, $3, '1111111111', 'STUDENT', 'Test Institute', 'CONFIRMED', 'https://example.com/test.jpg')`,
    [leadUser.registrationId, leadUser.fullName, leadUser.email],
  )
  await pool.query(
    `INSERT INTO registrations (registration_id, full_name, email, mobile_number, role, institute_name, status, id_card_url)
     VALUES ($1, $2, $3, '2222222222', 'STUDENT', 'Test Institute', 'CONFIRMED', 'https://example.com/test.jpg')`,
    [memberUser.registrationId, memberUser.fullName, memberUser.email],
  )

  // 3. Create a team and members
  const team = await hackathonService.createTeam(leadUser, {
    teamName: 'CertTest Team',
    members: [{ email: memberUser.email }],
  })

  assert.equal(team.members.length, 2)

  // 4. Verify Eligibility Retrieval
  const eligible = await certificateService.getEligibleParticipants('day-3', CERTIFICATE_TYPES.HACKATHON_PARTICIPATION)
  assert.ok(eligible.length >= 2)
  
  const leadEligible = eligible.find(p => p.publicRegistrationId === leadUser.registrationId)
  assert.ok(leadEligible)
  assert.equal(leadEligible.fullName, leadUser.fullName)
  assert.equal(leadEligible.email, leadUser.email)

  const memberEligible = eligible.find(p => p.publicRegistrationId === memberUser.registrationId)
  assert.ok(memberEligible)
  assert.equal(memberEligible.fullName, memberUser.fullName)
  assert.equal(memberEligible.email, memberUser.email)

  // 5. Verify Eligibility Preview
  const preview = await certificateService.getEligibilityPreview('day-3', CERTIFICATE_TYPES.HACKATHON_PARTICIPATION)
  assert.equal(preview.certificateType, CERTIFICATE_TYPES.HACKATHON_PARTICIPATION)
  assert.equal(preview.eligibilitySource, 'teams')
  assert.ok(preview.eligibleParticipants.length >= 2)
  assert.equal(preview.alreadyIssued.length, 0)

  // 6. Generate One Certificate
  const generated = await certificateService.generateCertificates('day-3', {
    certificateType: CERTIFICATE_TYPES.HACKATHON_PARTICIPATION,
    registrationIds: [leadUser.registrationId]
  })
  assert.equal(generated.length, 1)
  assert.equal(generated[0].certificateType, CERTIFICATE_TYPES.HACKATHON_PARTICIPATION)
  assert.equal(generated[0].eventId, 'day-3')

  // Verify certificate record is in DB
  const dbCert = await pool.query(
    "SELECT * FROM certificates WHERE event_id = 'day-3' AND registration_id = $1 AND certificate_type = 'HACKATHON_PARTICIPATION'",
    [leadEligible.registrationId]
  )
  assert.equal(dbCert.rowCount, 1)

  // 7. Verify Eligibility Preview updates 'alreadyIssued'
  const previewAfter = await certificateService.getEligibilityPreview('day-3', CERTIFICATE_TYPES.HACKATHON_PARTICIPATION)
  assert.ok(previewAfter.alreadyIssued.length >= 1)
  
  const foundIssued = previewAfter.alreadyIssued.find(p => String(p.registrationId) === String(leadEligible.registrationId))
  assert.ok(foundIssued)

  // 8. Test Duplicate Prevention
  let rejectedDuplicate = false
  try {
    await certificateService.generateCertificates('day-3', {
      certificateType: CERTIFICATE_TYPES.HACKATHON_PARTICIPATION,
      registrationIds: [leadUser.registrationId]
    })
  } catch (error) {
    rejectedDuplicate = error.code === 'DUPLICATE_CERTIFICATE' || error.statusCode === 409
  }
  assert.equal(rejectedDuplicate, true)

  // Clean up database records
  await pool.query("DELETE FROM certificates WHERE event_id = 'day-3' AND certificate_type = 'HACKATHON_PARTICIPATION'")
  await pool.query("DELETE FROM team_members WHERE registration_id LIKE 'QFF26-R-CERT-%'")
  await pool.query("DELETE FROM teams WHERE team_name LIKE 'CertTest%'")
  await pool.query("DELETE FROM registrations WHERE registration_id LIKE 'QFF26-R-CERT-%'")
})
