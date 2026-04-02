require('dotenv').config({ path: '.env.local' })
const { Pool } = require('pg')
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })

async function test() {
  try {
    await pool.query(`
      INSERT INTO fee_events (user_id, event_date, fee_type, merchant_name, amount, raw_json)
      VALUES ('test', '2026-03-26', 'nsf', 'NSF Fee', 34, '{}')
    `)
    console.log('INSERT OK')
  } catch (e) {
    console.log('INSERT ERROR:', e.message)
  }

  try {
    await pool.query(`
      INSERT INTO income_predictions (user_id, synced_date, deposit_amount_required, next_paydate, raw_json)
      VALUES ('test', '2026-03-26', null, null, '{}')
    `)
    console.log('INCOME INSERT OK')
  } catch (e) {
    console.log('INCOME INSERT ERROR:', e.message)
  }

  await pool.end()
}

test()
