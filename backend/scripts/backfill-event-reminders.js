const { pool } = require('../src/config/database')
const { EVENT_DAYS, getScheduledAt } = require('../src/services/reminder.service')

const getConfirmedRegistrations = async () => {
  const result = await pool.query(
    `SELECT registration_id AS "registrationId"
     FROM registrations
     WHERE COALESCE(status, 'CONFIRMED') = 'CONFIRMED'
     ORDER BY registration_id`,
  )

  return result.rows
}

const buildReminderInsertValues = (registrationId) => {
  const values = []
  const placeholders = EVENT_DAYS.map((day) => {
    const offset = values.length
    values.push(registrationId, day.dayNumber, day.eventDate, getScheduledAt(day.eventDate))
    return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, 'PENDING')`
  })

  return { values, placeholders }
}

const insertRegistrationReminders = async (registrationId) => {
  const { values, placeholders } = buildReminderInsertValues(registrationId)

  const query = `
    INSERT INTO event_reminders (registration_id, day_number, event_date, scheduled_at, status)
    VALUES ${placeholders.join(', ')}
    ON CONFLICT (registration_id, day_number) DO NOTHING
    RETURNING id
  `

  const result = await pool.query(query, values)
  return result.rowCount || 0
}

const main = async () => {
  const registrations = await getConfirmedRegistrations()
  const totalConfirmed = registrations.length
  let insertedCount = 0
  let skippedCount = 0

  await pool.query('BEGIN')

  try {
    for (const registration of registrations) {
      const insertedForRegistration = await insertRegistrationReminders(registration.registrationId)
      insertedCount += insertedForRegistration
      skippedCount += EVENT_DAYS.length - insertedForRegistration
    }

    await pool.query('COMMIT')
  } catch (error) {
    await pool.query('ROLLBACK')
    throw error
  }

  const countsResult = await pool.query(`
    SELECT
      COUNT(*) FILTER (WHERE day_number = 1) AS day_1_count,
      COUNT(*) FILTER (WHERE day_number = 2) AS day_2_count,
      COUNT(*) FILTER (WHERE day_number = 3) AS day_3_count,
      COUNT(*) FILTER (WHERE day_number = 4) AS day_4_count
    FROM event_reminders
  `)

  const counts = countsResult.rows[0]

  console.log(`Confirmed registrations found: ${totalConfirmed}`)
  console.log(`Reminder rows inserted: ${insertedCount}`)
  console.log(`Reminder rows skipped because they already existed: ${skippedCount}`)
  console.log(
    `Final reminder counts by day: day_1=${Number(counts.day_1_count) || 0}, ` +
      `day_2=${Number(counts.day_2_count) || 0}, ` +
      `day_3=${Number(counts.day_3_count) || 0}, ` +
      `day_4=${Number(counts.day_4_count) || 0}`,
  )
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(`Backfill failed: ${error.message}`)
    process.exit(1)
  })
