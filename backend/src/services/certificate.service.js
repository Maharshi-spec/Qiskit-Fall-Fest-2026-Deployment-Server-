const crypto = require('crypto')
const fs = require('fs')
const path = require('path')
const { pool } = require('../config/database')
const { AppError } = require('../middleware/error.middleware')
const registrationService = require('./registration.service')
const certificateGenerator = require('../utils/certificate-generator')
const { saveFile, removeFile } = require('../utils/file-storage')
const {
  CERTIFICATE_TYPES,
  CERTIFICATE_STORAGE_CONFIG,
  ensureCertificateType,
  getCertificateTypeConfig,
} = require('../utils/certificate.utils')

const ATTENDANCE_CERTIFICATE_TYPES = new Set([
  CERTIFICATE_TYPES.GENERAL_EVENT_PARTICIPATION,
  CERTIFICATE_TYPES.HACKATHON_PARTICIPATION,
  CERTIFICATE_TYPES.WEBINAR_PARTICIPATION,
  CERTIFICATE_TYPES.WORKSHOP_PARTICIPATION,
  CERTIFICATE_TYPES.QUANTUM_BOOTCAMP_COMPLETION,
])

const PLACEMENT_TO_CERTIFICATE_TYPE = Object.freeze({
  FIRST_POSITION: CERTIFICATE_TYPES.HACKATHON_FIRST_POSITION,
  FIRST_RUNNERS_UP: CERTIFICATE_TYPES.HACKATHON_FIRST_RUNNERS_UP,
  SECOND_RUNNERS_UP: CERTIFICATE_TYPES.HACKATHON_SECOND_RUNNERS_UP,
})

const CERTIFICATE_TO_PLACEMENT = Object.freeze(Object.fromEntries(
  Object.entries(PLACEMENT_TO_CERTIFICATE_TYPE).map(([placement, type]) => [type, placement]),
))

const normalizeEmail = (email) => (typeof email === 'string' ? email.trim().toLowerCase() : '')

const mapCertificate = (row) => ({
  certificateId: row.id,
  certificateNumber: row.certificate_number,
  certificateType: row.certificate_type,
  eventId: row.event_id,
  eventName: row.event_name || null,
  templateName: row.template_name,
  issuedAt: row.issued_at,
  status: row.status,
  verificationCode: row.verification_code,
  viewUrl: row.file_path || null,
  downloadUrl: row.file_path || null,
})

const getEvent = async (eventId) => {
  const result = await pool.query('SELECT event_id, event_name, event_type, event_date, status FROM events WHERE event_id = $1 LIMIT 1', [eventId])
  if (!result.rows[0]) throw new AppError(404, 'EVENT_NOT_FOUND', 'Event not found.')
  return result.rows[0]
}

const findRegistrationById = async (registrationId) => {
  const result = await pool.query('SELECT * FROM registrations WHERE id = $1 LIMIT 1', [registrationId])
  return result.rows[0] || null
}

const findRegistrationByPublicId = async (registrationId) => {
  const result = await pool.query('SELECT * FROM registrations WHERE registration_id = $1 LIMIT 1', [registrationId])
  return result.rows[0] || null
}

const getCertificateTemplateForType = (certificateType) => {
  const type = ensureCertificateType(certificateType)
  const templateName = getCertificateTypeConfig(type).templateName
  return {
    certificateType: type,
    templateName,
    templatePath: path.resolve(__dirname, '../../assets/certificates', templateName),
    bucketName: CERTIFICATE_STORAGE_CONFIG.bucketName,
    folderPath: CERTIFICATE_STORAGE_CONFIG.directories.generated,
  }
}

const buildCertificateNumber = async () => {
  try {
    const result = await pool.query("SELECT nextval('certificates_id_seq') AS number")
    return `QFF26-C-${String(result.rows[0].number).padStart(5, '0')}`
  } catch (error) {
    throw new AppError(503, 'CERTIFICATE_NUMBER_UNAVAILABLE', 'Certificate number generation is temporarily unavailable.')
  }
}

const generateVerificationCode = async () => {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = crypto.randomBytes(24).toString('base64url')
    const result = await pool.query('SELECT 1 FROM certificates WHERE verification_code = $1 LIMIT 1', [code])
    if (result.rowCount === 0) return code
  }
  throw new AppError(503, 'VERIFICATION_CODE_UNAVAILABLE', 'Unable to allocate a unique verification code.')
}

const getAttendanceEligibleParticipants = async (eventId) => {
  const result = await pool.query(
    `SELECT DISTINCT r.id AS "registrationId", r.registration_id AS "publicRegistrationId",
       r.full_name AS "fullName", r.email
     FROM attendance a
     JOIN registrations r ON r.registration_id = a.registration_id
     WHERE a.event_id = $1 AND a.status = 'PRESENT'
     ORDER BY r.full_name ASC`,
    [eventId],
  )
  return result.rows
}

