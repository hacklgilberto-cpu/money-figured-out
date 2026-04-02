// scripts/seed-pave-data.js
// Reads data/pave.csv, parses each row's `attributes` JSON column,
// and upserts into the four Pave foundation tables.
//
// Usage:
//   node scripts/seed-pave-data.js
//   node scripts/seed-pave-data.js --file data/other.csv
//
// Expected CSV columns (all others are ignored):
//   user_id      — UUID matching users.id
//   synced_date  — ISO date string (YYYY-MM-DD), falls back to today
//   attributes   — JSON string containing any/all of:
//                    recurring_expenditures[]
//                    recurring_income[]
//                    ritual_expenses[]
//                    financial_health.detailed_summary[]
//                    deposit_amount_required
//                    next_paydate
//                    end_of_day_balances[]

'use strict';

const PAVE_DEMO_USER_ID = '2208734';

const fs    = require('fs');
const path  = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

// ── CLI arg: --file path/to/override.csv ──────────────────────────
const fileArgIdx = process.argv.indexOf('--file');
const csvPath = fileArgIdx !== -1
  ? path.resolve(process.argv[fileArgIdx + 1])
  : path.resolve(__dirname, '../data/pave.csv');

// ── DB connection (pooler URL, port 6543) ─────────────────────────
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// ── Minimal CSV parser (handles quoted fields with embedded commas) ─
function parseCsv(raw) {
  const lines = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const headers = splitCsvLine(lines[0]);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const values = splitCsvLine(line);
    const row = {};
    headers.forEach((h, idx) => { row[h.trim()] = values[idx] ?? ''; });
    rows.push(row);
  }
  return rows;
}

function splitCsvLine(line) {
  const fields = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else { inQuotes = !inQuotes; }
    } else if (ch === ',' && !inQuotes) {
      fields.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  fields.push(current);
  return fields;
}

// ── Upsert helpers ────────────────────────────────────────────────

async function upsertRecurringSet(client, userId, syncedDate, setType, set) {
  await client.query(
    `INSERT INTO recurring_sets
       (user_id, synced_date, set_type, merchant_name, frequency, amount, category, raw_json)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     ON CONFLICT (user_id, merchant_name, set_type) DO UPDATE SET
       frequency   = EXCLUDED.frequency,
       amount      = EXCLUDED.amount,
       category    = EXCLUDED.category,
       raw_json    = EXCLUDED.raw_json,
       synced_date = EXCLUDED.synced_date`,
    [
      userId,
      syncedDate,
      setType,
      set.merchant_name ?? set.name ?? null,
      set.frequency ?? null,
      set.amount ?? null,
      set.category ?? null,
      JSON.stringify(set),
    ]
  );
}

async function upsertFeeEvent(client, userId, syncedDate, fee) {
  await client.query(
    `INSERT INTO fee_events
       (user_id, event_date, fee_type, merchant_name, amount, raw_json)
     VALUES ($1,$2,$3,$4,$5,$6)
     ON CONFLICT (user_id, event_date, fee_type) DO UPDATE SET
       merchant_name = EXCLUDED.merchant_name,
       amount        = EXCLUDED.amount,
       raw_json      = EXCLUDED.raw_json`,
    [
      userId,
      fee.date ?? syncedDate,
      fee.fee_type ?? 'financial_health',
      fee.merchant_name ?? fee.name ?? null,
      fee.amount_90d ?? fee.amount ?? null,
      JSON.stringify(fee),
    ]
  );
}

async function upsertIncomePredict(client, userId, syncedDate, income) {
  await client.query(
    `INSERT INTO income_predictions
       (user_id, synced_date, deposit_amount_required, next_paydate, raw_json)
     VALUES ($1,$2,$3,$4,$5)
     ON CONFLICT (user_id, synced_date) DO UPDATE SET
       deposit_amount_required = EXCLUDED.deposit_amount_required,
       next_paydate            = EXCLUDED.next_paydate,
       raw_json                = EXCLUDED.raw_json`,
    [
      userId,
      syncedDate,
      null,
      null,
      JSON.stringify({
        monthly_income:      income.monthly_income      ?? null,
        income_next_30d:     income.income_next_30d     ?? null,
        income_next_7d:      income.income_next_7d      ?? null,
        is_biweekly:         income.is_biweekly         ?? null,
        is_weekly:           income.is_weekly           ?? null,
        is_payroll:          income.is_payroll          ?? null,
        has_active_payroll:  income.has_active_payroll  ?? null,
        inflows_past_30d:    income.inflows_past_30d    ?? null,
      }),
    ]
  );
}

