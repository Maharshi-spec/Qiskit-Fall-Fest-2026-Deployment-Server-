const fs = require('node:fs/promises')
const path = require('node:path')
const { pool } = require('./database')

const schemaDirectory = path.resolve(__dirname, '../../../database/schema')

const requiredTables = [
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
]
const organizerDetailsMigration = '012_add_organizers_details.sql'

const getMissingTables = async (client) => {
  const result = await client.query(
    `SELECT table_name
     FROM information_schema.tables
     WHERE table_schema = 'public' AND table_name = ANY($1::text[])`,
    [requiredTables]
  )

  const existingTables = new Set(result.rows.map((row) => row.table_name))
  return requiredTables.filter((tableName) => !existingTables.has(tableName))
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
    const missingTables = await getMissingTables(client)

    const migrationFiles = await getMigrationFiles()
    if (migrationFiles.length === 0) {
      throw new Error(`No SQL migration files found in ${schemaDirectory}`)
    }

    const filesToApply = missingTables.length === 0
      ? [organizerDetailsMigration]
      : migrationFiles

    if (missingTables.length === 0) {
      console.log('Database tables already exist. Checking organizer details.')
    } else {
      console.log(`Missing database tables detected: ${missingTables.join(', ')}`)
    }

    await client.query('BEGIN')

    for (const migrationFile of filesToApply) {
      const migrationPath = path.join(schemaDirectory, migrationFile)
      const migrationSql = await fs.readFile(migrationPath, 'utf8')
      await client.query(migrationSql)
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