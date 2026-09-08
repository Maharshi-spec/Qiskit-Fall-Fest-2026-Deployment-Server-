const fs = require('fs')
const path = require('path')
const { pool } = require('../config/database')
const { publicApiUrl } = require('../config/env')
const { AppError } = require('../middleware/error.middleware')
const { saveFile, removeFile, uploadRoot } = require('../utils/file-storage')

const formatAttachment = (fileRow) => ({
  id: String(fileRow.id),
  problemStatementId: String(fileRow.problem_statement_id),
  originalFilename: fileRow.original_filename,
  mimeType: fileRow.mime_type,
  fileSize: Number(fileRow.file_size),
  createdAt: fileRow.created_at,
  viewUrl: `${publicApiUrl}/api/v1/hackathon/problem-statements/${fileRow.problem_statement_id}/files/${fileRow.id}/view`,
  downloadUrl: `${publicApiUrl}/api/v1/hackathon/problem-statements/${fileRow.problem_statement_id}/files/${fileRow.id}/download`,
})

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

  const selRes = await pool.query(
    `SELECT
       hpsel.id AS selection_id,
       hpsel.problem_statement_id,
       hpsel.selected_at,
       hps.title AS problem_title,
       hps.description AS problem_description,
       hps.max_capacity,
       hps.is_active
     FROM hackathon_problem_selections hpsel
     JOIN hackathon_problem_statements hps ON hps.id = hpsel.problem_statement_id
     WHERE hpsel.team_id = $1 AND hpsel.event_id = $2
     LIMIT 1;`,
    [teamId, team.event_id]
  )

  let attachments = []
  if (selRes.rows[0]) {
    const filesRes = await pool.query(
      `SELECT * FROM hackathon_problem_statement_files
       WHERE problem_statement_id = $1
       ORDER BY created_at ASC;`,
      [selRes.rows[0].problem_statement_id],
    )
    attachments = filesRes.rows.map(formatAttachment)
  }

  const problemSelection = selRes.rows[0]
    ? {
        selectionId: String(selRes.rows[0].selection_id),
        problemStatementId: String(selRes.rows[0].problem_statement_id),
        problemTitle: selRes.rows[0].problem_title,
        problemDescription: selRes.rows[0].problem_description,
        maxCapacity: selRes.rows[0].max_capacity,
        isUnlimited: selRes.rows[0].max_capacity === null,
        selectedAt: selRes.rows[0].selected_at,
        attachments,
      }
    : null

  return {
    teamId: String(team.id),
    teamName: team.team_name,
    status: 'ACTIVE',
    eventId: team.event_id,
    eventName: team.event_name || 'Hackathon',
    teamLeadRegistrationId: team.team_lead_registration_id,
    createdAt: team.created_at,
    problemSelection,
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

const getMyTeamProblemSelection = async (user) => {
  const registration = await findRegistrationByUser(user)
  if (!registration) throw new AppError(404, 'REGISTRATION_NOT_FOUND', 'Registration record not found.')

  const memberRes = await pool.query(
    'SELECT team_id FROM team_members WHERE registration_id = $1 LIMIT 1',
    [registration.registration_id],
  )

  if (!memberRes.rows[0]) {
    return {
      hasTeam: false,
      hasSelection: false,
      selection: null,
      team: null,
    }
  }

  const teamId = memberRes.rows[0].team_id
  const teamDetails = await getTeamDetailsById(teamId)
  if (!teamDetails) {
    return {
      hasTeam: false,
      hasSelection: false,
      selection: null,
      team: null,
    }
  }

  return {
    hasTeam: true,
    hasSelection: Boolean(teamDetails.problemSelection),
    selection: teamDetails.problemSelection,
    team: {
      teamId: teamDetails.teamId,
      teamName: teamDetails.teamName,
      teamLeadRegistrationId: teamDetails.teamLeadRegistrationId,
    },
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

const validateCapacity = (val) => {
  if (val === undefined || val === null || val === '' || val === 'unlimited' || val === 'UNLIMITED') {
    return null
  }
  const num = Number(val)
  if (!Number.isInteger(num) || num < 0 || isNaN(num)) {
    throw new AppError(400, 'INVALID_CAPACITY', 'Capacity must be 0 or a positive integer, or null for unlimited.')
  }
  return num
}

const validateTitle = (val) => {
  const title = typeof val === 'string' ? val.trim() : ''
  if (!title || title.length < 3 || title.length > 255) {
    throw new AppError(400, 'INVALID_TITLE', 'Problem statement title is required and must be between 3 and 255 characters.')
  }
  return title
}

const validateDescription = (val) => {
  const desc = typeof val === 'string' ? val.trim() : ''
  if (!desc || desc.length < 5) {
    throw new AppError(400, 'INVALID_DESCRIPTION', 'Problem statement description is required and must be at least 5 characters.')
  }
  return desc
}

const getHackathonStats = async (eventId = 'day-3') => {
  const result = await pool.query(
    `WITH problem_counts AS (
       SELECT
         hps.id,
         hps.max_capacity,
         hps.is_active,
         COUNT(hpsel.id)::int AS selected_teams
       FROM hackathon_problem_statements hps
       LEFT JOIN hackathon_problem_selections hpsel ON hpsel.problem_statement_id = hps.id
       WHERE hps.event_id = $1
       GROUP BY hps.id, hps.max_capacity, hps.is_active
     ),
     team_count AS (
       SELECT COUNT(*)::int AS total_teams FROM teams WHERE event_id = $1
     ),
     selection_count AS (
       SELECT COUNT(*)::int AS total_selections FROM hackathon_problem_selections WHERE event_id = $1
     )
     SELECT
       (SELECT COUNT(*)::int FROM problem_counts) AS total_problems,
       (SELECT total_teams FROM team_count) AS total_teams,
       (SELECT total_selections FROM selection_count) AS total_selections,
       (SELECT COUNT(*)::int FROM problem_counts WHERE is_active = true AND (max_capacity IS NULL OR (max_capacity > 0 AND selected_teams < max_capacity))) AS available_problems,
       (SELECT COUNT(*)::int FROM problem_counts WHERE max_capacity IS NOT NULL AND max_capacity > 0 AND selected_teams >= max_capacity) AS full_problems;`,
    [eventId]
  )

  const row = result.rows[0] || {}
  return {
    totalProblems: Number(row.total_problems || 0),
    totalTeams: Number(row.total_teams || 0),
    totalSelections: Number(row.total_selections || 0),
    availableProblems: Number(row.available_problems || 0),
    fullProblems: Number(row.full_problems || 0),
  }
}

const getProblemStatements = async (eventId = 'day-3', options = {}) => {
  let activeFilter = ''
  if (options.activeOnly) {
    activeFilter = ' AND hps.is_active = true'
  }

  const result = await pool.query(
    `SELECT
       hps.id,
       hps.event_id,
       hps.title,
       hps.description,
       hps.max_capacity,
       hps.is_active,
       hps.created_by,
       hps.created_at,
       hps.updated_at,
       COUNT(DISTINCT hpsel.team_id)::int AS selected_teams,
       COUNT(DISTINCT tm.id)::int AS selected_participants
     FROM hackathon_problem_statements hps
     LEFT JOIN hackathon_problem_selections hpsel ON hpsel.problem_statement_id = hps.id
     LEFT JOIN team_members tm ON tm.team_id = hpsel.team_id
     WHERE hps.event_id = $1${activeFilter}
     GROUP BY hps.id
     ORDER BY hps.id ASC;`,
    [eventId]
  )

  const problemIds = result.rows.map((r) => r.id)
  const filesByProblem = new Map()

  if (problemIds.length > 0) {
    const filesRes = await pool.query(
      `SELECT id, problem_statement_id, event_id, original_filename, storage_path, mime_type, file_size, created_at, updated_at
       FROM hackathon_problem_statement_files
       WHERE problem_statement_id = ANY($1::bigint[])
       ORDER BY id ASC;`,
      [problemIds]
    )
    for (const f of filesRes.rows) {
      const pid = String(f.problem_statement_id)
      const list = filesByProblem.get(pid) || []
      list.push(formatAttachment(f))
      filesByProblem.set(pid, list)
    }
  }

  return result.rows.map((row, idx) => {
    const selectedTeams = Number(row.selected_teams || 0)
    const selectedParticipants = Number(row.selected_participants || 0)
    const maxCapacity = row.max_capacity === null ? null : Number(row.max_capacity)
    const isUnlimited = maxCapacity === null
    const remainingCapacity = isUnlimited ? null : Math.max(0, maxCapacity - selectedTeams)
    const isFull = !isUnlimited && maxCapacity > 0 && selectedTeams >= maxCapacity
    const isUnavailable = !row.is_active || maxCapacity === 0

    return {
      id: String(row.id),
      problemNumber: idx + 1,
      eventId: row.event_id,
      title: row.title,
      description: row.description,
      maxCapacity,
      isUnlimited,
      isActive: Boolean(row.is_active),
      selectedTeams,
      selectedParticipants,
      remainingCapacity,
      isFull,
      isUnavailable,
      attachments: filesByProblem.get(String(row.id)) || [],
      createdBy: row.created_by ? String(row.created_by) : null,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }
  })
}

const getProblemStatementById = async (id, eventId = null) => {
  const query = `
    SELECT
      hps.id,
      hps.event_id,
      hps.title,
      hps.description,
      hps.max_capacity,
      hps.is_active,
      hps.created_by,
      hps.created_at,
      hps.updated_at,
      COUNT(DISTINCT hpsel.team_id)::int AS selected_teams,
      COUNT(DISTINCT tm.id)::int AS selected_participants
    FROM hackathon_problem_statements hps
    LEFT JOIN hackathon_problem_selections hpsel ON hpsel.problem_statement_id = hps.id
    LEFT JOIN team_members tm ON tm.team_id = hpsel.team_id
    WHERE hps.id = $1 ${eventId ? 'AND hps.event_id = $2' : ''}
    GROUP BY hps.id
    LIMIT 1;`
  const params = eventId ? [id, eventId] : [id]
  const result = await pool.query(query, params)

  if (!result.rows[0]) {
    throw new AppError(404, 'PROBLEM_STATEMENT_NOT_FOUND', 'Problem statement not found.')
  }

  const row = result.rows[0]
  const selectedTeams = Number(row.selected_teams || 0)
  const selectedParticipants = Number(row.selected_participants || 0)
  const maxCapacity = row.max_capacity === null ? null : Number(row.max_capacity)
  const isUnlimited = maxCapacity === null
  const remainingCapacity = isUnlimited ? null : Math.max(0, maxCapacity - selectedTeams)
  const isFull = !isUnlimited && maxCapacity > 0 && selectedTeams >= maxCapacity

  const filesRes = await pool.query(
    `SELECT id, problem_statement_id, event_id, original_filename, storage_path, mime_type, file_size, created_at, updated_at
     FROM hackathon_problem_statement_files
     WHERE problem_statement_id = $1
     ORDER BY id ASC;`,
    [row.id]
  )

  return {
    id: String(row.id),
    eventId: row.event_id,
    title: row.title,
    description: row.description,
    maxCapacity,
    isUnlimited,
    isActive: Boolean(row.is_active),
    selectedTeams,
    selectedParticipants,
    remainingCapacity,
    isFull,
    isUnavailable: !row.is_active || maxCapacity === 0,
    attachments: filesRes.rows.map(formatAttachment),
    createdBy: row.created_by ? String(row.created_by) : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

const createProblemStatement = async (user, payload = {}, files = []) => {
  const title = validateTitle(payload.title)
  const description = validateDescription(payload.description)
  const maxCapacity = validateCapacity(payload.maxCapacity)
  const isActive = payload.isActive === undefined ? true : Boolean(payload.isActive)
  const eventId = typeof payload.eventId === 'string' && payload.eventId.trim() ? payload.eventId.trim() : 'day-3'

  const eventCheck = await pool.query('SELECT event_id FROM events WHERE event_id = $1 LIMIT 1;', [eventId])
  if (!eventCheck.rows[0]) {
    throw new AppError(404, 'EVENT_NOT_FOUND', `Event '${eventId}' does not exist.`)
  }

  const organizerId = user?.organizerId || user?.organizer_id || user?.id || null

  const client = await pool.connect()
  const savedFiles = []
  let createdProblemId = null

  try {
    await client.query('BEGIN')

    const result = await client.query(
      `INSERT INTO hackathon_problem_statements (event_id, title, description, max_capacity, is_active, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id;`,
      [eventId, title, description, maxCapacity, isActive, organizerId]
    )
    createdProblemId = result.rows[0].id

    if (Array.isArray(files) && files.length > 0) {
      for (const file of files) {
        const ext = path.extname(file.originalname || '').toLowerCase() || (file.mimetype === 'application/pdf' ? '.pdf' : '.jpg')
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`
        const storagePath = `hackathon/problem-statements/${eventId}/${createdProblemId}/${uniqueName}`

        await saveFile(storagePath, file.buffer)
        savedFiles.push(storagePath)

        await client.query(
          `INSERT INTO hackathon_problem_statement_files (
             problem_statement_id, event_id, original_filename, storage_path, mime_type, file_size
           ) VALUES ($1, $2, $3, $4, $5, $6);`,
          [createdProblemId, eventId, file.originalname, storagePath, file.mimetype, file.size || file.buffer?.length || 0]
        )
      }
    }

    await client.query('COMMIT')
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {})
    for (const p of savedFiles) {
      try {
        await removeFile(p)
      } catch (cleanErr) {
        console.error('[STORAGE_CLEANUP_ERROR]', p, cleanErr)
      }
    }
    throw error
  } finally {
    client.release()
  }

  return getProblemStatementById(createdProblemId)
}

const updateProblemStatement = async (id, user, payload = {}, files = []) => {
  const existing = await pool.query(
    'SELECT id, event_id, title, description, max_capacity, is_active FROM hackathon_problem_statements WHERE id = $1 LIMIT 1;',
    [id]
  )
  if (!existing.rows[0]) {
    throw new AppError(404, 'PROBLEM_STATEMENT_NOT_FOUND', 'Problem statement not found.')
  }

  const prev = existing.rows[0]
  const title = payload.title !== undefined ? validateTitle(payload.title) : prev.title
  const description = payload.description !== undefined ? validateDescription(payload.description) : prev.description
  const isActive = payload.isActive !== undefined ? Boolean(payload.isActive) : prev.is_active

  let maxCapacity = prev.max_capacity
  if (payload.maxCapacity !== undefined) {
    maxCapacity = validateCapacity(payload.maxCapacity)

    // Editing rule: If a problem already has selections, do not allow reducing capacity below current selections!
    if (maxCapacity !== null) {
      const selectionsRes = await pool.query(
        'SELECT COUNT(*)::int AS count FROM hackathon_problem_selections WHERE problem_statement_id = $1;',
        [id]
      )
      const currentSelections = Number(selectionsRes.rows[0]?.count || 0)
      if (maxCapacity < currentSelections) {
        throw new AppError(
          400,
          'CANNOT_REDUCE_CAPACITY_BELOW_SELECTIONS',
          `Cannot reduce capacity to ${maxCapacity} because ${currentSelections} teams have already selected this problem statement.`
        )
      }
    }
  }

  const client = await pool.connect()
  const savedFiles = []

  try {
    await client.query('BEGIN')

    await client.query(
      `UPDATE hackathon_problem_statements
       SET title = $1, description = $2, max_capacity = $3, is_active = $4, updated_at = NOW()
       WHERE id = $5;`,
      [title, description, maxCapacity, isActive, id]
    )

    if (Array.isArray(files) && files.length > 0) {
      for (const file of files) {
        const ext = path.extname(file.originalname || '').toLowerCase() || (file.mimetype === 'application/pdf' ? '.pdf' : '.jpg')
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`
        const storagePath = `hackathon/problem-statements/${prev.event_id}/${id}/${uniqueName}`

        await saveFile(storagePath, file.buffer)
        savedFiles.push(storagePath)

        await client.query(
          `INSERT INTO hackathon_problem_statement_files (
             problem_statement_id, event_id, original_filename, storage_path, mime_type, file_size
           ) VALUES ($1, $2, $3, $4, $5, $6);`,
          [id, prev.event_id, file.originalname, storagePath, file.mimetype, file.size || file.buffer?.length || 0]
        )
      }
    }

    await client.query('COMMIT')
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {})
    for (const p of savedFiles) {
      try {
        await removeFile(p)
      } catch (cleanErr) {
        console.error('[STORAGE_CLEANUP_ERROR]', p, cleanErr)
      }
    }
    throw error
  } finally {
    client.release()
  }

  return getProblemStatementById(id)
}

const deleteProblemStatement = async (id) => {
  const existing = await pool.query('SELECT id, event_id FROM hackathon_problem_statements WHERE id = $1 LIMIT 1;', [id])
  if (!existing.rows[0]) {
    throw new AppError(404, 'PROBLEM_STATEMENT_NOT_FOUND', 'Problem statement not found.')
  }

  // Check if any teams selected it
  const selectionsRes = await pool.query(
    'SELECT COUNT(*)::int AS count FROM hackathon_problem_selections WHERE problem_statement_id = $1;',
    [id]
  )
  const selectionCount = Number(selectionsRes.rows[0]?.count || 0)
  if (selectionCount > 0) {
    throw new AppError(
      409,
      'CANNOT_DELETE_SELECTED_PROBLEM',
      `Cannot delete problem statement because ${selectionCount} team(s) have already selected it. Deactivate it instead.`
    )
  }

  // Delete all associated files from storage
  const filesRes = await pool.query('SELECT storage_path FROM hackathon_problem_statement_files WHERE problem_statement_id = $1;', [id])
  for (const f of filesRes.rows) {
    try {
      await removeFile(f.storage_path)
    } catch (cleanErr) {
      console.error('[STORAGE_CLEANUP_ERROR]', f.storage_path, cleanErr)
    }
  }

  await pool.query('DELETE FROM hackathon_problem_statements WHERE id = $1;', [id])
  return { success: true, message: 'Problem statement deleted successfully.' }
}

const deleteProblemStatementFile = async (problemStatementId, fileId, user) => {
  const problemRes = await pool.query(
    'SELECT id, event_id FROM hackathon_problem_statements WHERE id = $1 LIMIT 1;',
    [problemStatementId]
  )
  if (!problemRes.rows[0]) {
    throw new AppError(404, 'PROBLEM_STATEMENT_NOT_FOUND', 'Problem statement not found.')
  }

  const fileRes = await pool.query(
    'SELECT id, problem_statement_id, event_id, storage_path, original_filename FROM hackathon_problem_statement_files WHERE id = $1 LIMIT 1;',
    [fileId]
  )
  if (!fileRes.rows[0]) {
    throw new AppError(404, 'ATTACHMENT_NOT_FOUND', 'Attachment not found.')
  }

  const fileRow = fileRes.rows[0]
  if (String(fileRow.problem_statement_id) !== String(problemStatementId)) {
    throw new AppError(400, 'ATTACHMENT_MISMATCH', 'Attachment does not belong to the specified problem statement.')
  }

  if (fileRow.event_id !== problemRes.rows[0].event_id) {
    throw new AppError(400, 'EVENT_MISMATCH', 'Attachment event does not match problem statement event.')
  }

  try {
    await removeFile(fileRow.storage_path)
  } catch (storageErr) {
    console.error('[STORAGE_DELETE_ERROR] Failed to delete file from storage:', fileRow.storage_path, storageErr)
  }

  await pool.query('DELETE FROM hackathon_problem_statement_files WHERE id = $1;', [fileId])
  return { success: true, message: 'Attachment deleted successfully.' }
}

const getFileForViewOrDownload = async (problemStatementId, fileId, user) => {
  const fileRes = await pool.query(
    `SELECT f.id, f.problem_statement_id, f.event_id, f.original_filename, f.storage_path, f.mime_type, f.file_size,
            ps.is_active, ps.event_id AS problem_event_id
     FROM hackathon_problem_statement_files f
     JOIN hackathon_problem_statements ps ON ps.id = f.problem_statement_id
     WHERE f.id = $1 AND f.problem_statement_id = $2
     LIMIT 1;`,
    [fileId, problemStatementId]
  )

  if (!fileRes.rows[0]) {
    throw new AppError(404, 'ATTACHMENT_NOT_FOUND', 'Attachment not found.')
  }

  const fileRow = fileRes.rows[0]
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'ORGANIZER'
  if (!isAdmin && !fileRow.is_active) {
    throw new AppError(404, 'ATTACHMENT_NOT_FOUND', 'Problem statement is inactive.')
  }

  const normalizedPath = fileRow.storage_path.split('/').join(path.sep)
  const absolutePath = path.resolve(uploadRoot, normalizedPath)

  if (!fs.existsSync(absolutePath)) {
    throw new AppError(404, 'FILE_NOT_FOUND', 'File not found on storage server.')
  }

  return {
    file: {
      id: String(fileRow.id),
      problemStatementId: String(fileRow.problem_statement_id),
      originalFilename: fileRow.original_filename,
      mimeType: fileRow.mime_type,
      fileSize: Number(fileRow.file_size),
      storagePath: fileRow.storage_path,
    },
    absolutePath,
  }
}

const getProblemSelections = async (problemStatementId) => {
  const problemRes = await pool.query(
    'SELECT id, event_id, title, max_capacity, is_active FROM hackathon_problem_statements WHERE id = $1 LIMIT 1;',
    [problemStatementId]
  )
  if (!problemRes.rows[0]) {
    throw new AppError(404, 'PROBLEM_STATEMENT_NOT_FOUND', 'Problem statement not found.')
  }
  const problem = problemRes.rows[0]

  const selectionsRes = await pool.query(
    `SELECT
       hpsel.id AS selection_id,
       hpsel.selected_at,
       t.id AS team_id,
       t.team_name,
       t.team_lead_registration_id,
       lead_r.full_name AS lead_name,
       lead_r.email AS lead_email,
       lead_r.institute_name AS lead_institute
     FROM hackathon_problem_selections hpsel
     JOIN teams t ON t.id = hpsel.team_id
     LEFT JOIN registrations lead_r ON lead_r.registration_id = t.team_lead_registration_id
     WHERE hpsel.problem_statement_id = $1
     ORDER BY hpsel.selected_at ASC;`,
    [problemStatementId]
  )

  const teams = []
  if (selectionsRes.rows.length > 0) {
    const teamIds = selectionsRes.rows.map((r) => r.team_id)
    const membersRes = await pool.query(
      `SELECT
         tm.team_id,
         tm.registration_id,
         tm.joined_at,
         r.full_name,
         r.email,
         r.institute_name
       FROM team_members tm
       JOIN registrations r ON r.registration_id = tm.registration_id
       WHERE tm.team_id = ANY($1::bigint[])
       ORDER BY tm.joined_at ASC;`,
      [teamIds]
    )

    const membersByTeam = new Map()
    for (const m of membersRes.rows) {
      const list = membersByTeam.get(String(m.team_id)) || []
      list.push({
        registrationId: m.registration_id,
        fullName: m.full_name,
        email: m.email,
        instituteName: m.institute_name,
        joinedAt: m.joined_at,
      })
      membersByTeam.set(String(m.team_id), list)
    }

    for (const sel of selectionsRes.rows) {
      const teamIdStr = String(sel.team_id)
      const members = membersByTeam.get(teamIdStr) || []
      teams.push({
        selectionId: String(sel.selection_id),
        selectedAt: sel.selected_at,
        teamId: teamIdStr,
        teamName: sel.team_name,
        teamLeadRegistrationId: sel.team_lead_registration_id,
        teamLead: {
          registrationId: sel.team_lead_registration_id,
          fullName: sel.lead_name,
          email: sel.lead_email,
          instituteName: sel.lead_institute,
        },
        members: members.map((m) => ({
          ...m,
          isTeamLead: m.registrationId === sel.team_lead_registration_id,
        })),
      })
    }
  }

  return {
    problemStatementId: String(problem.id),
    title: problem.title,
    maxCapacity: problem.max_capacity,
    selectedTeamsCount: teams.length,
    selectedParticipantsCount: teams.reduce((acc, t) => acc + t.members.length, 0),
    teams,
  }
}

const selectProblemForTeam = async (teamId, problemStatementId, userId = null) => {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // 1. Fetch team
    const teamRes = await client.query(
      'SELECT id, event_id, team_name, team_lead_registration_id FROM teams WHERE id = $1 LIMIT 1;',
      [teamId]
    )
    if (!teamRes.rows[0]) {
      throw new AppError(404, 'TEAM_NOT_FOUND', 'Team not found.')
    }
    const team = teamRes.rows[0]

    // 2. Lock problem statement row for atomic capacity check
    const problemRes = await client.query(
      'SELECT id, event_id, title, description, max_capacity, is_active FROM hackathon_problem_statements WHERE id = $1 FOR UPDATE;',
      [problemStatementId]
    )
    if (!problemRes.rows[0]) {
      throw new AppError(404, 'PROBLEM_STATEMENT_NOT_FOUND', 'Problem statement not found.')
    }
    const problem = problemRes.rows[0]

    // 3. Validate event isolation
    if (problem.event_id !== team.event_id) {
      throw new AppError(400, 'EVENT_MISMATCH', 'Problem statement belongs to a different event than the team.')
    }

    // 4. Validate active status
    if (!problem.is_active) {
      throw new AppError(400, 'PROBLEM_STATEMENT_INACTIVE', 'This problem statement is currently inactive.')
    }

    // 5. If max_capacity is 0, selection is unavailable / full
    if (problem.max_capacity === 0) {
      throw new AppError(409, 'PROBLEM_STATEMENT_FULL', 'This problem statement is not available for selection.')
    }

    // 6. Check if team has already selected a problem statement for this event
    const existingSelection = await client.query(
      'SELECT id, problem_statement_id FROM hackathon_problem_selections WHERE event_id = $1 AND team_id = $2 LIMIT 1;',
      [team.event_id, team.id]
    )
    if (existingSelection.rows[0]) {
      throw new AppError(409, 'ALREADY_SELECTED', 'This team has already selected a problem statement.')
    }

    // 7. Check capacity (if not unlimited)
    if (problem.max_capacity !== null) {
      const countRes = await client.query(
        'SELECT COUNT(*)::int AS count FROM hackathon_problem_selections WHERE problem_statement_id = $1;',
        [problemStatementId]
      )
      const currentCount = Number(countRes.rows[0]?.count || 0)
      if (currentCount >= problem.max_capacity) {
        throw new AppError(409, 'PROBLEM_STATEMENT_FULL', 'This problem statement has reached its maximum capacity.')
      }
    }

    // 8. Insert selection atomically
    const insertRes = await client.query(
      `INSERT INTO hackathon_problem_selections (event_id, problem_statement_id, team_id)
       VALUES ($1, $2, $3)
       RETURNING id, selected_at;`,
      [team.event_id, problemStatementId, team.id]
    )

    await client.query('COMMIT')
    return {
      selectionId: String(insertRes.rows[0].id),
      selectedAt: insertRes.rows[0].selected_at,
      teamId: String(team.id),
      teamName: team.team_name,
      problemStatementId: String(problem.id),
      problemTitle: problem.title,
      problemDescription: problem.description,
      selectedByUserId: userId ? String(userId) : null,
    }
  } catch (err) {
    await client.query('ROLLBACK')
    if (err.code === '23505') {
      throw new AppError(409, 'ALREADY_SELECTED', 'This team has already selected a problem statement.')
    }
    throw err
  } finally {
    client.release()
  }
}

const selectProblemStatement = async (user, problemStatementId) => {
  const userRegistration = await findRegistrationByUser(user)
  if (!userRegistration) {
    throw new AppError(404, 'REGISTRATION_NOT_FOUND', 'Registration record not found.')
  }

  const memberRes = await pool.query(
    'SELECT team_id FROM team_members WHERE registration_id = $1 LIMIT 1;',
    [userRegistration.registration_id]
  )
  if (!memberRes.rows[0]) {
    throw new AppError(400, 'TEAM_NOT_FOUND', 'Create or join a team before selecting a problem statement.')
  }

  const userId = user?.userId || user?.id || null
  return selectProblemForTeam(memberRes.rows[0].team_id, problemStatementId, userId)
}

const getHackathonInfo = async () => ({
  title: 'Hackathon',
  entries: [],
})

module.exports = {
  getHackathonInfo,
  getMyTeam,
  getMyTeamProblemSelection,
  createTeam,
  verifyParticipant,
  getHackathonStats,
  getProblemStatements,
  getProblemStatementById,
  createProblemStatement,
  updateProblemStatement,
  deleteProblemStatement,
  deleteProblemStatementFile,
  getFileForViewOrDownload,
  getProblemSelections,
  selectProblemForTeam,
  selectProblemStatement,
}

