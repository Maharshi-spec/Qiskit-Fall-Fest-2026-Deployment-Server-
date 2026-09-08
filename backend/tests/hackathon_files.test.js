const assert = require('node:assert/strict')
const { test, before, after } = require('node:test')
const http = require('node:http')
const fs = require('node:fs')
const path = require('node:path')
const jwt = require('jsonwebtoken')
const app = require('../src/app')
const { pool } = require('../src/config/database')
const { initializeDatabase } = require('../src/config/database-init')
const { uploadRoot, removeFile } = require('../src/utils/file-storage')

let server
let baseUrl
let organizerToken
let participantToken
let participantRegId
let originalFetch

const TEST_PREFIX = 'QFILES_'

const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '1h' })
}

const createTestRegistrationAndTeam = async (suffix, eventId = 'day-3') => {
  const regId = `${TEST_PREFIX}REG_${suffix}`
  const email = `files_test_${suffix.toLowerCase()}@example.com`
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
  } catch (_) {}

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

  participantRegId = `${TEST_PREFIX}REG_P1`
  participantToken = generateToken({
    userId: 201,
    registrationId: participantRegId,
    email: 'participant_files@example.com',
    role: 'STUDENT',
  })

  originalFetch = global.fetch
  global.fetch = async (url, options = {}) => {
    if (
      typeof url === 'string' &&
      url.includes('/api/v1/hackathon/problem-statements') &&
      options.method === 'POST' &&
      options.body &&
      typeof options.body.append === 'function'
    ) {
      if (!options.body.has('eventId')) {
        options.body.append('eventId', 'day-3')
      }
    }
    return originalFetch(url, options)
  }

  // Cleanup test data
  await pool.query(`DELETE FROM hackathon_problem_selections WHERE team_id IN (SELECT id FROM teams WHERE team_name LIKE '${TEST_PREFIX}%');`)
  await pool.query(`DELETE FROM hackathon_problem_statement_files WHERE original_filename LIKE '${TEST_PREFIX}%';`)
  await pool.query(`DELETE FROM hackathon_problem_statements WHERE title LIKE '${TEST_PREFIX}%';`)
})

after(async () => {
  if (originalFetch) {
    global.fetch = originalFetch
  }
  // Cleanup test data and files
  const files = await pool.query(`SELECT storage_path FROM hackathon_problem_statement_files WHERE original_filename LIKE '${TEST_PREFIX}%';`)
  for (const f of files.rows) {
    try { await removeFile(f.storage_path) } catch (_) {}
  }

  await pool.query(`DELETE FROM hackathon_problem_selections WHERE team_id IN (SELECT id FROM teams WHERE team_name LIKE '${TEST_PREFIX}%');`)
  await pool.query(`DELETE FROM hackathon_problem_statement_files WHERE original_filename LIKE '${TEST_PREFIX}%';`)
  await pool.query(`DELETE FROM hackathon_problem_statements WHERE title LIKE '${TEST_PREFIX}%';`)
  await pool.query(`DELETE FROM team_members WHERE registration_id LIKE '${TEST_PREFIX}%';`)
  await pool.query(`DELETE FROM teams WHERE team_name LIKE '${TEST_PREFIX}%';`)
  await pool.query(`DELETE FROM registrations WHERE registration_id LIKE '${TEST_PREFIX}%';`)

  if (server) {
    await new Promise((resolve) => server.close(resolve))
  }
})

