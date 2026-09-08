const fs = require('node:fs/promises')
const path = require('node:path')
const { pool } = require('./database')

const schemaDirectory = path.resolve(__dirname, '../../../database/schema')

const requiredPreQiskitTables = [
  'events',
  'organizers',
  'registrations',
  'teams',
  'team_members',
  'attendance',
  'attendance_sessions',
  'attendance_tokens',
  'certificates',
  'event_reminders',
  'hackathon_results',
  'hackathon_problem_statements',
  'hackathon_problem_selections',
  'hackathon_problem_statement_files',
]

const requiredPostQiskitTables = [
  'post_qiskit_events',
  'post_qiskit_registrations',
  'post_qiskit_teams',
  'post_qiskit_team_members',
  'post_qiskit_attendance',
  'post_qiskit_attendance_sessions',
  'post_qiskit_attendance_tokens',
  'post_qiskit_certificates',
  'post_qiskit_event_reminders',
  'post_qiskit_hackathon_results',
  'post_qiskit_config',
  'post_qiskit_hackathon_problem_statements',
  'post_qiskit_hackathon_problem_selections',
  'post_qiskit_hackathon_problem_statement_files',
]

const organizerDetailsMigration = '012_add_organizers_details.sql'
const postQiskitSchemaMigration = '013_create_post_qiskit_schema.sql'
const postQiskitConfigMigration = '014_create_post_qiskit_config.sql'
const hackathonProblemStatementsMigration = '015_create_hackathon_problem_statements.sql'
const hackathonProblemStatementFilesMigration = '016_create_hackathon_problem_statement_files.sql'
const eventsSchemaUpdateMigration = '017_update_events_schema.sql'

const getMissingTables = async (client, tables) => {
  const result = await client.query(
    `SELECT table_name
     FROM information_schema.tables
     WHERE table_schema = 'public' AND table_name = ANY($1::text[])`,
    [tables]
  )

  const existingTables = new Set(result.rows.map((row) => row.table_name))
  return tables.filter((tableName) => !existingTables.has(tableName))
}

const getMigrationFiles = async () => {
  const files = await fs.readdir(schemaDirectory)
  return files
    .filter((fileName) => /^\d+_.+\.sql$/.test(fileName))
    .sort((left, right) => left.localeCompare(right, undefined, { numeric: true }))
}

const initializeDatabase = async () => {
  const client = await pool.connect()

  try {
    const missingPreTables = await getMissingTables(client, requiredPreQiskitTables)
    const missingPostTables = await getMissingTables(client, requiredPostQiskitTables)

    const migrationFiles = await getMigrationFiles()
    if (migrationFiles.length === 0) {
      throw new Error(`No SQL migration files found in ${schemaDirectory}`)
    }

    let filesToApply
    if (missingPreTables.length > 0) {
      console.log(`Missing Pre-Qiskit database tables detected: ${missingPreTables.join(', ')}`)
      filesToApply = migrationFiles
    } else {
      console.log('Pre-Qiskit database tables verified.')
      const updates = [organizerDetailsMigration]
      if (missingPostTables.length > 0) {
        console.log(`Missing Post-Qiskit database tables detected: ${missingPostTables.join(', ')}`)
        updates.push(postQiskitSchemaMigration)
      } else {
        updates.push(postQiskitSchemaMigration)
      }
      updates.push(postQiskitConfigMigration)
      updates.push(hackathonProblemStatementsMigration)
      updates.push(hackathonProblemStatementFilesMigration)
      updates.push(eventsSchemaUpdateMigration)
      filesToApply = updates
    }

    await client.query('BEGIN')

    for (const migrationFile of filesToApply) {
      const migrationPath = path.join(schemaDirectory, migrationFile)
      const migrationSql = await fs.readFile(migrationPath, 'utf8')
      const cleanSql = migrationSql.replace(/^\uFEFF/, '')
      await client.query(cleanSql)
      console.log(`Applied database migration: ${migrationFile}`)
    }

    await client.query('COMMIT')
    console.log('Database initialization complete.')
  } catch (error) {
    try {
      await client.query('ROLLBACK')
    } catch (rollbackError) {
      console.error('Database initialization rollback failed:', rollbackError)
    }
    throw error
  } finally {
    client.release()
  }
}

module.exports = { initializeDatabase }