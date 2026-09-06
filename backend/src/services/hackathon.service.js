const { pool } = require('../config/database')
const { AppError } = require('../middleware/error.middleware')

const normalizeEmail = (email) => (typeof email === 'string' ? email.trim().toLowerCase() : '')

const findRegistrationByUser = async (user) => {
  if (user?.registrationId) {
    const res = await pool.query('SELECT * FROM registrations WHERE registration_id = $1 LIMIT 1', [user.registrationId])
    if (res.rows[0]) return res.rows[0]
  }
  if (user?.email) {
    const res = await pool.query('SELECT * FROM registrations WHERE email = $1 LIMIT 1', [normalizeEmail(user.email)])
    if (res.rows[0]) return res.rows[0]
  }
  return null
}

const findRegistrationByEmail = async (email) => {
  const res = await pool.query('SELECT * FROM registrations WHERE email = $1 LIMIT 1', [normalizeEmail(email)])
  return res.rows[0] || null
}

const getTeamDetailsById = async (teamId) => {
  const teamRes = await pool.query(
    `SELECT t.id, t.event_id, t.team_name, t.team_lead_registration_id, t.created_at, t.updated_at, e.event_name
     FROM teams t LEFT JOIN events e ON e.event_id = t.event_id
     WHERE t.id = $1 LIMIT 1`,
    [teamId],
  )
  if (!teamRes.rows[0]) return null
  const team = teamRes.rows[0]

  const membersRes = await pool.query(
    `SELECT tm.id AS member_id, tm.joined_at, r.registration_id, r.full_name, r.email, r.institute_name
     FROM team_members tm
     JOIN registrations r ON r.registration_id = tm.registration_id
     WHERE tm.team_id = $1
     ORDER BY CASE WHEN r.registration_id = $2 THEN 0 ELSE 1 END, tm.joined_at ASC`,
    [teamId, team.team_lead_registration_id],
  )

  return {
    teamId: String(team.id),
    teamName: team.team_name,
    status: 'ACTIVE',
    eventId: team.event_id,
    eventName: team.event_name || 'Hackathon',
    teamLeadRegistrationId: team.team_lead_registration_id,
    createdAt: team.created_at,
    members: membersRes.rows.map((row) => ({
      registrationId: row.registration_id,
      fullName: row.full_name,
      email: row.email,
      instituteName: row.institute_name,
      isTeamLead: row.registration_id === team.team_lead_registration_id,
      joinedAt: row.joined_at,
    })),
  }
}

const getMyTeam = async (user) => {
  const registration = await findRegistrationByUser(user)
  if (!registration) throw new AppError(404, 'REGISTRATION_NOT_FOUND', 'Registration record not found.')

  const memberRes = await pool.query(
    'SELECT team_id FROM team_members WHERE registration_id = $1 LIMIT 1',
    [registration.registration_id],
  )

  if (!memberRes.rows[0]) {
    return null
  }

  return getTeamDetailsById(memberRes.rows[0].team_id)
}

const createTeam = async (user, payload = {}) => {
  const userRegistration = await findRegistrationByUser(user)
  if (!userRegistration) throw new AppError(404, 'REGISTRATION_NOT_FOUND', 'Registration record not found.')

  const existingTeam = await getMyTeam(user)
  if (existingTeam) throw new AppError(409, 'ALREADY_IN_TEAM', 'You are already a member of a hackathon team.')

  const teamName = typeof payload.teamName === 'string' ? payload.teamName.trim() : ''
  if (!teamName) throw new AppError(400, 'INVALID_TEAM_NAME', 'Team name is required.')

  const additionalMembers = Array.isArray(payload.members) ? payload.members : []

  if (additionalMembers.length > 3) {
    throw new AppError(400, 'INVALID_TEAM_SIZE', 'Maximum team size is 4 members (Team Lead + 3 members).')
  }

  const teamMembers = [{ registrationId: userRegistration.registration_id }]
  const addedEmails = new Set([userRegistration.email.toLowerCase()])

  for (const m of additionalMembers) {
    const rawEmail = typeof m?.email === 'string' ? m.email.trim().toLowerCase() : ''
    if (!rawEmail) continue
    if (addedEmails.has(rawEmail)) continue

    const reg = await findRegistrationByEmail(rawEmail)
    if (!reg) {
      throw new AppError(400, 'MEMBER_NOT_REGISTERED', `Participant with email ${m.email} is not registered for Qiskit Fall Fest.`)
    }

    const existingMemberTeam = await pool.query(
      'SELECT team_id FROM team_members WHERE registration_id = $1 LIMIT 1',
      [reg.registration_id],
    )
    if (existingMemberTeam.rows[0]) {
      throw new AppError(409, 'MEMBER_ALREADY_IN_TEAM', `${reg.full_name} (${m.email}) is already a member of another team.`)
    }

    addedEmails.add(rawEmail)
    teamMembers.push({ registrationId: reg.registration_id })
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const teamRes = await client.query(
      `INSERT INTO teams (event_id, team_name, team_lead_registration_id)
       VALUES ('day-3', $1, $2)
       RETURNING id`,
      [teamName, userRegistration.registration_id],
    )
    const teamId = teamRes.rows[0].id

    for (const tm of teamMembers) {
      await client.query(
        'INSERT INTO team_members (team_id, registration_id) VALUES ($1, $2)',
        [teamId, tm.registrationId],
      )
    }

    await client.query('COMMIT')
    return getTeamDetailsById(teamId)
  } catch (error) {
    await client.query('ROLLBACK')
    if (error.code === '23505') {
      throw new AppError(409, 'DUPLICATE_TEAM_NAME', 'A hackathon team with this name already exists.')
    }
    throw error
  } finally {
    client.release()
  }
}

const verifyParticipant = async (user, email) => {
  const normEmail = normalizeEmail(email)
  if (!normEmail) {
    throw new AppError(400, 'INVALID_EMAIL', 'Email address is required.')
  }

  const userReg = await findRegistrationByUser(user)
  if (userReg && userReg.email.toLowerCase() === normEmail) {
    throw new AppError(400, 'SELF_ADDITION', 'You cannot add yourself as another team member.')
  }

  const reg = await findRegistrationByEmail(normEmail)
  if (!reg) {
    throw new AppError(404, 'MEMBER_NOT_REGISTERED', 'Participant not found. All team members must be registered.')
  }

  const existingTeam = await pool.query(
    'SELECT team_id FROM team_members WHERE registration_id = $1 LIMIT 1',
    [reg.registration_id],
  )
  if (existingTeam.rows[0]) {
    throw new AppError(409, 'MEMBER_ALREADY_IN_TEAM', `${reg.full_name} (${reg.email}) is already a member of another team.`)
  }

  return {
    registered: true,
    fullName: reg.full_name,
    email: reg.email,
    instituteName: reg.institute_name,
  }
}

const getHackathonInfo = async () => ({
  title: 'Hackathon',
  entries: [],
})

module.exports = {
  getHackathonInfo,
  getMyTeam,
  createTeam,
  verifyParticipant,
}
