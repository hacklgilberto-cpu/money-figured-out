/**
 * DEMO PERSONA: Marcus Rivera, 34, Miami FL
 *
 * Story: Certified Nursing Assistant at Baptist Health South Florida.
 * Was paid biweekly at $1,640/paycheck ($20.50/hr × 40hrs × 2 weeks).
 * Last month his unit cut overtime and reduced some CNAs to 36hr weeks.
 * His last check came in at $1,420 ($19.72/hr avg after shift differential
 * adjustment — Baptist Health rounds weird). Before that, consistent $1,420-1,640.
 *
 * CURRENT SITUATION:
 *   Checking balance: $47.
 *   Days to payday: 6.
 *   AT&T autopay ($85) hits in 3 days.
 *   FPL electric ($94) hits in 5 days.
 *   He WILL go negative on day 3 unless he acts.
 *   After payday ($1,420) on day 6, he's briefly okay — then Progressive ($148)
 *   and Honda ($387) hit on days 8 and 10. He'll be tight again by day 12.
 *
 * MONTHLY MATH (real):
 *   Income: ~$2,840/mo (2 × $1,420)
 *   Fixed obligations: $1,050 rent + $387 car + $148 insurance + $85 phone
 *                      + $94 electric = $1,764
 *   Remaining for everything else: $1,076/mo
 *   But: $56 streaming + $185 delivery + $60 coffee + $45 CC interest
 *        + $180 groceries + $100 gas + $37 pharmacy = $663
 *   True discretionary: ~$413/mo — except NSF fees ($39 each × 5 this year = $195)
 *   and payday loan fees ($90) eat into that.
 *   Real surplus: ~$128/mo on a GOOD month. Most months: $0-50.
 *
 * CREDIT SCORE: 612 VantageScore 3.0. Sideways trajectory.
 *   6-month history: 605 → 608 → 612 → 610 → 614 → 612
 *   Reason codes: high utilization (74% on Capital One), thin file, recent late
 *
 * KEY INSIGHT: Marcus isn't irresponsible. He's a CNA making $36K/yr in Miami.
 * His rent is 37% of gross income. His car payment exists because he needs
 * the car to get to Baptist Health at 6am. The delivery apps spike after
 * 12-hour shifts when he's too exhausted to cook. This is structural, not behavioral.
 */

function monthsAgo(n, day = 1) {
  const d = new Date()
  d.setMonth(d.getMonth() - n)
  d.setDate(day)
  return d.toISOString().split('T')[0]
}

function daysFromNow(n) {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString().split('T')[0]
}

// ── Accounts ──────────────────────────────────────────────────
export const marcusAccounts = [
  {
    account_id: 'demo-checking-001',
    name: 'Wells Fargo Everyday Checking',
    type: 'depository',
    subtype: 'checking',
    balances: { current: 47, available: 47, limit: null, iso_currency_code: 'USD' }
  },
  {
    account_id: 'demo-credit-001',
    name: 'Capital One Quicksilver',
    type: 'credit',
    subtype: 'credit card',
    balances: { current: -2240, available: 760, limit: 3000, iso_currency_code: 'USD' }
  }
]

// ── Transaction builder ───────────────────────────────────────
const tx = (id, acct, name, merchant, amount, monthsBack, day, channel, cat, detail) => ({
  transaction_id: id,
  account_id: acct,
  name,
  merchant_name: merchant,
  amount,
  iso_currency_code: 'USD',
  date: monthsAgo(monthsBack, day),
  pending: false,
  payment_channel: channel,
  personal_finance_category: { primary: cat, detailed: detail }
})

const CHK = 'demo-checking-001'
const CC  = 'demo-credit-001'