const getAwardEligibleParticipants = async (eventId, certificateType) => {
  const placement = CERTIFICATE_TO_PLACEMENT[certificateType]
  const event = await getEvent(eventId)
  if (event.event_type !== 'HACKATHON') throw new AppError(400, 'INVALID_EVENT_TYPE', 'Award eligibility is available only for hackathon events.')
  const result = await pool.query(
    `SELECT DISTINCT r.id AS "registrationId", r.registration_id AS "publicRegistrationId",
       r.full_name AS "fullName", r.email, t.id AS "teamId", t.team_name AS "teamName",
       hr.placement
     FROM hackathon_results hr
     JOIN teams t ON t.id = hr.team_id
     JOIN team_members tm ON tm.team_id = t.id
     JOIN registrations r ON r.registration_id = tm.registration_id
     WHERE t.event_id = $1 AND hr.placement = $2
     ORDER BY t.team_name, r.full_name`,
    [eventId, placement],
  )
  return result.rows
}

const getEligibleParticipants = async (eventId, certificateType) => {
  const type = ensureCertificateType(certificateType)
  const event = await getEvent(eventId)
  if (ATTENDANCE_CERTIFICATE_TYPES.has(type)) return getAttendanceEligibleParticipants(event.event_id)
  return getAwardEligibleParticipants(event.event_id, type)
}

const getEligibilityPreview = async (eventId, certificateType) => {
  const type = ensureCertificateType(certificateType)
  const event = await getEvent(eventId)
  const eligible = await getEligibleParticipants(eventId, type)
  const ids = eligible.map((item) => item.registrationId)
  const issuedResult = ids.length
    ? await pool.query(
      `SELECT registration_id FROM certificates
       WHERE event_id = $1 AND certificate_type = $2 AND registration_id = ANY($3::bigint[])`,
      [eventId, type, ids],
    )
    : { rows: [] }
  const issuedIds = new Set(issuedResult.rows.map((item) => String(item.registration_id)))
  return {
    event,
    certificateType: type,
    eligibilitySource: ATTENDANCE_CERTIFICATE_TYPES.has(type) ? 'attendance' : 'hackathon_results',
    eligibleParticipants: eligible,
    alreadyIssued: eligible.filter((item) => issuedIds.has(String(item.registrationId))),
    excludedParticipants: [],
  }
}

const certificateSelect = `
  SELECT c.id, c.certificate_number, c.registration_id, c.certificate_type, c.participant_name,
    c.participant_email, c.event_id, c.template_name, c.verification_code, c.issued_at,
    c.file_path, c.status, c.created_at, e.event_name
  FROM certificates c LEFT JOIN events e ON e.event_id = c.event_id`

const listCertificates = async () => {
  const result = await pool.query(`${certificateSelect} ORDER BY c.created_at DESC`)
  return result.rows.map(mapCertificate)
}

const getCertificateById = async (certificateId) => {
  const result = await pool.query(`${certificateSelect} WHERE c.id = $1 LIMIT 1`, [certificateId])
  return result.rows[0] ? mapCertificate(result.rows[0]) : null
}

const getParticipantCertificates = async (user) => {
  const registration = user.registrationId
    ? await findRegistrationByPublicId(user.registrationId)
    : (await pool.query('SELECT * FROM registrations WHERE email = $1 LIMIT 1', [normalizeEmail(user.email)])).rows[0]
  if (!registration) throw new AppError(404, 'REGISTRATION_NOT_FOUND', 'Registration record not found.')
  const result = await pool.query(`${certificateSelect} WHERE c.registration_id = $1 ORDER BY c.created_at DESC`, [registration.id])
  return result.rows.map(mapCertificate)
}

const getOwnedCertificate = async (certificateId, user) => {
  const registration = user.registrationId ? await findRegistrationByPublicId(user.registrationId) : null
  const certificate = await getCertificateById(certificateId)
  if (!certificate || !registration || String(certificate.certificateId) !== String(certificateId)) {
    throw new AppError(404, 'CERTIFICATE_NOT_FOUND', 'Certificate was not found.')
  }
  const owner = await pool.query('SELECT id FROM registrations WHERE registration_id = $1 LIMIT 1', [user.registrationId])
  if (!owner.rows[0] || String(certificate.registrationId) !== String(owner.rows[0].id)) {
    throw new AppError(404, 'CERTIFICATE_NOT_FOUND', 'Certificate was not found.')
  }
  return certificate
}

