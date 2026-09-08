const fs = require('node:fs/promises')
const path = require('node:path')
const { spawn } = require('node:child_process')
const app = require('./app')
const { port } = require('./config/env')
const { initializeDatabase } = require('./config/database-init')

const importerScript = path.resolve(__dirname, '../scripts/import_students.py')
const importerWorkbook = path.resolve(__dirname, '../scripts/Untitled spreadsheet - Copy.xlsx')

const runAutomaticStudentImport = async () => {
  if (process.env.AUTO_IMPORT_STUDENTS !== 'true') {
    return
  }

  try {
    await fs.access(importerWorkbook)
  } catch (_error) {
    console.warn(`[AUTO_IMPORT] Excel file not found: ${importerWorkbook}. Skipping automatic import.`)
    return
  }

  const pythonCommand = process.env.PYTHON_EXECUTABLE || (process.platform === 'win32' ? 'python' : 'python3')
  const args = [importerScript, '--file', importerWorkbook]
  if (process.env.AUTO_IMPORT_DRY_RUN === 'true') {
    args.push('--dry-run')
  }

  console.log(`[AUTO_IMPORT] Starting automatic student import${process.env.AUTO_IMPORT_DRY_RUN === 'true' ? ' (dry run)' : ''}.`)
  const importer = spawn(pythonCommand, args, {
    cwd: path.resolve(__dirname, '..'),
    env: process.env,
    stdio: 'inherit',
  })

  importer.on('error', (error) => {
    console.error('[AUTO_IMPORT] Unable to start importer:', error.message)
  })

  importer.on('close', (code, signal) => {
    if (code === 0) {
      console.log('[AUTO_IMPORT] Automatic student import completed.')
      return
    }
    console.error(`[AUTO_IMPORT] Importer exited unsuccessfully (code=${code}, signal=${signal || 'none'}).`)
  })
}

const startServer = async () => {
  await initializeDatabase()

  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`)
    void runAutomaticStudentImport()
  })
}

startServer().catch((error) => {
  console.error('Unable to start server:', error)
  process.exitCode = 1
})
