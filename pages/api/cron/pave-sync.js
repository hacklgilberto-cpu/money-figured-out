// pages/api/cron/pave-sync.js
// Nightly Pave cashflow sync. Registered in vercel.json under crons.
// Fetches Plaid transactions for every connected user, calls three
// Pave endpoints, and writes results to Supabase.

export const maxDuration = 60;

import { plaidClient } from '../../../lib/plaid';
import { pool } from '../../../lib/supabaseClient';
import {
  getUnifiedInsights,
  getDepositAmountRequired,
  getEndOfDayBalances,
} from '../../../lib/paveService';

export default async function handler(req, res) {
  const authHeader = req.headers['authorization'];
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // All users with at least one live Plaid item
  const { rows: items } = await pool.query(`
    SELECT DISTINCT ON (pi.user_id) pi.user_id, pi.access_token
    FROM plaid_items pi
    WHERE pi.revoked_at IS NULL
    ORDER BY pi.user_id, pi.created_at DESC
  `);

  const results = [];
  for (const item of items) {
    try {
      await syncUser(item.user_id, item.access_token);
      results.push({ user_id: item.user_id, ok: true });
    } catch (err) {
      console.error(`[pave-sync] user ${item.user_id}:`, err.message);
      results.push({ user_id: item.user_id, ok: false, error: err.message });
    }
  }

  return res.status(200).json({ synced: results.length, results });
}

async function syncUser(userId, accessToken) {
  const today = new Date().toISOString().split('T')[0];
  const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  // ── 1. Fetch from Plaid ────────────────────────────────────────
  const [accountsRes, txRes] = await Promise.all([
    plaidClient.accountsGet({ access_token: accessToken }),
    plaidClient.transactionsGet({
      access_token: accessToken,
      start_date: sixtyDaysAgo,
      end_date: today,
      options: { count: 500 },
    }),
  ]);

  const accounts = accountsRes.data.accounts;
  const transactions = txRes.data.transactions;

  const checking =
    accounts.find(a => a.type === 'depository' && a.subtype === 'checking') ||
    accounts.find(a => a.type === 'depository') ||
    accounts[0];
  const currentBalance = checking?.balances?.current ?? 0;

  // ── 2. Call Pave in parallel ───────────────────────────────────
  const [insights, depositReq, eodBalances] = await Promise.all([
    getUnifiedInsights(userId, transactions),
    getDepositAmountRequired(userId, transactions),
    getEndOfDayBalances(userId, transactions, currentBalance),
  ]);

  // ── 3. Write to Supabase in a single transaction ───────────────
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // recurring_sets — expenditures + income + ritual_expenses from unified_insights
    const expenditures  = insights?.recurring_expenditures ?? [];
    const incomeStreams  = insights?.recurring_income ?? [];
    const ritualExpenses = insights?.ritual_expenses ?? [];

    const recurringRows = [
      ...expenditures.map(s => ({ ...s, setType: 'expense' })),
      ...incomeStreams.map(s => ({ ...s, setType: 'income' })),
      ...ritualExpenses.map(s => ({ ...s, setType: 'ritual' })),
    ];

    for (const set of recurringRows) {
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
        [userId, today, set.setType,
         set.merchant_name ?? set.name ?? null,
         set.frequency ?? null, set.amount ?? null,
         set.category ?? null, JSON.stringify(set)]
      );
    }

    // income_predictions — deposit_amount_required
    await client.query(
      `INSERT INTO income_predictions
         (user_id, synced_date, deposit_amount_required, next_paydate, raw_json)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (user_id, synced_date) DO UPDATE SET
         deposit_amount_required = EXCLUDED.deposit_amount_required,
         next_paydate            = EXCLUDED.next_paydate,
         raw_json                = EXCLUDED.raw_json`,
      [userId, today,
       depositReq?.deposit_amount_required ?? null,
       depositReq?.next_paydate ?? null,
       JSON.stringify(depositReq)]
    );

    // fee_events — financial_health.detailed_summary from unified_insights
    const feeEvents = insights?.financial_health?.detailed_summary ?? [];
    for (const fee of feeEvents) {
      await client.query(
        `INSERT INTO fee_events
           (user_id, event_date, merchant_name, amount, fee_type, raw_json)
         VALUES ($1,$2,$3,$4,$5,$6)
         ON CONFLICT (user_id, event_date, merchant_name) DO UPDATE SET
           amount   = EXCLUDED.amount,
           fee_type = EXCLUDED.fee_type,
           raw_json = EXCLUDED.raw_json`,
        [userId, fee.date ?? today,
         fee.merchant_name ?? fee.name ?? null,
         fee.amount ?? null,
         fee.fee_type ?? 'ritual',
         JSON.stringify(fee)]
      );
    }

    // balance_snapshots — end_of_day_balances projected days
    const projectedDays = eodBalances?.end_of_day_balances ?? [];
    for (const day of projectedDays) {
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

    await client.query('COMMIT');
    console.log(`[pave-sync] user ${userId}: ${expenditures.length} expenses, ${incomeStreams.length} income, ${ritualExpenses.length} ritual, ${feeEvents.length} fee events, ${projectedDays.length} balance days`);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
