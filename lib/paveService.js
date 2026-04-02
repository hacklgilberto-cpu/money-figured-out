// lib/paveService.js
// Pave Cashflow API wrapper.
// All functions hit Pave and return raw parsed JSON.
// Never call these from UI routes — use the nightly cron only.

const PAVE_BASE_URL = 'https://api.pave.dev/v1';

function paveHeaders() {
  return {
    'Content-Type': 'application/json',
    'X-API-Key': process.env.PAVE_API_KEY,
  };
}

async function pavePost(path, body) {
  const res = await fetch(`${PAVE_BASE_URL}${path}`, {
    method: 'GET',
    headers: paveHeaders(),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Pave ${path} → ${res.status}: ${text}`);
  }

  return res.json();
}

// ─── getUnifiedInsights ───────────────────────────────────────────
// Calls /cashflow/unified_insights for a given user.
// Returns: recurring expenditure sets, income predictions, ritual
//          expense summaries, and financial health score.
// userId:  internal Pave user ID (stored in pave_user_id on users row)
// transactions: array of Plaid-formatted transaction objects
export async function getUnifiedInsights(userId, transactions) {
  return pavePost(`/users/${userId}/cashflow/unified_insights`, {
    transactions,
  });
}

// ─── getDepositAmountRequired ─────────────────────────────────────
// Calls /cashflow/deposit_amount_required.
// Returns the predicted amount needed before the user's next payday
// to cover upcoming obligations.
export async function getDepositAmountRequired(userId, transactions) {
  return pavePost(`/users/${userId}/cashflow/deposit_amount_required`, {
    transactions,
  });
}

// ─── getEndOfDayBalances ──────────────────────────────────────────
// Calls /cashflow/end_of_day_balances.
// Returns projected end-of-day balances for the next 14 days based
// on known recurring items and current balance.
export async function getEndOfDayBalances(userId, transactions, currentBalance) {
  return pavePost(`/users/${userId}/cashflow/end_of_day_balances`, {
    transactions,
    current_balance: currentBalance,
  });
}