export const marcusTransactions = [

  // ── INCOME: biweekly, reduced last 2 months ─────────────────
  // Months 3-5: $1,640 (full 40hr weeks)
  // Months 0-2: $1,420 (36hr weeks after unit cut)
  ...[0,1,2].flatMap(m => [
    tx(`inc-a-${m}`, CHK, 'BAPTIST HEALTH SOUTH FLORIDA PAYROLL', 'Baptist Health',
      -1420, m, 1, 'other', 'INCOME', 'INCOME_WAGES'),
    tx(`inc-b-${m}`, CHK, 'BAPTIST HEALTH SOUTH FLORIDA PAYROLL', 'Baptist Health',
      -1420, m, 15, 'other', 'INCOME', 'INCOME_WAGES'),
  ]),
  ...[3,4,5].flatMap(m => [
    tx(`inc-a-${m}`, CHK, 'BAPTIST HEALTH SOUTH FLORIDA PAYROLL', 'Baptist Health',
      -1640, m, 1, 'other', 'INCOME', 'INCOME_WAGES'),
    tx(`inc-b-${m}`, CHK, 'BAPTIST HEALTH SOUTH FLORIDA PAYROLL', 'Baptist Health',
      -1640, m, 15, 'other', 'INCOME', 'INCOME_WAGES'),
  ]),

  // ── RENT: $1,050/mo ──────────────────────────────────────────
  ...[0,1,2,3,4,5].map(m =>
    tx(`rent-${m}`, CHK, 'PALM BREEZE APARTMENTS', 'Palm Breeze Apartments',
      1050, m, 3, 'other', 'RENT_AND_UTILITIES', 'RENT_AND_UTILITIES_RENT')
  ),

  // ── CAR PAYMENT: $387/mo (2021 Honda Civic) ──────────────────
  ...[0,1,2,3,4,5].map(m =>
    tx(`car-${m}`, CHK, 'HONDA FINANCIAL SERVICES', 'Honda Financial Services',
      387, m, 10, 'other', 'LOAN_PAYMENTS', 'LOAN_PAYMENTS_CAR_PAYMENT')
  ),

  // ── CAR INSURANCE: $148/mo ───────────────────────────────────
  ...[0,1,2,3,4,5].map(m =>
    tx(`ins-${m}`, CHK, 'PROGRESSIVE INSURANCE', 'Progressive',
      148, m, 8, 'other', 'GENERAL_SERVICES', 'GENERAL_SERVICES_INSURANCE')
  ),

  // ── PHONE: AT&T $85/mo ───────────────────────────────────────
  ...[0,1,2,3,4,5].map(m =>
    tx(`phone-${m}`, CHK, 'AT&T MOBILITY', 'AT&T',
      85, m, 12, 'other', 'RENT_AND_UTILITIES', 'RENT_AND_UTILITIES_TELEPHONE_SERVICE')
  ),

  // ── UTILITIES: FPL electric ~$94/mo ──────────────────────────
  ...[0,1,2,3,4,5].map(m =>
    tx(`fpl-${m}`, CHK, 'FLORIDA POWER AND LIGHT', 'Florida Power & Light',
      [88,94,102,97,91,94][m], m, 14, 'other', 'RENT_AND_UTILITIES', 'RENT_AND_UTILITIES_ELECTRIC')
  ),

  // ── GROCERIES: Publix, Walmart — tight budget ────────────────
  tx('groc-0a', CC, 'PUBLIX #1247', 'Publix', 62, 0, 5, 'in store', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_GROCERIES'),
  tx('groc-0b', CC, 'WALMART SUPERCENTER', 'Walmart', 48, 0, 19, 'in store', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_GROCERIES'),
  tx('groc-1a', CC, 'PUBLIX #1247', 'Publix', 71, 1, 6, 'in store', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_GROCERIES'),
  tx('groc-1b', CC, 'WALMART SUPERCENTER', 'Walmart', 54, 1, 20, 'in store', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_GROCERIES'),
  tx('groc-2a', CC, 'PUBLIX #1247', 'Publix', 67, 2, 4, 'in store', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_GROCERIES'),
  tx('groc-2b', CC, 'WALMART SUPERCENTER', 'Walmart', 58, 2, 18, 'in store', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_GROCERIES'),
  tx('groc-3a', CC, 'PUBLIX #1247', 'Publix', 78, 3, 7, 'in store', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_GROCERIES'),
  tx('groc-3b', CC, 'WALMART SUPERCENTER', 'Walmart', 61, 3, 21, 'in store', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_GROCERIES'),
  tx('groc-4a', CC, 'PUBLIX #1247', 'Publix', 69, 4, 3, 'in store', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_GROCERIES'),
  tx('groc-4b', CC, 'WALMART SUPERCENTER', 'Walmart', 52, 4, 17, 'in store', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_GROCERIES'),
  tx('groc-5a', CC, 'PUBLIX #1247', 'Publix', 74, 5, 5, 'in store', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_GROCERIES'),
  tx('groc-5b', CC, 'WALMART SUPERCENTER', 'Walmart', 56, 5, 19, 'in store', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_GROCERIES'),

  // ── DELIVERY APPS: DoorDash + Uber Eats — ~$160/mo ──────────
  // Spikes after 12-hour shifts. This isn't laziness, it's exhaustion.
  tx('dd-0a', CC, 'DOORDASH', 'DoorDash', 28.45, 0, 2, 'online', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_FAST_FOOD'),
  tx('ue-0a', CC, 'UBER EATS', 'Uber Eats', 32.18, 0, 4, 'online', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_FAST_FOOD'),
  tx('dd-0b', CC, 'DOORDASH', 'DoorDash', 24.90, 0, 9, 'online', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_FAST_FOOD'),
  tx('ue-0b', CC, 'UBER EATS', 'Uber Eats', 31.75, 0, 16, 'online', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_FAST_FOOD'),
  tx('dd-0c', CC, 'DOORDASH', 'DoorDash', 38.60, 0, 22, 'online', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_FAST_FOOD'),

  tx('dd-1a', CC, 'DOORDASH', 'DoorDash', 26.80, 1, 3, 'online', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_FAST_FOOD'),
  tx('ue-1a', CC, 'UBER EATS', 'Uber Eats', 41.25, 1, 8, 'online', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_FAST_FOOD'),
  tx('dd-1b', CC, 'DOORDASH', 'DoorDash', 34.15, 1, 14, 'online', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_FAST_FOOD'),
  tx('ue-1b', CC, 'UBER EATS', 'Uber Eats', 29.90, 1, 19, 'online', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_FAST_FOOD'),

  tx('ue-2a', CC, 'UBER EATS', 'Uber Eats', 33.55, 2, 5, 'online', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_FAST_FOOD'),
  tx('dd-2a', CC, 'DOORDASH', 'DoorDash', 39.80, 2, 10, 'online', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_FAST_FOOD'),
  tx('ue-2b', CC, 'UBER EATS', 'Uber Eats', 27.20, 2, 16, 'online', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_FAST_FOOD'),
  tx('dd-2b', CC, 'DOORDASH', 'DoorDash', 42.10, 2, 21, 'online', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_FAST_FOOD'),

  tx('dd-3a', CC, 'DOORDASH', 'DoorDash', 31.40, 3, 4, 'online', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_FAST_FOOD'),
  tx('ue-3a', CC, 'UBER EATS', 'Uber Eats', 44.80, 3, 9, 'online', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_FAST_FOOD'),
  tx('dd-3b', CC, 'DOORDASH', 'DoorDash', 36.65, 3, 15, 'online', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_FAST_FOOD'),
  tx('ue-3b', CC, 'UBER EATS', 'Uber Eats', 25.90, 3, 22, 'online', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_FAST_FOOD'),

  tx('ue-4a', CC, 'UBER EATS', 'Uber Eats', 37.10, 4, 6, 'online', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_FAST_FOOD'),
  tx('dd-4a', CC, 'DOORDASH', 'DoorDash', 29.75, 4, 11, 'online', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_FAST_FOOD'),
  tx('ue-4b', CC, 'UBER EATS', 'Uber Eats', 41.20, 4, 17, 'online', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_FAST_FOOD'),
  tx('dd-4b', CC, 'DOORDASH', 'DoorDash', 35.85, 4, 23, 'online', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_FAST_FOOD'),

  tx('dd-5a', CC, 'DOORDASH', 'DoorDash', 33.90, 5, 3, 'online', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_FAST_FOOD'),
  tx('ue-5a', CC, 'UBER EATS', 'Uber Eats', 28.15, 5, 8, 'online', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_FAST_FOOD'),
  tx('dd-5b', CC, 'DOORDASH', 'DoorDash', 40.70, 5, 14, 'online', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_FAST_FOOD'),
  tx('ue-5b', CC, 'UBER EATS', 'Uber Eats', 38.25, 5, 20, 'online', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_FAST_FOOD'),

  // ── STREAMING (4 services = $56/mo) ──────────────────────────
  ...[0,1,2,3,4,5].map(m =>
    tx(`netflix-${m}`, CC, 'NETFLIX.COM', 'Netflix', 15.49, m, 8, 'online', 'ENTERTAINMENT', 'ENTERTAINMENT_TV_AND_MOVIES')
  ),
  ...[0,1,2,3,4,5].map(m =>
    tx(`hbo-${m}`, CC, 'MAX', 'Max', 15.99, m, 9, 'online', 'ENTERTAINMENT', 'ENTERTAINMENT_TV_AND_MOVIES')
  ),
  ...[0,1,2,3,4,5].map(m =>
    tx(`disney-${m}`, CC, 'DISNEY PLUS', 'Disney+', 13.99, m, 10, 'online', 'ENTERTAINMENT', 'ENTERTAINMENT_TV_AND_MOVIES')
  ),
  ...[0,1,2,3,4,5].map(m =>
    tx(`spotify-${m}`, CC, 'SPOTIFY USA', 'Spotify', 10.99, m, 11, 'online', 'ENTERTAINMENT', 'ENTERTAINMENT_MUSIC_AND_AUDIO')
  ),

  // ── GAS: ~$95/mo ────────────────────────────────────────────
  ...[0,1,2,3,4,5].flatMap(m => [
    tx(`gas-a-${m}`, CC, 'SHELL OIL', 'Shell', [42,48,51,44,46,49][m], m, 8, 'in store', 'TRANSPORTATION', 'TRANSPORTATION_GAS'),
    tx(`gas-b-${m}`, CC, 'CHEVRON', 'Chevron', [44,41,48,46,42,45][m], m, 22, 'in store', 'TRANSPORTATION', 'TRANSPORTATION_GAS'),
  ]),

  // ── CC INTEREST: ~$45/mo (24% APR on $2,240) ────────────────
  ...[0,1,2,3,4,5].map(m =>
    tx(`interest-${m}`, CC, 'CAPITAL ONE INTEREST CHARGE', 'Capital One',
      [44,42,48,41,46,43][m], m, 28, 'other', 'BANK_FEES', 'BANK_FEES_INTEREST_CHARGE')
  ),

  // ── CC MINIMUM PAYMENTS (never pays it off) ──────────────────
  ...[0,1,2,3,4,5].map(m =>
    tx(`ccpay-${m}`, CHK, 'CAPITAL ONE PAYMENT', null,
      [65,55,75,60,50,65][m], m, 27, 'other', 'LOAN_PAYMENTS', 'LOAN_PAYMENTS_CREDIT_CARD_PAYMENT')
  ),

  // ── NSF FEES: 5 this year ($39 each) ─────────────────────────
  tx('nsf-1', CHK, 'WELLS FARGO NSF FEE', 'Wells Fargo', 39, 1, 18, 'other', 'BANK_FEES', 'BANK_FEES_OVERDRAFT'),
  tx('nsf-2', CHK, 'WELLS FARGO NSF FEE', 'Wells Fargo', 39, 2, 9, 'other', 'BANK_FEES', 'BANK_FEES_OVERDRAFT'),
  tx('nsf-3', CHK, 'WELLS FARGO NSF FEE', 'Wells Fargo', 39, 2, 26, 'other', 'BANK_FEES', 'BANK_FEES_OVERDRAFT'),
  tx('nsf-4', CHK, 'WELLS FARGO NSF FEE', 'Wells Fargo', 39, 3, 14, 'other', 'BANK_FEES', 'BANK_FEES_OVERDRAFT'),
  tx('nsf-5', CHK, 'WELLS FARGO NSF FEE', 'Wells Fargo', 39, 4, 22, 'other', 'BANK_FEES', 'BANK_FEES_OVERDRAFT'),

  // ── PAYDAY LOANS: ACE Cash Express ───────────────────────────
  tx('pdl-1-borrow', CHK, 'ACE CASH EXPRESS', 'ACE Cash Express', -300, 2, 5, 'other', 'INCOME', 'INCOME_OTHER_INCOME'),
  tx('pdl-1-repay',  CHK, 'ACE CASH EXPRESS REPAY', 'ACE Cash Express', 345, 2, 19, 'other', 'LOAN_PAYMENTS', 'LOAN_PAYMENTS_OTHER_PAYMENT'),
  tx('pdl-2-borrow', CHK, 'ACE CASH EXPRESS', 'ACE Cash Express', -300, 4, 8, 'other', 'INCOME', 'INCOME_OTHER_INCOME'),
  tx('pdl-2-repay',  CHK, 'ACE CASH EXPRESS REPAY', 'ACE Cash Express', 345, 4, 22, 'other', 'LOAN_PAYMENTS', 'LOAN_PAYMENTS_OTHER_PAYMENT'),

  // ── COFFEE: Starbucks ~$48/mo (down from $60 — already cutting) ─
  ...[0,1,2,3,4,5].flatMap(m => [
    tx(`sbux-a-${m}`, CC, 'STARBUCKS', 'Starbucks', [5.45,6.25,4.95,7.10,5.80,6.50][m], m, 4, 'in store', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_COFFEE'),
    tx(`sbux-b-${m}`, CC, 'STARBUCKS', 'Starbucks', [9.80,10.40,8.95,11.20,9.40,10.60][m], m, 14, 'in store', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_COFFEE'),
    tx(`sbux-c-${m}`, CC, 'STARBUCKS', 'Starbucks', [6.85,7.40,5.70,8.15,6.20,7.90][m], m, 24, 'in store', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_COFFEE'),
  ]),

  // ── PHARMACY ─────────────────────────────────────────────────
  tx('pharmacy-1', CC, 'CVS PHARMACY', 'CVS', 42.80, 1, 17, 'in store', 'MEDICAL', 'MEDICAL_PHARMACIES'),
  tx('pharmacy-2', CC, 'CVS PHARMACY', 'CVS', 31.60, 3, 15, 'in store', 'MEDICAL', 'MEDICAL_PHARMACIES'),

  // ── ONEBLINC EWA (small, interest-free) ──────────────────────
  tx('ewa-1', CHK, 'ONEBLINC ADVANCE', 'OneBlinc', -50, 1, 10, 'other', 'INCOME', 'INCOME_OTHER_INCOME'),
  tx('ewa-1-repay', CHK, 'ONEBLINC REPAYMENT', 'OneBlinc', 50, 1, 15, 'other', 'LOAN_PAYMENTS', 'LOAN_PAYMENTS_OTHER_PAYMENT'),
  tx('ewa-2', CHK, 'ONEBLINC ADVANCE', 'OneBlinc', -50, 3, 12, 'other', 'INCOME', 'INCOME_OTHER_INCOME'),
  tx('ewa-2-repay', CHK, 'ONEBLINC REPAYMENT', 'OneBlinc', 50, 3, 15, 'other', 'LOAN_PAYMENTS', 'LOAN_PAYMENTS_OTHER_PAYMENT'),
  tx('ewa-3', CHK, 'ONEBLINC ADVANCE', 'OneBlinc', -75, 0, 8, 'other', 'INCOME', 'INCOME_OTHER_INCOME'),
]

// ── Credit score history (mock Clarity data) ───────────────────
export const marcusCreditHistory = [
  { month: monthsAgo(5, 1), score: 605, reason_code_1: 18, reason_code_2: 97 },
  { month: monthsAgo(4, 1), score: 608, reason_code_1: 18, reason_code_2: 97 },
  { month: monthsAgo(3, 1), score: 612, reason_code_1: 18, reason_code_2: 29 },
  { month: monthsAgo(2, 1), score: 610, reason_code_1: 18, reason_code_2: 15 },
  { month: monthsAgo(1, 1), score: 614, reason_code_1: 18, reason_code_2: 29 },
  { month: monthsAgo(0, 1), score: 612, reason_code_1: 18, reason_code_2: 97 },
]

// ── Pave-equivalent attributes (mock) ──────────────────────────
// These match what /users/{id}/attributes would return from Pave
export const marcusPaveAttributes = {
  // Cashflow survival signals
  number_of_days_until_next_income: 6,
  number_of_days_until_next_stable_income: 6,
  recurring_expenditures_next_7d: 179,   // AT&T $85 + FPL $94
  recurring_expenditures_next_30d: 1764,
  income_next_7d: -1420,                 // paycheck on day 6
  income_next_30d: -2840,
  primary_account_current_balance_latest: 47,

  // Fee signals
  nsf_fee_past_30d: 0,
  nsf_fee_past_90d: 78,    // 2 × $39
  overdraft_fee_past_30d: 0,
  overdraft_fee_past_90d: 78,
  atm_fees_past_30d: 0,
  atm_fees_past_90d: 0,

  // Income reliability
  is_primary_income_biweekly: true,
  is_primary_income_payroll: true,
  is_primary_income_weekly: false,
  has_active_payroll: 1,
  primary_income_monthly_average_past_30d: 2840,

  // Cashflow mode detection
  balances_days_negative_past_30d: 4,
  raw_balances_days_negative_past_30d: 4,
  primary_account_current_balance_minimum_past_30d: -38,

  // Essentials vs lifestyle
  essential_outflows_past_30d: 1764,
  nonessential_outflows_past_30d: 264,   // delivery + streaming + coffee
  obligatory_outflows_past_30d: 1764,
  food_delivery_past_30d: 156,
  subscriptions_past_30d: 56,
}

// ── 14-day forecast (mock — what the nightly cron would compute) ─
export const marcusForecast = {
  current_balance: 47,
  days_to_payday: 6,
  cashflow_mode: 'RED',  // $47, $179 in bills before payday = going negative
  deposit_required: 132,  // $179 bills - $47 balance = $132 needed
  bills_next_14d: 714,    // AT&T + FPL + Progressive + Honda
  income_next_14d: 1420,
  gap_amount: 753,        // $47 + $1420 - $714 = $753 (okay after payday, crunch before)
  verdict_text: "You have $47. Your AT&T ($85) hits in 3 days and FPL ($94) hits in 5 days. That's $179 against $47. You'll be $132 short before your paycheck arrives on day 6. After payday ($1,420), Progressive ($148) and Honda ($387) hit on days 8 and 10. You'll end the 14 days with about $753 — but the next 3 days are the crisis.",
  bills_detail: [
    { merchant: 'AT&T', amount: 85, days_away: 3, predicted_date: daysFromNow(3), confidence: 'high', necessity: 'essential' },
    { merchant: 'Florida Power & Light', amount: 94, days_away: 5, predicted_date: daysFromNow(5), confidence: 'high', necessity: 'essential' },
    { merchant: 'Baptist Health (paycheck)', amount: -1420, days_away: 6, predicted_date: daysFromNow(6), confidence: 'high', necessity: 'income' },
    { merchant: 'Progressive', amount: 148, days_away: 8, predicted_date: daysFromNow(8), confidence: 'high', necessity: 'obligatory' },
    { merchant: 'Honda Financial Services', amount: 387, days_away: 10, predicted_date: daysFromNow(10), confidence: 'high', necessity: 'obligatory' },
    { merchant: 'Netflix', amount: 15.49, days_away: 8, predicted_date: daysFromNow(8), confidence: 'high', necessity: 'nonessential' },
    { merchant: 'Spotify', amount: 10.99, days_away: 11, predicted_date: daysFromNow(11), confidence: 'medium', necessity: 'nonessential' },
  ],
  // Day-by-day balance projection
  daily_balances: [
    { day: 0, date: daysFromNow(0), balance: 47, event: null },
    { day: 1, date: daysFromNow(1), balance: 47, event: null },
    { day: 2, date: daysFromNow(2), balance: 47, event: null },
    { day: 3, date: daysFromNow(3), balance: -38, event: 'AT&T autopay ($85)' },
    { day: 4, date: daysFromNow(4), balance: -38, event: null },
    { day: 5, date: daysFromNow(5), balance: -132, event: 'FPL electric ($94)' },
    { day: 6, date: daysFromNow(6), balance: 1288, event: 'Paycheck ($1,420)' },
    { day: 7, date: daysFromNow(7), balance: 1288, event: null },
    { day: 8, date: daysFromNow(8), balance: 1124.51, event: 'Progressive ($148) + Netflix ($15.49)' },
    { day: 9, date: daysFromNow(9), balance: 1124.51, event: null },
    { day: 10, date: daysFromNow(10), balance: 737.51, event: 'Honda Financial ($387)' },
    { day: 11, date: daysFromNow(11), balance: 726.52, event: 'Spotify ($10.99)' },
    { day: 12, date: daysFromNow(12), balance: 726.52, event: null },
    { day: 13, date: daysFromNow(13), balance: 726.52, event: null },
  ],
}

// ── Profile builder ────────────────────────────────────────────
export function buildMarcusProfile(state = 'FL') {
  const utilityMap = {
    FL: 'Florida Power & Light', TX: 'TXU Energy', CA: 'PG&E',
    NY: 'Con Edison', GA: 'Georgia Power', IL: 'ComEd',
    AZ: 'APS', NC: 'Duke Energy', OH: 'AEP Ohio', WA: 'PSE'
  }

  const transactions = marcusTransactions.map(t =>
    t.name === 'FLORIDA POWER AND LIGHT'
      ? { ...t, name: (utilityMap[state] || 'Florida Power & Light').toUpperCase(), merchant_name: utilityMap[state] || 'Florida Power & Light' }
      : t
  )

  const accounts = marcusAccounts
  const totalAssets = accounts.filter(a => a.type === 'depository').reduce((s, a) => s + (a.balances.current || 0), 0)
  const totalLiabilities = accounts.filter(a => ['credit', 'loan'].includes(a.type)).reduce((s, a) => s + Math.abs(a.balances.current || 0), 0)

  const byMonth = {}
  transactions.forEach(t => {
    const month = t.date.substring(0, 7)
    if (!byMonth[month]) byMonth[month] = { income: 0, expenses: 0 }
    if (t.amount < 0) byMonth[month].income += Math.abs(t.amount)
    else byMonth[month].expenses += t.amount
  })
  const months = Object.values(byMonth)
  const avgIncome = months.reduce((s, m) => s + m.income, 0) / Math.max(months.length, 1)
  const avgExpenses = months.reduce((s, m) => s + m.expenses, 0) / Math.max(months.length, 1)

  const merchants = {}
  transactions.filter(t => t.amount > 0 && !t.pending).forEach(t => {
    const name = t.merchant_name || t.name || 'Unknown'
    if (!merchants[name]) merchants[name] = { name, totalSpent: 0, transactionCount: 0, category: t.personal_finance_category?.primary || 'Other', amounts: [] }
    merchants[name].totalSpent += t.amount
    merchants[name].transactionCount++
    merchants[name].amounts.push(t.amount)
  })
  const merchantList = Object.values(merchants)
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .map(m => ({
      name: m.name,
      totalSpent: Math.round(m.totalSpent),
      monthlyAvg: Math.round(m.totalSpent / 6),
      transactionCount: m.transactionCount,
      category: m.category,
      looksLikeSubscription: m.transactionCount >= 5 && m.amounts.every(a => Math.abs(a - m.amounts[0]) < 1.5)
    }))

  const subscriptions = merchantList
    .filter(m => m.looksLikeSubscription)
    .map(m => ({ name: m.name, monthlyAmount: Math.round(m.totalSpent / 6 * 100) / 100, annualAmount: m.totalSpent * 2, occurrences: m.transactionCount }))

  return {
    snapshot: {
      assets: accounts.filter(a => a.type === 'depository').map(a => ({ name: a.name, type: a.subtype, balance: a.balances.current })),
      liabilities: accounts.filter(a => ['credit', 'loan'].includes(a.type)).map(a => ({ name: a.name, type: a.subtype, balance: Math.abs(a.balances.current) })),
      totalAssets: Math.round(totalAssets),
      totalLiabilities: Math.round(totalLiabilities),
    },
    cashFlow: {
      avgMonthlyIncome: Math.round(avgIncome),
      avgMonthlyExpenses: Math.round(avgExpenses),
      avgMonthlySurplus: Math.round(avgIncome - avgExpenses),
      monthCount: months.length,
      byMonth
    },
    income: {
      estimatedMonthlyGross: 2840,
      payFrequency: 'biweekly',
      sources: [{ name: 'BAPTIST HEALTH SOUTH FLORIDA PAYROLL', amount: 1420, frequency: 'biweekly' }]
    },
    topMerchants: merchantList.slice(0, 20),
    subscriptions,
    accounts: accounts.map(a => ({
      account_id: a.account_id,
      name: a.name, type: a.type, subtype: a.subtype,
      balance: a.balances.current, limit: a.balances.limit
    })),
    rawTransactions: transactions,
    // Unified data exports for the demo page
    creditHistory: marcusCreditHistory,
    paveAttributes: marcusPaveAttributes,
    forecast: marcusForecast,
    flags: [
      { type: 'nsf_imminent', message: 'Marcus has $47 in checking with $179 in bills hitting before his paycheck in 6 days. He will be $132 overdrawn by day 5 — triggering a $39 NSF fee from Wells Fargo. A $132 OneBlinc advance today prevents the overdraft entirely.', annualImpact: 195 },
      { type: 'hours_cut', message: 'Baptist Health reduced Marcus from 40 to 36 hours/week. His paycheck dropped from $1,640 to $1,420 — a $440/month income loss. His expenses haven\'t adjusted yet.', annualImpact: 5280 },
      { type: 'payday_loans', message: 'Marcus used ACE Cash Express twice this year — borrowing $300 each time and paying $45 in fees (400%+ APR). That\'s $90 in pure fee waste. OneBlinc advances cost $0.', annualImpact: 90 },
      { type: 'delivery_spend', message: 'Spending ~$160/mo on DoorDash and Uber Eats. This spikes after 12-hour shifts — it\'s exhaustion, not habit. Cutting to twice a week saves $80/mo ($960/yr).', annualImpact: 960 },
      { type: 'streaming_overlap', message: 'Paying for Netflix ($15.49), Max ($15.99), Disney+ ($13.99), Spotify ($10.99) = $56.46/mo. Canceling two saves $29/mo ($354/yr).', annualImpact: 354 },
      { type: 'phone_plan', message: 'Paying AT&T $85/mo. Mint Mobile offers the same coverage for $30/mo — saving $55/mo ($660/yr).', annualImpact: 660 },
      { type: 'cc_interest', message: 'Paying $44/mo in Capital One interest on $2,240 at 24% APR. Balance never goes down because minimum payments ($55-75) barely cover interest.', annualImpact: 528 },
    ]
  }
}
