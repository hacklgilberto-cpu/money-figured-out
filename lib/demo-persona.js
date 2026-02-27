/**
 * DEMO PERSONA: Sofia Martins, 29, Toronto
 *
 * Story: UX designer, good salary, classic lifestyle creep.
 * Eats out / orders delivery way too much, paying $60/mo in CC interest
 * on a balance she never fully clears, 4 streaming services she barely uses,
 * Rogers at $89 when Public Mobile offers the same for $34.
 * Her TFSA is sitting in a 0.5% savings account doing nothing.
 * No FHSA opened yet despite wanting to buy in 2 years.
 *
 * CURRENT NET WORTH: ~-$11,200 (CC debt + student loan, offset by TFSA + chequing)
 * PROJECTED IN 12 MONTHS (with plan): ~+$9,800 — a $21,000 swing
 *
 * Key levers Claude should catch:
 *   1. Open FHSA → $1,053/yr tax savings
 *   2. Pay off CC ($3,420) in 4 months → $684/yr interest gone
 *   3. Cut delivery from $290 → $80/mo → $2,520/yr back
 *   4. Switch Rogers → Public Mobile → $660/yr saved
 *   5. Cancel 2 of 4 streaming services → $420/yr saved
 *   6. Move TFSA to Wealthsimple Save (2.75%) → $226/yr in interest
 */

function monthsAgo(n, day = 1) {
  const d = new Date()
  d.setMonth(d.getMonth() - n)
  d.setDate(day)
  return d.toISOString().split('T')[0]
}

// ── Accounts ─────────────────────────────────────────────────
export const sofiaAccounts = [
  {
    account_id: 'demo-chequing-001',
    name: 'TD Everyday Chequing',
    type: 'depository',
    subtype: 'checking',
    balances: { current: 2140, available: 2140, limit: null, iso_currency_code: 'CAD' }
  },
  {
    account_id: 'demo-tfsa-001',
    name: 'TD TFSA Savings',
    type: 'depository',
    subtype: 'savings',
    balances: { current: 8200, available: 8200, limit: null, iso_currency_code: 'CAD' }
  },
  {
    account_id: 'demo-credit-001',
    name: 'TD Cash Back Visa',
    type: 'credit',
    subtype: 'credit card',
    balances: { current: -3420, available: 6580, limit: 10000, iso_currency_code: 'CAD' }
  },
  {
    account_id: 'demo-loan-001',
    name: 'NSLSC Student Loan',
    type: 'loan',
    subtype: 'student',
    balances: { current: -18000, available: null, limit: null, iso_currency_code: 'CAD' }
  }
]

// ── Transactions (12 months, Plaid format: positive = expense, negative = income) ──
const tx = (id, acct, name, merchant, amount, monthsBack, day, channel, cat, detail) => ({
  transaction_id: id,
  account_id: acct,
  name,
  merchant_name: merchant,
  amount,
  iso_currency_code: 'CAD',
  date: monthsAgo(monthsBack, day),
  pending: false,
  payment_channel: channel,
  personal_finance_category: { primary: cat, detailed: detail }
})

const CHQ = 'demo-chequing-001'
const CC  = 'demo-credit-001'

