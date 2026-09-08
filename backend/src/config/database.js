const { db, databaseUrl } = require('./env')
const { Pool, types } = require('pg')
const { getActiveEventProfile } = require('../middleware/profile.middleware')

// Force DATE columns (OID 1082) to be returned as plain YYYY-MM-DD strings
types.setTypeParser(1082, (val) => val)

const poolConfig = {
  connectionString: databaseUrl,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
}

const pool = new Pool(poolConfig)

pool.on('error', (err) => {
  console.error('Unexpected Postgres client error', err)
})

const POST_QISKIT_REPLACEMENTS = [
  // Sequences first
  ['registrations_registration_id_seq', 'post_qiskit_registrations_registration_id_seq'],
  ['registrations_id_seq', 'post_qiskit_registrations_id_seq'],
  ['certificates_id_seq', 'post_qiskit_certificates_id_seq'],
  ['teams_id_seq', 'post_qiskit_teams_id_seq'],
  ['team_members_id_seq', 'post_qiskit_team_members_id_seq'],
  ['attendance_id_seq', 'post_qiskit_attendance_id_seq'],
  ['attendance_sessions_id_seq', 'post_qiskit_attendance_sessions_id_seq'],
  ['attendance_tokens_id_seq', 'post_qiskit_attendance_tokens_id_seq'],
  ['hackathon_results_id_seq', 'post_qiskit_hackathon_results_id_seq'],
  ['hackathon_problem_statement_files_id_seq', 'post_qiskit_hackathon_problem_statement_files_id_seq'],
  ['hackathon_problem_statements_id_seq', 'post_qiskit_hackathon_problem_statements_id_seq'],
  ['hackathon_problem_selections_id_seq', 'post_qiskit_hackathon_problem_selections_id_seq'],
  ['event_reminders_id_seq', 'post_qiskit_event_reminders_id_seq'],
  // Tables next (longer names first)
  ['hackathon_problem_statement_files', 'post_qiskit_hackathon_problem_statement_files'],
  ['hackathon_problem_statements', 'post_qiskit_hackathon_problem_statements'],
  ['hackathon_problem_selections', 'post_qiskit_hackathon_problem_selections'],
  ['attendance_sessions', 'post_qiskit_attendance_sessions'],
  ['attendance_tokens', 'post_qiskit_attendance_tokens'],
  ['attendance', 'post_qiskit_attendance'],
  ['certificates', 'post_qiskit_certificates'],
  ['event_reminders', 'post_qiskit_event_reminders'],
  ['hackathon_results', 'post_qiskit_hackathon_results'],
  ['team_members', 'post_qiskit_team_members'],
  ['teams', 'post_qiskit_teams'],
  ['registrations', 'post_qiskit_registrations'],
  ['events', 'post_qiskit_events'],
]

const replacementMap = new Map(POST_QISKIT_REPLACEMENTS)
const rewritePattern = new RegExp(
  `(?<!post_qiskit_|pre_qiskit_)\\b(${POST_QISKIT_REPLACEMENTS.map(([k]) => k).join('|')})\\b`,
  'gi'
)

const rewriteSqlForProfile = (sql, profile) => {
  if (profile !== 'post-qiskit' || typeof sql !== 'string') return sql
  return sql.replace(rewritePattern, (matched) => {
    return replacementMap.get(matched.toLowerCase()) || matched
  })
}

// Transparently wrap pool.query
const rawPoolQuery = pool.query.bind(pool)
pool.query = function (queryTextOrConfig, values, callback) {
  const profile = getActiveEventProfile()
  if (typeof queryTextOrConfig === 'string') {
    const rewritten = rewriteSqlForProfile(queryTextOrConfig, profile)
    return rawPoolQuery(rewritten, values, callback)
  }
  if (queryTextOrConfig && typeof queryTextOrConfig === 'object' && queryTextOrConfig.text) {
    const rewritten = rewriteSqlForProfile(queryTextOrConfig.text, profile)
    return rawPoolQuery({ ...queryTextOrConfig, text: rewritten }, values, callback)
  }
  return rawPoolQuery(queryTextOrConfig, values, callback)
}

const wrapClient = (client) => {
  if (!client || client.__wrappedForProfile) return client
  client.__wrappedForProfile = true
  const rawClientQuery = client.query.bind(client)
  client.query = function (queryTextOrConfig, values, callback) {
    const profile = getActiveEventProfile()
    if (typeof queryTextOrConfig === 'string') {
      const rewritten = rewriteSqlForProfile(queryTextOrConfig, profile)
      return rawClientQuery(rewritten, values, callback)
    }
    if (queryTextOrConfig && typeof queryTextOrConfig === 'object' && queryTextOrConfig.text) {
      const rewritten = rewriteSqlForProfile(queryTextOrConfig.text, profile)
      return rawClientQuery({ ...queryTextOrConfig, text: rewritten }, values, callback)
    }
    return rawClientQuery(queryTextOrConfig, values, callback)
  }
  return client
}

// Transparently wrap pool.connect for clients in transactions
const rawPoolConnect = pool.connect.bind(pool)
pool.connect = function (callback) {
  if (typeof callback === 'function') {
    return rawPoolConnect((err, client, release) => {
      if (err) return callback(err)
      wrapClient(client)
      return callback(null, client, release)
    })
  }

  return rawPoolConnect().then((client) => {
    wrapClient(client)
    return client
  })
}

module.exports = {
  host: db.host,
  port: db.port,
  name: db.name,
  user: db.user,
  password: db.password,
  databaseUrl,
  pool,
  rewriteSqlForProfile,
}

