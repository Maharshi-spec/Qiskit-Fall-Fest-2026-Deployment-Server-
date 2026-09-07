const app = require('./app')
const { port } = require('./config/env')
const { initializeDatabase } = require('./config/database-init')

const startServer = async () => {
  await initializeDatabase()

  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`)
  })
}

startServer().catch((error) => {
  console.error('Unable to start server:', error)
  process.exitCode = 1
})