export const sofiaTransactions = [

  // ── INCOME: $6,800 salary, 15th of each month ──────────────
  ...[0,1,2,3,4,5,6,7,8,9,10,11].map(m =>
    tx(`inc-sal-${m}`, CHQ, 'VISIONARY DESIGN STUDIO PAYROLL', 'Visionary Design Studio',
      -6800, m, 15, 'other', 'INCOME', 'INCOME_WAGES')
  ),

  // Freelance (sporadic — 3 times in 12 months)
  tx('inc-free-1', CHQ, 'E-TRANSFER FROM BOLT AGENCY', null, -1150, 1, 8, 'other', 'INCOME', 'INCOME_OTHER_INCOME'),
  tx('inc-free-2', CHQ, 'E-TRANSFER LAKEVIEW MEDIA',  null,  -800, 5, 19, 'other', 'INCOME', 'INCOME_OTHER_INCOME'),
  tx('inc-free-3', CHQ, 'E-TRANSFER FROM BOLT AGENCY', null,  -650, 9, 6, 'other', 'INCOME', 'INCOME_OTHER_INCOME'),

  // ── RENT: $2,100 first of month ────────────────────────────
  ...[0,1,2,3,4,5,6,7,8,9,10,11].map(m =>
    tx(`rent-${m}`, CHQ, 'E-TRANSFER PARKVIEW PROPERTIES', 'Parkview Properties',
      2100, m, 1, 'other', 'RENT_AND_UTILITIES', 'RENT_AND_UTILITIES_RENT')
  ),

  // ── HONDA LEASE: $498/mo ────────────────────────────────────
  ...[0,1,2,3,4,5,6,7,8,9,10,11].map(m =>
    tx(`lease-${m}`, CHQ, 'HONDA FINANCIAL SERVICES', 'Honda Financial Services',
      498, m, 5, 'other', 'LOAN_PAYMENTS', 'LOAN_PAYMENTS_CAR_PAYMENT')
  ),

  // ── STUDENT LOAN: $280/mo ───────────────────────────────────
  ...[0,1,2,3,4,5,6,7,8,9,10,11].map(m =>
    tx(`nslsc-${m}`, CHQ, 'NSLSC PAYMENT', 'NSLSC',
      280, m, 18, 'other', 'LOAN_PAYMENTS', 'LOAN_PAYMENTS_STUDENT_LOAN_PAYMENT')
  ),

  // ── GROCERIES: Loblaws, Metro, No Frills ────────────────────
  // Recent months: more delivery → less grocery. Older months: higher grocery spend.
  tx('groc-0a', CC, 'LOBLAWS #1042', 'Loblaws', 142, 0, 4, 'in store', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_GROCERIES'),
  tx('groc-0b', CC, 'METRO PLUS', 'Metro', 89, 0, 18, 'in store', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_GROCERIES'),
  tx('groc-1a', CC, 'LOBLAWS #1042', 'Loblaws', 158, 1, 6, 'in store', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_GROCERIES'),
  tx('groc-1b', CC, 'METRO PLUS', 'Metro', 103, 1, 20, 'in store', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_GROCERIES'),
  tx('groc-2a', CC, 'LOBLAWS #1042', 'Loblaws', 171, 2, 5, 'in store', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_GROCERIES'),
  tx('groc-2b', CC, 'NO FRILLS #438', 'No Frills', 94, 2, 19, 'in store', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_GROCERIES'),
  tx('groc-3a', CC, 'LOBLAWS #1042', 'Loblaws', 215, 3, 7, 'in store', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_GROCERIES'),
  tx('groc-3b', CC, 'METRO PLUS', 'Metro', 128, 3, 21, 'in store', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_GROCERIES'),
  tx('groc-4a', CC, 'LOBLAWS #1042', 'Loblaws', 224, 4, 3, 'in store', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_GROCERIES'),
  tx('groc-4b', CC, 'COSTCO WHOLESALE', 'Costco', 187, 4, 16, 'in store', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_GROCERIES'),
  tx('groc-5a', CC, 'LOBLAWS #1042', 'Loblaws', 241, 5, 4, 'in store', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_GROCERIES'),
  tx('groc-5b', CC, 'METRO PLUS', 'Metro', 162, 5, 22, 'in store', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_GROCERIES'),
  tx('groc-6', CC, 'LOBLAWS #1042', 'Loblaws', 389, 6, 11, 'in store', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_GROCERIES'),
  tx('groc-7', CC, 'METRO PLUS', 'Metro', 341, 7, 14, 'in store', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_GROCERIES'),
  tx('groc-8', CC, 'LOBLAWS #1042', 'Loblaws', 376, 8, 8, 'in store', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_GROCERIES'),
  tx('groc-9', CC, 'NO FRILLS #438', 'No Frills', 298, 9, 5, 'in store', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_GROCERIES'),
  tx('groc-10', CC, 'LOBLAWS #1042', 'Loblaws', 352, 10, 10, 'in store', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_GROCERIES'),
  tx('groc-11', CC, 'METRO PLUS', 'Metro', 319, 11, 16, 'in store', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_GROCERIES'),

  // ── DELIVERY: UberEats + DoorDash — high and consistent ─────
  // Pattern: orders Wednesday nights and Sundays (lazy cooking)
  // Averaging $285/mo — a clear target for Claude to flag
  tx('ube-0a', CC, 'UBER EATS', 'Uber Eats', 38.47, 0, 5, 'online', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_FAST_FOOD'),
  tx('ube-0b', CC, 'UBER EATS', 'Uber Eats', 52.18, 0, 9, 'online', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_FAST_FOOD'),
  tx('ube-0c', CC, 'DOORDASH', 'DoorDash', 44.61, 0, 13, 'online', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_FAST_FOOD'),
  tx('ube-0d', CC, 'UBER EATS', 'Uber Eats', 29.83, 0, 19, 'online', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_FAST_FOOD'),
  tx('ube-0e', CC, 'DOORDASH', 'DoorDash', 61.22, 0, 23, 'online', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_FAST_FOOD'),
  tx('ube-0f', CC, 'UBER EATS', 'Uber Eats', 47.90, 0, 27, 'online', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_FAST_FOOD'),

  tx('ube-1a', CC, 'UBER EATS', 'Uber Eats', 55.30, 1, 3, 'online', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_FAST_FOOD'),
  tx('ube-1b', CC, 'DOORDASH', 'DoorDash', 41.75, 1, 8, 'online', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_FAST_FOOD'),
  tx('ube-1c', CC, 'UBER EATS', 'Uber Eats', 67.44, 1, 14, 'online', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_FAST_FOOD'),
  tx('ube-1d', CC, 'DOORDASH', 'DoorDash', 38.92, 1, 20, 'online', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_FAST_FOOD'),
  tx('ube-1e', CC, 'UBER EATS', 'Uber Eats', 44.18, 1, 25, 'online', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_FAST_FOOD'),

  tx('ube-2a', CC, 'UBER EATS', 'Uber Eats', 71.20, 2, 5, 'online', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_FAST_FOOD'),
  tx('ube-2b', CC, 'DOORDASH', 'DoorDash', 33.88, 2, 11, 'online', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_FAST_FOOD'),
  tx('ube-2c', CC, 'UBER EATS', 'Uber Eats', 58.41, 2, 17, 'online', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_FAST_FOOD'),
  tx('ube-2d', CC, 'UBER EATS', 'Uber Eats', 49.65, 2, 24, 'online', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_FAST_FOOD'),

  tx('ube-3a', CC, 'UBER EATS', 'Uber Eats', 62.10, 3, 4, 'online', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_FAST_FOOD'),
  tx('ube-3b', CC, 'DOORDASH', 'DoorDash', 45.33, 3, 9, 'online', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_FAST_FOOD'),
  tx('ube-3c', CC, 'UBER EATS', 'Uber Eats', 38.74, 3, 16, 'online', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_FAST_FOOD'),
  tx('ube-3d', CC, 'DOORDASH', 'DoorDash', 79.20, 3, 22, 'online', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_FAST_FOOD'),

  tx('ube-4a', CC, 'UBER EATS', 'Uber Eats', 53.45, 4, 6, 'online', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_FAST_FOOD'),
  tx('ube-4b', CC, 'DOORDASH', 'DoorDash', 37.80, 4, 13, 'online', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_FAST_FOOD'),
  tx('ube-4c', CC, 'UBER EATS', 'Uber Eats', 66.92, 4, 19, 'online', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_FAST_FOOD'),
  tx('ube-4d', CC, 'UBER EATS', 'Uber Eats', 42.61, 4, 26, 'online', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_FAST_FOOD'),

  tx('ube-5a', CC, 'UBER EATS', 'Uber Eats', 48.30, 5, 5, 'online', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_FAST_FOOD'),
  tx('ube-5b', CC, 'DOORDASH', 'DoorDash', 57.14, 5, 12, 'online', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_FAST_FOOD'),
  tx('ube-5c', CC, 'UBER EATS', 'Uber Eats', 31.88, 5, 18, 'online', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_FAST_FOOD'),
  tx('ube-5d', CC, 'UBER EATS', 'Uber Eats', 74.40, 5, 25, 'online', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_FAST_FOOD'),

  tx('ube-6a', CC, 'UBER EATS', 'Uber Eats', 59.20, 6, 4, 'online', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_FAST_FOOD'),
  tx('ube-6b', CC, 'DOORDASH', 'DoorDash', 43.55, 6, 11, 'online', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_FAST_FOOD'),
  tx('ube-6c', CC, 'UBER EATS', 'Uber Eats', 68.88, 6, 18, 'online', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_FAST_FOOD'),
  tx('ube-6d', CC, 'DOORDASH', 'DoorDash', 51.10, 6, 25, 'online', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_FAST_FOOD'),

  tx('ube-7', CC, 'UBER EATS', 'Uber Eats', 247.80, 7, 10, 'online', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_FAST_FOOD'),
  tx('ube-8', CC, 'UBER EATS', 'Uber Eats', 271.40, 8, 9, 'online', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_FAST_FOOD'),
  tx('ube-9', CC, 'DOORDASH', 'DoorDash', 258.60, 9, 8, 'online', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_FAST_FOOD'),
  tx('ube-10', CC, 'UBER EATS', 'Uber Eats', 265.90, 10, 7, 'online', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_FAST_FOOD'),
  tx('ube-11', CC, 'UBER EATS', 'Uber Eats', 241.20, 11, 6, 'online', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_FAST_FOOD'),

  // ── COFFEE: Starbucks habit — ~$175/mo ──────────────────────
  ...[0,1,2,3,4,5,6,7,8,9,10,11].map(m =>
    tx(`sbux-${m}a`, CC, 'STARBUCKS', 'Starbucks',
      [42,38,51,47,54,39,62,44,49,55,41,58][m], m, 7, 'in store', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_COFFEE')
  ),
  ...[0,1,2,3,4,5,6,7,8,9,10,11].map(m =>
    tx(`sbux-${m}b`, CC, 'STARBUCKS', 'Starbucks',
      [38,44,47,35,51,43,58,37,42,48,36,52][m], m, 21, 'in store', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_COFFEE')
  ),
  // Tim Hortons occasional
  tx('tims-1', CC, 'TIM HORTONS', 'Tim Hortons', 8.45, 0, 11, 'in store', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_COFFEE'),
  tx('tims-2', CC, 'TIM HORTONS', 'Tim Hortons', 6.80, 2, 14, 'in store', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_COFFEE'),
  tx('tims-3', CC, 'TIM HORTONS', 'Tim Hortons', 11.20, 4, 8, 'in store', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_COFFEE'),
  tx('tims-4', CC, 'TIM HORTONS', 'Tim Hortons', 7.35, 7, 16, 'in store', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_COFFEE'),

  // ── RESTAURANTS (sit-down, monthly night out) ───────────────
  tx('rest-1', CC, 'GUSTO 101', 'Gusto 101', 94, 0, 17, 'in store', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_RESTAURANT'),
  tx('rest-2', CC, 'BUCA RISTORANTE', 'Buca', 142, 1, 22, 'in store', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_RESTAURANT'),
  tx('rest-3', CC, 'PAI NORTHERN THAI', 'Pai Northern Thai Kitchen', 78, 2, 9, 'in store', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_RESTAURANT'),
  tx('rest-4', CC, 'BAR ISABEL', 'Bar Isabel', 118, 3, 14, 'in store', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_RESTAURANT'),
  tx('rest-5', CC, 'GUSTO 101', 'Gusto 101', 86, 5, 19, 'in store', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_RESTAURANT'),
  tx('rest-6', CC, 'BUCA RISTORANTE', 'Buca', 163, 8, 25, 'in store', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_RESTAURANT'),

  // ── PHONE: Rogers at $89/mo — clearly overpaying ────────────
  // (Public Mobile same data: $34/mo — $660/yr opportunity)
  ...[0,1,2,3,4,5,6,7,8,9,10,11].map(m =>
    tx(`rogers-${m}`, CHQ, 'ROGERS COMMUNICATIONS', 'Rogers',
      89, m, 22, 'other', 'RENT_AND_UTILITIES', 'RENT_AND_UTILITIES_TELEPHONE')
  ),

  // ── INTERNET: Bell at $99/mo ────────────────────────────────
  ...[0,1,2,3,4,5,6,7,8,9,10,11].map(m =>
    tx(`bell-${m}`, CHQ, 'BELL CANADA', 'Bell Canada',
      99, m, 24, 'other', 'RENT_AND_UTILITIES', 'RENT_AND_UTILITIES_INTERNET')
  ),

  // ── HYDRO ───────────────────────────────────────────────────
  ...[0,1,2,3,4,5,6,7,8,9,10,11].map(m =>
    tx(`hydro-${m}`, CHQ, 'TORONTO HYDRO', 'Toronto Hydro',
      m < 3 || m > 8 ? 108 : 74, m, 20, 'other', 'RENT_AND_UTILITIES', 'RENT_AND_UTILITIES_ELECTRICITY')
  ),

  // ── STREAMING: 4 services she barely needs ──────────────────
  // Netflix + Disney+ + Crave + Spotify = $67.96/mo
  ...[0,1,2,3,4,5,6,7,8,9,10,11].map(m =>
    tx(`netflix-${m}`, CC, 'NETFLIX.COM', 'Netflix', 20.99, m, 7, 'online', 'ENTERTAINMENT', 'ENTERTAINMENT_TV_AND_MOVIES')
  ),
  ...[0,1,2,3,4,5,6,7,8,9,10,11].map(m =>
    tx(`disney-${m}`, CC, 'DISNEY PLUS', 'Disney+', 14.99, m, 11, 'online', 'ENTERTAINMENT', 'ENTERTAINMENT_TV_AND_MOVIES')
  ),
  ...[0,1,2,3,4,5,6,7,8,9,10,11].map(m =>
    tx(`crave-${m}`, CC, 'CRAVE SUBSCRIPTION', 'Crave', 19.99, m, 13, 'online', 'ENTERTAINMENT', 'ENTERTAINMENT_TV_AND_MOVIES')
  ),
  ...[0,1,2,3,4,5,6,7,8,9,10,11].map(m =>
    tx(`spotify-${m}`, CC, 'SPOTIFY AB', 'Spotify', 11.99, m, 9, 'online', 'ENTERTAINMENT', 'ENTERTAINMENT_MUSIC')
  ),

  // ── GYM + OTHER SUBSCRIPTIONS ────────────────────────────────
  ...[0,1,2,3,4,5,6,7,8,9,10,11].map(m =>
    tx(`gym-${m}`, CC, 'GOODLIFE FITNESS', 'GoodLife Fitness', 54.99, m, 3, 'other', 'PERSONAL_CARE', 'PERSONAL_CARE_GYMS_AND_FITNESS_CENTERS')
  ),
  ...[0,1,2,3,4,5,6,7,8,9,10,11].map(m =>
    tx(`apple-${m}`, CC, 'APPLE.COM/BILL', 'Apple', 13.99, m, 16, 'online', 'ENTERTAINMENT', 'ENTERTAINMENT_TV_AND_MOVIES')
  ),

  // ── TRANSPORTATION ───────────────────────────────────────────
  ...[0,1,2,3,4,5,6,7,8,9,10,11].map(m =>
    tx(`uber-${m}`, CC, 'UBER CANADA', 'Uber',
      [74,58,92,71,49,88,63,104,68,77,55,91][m], m, 16, 'online', 'TRANSPORTATION', 'TRANSPORTATION_TAXIS_AND_RIDE_SHARES')
  ),
  ...[0,1,2,3,4,5,6,7,8,9,10,11].map(m =>
    tx(`gas-${m}`, CC, 'ESSO', 'Esso',
      [72,79,66,61,54,58,51,57,70,78,83,74][m], m, 10, 'in store', 'TRANSPORTATION', 'TRANSPORTATION_GAS')
  ),

  // ── CC INTEREST: $57–68/mo (21% APR on $3,420 balance) ──────
  ...[0,1,2,3,4,5,6,7,8,9,10,11].map(m =>
    tx(`interest-${m}`, CC, 'TD VISA INTEREST CHARGE', 'TD Bank',
      [57,61,54,68,66,52,63,59,55,68,62,57][m], m, 28, 'other', 'BANK_FEES', 'BANK_FEES_INTEREST_CHARGE')
  ),

  // ── CC PARTIAL PAYMENTS (she never clears the full balance) ──
  ...[0,1,2,3,4,5,6,7,8,9,10,11].map(m =>
    tx(`ccpay-${m}`, CHQ, 'TD VISA PAYMENT', null,
      [750,600,850,700,500,750,620,850,670,520,750,700][m], m, 27, 'other', 'LOAN_PAYMENTS', 'LOAN_PAYMENTS_CREDIT_CARD_PAYMENT')
  ),

  // ── SHOPPING ─────────────────────────────────────────────────
  tx('shop-1', CC, 'ZARA CANADA', 'Zara', 187, 0, 12, 'in store', 'GENERAL_MERCHANDISE', 'GENERAL_MERCHANDISE_CLOTHING_AND_ACCESSORIES'),
  tx('shop-2', CC, 'SEPHORA', 'Sephora', 143, 1, 8, 'in store', 'PERSONAL_CARE', 'PERSONAL_CARE_PERSONAL_CARE_PRODUCTS'),
  tx('shop-3', CC, 'AMAZON.CA', 'Amazon', 94, 2, 17, 'online', 'GENERAL_MERCHANDISE', 'GENERAL_MERCHANDISE_ONLINE_MARKETPLACES'),
  tx('shop-4', CC, 'AMAZON.CA', 'Amazon', 67, 3, 21, 'online', 'GENERAL_MERCHANDISE', 'GENERAL_MERCHANDISE_ONLINE_MARKETPLACES'),
  tx('shop-5', CC, 'ARITZIA', 'Aritzia', 234, 4, 3, 'in store', 'GENERAL_MERCHANDISE', 'GENERAL_MERCHANDISE_CLOTHING_AND_ACCESSORIES'),
  tx('shop-6', CC, 'AMAZON.CA', 'Amazon', 112, 5, 14, 'online', 'GENERAL_MERCHANDISE', 'GENERAL_MERCHANDISE_ONLINE_MARKETPLACES'),
  tx('shop-7', CC, 'INDIGO BOOKS', 'Indigo', 78, 6, 22, 'in store', 'GENERAL_MERCHANDISE', 'GENERAL_MERCHANDISE_BOOKSTORES'),
  tx('shop-8', CC, 'SEPHORA', 'Sephora', 89, 8, 7, 'in store', 'PERSONAL_CARE', 'PERSONAL_CARE_PERSONAL_CARE_PRODUCTS'),
  tx('shop-9', CC, 'AMAZON.CA', 'Amazon', 156, 10, 18, 'online', 'GENERAL_MERCHANDISE', 'GENERAL_MERCHANDISE_ONLINE_MARKETPLACES'),

  // ── IRREGULAR BUT REAL EXPENSES ──────────────────────────────
  tx('dental-1', CC, 'YONGE ST DENTAL CENTRE', 'Yonge Street Dental', 680, 2, 8, 'in store', 'MEDICAL', 'MEDICAL_DENTISTS'),
  tx('dental-2', CC, 'YONGE ST DENTAL CENTRE', 'Yonge Street Dental', 280, 7, 15, 'in store', 'MEDICAL', 'MEDICAL_DENTISTS'),
  tx('vet-1', CC, 'BLOOR WEST ANIMAL HOSPITAL', 'Bloor West Animal Hospital', 312, 1, 26, 'in store', 'GENERAL_SERVICES', 'GENERAL_SERVICES_VETERINARIANS'),
  tx('vet-2', CC, 'BLOOR WEST ANIMAL HOSPITAL', 'Bloor West Animal Hospital', 148, 8, 19, 'in store', 'GENERAL_SERVICES', 'GENERAL_SERVICES_VETERINARIANS'),
  tx('car-repair', CC, 'DOWNTOWN HONDA SERVICE', 'Downtown Honda', 620, 5, 12, 'in store', 'TRANSPORTATION', 'TRANSPORTATION_AUTO_MAINTENANCE'),
  tx('ikea', CC, 'IKEA NORTH YORK', 'IKEA', 547, 9, 10, 'in store', 'HOME_IMPROVEMENT', 'HOME_IMPROVEMENT_FURNITURE'),
  tx('gift', CC, 'WILLIAMS SONOMA', 'Williams Sonoma', 189, 6, 4, 'in store', 'GENERAL_MERCHANDISE', 'GENERAL_MERCHANDISE_GIFTS'),
  tx('concert', CC, 'TICKETMASTER CANADA', 'Ticketmaster', 187, 3, 4, 'online', 'ENTERTAINMENT', 'ENTERTAINMENT_EVENTS_AND_ATTRACTIONS'),

  // ── INVESTMENTS (inconsistent, small) ────────────────────────
  tx('inv-1', CHQ, 'TRANSFER TO TFSA SAVINGS', null, 300, 0, 25, 'other', 'TRANSFER_OUT', 'TRANSFER_OUT_SAVINGS'),
  tx('inv-2', CHQ, 'TRANSFER TO TFSA SAVINGS', null, 150, 2, 25, 'other', 'TRANSFER_OUT', 'TRANSFER_OUT_SAVINGS'),
  tx('inv-3', CHQ, 'WEALTHSIMPLE TRADE', 'Wealthsimple', 100, 3, 20, 'online', 'TRANSFER_OUT', 'TRANSFER_OUT_INVESTMENT_AND_RETIREMENT_FUNDS'),
  tx('inv-4', CHQ, 'TRANSFER TO TFSA SAVINGS', null, 500, 4, 25, 'other', 'TRANSFER_OUT', 'TRANSFER_OUT_SAVINGS'),
  tx('inv-5', CHQ, 'WEALTHSIMPLE TRADE', 'Wealthsimple', 200, 7, 18, 'online', 'TRANSFER_OUT', 'TRANSFER_OUT_INVESTMENT_AND_RETIREMENT_FUNDS'),
  tx('inv-6', CHQ, 'TRANSFER TO TFSA SAVINGS', null, 150, 10, 25, 'other', 'TRANSFER_OUT', 'TRANSFER_OUT_SAVINGS'),
]

// ── Profile builder (same shape as buildFinancialProfile()) ──
export function buildSofiaProfile(province = 'ON') {
  const utilityMap = {
    ON: 'Toronto Hydro', BC: 'BC Hydro', AB: 'ATCO Electric',
    QC: 'Hydro-Québec', SK: 'SaskPower', MB: 'Manitoba Hydro',
    NS: 'Nova Scotia Power', NB: 'NB Power', NL: 'Newfoundland Power', PEI: 'Maritime Electric'
  }

  const transactions = sofiaTransactions.map(t =>
    t.name === 'TORONTO HYDRO'
      ? { ...t, name: (utilityMap[province] || 'Toronto Hydro').toUpperCase(), merchant_name: utilityMap[province] || 'Toronto Hydro' }
      : t
  )

  const accounts = sofiaAccounts
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
      monthlyAvg: Math.round(m.totalSpent / 12),
      transactionCount: m.transactionCount,
      category: m.category,
      looksLikeSubscription: m.transactionCount >= 10 && m.amounts.every(a => Math.abs(a - m.amounts[0]) < 2)
    }))

  const subscriptions = merchantList
    .filter(m => m.looksLikeSubscription)
    .map(m => ({ name: m.name, monthlyAmount: Math.round(m.totalSpent / 12 * 100) / 100, annualAmount: m.totalSpent, occurrences: m.transactionCount }))

  return {
    snapshot: {
      assets: accounts.filter(a => a.type === 'depository').map(a => ({ name: a.name, type: a.subtype, balance: a.balances.current })),
      liabilities: accounts.filter(a => ['credit', 'loan'].includes(a.type)).map(a => ({ name: a.name, type: a.subtype, balance: Math.abs(a.balances.current) })),
      totalAssets: Math.round(totalAssets),
      totalLiabilities: Math.round(totalLiabilities),
      netWorth: Math.round(totalAssets - totalLiabilities)
    },
    cashFlow: {
      avgMonthlyIncome: Math.round(avgIncome),
      avgMonthlyExpenses: Math.round(avgExpenses),
      avgMonthlySurplus: Math.round(avgIncome - avgExpenses),
      monthCount: months.length,
      byMonth
    },
    income: {
      estimatedMonthlyGross: 6800,
      sources: [{ name: 'VISIONARY DESIGN STUDIO PAYROLL', amount: 6800 }]
    },
    topMerchants: merchantList.slice(0, 20),
    subscriptions,
    accounts: accounts.map(a => ({
      name: a.name, type: a.type, subtype: a.subtype,
      balance: a.balances.current, limit: a.balances.limit
    })),
    flags: [
      { type: 'delivery_spend', message: 'Spending $270–290/mo on UberEats and DoorDash combined (6+ orders/month). Cooking even 3 more nights/week could save $2,400+/yr.', annualImpact: 2520 },
      { type: 'phone_plan', message: 'Paying Rogers $89/mo for mobile. Public Mobile offers the same 50GB data for $34/mo — saving $660/yr with a 10-minute switch.', annualImpact: 660 },
      { type: 'streaming_overlap', message: 'Paying for Netflix + Disney+ + Crave + Spotify. That\'s $67.96/mo for 4 services. Cancelling 2 saves $420+/yr.', annualImpact: 420 },
      { type: 'cc_interest', message: 'Paying $57–68/mo in TD Visa interest charges on a $3,420 balance never fully cleared. At 21% APR, this costs $684/yr in pure interest.', annualImpact: 684 },
      { type: 'tfsa_idle', message: '$8,200 sitting in a 0.5% TD savings account. Moving to Wealthsimple Save (2.75%) earns $226/yr more. Takes 20 minutes.', annualImpact: 226 },
      { type: 'no_fhsa', message: 'No FHSA opened yet. As a first-time buyer, Sofia can contribute $8,000 this year and deduct it from her taxable income — worth ~$1,053 back on her next tax return.', annualImpact: 1053 },
      { type: 'coffee_spend', message: 'Spending $150–175/mo at Starbucks. Brewing at home even 3 days a week saves ~$720/yr.', annualImpact: 720 },
    ]
  }
}