const uploadGeneratedPdf = async (storagePath, buffer) => {
  try {
    const stored = await saveFile(storagePath, buffer)
    return stored.publicUrl
  } catch (error) {
    throw new AppError(503, 'CERTIFICATE_STORAGE_FAILED', 'Unable to store the generated certificate.')
  }
}

const deleteGeneratedPdf = async (storagePath) => {
  try {
    await removeFile(storagePath)
  } catch (error) {
    console.error('[CERTIFICATE_STORAGE_CLEANUP_FAILED]', { storagePath, message: error.message })
  }
}

const sendCertificateEmail = async (participant, certificate) => {
  try {
    await registrationService.sendMail({
      to: participant.email,
      subject: `Your Qiskit Fall Fest 2026 certificate: ${certificate.certificateNumber}`,
      text: `Your certificate is ready. View or download it here: ${certificate.filePath}`,
      html: `<p>Your certificate is ready.</p><p><a href="${certificate.filePath}">View or download your certificate</a></p>`,
    })
  } catch (error) {
    console.error('[CERTIFICATE_EMAIL_FAILED]', { certificateId: certificate.certificateId, message: error.message })
  }
}

const generateOneCertificate = async ({ event, certificateType, participant }) => {
  const template = getCertificateTemplateForType(certificateType)
  if (!fs.existsSync(template.templatePath)) throw new AppError(503, 'CERTIFICATE_TEMPLATE_MISSING', `Template ${template.templateName} is missing.`)
  const certificateNumber = await buildCertificateNumber()
  const generated = await certificateGenerator.generateCertificate({
    templatePath: template.templatePath,
    participantName: participant.fullName,
    certificateId: certificateNumber,
    registrationId: String(participant.publicRegistrationId),
    certificateType,
  })
  const storagePath = `${CERTIFICATE_STORAGE_CONFIG.directories.generated}/${certificateNumber}.pdf`
  const publicUrl = await uploadGeneratedPdf(storagePath, generated.buffer)
  try {
    let result = null
    for (let attempt = 0; attempt < 5 && !result; attempt += 1) {
      const verificationCode = await generateVerificationCode()
      try {
        result = await pool.query(
          `INSERT INTO certificates
           (certificate_number, registration_id, certificate_type, participant_name, participant_email,
            issued_at, file_path, status, event_id, template_name, verification_code)
           VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, $6, 'issued', $7, $8, $9)
           RETURNING id, certificate_number, registration_id, certificate_type, participant_name,
             participant_email, event_id, template_name, verification_code, issued_at, file_path, status, created_at`,
          [certificateNumber, participant.registrationId, certificateType, participant.fullName, participant.email, publicUrl, event.event_id, template.templateName, verificationCode],
        )
      } catch (error) {
        if (error.code === '23505' && String(error.constraint || '').includes('verification_code')) continue
        throw error
      }
    }
    if (!result) throw new AppError(503, 'VERIFICATION_CODE_UNAVAILABLE', 'Unable to allocate a unique verification code.')
    const certificate = mapCertificate({ ...result.rows[0], event_name: event.event_name })
    setImmediate(() => sendCertificateEmail(participant, { ...certificate, filePath: publicUrl }))
    return certificate
  } catch (error) {
    await deleteGeneratedPdf(storagePath)
    if (error.code === '23505') throw new AppError(409, 'DUPLICATE_CERTIFICATE', 'This certificate has already been generated.')
    throw new AppError(503, 'CERTIFICATE_PERSISTENCE_FAILED', 'Unable to save the generated certificate.')
  }
}

const generateCertificates = async (eventId, payload) => {
  const type = ensureCertificateType(payload.certificateType)
  const requestedIds = Array.isArray(payload.registrationIds) ? payload.registrationIds.map(String) : []
  if (!requestedIds.length) throw new AppError(400, 'INVALID_REQUEST', 'registrationIds must contain at least one participant.')
  const event = await getEvent(eventId)
  const eligible = await getEligibleParticipants(eventId, type)
  const eligibleByPublicId = new Map(eligible.map((item) => [String(item.publicRegistrationId), item]))
  const participants = requestedIds.map((id) => eligibleByPublicId.get(id)).filter(Boolean)
  if (participants.length !== requestedIds.length) throw new AppError(400, 'NOT_ELIGIBLE', 'One or more requested participants are not eligible.')
  const generated = []
  for (const participant of participants) generated.push(await generateOneCertificate({ event, certificateType: type, participant }))
  return generated
}

