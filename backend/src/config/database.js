const { db, databaseUrl } = require('./env')
const { Pool, types } = require('pg')

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

module.exports = {
  host: db.host,
  port: db.port,
  name: db.name,
  user: db.user,
  password: db.password,
  databaseUrl,
  pool,
}