// 1. Organizer can upload JPG
test('1. Organizer can upload JPG', async () => {
  const form = new FormData()
  form.append('title', `${TEST_PREFIX}Problem JPG`)
  form.append('description', 'Test challenge with JPG image')
  form.append('maxCapacity', '10')
  form.append('isActive', 'true')
  form.append('files', new Blob(['fake jpg binary content'], { type: 'image/jpeg' }), `${TEST_PREFIX}diagram.jpg`)

  const res = await fetch(`${baseUrl}/api/v1/hackathon/problem-statements`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${organizerToken}` },
    body: form,
  })
  assert.equal(res.status, 201)
  const data = await res.json()
  assert.equal(data.success, true)
  assert.equal(data.data.attachments.length, 1)
  assert.equal(data.data.attachments[0].originalFilename, `${TEST_PREFIX}diagram.jpg`)
  assert.equal(data.data.attachments[0].mimeType, 'image/jpeg')
})

// 2. Organizer can upload JPEG
test('2. Organizer can upload JPEG', async () => {
  const form = new FormData()
  form.append('title', `${TEST_PREFIX}Problem JPEG`)
  form.append('description', 'Test challenge with JPEG image')
  form.append('maxCapacity', '10')
  form.append('isActive', 'true')
  form.append('files', new Blob(['fake jpeg binary content'], { type: 'image/jpeg' }), `${TEST_PREFIX}photo.jpeg`)

  const res = await fetch(`${baseUrl}/api/v1/hackathon/problem-statements`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${organizerToken}` },
    body: form,
  })
  assert.equal(res.status, 201)
  const data = await res.json()
  assert.equal(data.success, true)
  assert.equal(data.data.attachments[0].originalFilename, `${TEST_PREFIX}photo.jpeg`)
})

// 3. Organizer can upload PNG
test('3. Organizer can upload PNG', async () => {
  const form = new FormData()
  form.append('title', `${TEST_PREFIX}Problem PNG`)
  form.append('description', 'Test challenge with PNG image')
  form.append('maxCapacity', '10')
  form.append('isActive', 'true')
  form.append('files', new Blob(['fake png binary content'], { type: 'image/png' }), `${TEST_PREFIX}graph.png`)

  const res = await fetch(`${baseUrl}/api/v1/hackathon/problem-statements`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${organizerToken}` },
    body: form,
  })
  assert.equal(res.status, 201)
  const data = await res.json()
  assert.equal(data.success, true)
  assert.equal(data.data.attachments[0].originalFilename, `${TEST_PREFIX}graph.png`)
  assert.equal(data.data.attachments[0].mimeType, 'image/png')
})

// 4. Organizer can upload PDF
test('4. Organizer can upload PDF', async () => {
  const form = new FormData()
  form.append('title', `${TEST_PREFIX}Problem PDF`)
  form.append('description', 'Test challenge with PDF file')
  form.append('maxCapacity', '10')
  form.append('isActive', 'true')
  form.append('files', new Blob(['%PDF-1.4 test document content'], { type: 'application/pdf' }), `${TEST_PREFIX}guide.pdf`)

  const res = await fetch(`${baseUrl}/api/v1/hackathon/problem-statements`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${organizerToken}` },
    body: form,
  })
  assert.equal(res.status, 201)
  const data = await res.json()
  assert.equal(data.success, true)
  assert.equal(data.data.attachments[0].originalFilename, `${TEST_PREFIX}guide.pdf`)
  assert.equal(data.data.attachments[0].mimeType, 'application/pdf')
})

// 5. Organizer can upload multiple files
test('5. Organizer can upload multiple files', async () => {
  const form = new FormData()
  form.append('title', `${TEST_PREFIX}Problem Multi`)
  form.append('description', 'Test challenge with multiple files')
  form.append('maxCapacity', '10')
  form.append('files', new Blob(['img1'], { type: 'image/jpeg' }), `${TEST_PREFIX}multi1.jpg`)
  form.append('files', new Blob(['img2'], { type: 'image/png' }), `${TEST_PREFIX}multi2.png`)
  form.append('files', new Blob(['%PDF doc'], { type: 'application/pdf' }), `${TEST_PREFIX}multi3.pdf`)

  const res = await fetch(`${baseUrl}/api/v1/hackathon/problem-statements`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${organizerToken}` },
    body: form,
  })
  assert.equal(res.status, 201)
  const data = await res.json()
  assert.equal(data.data.attachments.length, 3)
})

// 6. Unsupported file type is rejected
test('6. Unsupported file type is rejected', async () => {
  const form = new FormData()
  form.append('title', `${TEST_PREFIX}Invalid File`)
  form.append('description', 'Test challenge with exe file')
  form.append('files', new Blob(['malicious payload'], { type: 'application/octet-stream' }), `${TEST_PREFIX}virus.exe`)

  const res = await fetch(`${baseUrl}/api/v1/hackathon/problem-statements`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${organizerToken}` },
    body: form,
  })
  assert.equal(res.status, 400)
  const data = await res.json()
  assert.equal(data.success, false)
  assert.equal(data.error.code, 'INVALID_FILE_TYPE')
})