async function upsertBalanceSnapshot(client, userId, day) {
  await client.query(
    `INSERT INTO balance_snapshots
       (user_id, snapshot_date, projected_balance, is_projected, raw_json)
     VALUES ($1,$2,$3,true,$4)
     ON CONFLICT (user_id, snapshot_date) DO UPDATE SET
       projected_balance = EXCLUDED.projected_balance,
       is_projected      = EXCLUDED.is_projected,
       raw_json          = EXCLUDED.raw_json`,
    [userId, day.date, day.balance ?? null, JSON.stringify(day)]
  );
}

// ── Per-row processor ─────────────────────────────────────────────

async function processRow(client, row, today) {
  const userId     = process.env.MARCUS_USER_ID;
  const syncedDate = row.synced_date?.trim() || today;

  if (!userId) {
    console.warn('[seed] Skipping row — MARCUS_USER_ID not set in env');
    return;
  }

  let attrs;
  try {
    attrs = JSON.parse(row.attributes);
  } catch {
    console.warn(`[seed] Skipping user ${userId} — invalid attributes JSON`);
    return;
  }

  const counts = { recurring: 0, fees: 0, income: 0, balances: 0 };

  // recurring_expenditures → recurring_sets (expense)
  for (const set of attrs.recurring_expenditures ?? []) {
    await upsertRecurringSet(client, userId, syncedDate, 'expense', set);
    counts.recurring++;
  }

  // recurring_income → recurring_sets (income)
  for (const set of attrs.recurring_income ?? []) {
    await upsertRecurringSet(client, userId, syncedDate, 'income', set);
    counts.recurring++;
  }

  // ritual_expenses → recurring_sets (ritual)
  for (const set of attrs.ritual_expenses ?? []) {
    await upsertRecurringSet(client, userId, syncedDate, 'ritual', set);
    counts.recurring++;
  }

  // financial_health.detailed_summary → fee_events
  for (const fee of attrs.financial_health?.detailed_summary ?? []) {
    await upsertFeeEvent(client, userId, syncedDate, fee);
    counts.fees++;
  }

  // income object → income_predictions
  const incomeObj = attrs.income ?? attrs;
  if (incomeObj.monthly_income != null || incomeObj.income_next_30d != null || incomeObj.has_active_payroll != null) {
    await upsertIncomePredict(client, userId, syncedDate, incomeObj);
    counts.income++;
  }

  // end_of_day_balances → balance_snapshots
  for (const day of attrs.end_of_day_balances ?? []) {
    await upsertBalanceSnapshot(client, userId, day);
    counts.balances++;
  }

  console.log(
    `[seed] user ${userId} (${syncedDate}): ` +
    `${counts.recurring} recurring, ${counts.fees} fee events, ` +
    `${counts.income} income prediction, ${counts.balances} balance days`
  );
}

// ── Main ──────────────────────────────────────────────────────────

async function main() {
  if (!fs.existsSync(csvPath)) {
    console.error(`[seed] CSV not found: ${csvPath}`);
    process.exit(1);
  }

  const raw  = fs.readFileSync(csvPath, 'utf8');
  const allRows = parseCsv(raw);
  const rows = allRows.filter(r => r._user?.trim() === PAVE_DEMO_USER_ID);
  console.log(`[seed] Loaded ${allRows.length} total row(s), ${rows.length} matching PAVE_DEMO_USER_ID ${PAVE_DEMO_USER_ID} from ${csvPath}`);

  const today  = new Date().toISOString().split('T')[0];
  const client = await pool.connect();

  let success = 0;
  let failure = 0;

  try {
    for (const row of rows) {
      try {
        await processRow(client, row, today);
        success++;
      } catch (err) {
        console.error(`[seed] Row failed (user_id=${row.user_id}):`, err.message);
        failure++;
      }
    }
  } finally {
    client.release();
    await pool.end();
  }

  console.log(`\n[seed] Done — ${success} succeeded, ${failure} failed.`);
  if (failure > 0) process.exit(1);
}

main();