const assignHackathonAward = async (eventId, teamId, placement, organizerId) => {
  if (!Object.prototype.hasOwnProperty.call(PLACEMENT_TO_CERTIFICATE_TYPE, placement)) throw new AppError(400, 'INVALID_PLACEMENT', 'Invalid hackathon placement.')
  const event = await getEvent(eventId)
  if (event.event_type !== 'HACKATHON') throw new AppError(400, 'INVALID_EVENT_TYPE', 'Awards can only be assigned for hackathon events.')
  const team = await pool.query('SELECT id FROM teams WHERE id = $1 AND event_id = $2 LIMIT 1', [teamId, eventId])
  if (!team.rows[0]) throw new AppError(404, 'TEAM_NOT_FOUND', 'Team not found for this event.')
  try {
    const result = await pool.query('INSERT INTO hackathon_results (team_id, placement, assigned_by) VALUES ($1, $2, $3) RETURNING id, team_id, placement, assigned_by, assigned_at', [teamId, placement, organizerId])
    return result.rows[0]
  } catch (error) {
    if (error.code === '23505' || error.message.includes('already assigned')) throw new AppError(409, 'PLACEMENT_ALREADY_ASSIGNED', 'This placement is already assigned for the hackathon.')
    throw new AppError(503, 'AWARD_ASSIGNMENT_FAILED', 'Unable to assign the hackathon award.')
  }
}

const listTeams = async (eventId) => {
  await getEvent(eventId)
  const result = await pool.query('SELECT id, event_id, team_name, team_lead_registration_id, created_at, updated_at FROM teams WHERE event_id = $1 ORDER BY team_name', [eventId])
  return result.rows
}

const getTeam = async (teamId) => {
  const result = await pool.query('SELECT id, event_id, team_name, team_lead_registration_id, created_at, updated_at FROM teams WHERE id = $1 LIMIT 1', [teamId])
  if (!result.rows[0]) throw new AppError(404, 'TEAM_NOT_FOUND', 'Team not found.')
  return result.rows[0]
}

const listTeamMembers = async (teamId) => {
  await getTeam(teamId)
  const result = await pool.query('SELECT r.id AS "registrationId", r.registration_id AS "publicRegistrationId", r.full_name AS "fullName", r.email, tm.joined_at AS "joinedAt" FROM team_members tm JOIN registrations r ON r.registration_id = tm.registration_id WHERE tm.team_id = $1 ORDER BY r.full_name', [teamId])
  return result.rows
}

const generateAwardCertificates = async (eventId, teamId) => {
  const event = await getEvent(eventId)
  if (event.event_type !== 'HACKATHON') throw new AppError(400, 'INVALID_EVENT_TYPE', 'Awards can only be generated for hackathon events.')
  const team = await pool.query('SELECT id FROM teams WHERE id = $1 AND event_id = $2 LIMIT 1', [teamId, eventId])
  if (!team.rows[0]) throw new AppError(404, 'TEAM_NOT_FOUND', 'Team not found for this event.')
  const result = await pool.query('SELECT placement FROM hackathon_results WHERE team_id = $1 LIMIT 1', [teamId])
  if (!result.rows[0]) throw new AppError(409, 'AWARD_NOT_ASSIGNED', 'Assign a hackathon placement before generating certificates.')
  const certificateType = PLACEMENT_TO_CERTIFICATE_TYPE[result.rows[0].placement]
  const members = await listTeamMembers(teamId)
  const generated = []
  for (const member of members) generated.push(await generateOneCertificate({ event, certificateType, participant: member }))
  return generated
}

const verifyCertificate = async (verificationCode) => {
  const result = await pool.query(
    `SELECT c.certificate_number, c.certificate_type, c.participant_name, c.issued_at, c.status, e.event_name
     FROM certificates c LEFT JOIN events e ON e.event_id = c.event_id
     WHERE c.verification_code = $1 LIMIT 1`,
    [verificationCode],
  )
  const row = result.rows[0]
  if (!row) return { valid: false }
  return { valid: row.status !== 'REVOKED', certificateNumber: row.certificate_number, certificateType: row.certificate_type, participantName: row.participant_name, eventName: row.event_name, issueDate: row.issued_at, status: row.status }
}

const downloadCertificate = async (certificateId, user) => {
  const certificate = user ? await getOwnedCertificate(certificateId, user) : await getCertificateById(certificateId)
  if (!certificate.viewUrl) throw new AppError(404, 'CERTIFICATE_FILE_NOT_FOUND', 'Generated certificate file is not available yet.')
  return certificate
}

module.exports = {
  CERTIFICATE_TYPES,
  getCertificateTemplateForType,
  buildCertificateNumber,
  findRegistrationById,
  getEligibleParticipants,
  getEligibilityPreview,
  listCertificates,
  getCertificateById,
  getParticipantCertificates,
  getOwnedCertificate,
  generateCertificates,
  assignHackathonAward,
  listTeams,
  getTeam,
  listTeamMembers,
  generateAwardCertificates,
  verifyCertificate,
  downloadCertificate,
}