// 7. Oversized file is rejected
test('7. Oversized file is rejected', async () => {
  const maxMb = Number(process.env.MAX_HACKATHON_FILE_SIZE_MB || 10)
  const oversizedBuffer = Buffer.alloc((maxMb * 1024 * 1024) + 1024)

  const form = new FormData()
  form.append('title', `${TEST_PREFIX}Oversized`)
  form.append('description', 'Test challenge with oversized pdf')
  form.append('files', new Blob([oversizedBuffer], { type: 'application/pdf' }), `${TEST_PREFIX}large.pdf`)

  const res = await fetch(`${baseUrl}/api/v1/hackathon/problem-statements`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${organizerToken}` },
    body: form,
  })
  assert.equal(res.status, 400)
  const data = await res.json()
  assert.equal(data.success, false)
  assert.equal(data.error.code, 'FILE_TOO_LARGE')
})

// 8. Unauthorized organizer upload is rejected
test('8. Unauthorized organizer upload is rejected', async () => {
  const form = new FormData()
  form.append('title', `${TEST_PREFIX}Unauthorized`)
  form.append('description', 'Test challenge unauthorized')
  form.append('files', new Blob(['pdf data'], { type: 'application/pdf' }), `${TEST_PREFIX}unauth.pdf`)

  // No token
  const resNoAuth = await fetch(`${baseUrl}/api/v1/hackathon/problem-statements`, {
    method: 'POST',
    body: form,
  })
  assert.equal(resNoAuth.status, 401)

  // Participant token
  const resParticipant = await fetch(`${baseUrl}/api/v1/hackathon/problem-statements`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${participantToken}` },
    body: form,
  })
  assert.equal(resParticipant.status, 403)
})

// 9. Attachment metadata is persisted
test('9. Attachment metadata is persisted in PostgreSQL', async () => {
  const form = new FormData()
  form.append('title', `${TEST_PREFIX}Persist Test`)
  form.append('description', 'Test challenge persistence')
  form.append('files', new Blob(['sample persistence test content'], { type: 'image/png' }), `${TEST_PREFIX}persist.png`)

  const res = await fetch(`${baseUrl}/api/v1/hackathon/problem-statements`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${organizerToken}` },
    body: form,
  })
  assert.equal(res.status, 201)
  const data = await res.json()
  const problemId = data.data.id

  const dbRes = await pool.query(
    'SELECT * FROM hackathon_problem_statement_files WHERE problem_statement_id = $1;',
    [problemId]
  )
  assert.equal(dbRes.rows.length, 1)
  assert.equal(dbRes.rows[0].original_filename, `${TEST_PREFIX}persist.png`)
  assert.equal(dbRes.rows[0].mime_type, 'image/png')
  assert.ok(Number(dbRes.rows[0].file_size) > 0)
})

// 10. File is stored in the correct storage path
test('10. File is stored in the correct storage path', async () => {
  const form = new FormData()
  form.append('title', `${TEST_PREFIX}Storage Path Test`)
  form.append('description', 'Test storage path format')
  form.append('files', new Blob(['test content for storage path'], { type: 'image/jpeg' }), `${TEST_PREFIX}path_test.jpg`)

  const res = await fetch(`${baseUrl}/api/v1/hackathon/problem-statements`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${organizerToken}` },
    body: form,
  })
  const data = await res.json()
  const problemId = data.data.id

  const dbRes = await pool.query(
    'SELECT storage_path FROM hackathon_problem_statement_files WHERE problem_statement_id = $1;',
    [problemId]
  )
  const storedPath = dbRes.rows[0].storage_path
  assert.ok(storedPath.startsWith(`hackathon/problem-statements/day-3/${problemId}/`))

  const absoluteDiskPath = path.resolve(uploadRoot, storedPath.split('/').join(path.sep))
  assert.equal(fs.existsSync(absoluteDiskPath), true)
})

