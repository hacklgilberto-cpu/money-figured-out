/**
 * scripts/seed-pave.js
 *
 * Seeds fee_events and income_predictions from pave.csv.
 * Maps user 2208734 (best demo profile) to Marcus Rivera's UUID.
 *
 * Run: node scripts/seed-pave.js
 */

require('dotenv').config({ path: '.env.local' })
const fs   = require('fs')
const path = require('path')
const { Pool } = require('pg')

const PAVE_DEMO_USER_ID = '2208734'
const MARCUS_USER_ID    = process.env.MARCUS_USER_ID

if (!MARCUS_USER_ID) {
  console.error('[seed-pave] MARCUS_USER_ID not set in .env.local')
  process.exit(1)
}

const CSV_PATH = path.join(__dirname, '..', 'pave.csv')
const TODAY    = new Date().toISOString().slice(0, 10)

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})

function parseCSV(filePath) {
  const raw   = fs.readFileSync(filePath, 'utf-8').replace(/^\uFEFF/, '')
  const parts = raw.split(/\n(\d{6,}),/)
  const records = []
  for (let i = 1; i < parts.length - 1; i += 2) {
    const rowBody  = parts[i + 1]
    const uidMatch = rowBody.match(/UTC,(\d+),/)
    if (!uidMatch) continue
    const uid = uidMatch[1]
    const idx = rowBody.indexOf('{')
    if (idx === -1) continue
    const fixed     = rowBody.slice(idx).replace(/""/g, '"')
    const lastComma = fixed.lastIndexOf(', ')
    if (lastComma < 100) continue
    try {
      const obj = JSON.parse(fixed.slice(0, lastComma) + '}')
      obj._pave_user = uid
      records.push(obj)
    } catch (_) {}
  }
  return records
}

async function main() {
  console.log('[seed-pave] Reading CSV...')
  const allRecords = parseCSV(CSV_PATH)
  console.log(`[seed-pave] Parsed ${allRecords.length} total records`)

  const marcus = allRecords.find(a => a._pave_user === PAVE_DEMO_USER_ID)
  if (!marcus) {
    console.error(`[seed-pave] Demo user ${PAVE_DEMO_USER_ID} not found in CSV`)
    process.exit(1)
  }

  console.log(`[seed-pave] Found demo user ${PAVE_DEMO_USER_ID} → mapping to Marcus ${MARCUS_USER_ID}`)
  console.log(`[seed-pave] Income: $${Math.abs(marcus.income_past_30d).toFixed(0)}/mo | NSF: $${marcus.nsf_fee_past_90d} | OD: $${marcus.overdraft_fee_past_90d} | ATM: $${marcus.atm_fees_past_90d}`)

  const client = await pool.connect()

  try {
    // ── fee_events ─────────────────────────────────────────────────────────
    // Each fee type is its own independent insert — no shared transaction
    const fees = [
      { fee_type: 'nsf',       amount: marcus.nsf_fee_past_90d      ?? 0 },
      { fee_type: 'overdraft', amount: marcus.overdraft_fee_past_90d ?? 0 },
      { fee_type: 'atm',       amount: marcus.atm_fees_past_90d      ?? 0 },
      { fee_type: 'late',      amount: marcus.late_fee_past_90d      ?? 0 },
    ]

    let feeOk = 0
    for (const fee of fees) {
      if (fee.amount === 0) continue
      try {
        await client.query(`
          INSERT INTO fee_events
            (user_id, event_date, fee_type, merchant_name, amount, raw_json)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (user_id, event_date, fee_type)
          DO UPDATE SET
            amount        = EXCLUDED.amount,
            merchant_name = EXCLUDED.merchant_name,
            raw_json      = EXCLUDED.raw_json
        `, [
          MARCUS_USER_ID,
          TODAY,
          fee.fee_type,
          fee.fee_type.charAt(0).toUpperCase() + fee.fee_type.slice(1) + ' Fee',
          fee.amount,
          JSON.stringify({ amount_90d: fee.amount, source: 'pave_attributes' }),
        ])
        console.log(`  ✅ fee_events: ${fee.fee_type} $${fee.amount}`)
        feeOk++
      } catch (err) {
        console.error(`  ❌ fee_events ${fee.fee_type}: ${err.message}`)
      }
    }

    // ── income_predictions ─────────────────────────────────────────────────
    const rawJson = JSON.stringify({
      monthly_income:        marcus.income_past_30d    ? Math.abs(marcus.income_past_30d)  : null,
      income_next_30d:       marcus.income_next_30d    ? Math.abs(marcus.income_next_30d)  : null,
      income_next_7d:        marcus.income_next_7d     ? Math.abs(marcus.income_next_7d)   : null,
      inflows_past_30d:      marcus.inflows_past_30d   ?? null,
      is_biweekly:           marcus.is_primary_income_biweekly ?? null,
      is_weekly:             marcus.is_primary_income_weekly   ?? null,
      is_payroll:            marcus.is_primary_income_payroll  ?? null,
      has_active_payroll:    marcus.has_active_payroll != null ? Boolean(marcus.has_active_payroll) : null,
      debt_payments_30d:     marcus.debt_payments_past_30d     ?? null,
      food_delivery_30d:     marcus.food_delivery_past_30d     ?? null,
      subscriptions_30d:     marcus.subscriptions_past_30d     ?? null,
      essential_outflows_30d: marcus.essential_outflows_past_30d ?? null,
      source: 'pave_attributes',
    })

    try {
      await client.query(`
        INSERT INTO income_predictions
          (user_id, synced_date, deposit_amount_required, next_paydate, raw_json)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (user_id, synced_date)
        DO UPDATE SET
          deposit_amount_required = EXCLUDED.deposit_amount_required,
          next_paydate            = EXCLUDED.next_paydate,
          raw_json                = EXCLUDED.raw_json
      `, [
        MARCUS_USER_ID,
        TODAY,
        null,
        null,
        rawJson,
      ])
      console.log(`  ✅ income_predictions: $${Math.abs(marcus.income_past_30d).toFixed(0)}/mo`)
    } catch (err) {
      console.error(`  ❌ income_predictions: ${err.message}`)
    }

    console.log(`\n[seed-pave] ✅ Done — fee_events: ${feeOk} rows, income_predictions: 1 row`)

  } finally {
    client.release()
    await pool.end()
  }
}

main().catch(err => {
  console.error('[seed-pave] Fatal:', err.message)
  process.exit(1)
})