// 11. Participant can see attachment metadata
test('11. Participant can see attachment metadata', async () => {
  const form = new FormData()
  form.append('title', `${TEST_PREFIX}Participant View Metadata`)
  form.append('description', 'Participant viewable attachments')
  form.append('files', new Blob(['content1'], { type: 'application/pdf' }), `${TEST_PREFIX}part_meta.pdf`)

  const createRes = await fetch(`${baseUrl}/api/v1/hackathon/problem-statements`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${organizerToken}` },
    body: form,
  })
  const created = await createRes.json()
  const problemId = created.data.id

  const listRes = await fetch(`${baseUrl}/api/v1/hackathon/problem-statements?activeOnly=true`, {
    headers: { Authorization: `Bearer ${participantToken}` },
  })
  assert.equal(listRes.status, 200)
  const listData = await listRes.json()
  const matched = listData.data.find((p) => String(p.id) === String(problemId))
  assert.ok(matched)
  assert.equal(matched.attachments.length, 1)
  assert.equal(matched.attachments[0].originalFilename, `${TEST_PREFIX}part_meta.pdf`)
  assert.ok(matched.attachments[0].viewUrl)
  assert.ok(matched.attachments[0].downloadUrl)
})

const resolveTestUrl = (fullUrl) => {
  const urlObj = new URL(fullUrl)
  return `${baseUrl}${urlObj.pathname}${urlObj.search}`
}

// 12. Participant can view an image
test('12. Participant can view an image', async () => {
  const form = new FormData()
  form.append('title', `${TEST_PREFIX}View Image Test`)
  form.append('description', 'Test viewing an image')
  form.append('files', new Blob(['fake jpeg binary data for view'], { type: 'image/jpeg' }), `${TEST_PREFIX}view_image.jpg`)

  const createRes = await fetch(`${baseUrl}/api/v1/hackathon/problem-statements`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${organizerToken}` },
    body: form,
  })
  const created = await createRes.json()
  const viewUrl = resolveTestUrl(created.data.attachments[0].viewUrl)

  const viewRes = await fetch(viewUrl, {
    headers: { Authorization: `Bearer ${participantToken}` },
  })
  assert.equal(viewRes.status, 200)
  assert.equal(viewRes.headers.get('content-type'), 'image/jpeg')
  assert.ok(viewRes.headers.get('content-disposition')?.includes('inline'))
  const text = await viewRes.text()
  assert.equal(text, 'fake jpeg binary data for view')
})

// 13. Participant can download an image
test('13. Participant can download an image', async () => {
  const form = new FormData()
  form.append('title', `${TEST_PREFIX}Download Image Test`)
  form.append('description', 'Test downloading an image')
  form.append('files', new Blob(['image payload to download'], { type: 'image/png' }), `${TEST_PREFIX}download_img.png`)

  const createRes = await fetch(`${baseUrl}/api/v1/hackathon/problem-statements`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${organizerToken}` },
    body: form,
  })
  const created = await createRes.json()
  const downloadUrl = resolveTestUrl(created.data.attachments[0].downloadUrl)

  const downloadRes = await fetch(downloadUrl, {
    headers: { Authorization: `Bearer ${participantToken}` },
  })
  assert.equal(downloadRes.status, 200)
  assert.ok(downloadRes.headers.get('content-disposition')?.includes('attachment'))
  assert.ok(downloadRes.headers.get('content-disposition')?.includes(encodeURIComponent(`${TEST_PREFIX}download_img.png`)))
})

// 14. Participant can view a PDF
test('14. Participant can view a PDF', async () => {
  const form = new FormData()
  form.append('title', `${TEST_PREFIX}View PDF Test`)
  form.append('description', 'Test viewing a PDF')
  form.append('files', new Blob(['%PDF-1.4 viewable document'], { type: 'application/pdf' }), `${TEST_PREFIX}view_doc.pdf`)

  const createRes = await fetch(`${baseUrl}/api/v1/hackathon/problem-statements`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${organizerToken}` },
    body: form,
  })
  const created = await createRes.json()
  const viewUrl = resolveTestUrl(created.data.attachments[0].viewUrl)

  const viewRes = await fetch(viewUrl, {
    headers: { Authorization: `Bearer ${participantToken}` },
  })
  assert.equal(viewRes.status, 200)
  assert.equal(viewRes.headers.get('content-type'), 'application/pdf')
  assert.ok(viewRes.headers.get('content-disposition')?.includes('inline'))
})

// 15. Participant can download a PDF
test('15. Participant can download a PDF', async () => {
  const form = new FormData()
  form.append('title', `${TEST_PREFIX}Download PDF Test`)
  form.append('description', 'Test downloading a PDF')
  form.append('files', new Blob(['%PDF-1.4 downloadable document'], { type: 'application/pdf' }), `${TEST_PREFIX}download_doc.pdf`)

  const createRes = await fetch(`${baseUrl}/api/v1/hackathon/problem-statements`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${organizerToken}` },
    body: form,
  })
  const created = await createRes.json()
  const downloadUrl = resolveTestUrl(created.data.attachments[0].downloadUrl)

  const downloadRes = await fetch(downloadUrl, {
    headers: { Authorization: `Bearer ${participantToken}` },
  })
  assert.equal(downloadRes.status, 200)
  assert.ok(downloadRes.headers.get('content-disposition')?.includes('attachment'))
  assert.ok(downloadRes.headers.get('content-disposition')?.includes(encodeURIComponent(`${TEST_PREFIX}download_doc.pdf`)))
})

// 16. Unauthorized user cannot access protected attachment
test('16. Unauthorized user cannot access protected attachment', async () => {
  const form = new FormData()
  form.append('title', `${TEST_PREFIX}Protected File`)
  form.append('description', 'Protected challenge attachment')
  form.append('files', new Blob(['secret attachment'], { type: 'application/pdf' }), `${TEST_PREFIX}protected.pdf`)

  const createRes = await fetch(`${baseUrl}/api/v1/hackathon/problem-statements`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${organizerToken}` },
    body: form,
  })
  const created = await createRes.json()
  const viewUrl = resolveTestUrl(created.data.attachments[0].viewUrl)
  const downloadUrl = resolveTestUrl(created.data.attachments[0].downloadUrl)

  // No auth header or token query param
  const resView = await fetch(viewUrl)
  assert.equal(resView.status, 401)

  const resDownload = await fetch(downloadUrl)
  assert.equal(resDownload.status, 401)

  // Invalid token
  const resBadToken = await fetch(viewUrl, { headers: { Authorization: 'Bearer invalid-token' } })
  assert.equal(resBadToken.status, 401)
})

// 17. Organizer can delete attachment
test('17. Organizer can delete attachment', async () => {
  const form = new FormData()
  form.append('title', `${TEST_PREFIX}Delete File Test`)
  form.append('description', 'Test attachment deletion')
  form.append('files', new Blob(['attachment to delete'], { type: 'image/png' }), `${TEST_PREFIX}del_test.png`)

  const createRes = await fetch(`${baseUrl}/api/v1/hackathon/problem-statements`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${organizerToken}` },
    body: form,
  })
  const created = await createRes.json()
  const problemId = created.data.id
  const fileId = created.data.attachments[0].id

  const delRes = await fetch(`${baseUrl}/api/v1/hackathon/problem-statements/${problemId}/files/${fileId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${organizerToken}` },
  })
  assert.equal(delRes.status, 200)

  // Verify attachment is gone
  const getRes = await fetch(`${baseUrl}/api/v1/hackathon/problem-statements/${problemId}`)
  const getData = await getRes.json()
  assert.equal(getData.data.attachments.length, 0)
})

// 18. Organizer cannot delete attachment belonging to another problem
test('18. Organizer cannot delete attachment belonging to another problem', async () => {
  // Create Problem A with File A
  const formA = new FormData()
  formA.append('title', `${TEST_PREFIX}Prob A`)
  formA.append('description', 'Desc A')
  formA.append('files', new Blob(['file A'], { type: 'image/jpeg' }), `${TEST_PREFIX}fileA.jpg`)
  const resA = await (await fetch(`${baseUrl}/api/v1/hackathon/problem-statements`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${organizerToken}` },
    body: formA,
  })).json()
  const fileIdA = resA.data.attachments[0].id

  // Create Problem B
  const formB = new FormData()
  formB.append('title', `${TEST_PREFIX}Prob B`)
  formB.append('description', 'Desc B')
  const resB = await (await fetch(`${baseUrl}/api/v1/hackathon/problem-statements`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${organizerToken}` },
    body: formB,
  })).json()
  const problemIdB = resB.data.id

  // Attempt to delete File A using Problem B ID
  const delRes = await fetch(`${baseUrl}/api/v1/hackathon/problem-statements/${problemIdB}/files/${fileIdA}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${organizerToken}` },
  })
  assert.equal(delRes.status, 400)
  const data = await delRes.json()
  assert.equal(data.error.code, 'ATTACHMENT_MISMATCH')
})

// 19. Deleting attachment removes storage object and metadata
test('19. Deleting attachment removes storage object and metadata', async () => {
  const form = new FormData()
  form.append('title', `${TEST_PREFIX}Full Removal`)
  form.append('description', 'Verify physical removal')
  form.append('files', new Blob(['physical delete file'], { type: 'image/jpeg' }), `${TEST_PREFIX}phys_del.jpg`)

  const res = await (await fetch(`${baseUrl}/api/v1/hackathon/problem-statements`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${organizerToken}` },
    body: form,
  })).json()
  const problemId = res.data.id
  const fileId = res.data.attachments[0].id

  const dbBefore = await pool.query('SELECT storage_path FROM hackathon_problem_statement_files WHERE id = $1;', [fileId])
  const storagePath = dbBefore.rows[0].storage_path
  const diskPath = path.resolve(uploadRoot, storagePath.split('/').join(path.sep))
  assert.equal(fs.existsSync(diskPath), true)

  // Delete attachment
  await fetch(`${baseUrl}/api/v1/hackathon/problem-statements/${problemId}/files/${fileId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${organizerToken}` },
  })

  // Verify DB removal
  const dbAfter = await pool.query('SELECT * FROM hackathon_problem_statement_files WHERE id = $1;', [fileId])
  assert.equal(dbAfter.rows.length, 0)

  // Verify Disk removal
  assert.equal(fs.existsSync(diskPath), false)
})

// 20. Event isolation works
test('20. Event isolation works for attachments', async () => {
  // Problem created under day-3
  const form = new FormData()
  form.append('title', `${TEST_PREFIX}Event Iso`)
  form.append('description', 'Test event isolation')
  form.append('eventId', 'day-3')
  form.append('files', new Blob(['event file'], { type: 'application/pdf' }), `${TEST_PREFIX}event_iso.pdf`)

  const res = await (await fetch(`${baseUrl}/api/v1/hackathon/problem-statements`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${organizerToken}` },
    body: form,
  })).json()
  const problemId = res.data.id

  // Querying with different eventId (e.g. day-1) should not list this problem or its files
  const otherEventRes = await (await fetch(`${baseUrl}/api/v1/hackathon/problem-statements?eventId=day-1`)).json()
  const found = otherEventRes.data.find((p) => String(p.id) === String(problemId))
  assert.equal(found, undefined)
})

// 21. Problem selection continues to work normally
test('21. Problem selection continues to work normally with attachments', async () => {
  const { regId, teamId } = await createTestRegistrationAndTeam('S1')
  const teamLeadToken = generateToken({
    userId: 301,
    registrationId: regId,
    email: 'team_lead_s1@example.com',
    role: 'STUDENT',
  })

  // Create problem with files
  const form = new FormData()
  form.append('title', `${TEST_PREFIX}Selectable With Files`)
  form.append('description', 'Selectable challenge description')
  form.append('maxCapacity', '5')
  form.append('files', new Blob(['test file'], { type: 'application/pdf' }), `${TEST_PREFIX}selectable.pdf`)

  const created = await (await fetch(`${baseUrl}/api/v1/hackathon/problem-statements`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${organizerToken}` },
    body: form,
  })).json()
  const problemId = created.data.id

  // Team selects problem
  const selectRes = await fetch(`${baseUrl}/api/v1/hackathon/problem-statements/${problemId}/select`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${teamLeadToken}` },
  })
  assert.equal(selectRes.status, 201)
  const selectData = await selectRes.json()
  assert.equal(selectData.success, true)
  assert.equal(String(selectData.data.problemStatementId), String(problemId))
})

// 22. Existing team selection cannot be changed when attachments are modified
test('22. Existing team selection cannot be changed when attachments are added or deleted', async () => {
  const { regId, teamId } = await createTestRegistrationAndTeam('S2')
  const teamLeadToken = generateToken({
    userId: 302,
    registrationId: regId,
    email: 'team_lead_s2@example.com',
    role: 'STUDENT',
  })

  // Create Problem
  const form = new FormData()
  form.append('title', `${TEST_PREFIX}Lock Problem`)
  form.append('description', 'Lock problem description')
  form.append('maxCapacity', '5')
  form.append('files', new Blob(['initial file'], { type: 'application/pdf' }), `${TEST_PREFIX}initial.pdf`)

  const created = await (await fetch(`${baseUrl}/api/v1/hackathon/problem-statements`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${organizerToken}` },
    body: form,
  })).json()
  const problemId = created.data.id
  const initialFileId = created.data.attachments[0].id

  // Team selects problem
  await fetch(`${baseUrl}/api/v1/hackathon/problem-statements/${problemId}/select`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${teamLeadToken}` },
  })

  // Organizer adds another file to the problem
  const editForm = new FormData()
  editForm.append('files', new Blob(['second file'], { type: 'image/png' }), `${TEST_PREFIX}second.png`)
  await fetch(`${baseUrl}/api/v1/hackathon/problem-statements/${problemId}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${organizerToken}` },
    body: editForm,
  })

  // Organizer deletes the first file
  await fetch(`${baseUrl}/api/v1/hackathon/problem-statements/${problemId}/files/${initialFileId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${organizerToken}` },
  })

  // Team tries to select another problem -> Must still be rejected with ALREADY_SELECTED
  const formOther = new FormData()
  formOther.append('title', `${TEST_PREFIX}Other Problem`)
  formOther.append('description', 'Other challenge')
  const other = await (await fetch(`${baseUrl}/api/v1/hackathon/problem-statements`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${organizerToken}` },
    body: formOther,
  })).json()

  const secondSelectRes = await fetch(`${baseUrl}/api/v1/hackathon/problem-statements/${other.data.id}/select`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${teamLeadToken}` },
  })
  assert.equal(secondSelectRes.status, 409)
  const errData = await secondSelectRes.json()
  assert.equal(errData.error.code, 'ALREADY_SELECTED')
})

// 23. Multiple attachments remain associated with the same problem
test('23. Multiple attachments remain associated with the same problem after edit', async () => {
  const form = new FormData()
  form.append('title', `${TEST_PREFIX}Persistent Associations`)
  form.append('description', 'Test persistent associations')
  form.append('files', new Blob(['file1'], { type: 'image/jpeg' }), `${TEST_PREFIX}assoc1.jpg`)
  form.append('files', new Blob(['file2'], { type: 'application/pdf' }), `${TEST_PREFIX}assoc2.pdf`)

  const created = await (await fetch(`${baseUrl}/api/v1/hackathon/problem-statements`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${organizerToken}` },
    body: form,
  })).json()
  const problemId = created.data.id

  // Edit problem details and append file 3
  const editForm = new FormData()
  editForm.append('description', 'Updated description for persistent associations')
  editForm.append('files', new Blob(['file3'], { type: 'image/png' }), `${TEST_PREFIX}assoc3.png`)

  const updated = await (await fetch(`${baseUrl}/api/v1/hackathon/problem-statements/${problemId}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${organizerToken}` },
    body: editForm,
  })).json()

  assert.equal(updated.data.attachments.length, 3)
  const filenames = updated.data.attachments.map((a) => a.originalFilename)
  assert.ok(filenames.includes(`${TEST_PREFIX}assoc1.jpg`))
  assert.ok(filenames.includes(`${TEST_PREFIX}assoc2.pdf`))
  assert.ok(filenames.includes(`${TEST_PREFIX}assoc3.png`))
})
