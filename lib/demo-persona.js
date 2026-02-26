/**
 * DEMO PERSONA: Sofia Martins, 29, Toronto
 * Goal: Buy first home in 2 years
 * Story: Good income, lifestyle creep eating her surplus, some months saving,
 *        some months bleeding. Breakeven over 12 months. Clear levers to pull.
 */

function monthsAgo(n, day = 1) {
  const d = new Date()
  d.setMonth(d.getMonth() - n)
  d.setDate(day)
  return d.toISOString().split('T')[0]
}

function randomDay(monthsBack, minDay = 1, maxDay = 28) {
  const day = Math.floor(Math.random() * (maxDay - minDay + 1)) + minDay
  return monthsAgo(monthsBack, day)
}

// Sofia's accounts (mirrors Plaid account structure)
export const sofiaAccounts = [
  {
    account_id: 'demo-chequing-001',
    name: 'TD Everyday Chequing',
    type: 'depository',
    subtype: 'checking',
    balances: { current: 1240, available: 1240, limit: null, iso_currency_code: 'CAD' }
  },
  {
    account_id: 'demo-savings-001',
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
    balances: { current: -22400, available: null, limit: null, iso_currency_code: 'CAD' }
  }
]

// Build 12 months of transactions
// Plaid convention: positive = money out (expense), negative = money in (income)
export const sofiaTransactions = [

  // ── INCOME — $6,800/mo from Visionary Design Studio, some months consulting ──
  ...([0,1,2,3,4,5,6,7,8,9,10,11].map(m => ({
    transaction_id: `demo-income-salary-${m}`,
    account_id: 'demo-chequing-001',
    name: 'VISIONARY DESIGN STUDIO PAYROLL',
    merchant_name: 'Visionary Design Studio',
    amount: -6800,
    iso_currency_code: 'CAD',
    date: monthsAgo(m, 15),
    pending: false,
    payment_channel: 'other',
    personal_finance_category: { primary: 'INCOME', detailed: 'INCOME_WAGES' }
  }))),

  // Freelance consulting — sporadic, 4 months out of 12
  { transaction_id: 'demo-freelance-1', account_id: 'demo-chequing-001', name: 'E-TRANSFER FROM BOLT AGENCY', merchant_name: null, amount: -950, iso_currency_code: 'CAD', date: monthsAgo(1, 8), pending: false, payment_channel: 'other', personal_finance_category: { primary: 'INCOME', detailed: 'INCOME_OTHER_INCOME' } },
  { transaction_id: 'demo-freelance-2', account_id: 'demo-chequing-001', name: 'E-TRANSFER FROM BOLT AGENCY', merchant_name: null, amount: -650, iso_currency_code: 'CAD', date: monthsAgo(4, 12), pending: false, payment_channel: 'other', personal_finance_category: { primary: 'INCOME', detailed: 'INCOME_OTHER_INCOME' } },
  { transaction_id: 'demo-freelance-3', account_id: 'demo-chequing-001', name: 'E-TRANSFER LAKEVIEW MEDIA', merchant_name: null, amount: -1200, iso_currency_code: 'CAD', date: monthsAgo(7, 5), pending: false, payment_channel: 'other', personal_finance_category: { primary: 'INCOME', detailed: 'INCOME_OTHER_INCOME' } },
  { transaction_id: 'demo-freelance-4', account_id: 'demo-chequing-001', name: 'E-TRANSFER FROM BOLT AGENCY', merchant_name: null, amount: -800, iso_currency_code: 'CAD', date: monthsAgo(10, 20), pending: false, payment_channel: 'other', personal_finance_category: { primary: 'INCOME', detailed: 'INCOME_OTHER_INCOME' } },

  // ── RENT — $2,100/mo, first of month ──
  ...([0,1,2,3,4,5,6,7,8,9,10,11].map(m => ({
    transaction_id: `demo-rent-${m}`,
    account_id: 'demo-chequing-001',
    name: 'E-TRANSFER PARKVIEW PROPERTIES',
    merchant_name: 'Parkview Properties',
    amount: 2100,
    iso_currency_code: 'CAD',
    date: monthsAgo(m, 1),
    pending: false,
    payment_channel: 'other',
    personal_finance_category: { primary: 'RENT_AND_UTILITIES', detailed: 'RENT_AND_UTILITIES_RENT' }
  }))),

  // ── CAR LEASE — Honda Civic, $498/mo ──
  ...([0,1,2,3,4,5,6,7,8,9,10,11].map(m => ({
    transaction_id: `demo-car-lease-${m}`,
    account_id: 'demo-chequing-001',
    name: 'HONDA FINANCIAL SERVICES',
    merchant_name: 'Honda Financial Services',
    amount: 498,
    iso_currency_code: 'CAD',
    date: monthsAgo(m, 5),
    pending: false,
    payment_channel: 'other',
    personal_finance_category: { primary: 'LOAN_PAYMENTS', detailed: 'LOAN_PAYMENTS_CAR_PAYMENT' }
  }))),

  // ── STUDENT LOAN PAYMENT — $280/mo ──
  ...([0,1,2,3,4,5,6,7,8,9,10,11].map(m => ({
    transaction_id: `demo-student-loan-${m}`,
    account_id: 'demo-chequing-001',
    name: 'NSLSC PAYMENT',
    merchant_name: 'NSLSC',
    amount: 280,
    iso_currency_code: 'CAD',
    date: monthsAgo(m, 18),
    pending: false,
    payment_channel: 'other',
    personal_finance_category: { primary: 'LOAN_PAYMENTS', detailed: 'LOAN_PAYMENTS_STUDENT_LOAN_PAYMENT' }
  }))),

  // ── GROCERIES — Loblaws + Metro, varies $400-700/mo ──
  { transaction_id: 'demo-grocery-1a', account_id: 'demo-credit-001', name: 'LOBLAWS #1042', merchant_name: 'Loblaws', amount: 187, iso_currency_code: 'CAD', date: monthsAgo(0, 6), pending: false, payment_channel: 'in store', personal_finance_category: { primary: 'FOOD_AND_DRINK', detailed: 'FOOD_AND_DRINK_GROCERIES' } },
  { transaction_id: 'demo-grocery-1b', account_id: 'demo-credit-001', name: 'METRO PLUS', merchant_name: 'Metro', amount: 134, iso_currency_code: 'CAD', date: monthsAgo(0, 14), pending: false, payment_channel: 'in store', personal_finance_category: { primary: 'FOOD_AND_DRINK', detailed: 'FOOD_AND_DRINK_GROCERIES' } },
  { transaction_id: 'demo-grocery-1c', account_id: 'demo-credit-001', name: 'LOBLAWS #1042', merchant_name: 'Loblaws', amount: 212, iso_currency_code: 'CAD', date: monthsAgo(0, 22), pending: false, payment_channel: 'in store', personal_finance_category: { primary: 'FOOD_AND_DRINK', detailed: 'FOOD_AND_DRINK_GROCERIES' } },
  { transaction_id: 'demo-grocery-2a', account_id: 'demo-credit-001', name: 'LOBLAWS #1042', merchant_name: 'Loblaws', amount: 156, iso_currency_code: 'CAD', date: monthsAgo(1, 3), pending: false, payment_channel: 'in store', personal_finance_category: { primary: 'FOOD_AND_DRINK', detailed: 'FOOD_AND_DRINK_GROCERIES' } },
  { transaction_id: 'demo-grocery-2b', account_id: 'demo-credit-001', name: 'METRO PLUS', merchant_name: 'Metro', amount: 98, iso_currency_code: 'CAD', date: monthsAgo(1, 11), pending: false, payment_channel: 'in store', personal_finance_category: { primary: 'FOOD_AND_DRINK', detailed: 'FOOD_AND_DRINK_GROCERIES' } },
  { transaction_id: 'demo-grocery-2c', account_id: 'demo-credit-001', name: 'LOBLAWS #1042', merchant_name: 'Loblaws', amount: 231, iso_currency_code: 'CAD', date: monthsAgo(1, 20), pending: false, payment_channel: 'in store', personal_finance_category: { primary: 'FOOD_AND_DRINK', detailed: 'FOOD_AND_DRINK_GROCERIES' } },
  { transaction_id: 'demo-grocery-3a', account_id: 'demo-credit-001', name: 'LOBLAWS #1042', merchant_name: 'Loblaws', amount: 178, iso_currency_code: 'CAD', date: monthsAgo(2, 5), pending: false, payment_channel: 'in store', personal_finance_category: { primary: 'FOOD_AND_DRINK', detailed: 'FOOD_AND_DRINK_GROCERIES' } },
  { transaction_id: 'demo-grocery-3b', account_id: 'demo-credit-001', name: 'COSTCO WHOLESALE', merchant_name: 'Costco', amount: 289, iso_currency_code: 'CAD', date: monthsAgo(2, 12), pending: false, payment_channel: 'in store', personal_finance_category: { primary: 'FOOD_AND_DRINK', detailed: 'FOOD_AND_DRINK_GROCERIES' } },
  { transaction_id: 'demo-grocery-4a', account_id: 'demo-credit-001', name: 'METRO PLUS', merchant_name: 'Metro', amount: 143, iso_currency_code: 'CAD', date: monthsAgo(3, 8), pending: false, payment_channel: 'in store', personal_finance_category: { primary: 'FOOD_AND_DRINK', detailed: 'FOOD_AND_DRINK_GROCERIES' } },
  { transaction_id: 'demo-grocery-4b', account_id: 'demo-credit-001', name: 'LOBLAWS #1042', merchant_name: 'Loblaws', amount: 201, iso_currency_code: 'CAD', date: monthsAgo(3, 18), pending: false, payment_channel: 'in store', personal_finance_category: { primary: 'FOOD_AND_DRINK', detailed: 'FOOD_AND_DRINK_GROCERIES' } },
  { transaction_id: 'demo-grocery-5a', account_id: 'demo-credit-001', name: 'LOBLAWS #1042', merchant_name: 'Loblaws', amount: 167, iso_currency_code: 'CAD', date: monthsAgo(4, 4), pending: false, payment_channel: 'in store', personal_finance_category: { primary: 'FOOD_AND_DRINK', detailed: 'FOOD_AND_DRINK_GROCERIES' } },
  { transaction_id: 'demo-grocery-5b', account_id: 'demo-credit-001', name: 'COSTCO WHOLESALE', merchant_name: 'Costco', amount: 312, iso_currency_code: 'CAD', date: monthsAgo(4, 16), pending: false, payment_channel: 'in store', personal_finance_category: { primary: 'FOOD_AND_DRINK', detailed: 'FOOD_AND_DRINK_GROCERIES' } },
  { transaction_id: 'demo-grocery-6a', account_id: 'demo-credit-001', name: 'METRO PLUS', merchant_name: 'Metro', amount: 189, iso_currency_code: 'CAD', date: monthsAgo(5, 7), pending: false, payment_channel: 'in store', personal_finance_category: { primary: 'FOOD_AND_DRINK', detailed: 'FOOD_AND_DRINK_GROCERIES' } },
  { transaction_id: 'demo-grocery-6b', account_id: 'demo-credit-001', name: 'LOBLAWS #1042', merchant_name: 'Loblaws', amount: 224, iso_currency_code: 'CAD', date: monthsAgo(5, 21), pending: false, payment_channel: 'in store', personal_finance_category: { primary: 'FOOD_AND_DRINK', detailed: 'FOOD_AND_DRINK_GROCERIES' } },
  { transaction_id: 'demo-grocery-7', account_id: 'demo-credit-001', name: 'LOBLAWS #1042', merchant_name: 'Loblaws', amount: 445, iso_currency_code: 'CAD', date: monthsAgo(6, 10), pending: false, payment_channel: 'in store', personal_finance_category: { primary: 'FOOD_AND_DRINK', detailed: 'FOOD_AND_DRINK_GROCERIES' } },
  { transaction_id: 'demo-grocery-8', account_id: 'demo-credit-001', name: 'METRO PLUS', merchant_name: 'Metro', amount: 398, iso_currency_code: 'CAD', date: monthsAgo(7, 14), pending: false, payment_channel: 'in store', personal_finance_category: { primary: 'FOOD_AND_DRINK', detailed: 'FOOD_AND_DRINK_GROCERIES' } },
  { transaction_id: 'demo-grocery-9', account_id: 'demo-credit-001', name: 'LOBLAWS #1042', merchant_name: 'Loblaws', amount: 412, iso_currency_code: 'CAD', date: monthsAgo(8, 9), pending: false, payment_channel: 'in store', personal_finance_category: { primary: 'FOOD_AND_DRINK', detailed: 'FOOD_AND_DRINK_GROCERIES' } },
  { transaction_id: 'demo-grocery-10', account_id: 'demo-credit-001', name: 'LOBLAWS #1042', merchant_name: 'Loblaws', amount: 376, iso_currency_code: 'CAD', date: monthsAgo(9, 6), pending: false, payment_channel: 'in store', personal_finance_category: { primary: 'FOOD_AND_DRINK', detailed: 'FOOD_AND_DRINK_GROCERIES' } },
  { transaction_id: 'demo-grocery-11', account_id: 'demo-credit-001', name: 'METRO PLUS', merchant_name: 'Metro', amount: 341, iso_currency_code: 'CAD', date: monthsAgo(10, 11), pending: false, payment_channel: 'in store', personal_finance_category: { primary: 'FOOD_AND_DRINK', detailed: 'FOOD_AND_DRINK_GROCERIES' } },
  { transaction_id: 'demo-grocery-12', account_id: 'demo-credit-001', name: 'LOBLAWS #1042', merchant_name: 'Loblaws', amount: 428, iso_currency_code: 'CAD', date: monthsAgo(11, 15), pending: false, payment_channel: 'in store', personal_finance_category: { primary: 'FOOD_AND_DRINK', detailed: 'FOOD_AND_DRINK_GROCERIES' } },

  // ── SUBSCRIPTIONS — all monthly, all named ──
  ...([0,1,2,3,4,5,6,7,8,9,10,11].map(m => ({ transaction_id: `demo-netflix-${m}`, account_id: 'demo-credit-001', name: 'NETFLIX.COM', merchant_name: 'Netflix', amount: 20.99, iso_currency_code: 'CAD', date: monthsAgo(m, 7), pending: false, payment_channel: 'online', personal_finance_category: { primary: 'ENTERTAINMENT', detailed: 'ENTERTAINMENT_TV_AND_MOVIES' } }))),
  ...([0,1,2,3,4,5,6,7,8,9,10,11].map(m => ({ transaction_id: `demo-spotify-${m}`, account_id: 'demo-credit-001', name: 'SPOTIFY AB', merchant_name: 'Spotify', amount: 11.99, iso_currency_code: 'CAD', date: monthsAgo(m, 9), pending: false, payment_channel: 'online', personal_finance_category: { primary: 'ENTERTAINMENT', detailed: 'ENTERTAINMENT_MUSIC' } }))),
  ...([0,1,2,3,4,5,6,7,8,9,10,11].map(m => ({ transaction_id: `demo-disney-${m}`, account_id: 'demo-credit-001', name: 'DISNEY PLUS', merchant_name: 'Disney+', amount: 14.99, iso_currency_code: 'CAD', date: monthsAgo(m, 11), pending: false, payment_channel: 'online', personal_finance_category: { primary: 'ENTERTAINMENT', detailed: 'ENTERTAINMENT_TV_AND_MOVIES' } }))),
  ...([0,1,2,3,4,5,6,7,8,9,10,11].map(m => ({ transaction_id: `demo-crave-${m}`, account_id: 'demo-credit-001', name: 'CRAVE SUBSCRIPTION', merchant_name: 'Crave', amount: 19.99, iso_currency_code: 'CAD', date: monthsAgo(m, 13), pending: false, payment_channel: 'online', personal_finance_category: { primary: 'ENTERTAINMENT', detailed: 'ENTERTAINMENT_TV_AND_MOVIES' } }))),
  ...([0,1,2,3,4,5,6,7,8,9,10,11].map(m => ({ transaction_id: `demo-apple-${m}`, account_id: 'demo-credit-001', name: 'APPLE.COM/BILL', merchant_name: 'Apple', amount: 22.95, iso_currency_code: 'CAD', date: monthsAgo(m, 16), pending: false, payment_channel: 'online', personal_finance_category: { primary: 'ENTERTAINMENT', detailed: 'ENTERTAINMENT_TV_AND_MOVIES' } }))),
  ...([0,1,2,3,4,5,6,7,8,9,10,11].map(m => ({ transaction_id: `demo-gym-${m}`, account_id: 'demo-credit-001', name: 'GOODLIFE FITNESS', merchant_name: 'GoodLife Fitness', amount: 54.99, iso_currency_code: 'CAD', date: monthsAgo(m, 3), pending: false, payment_channel: 'other', personal_finance_category: { primary: 'PERSONAL_CARE', detailed: 'PERSONAL_CARE_GYMS_AND_FITNESS_CENTERS' } }))),

  // ── UTILITIES ──
  ...([0,1,2,3,4,5,6,7,8,9,10,11].map(m => ({ transaction_id: `demo-hydro-${m}`, account_id: 'demo-chequing-001', name: 'LOCAL HYDRO PAYMENT', merchant_name: 'Toronto Hydro', amount: m < 3 || m > 8 ? 112 : 78, iso_currency_code: 'CAD', date: monthsAgo(m, 20), pending: false, payment_channel: 'other', personal_finance_category: { primary: 'RENT_AND_UTILITIES', detailed: 'RENT_AND_UTILITIES_ELECTRICITY' } }))),
  ...([0,1,2,3,4,5,6,7,8,9,10,11].map(m => ({ transaction_id: `demo-rogers-${m}`, account_id: 'demo-chequing-001', name: 'ROGERS COMMUNICATIONS', merchant_name: 'Rogers', amount: 89, iso_currency_code: 'CAD', date: monthsAgo(m, 22), pending: false, payment_channel: 'other', personal_finance_category: { primary: 'RENT_AND_UTILITIES', detailed: 'RENT_AND_UTILITIES_TELEPHONE' } }))),

  // ── FOOD OUT — UberEats heavy, some restaurants, Starbucks ──
  ...([0,1,2,3,4,5,6,7,8,9,10,11].map(m => [
    { transaction_id: `demo-ubereats-${m}a`, account_id: 'demo-credit-001', name: 'UBER EATS', merchant_name: 'Uber Eats', amount: [67,43,89,54,72,38,91,61,47,83,55,70][m], iso_currency_code: 'CAD', date: monthsAgo(m, 8), pending: false, payment_channel: 'online', personal_finance_category: { primary: 'FOOD_AND_DRINK', detailed: 'FOOD_AND_DRINK_FAST_FOOD' } },
    { transaction_id: `demo-ubereats-${m}b`, account_id: 'demo-credit-001', name: 'UBER EATS', merchant_name: 'Uber Eats', amount: [51,78,44,88,62,94,39,72,84,48,67,53][m], iso_currency_code: 'CAD', date: monthsAgo(m, 19), pending: false, payment_channel: 'online', personal_finance_category: { primary: 'FOOD_AND_DRINK', detailed: 'FOOD_AND_DRINK_FAST_FOOD' } },
    { transaction_id: `demo-starbucks-${m}`, account_id: 'demo-credit-001', name: 'STARBUCKS', merchant_name: 'Starbucks', amount: [58,43,67,49,72,54,81,46,63,55,48,71][m], iso_currency_code: 'CAD', date: monthsAgo(m, 14), pending: false, payment_channel: 'in store', personal_finance_category: { primary: 'FOOD_AND_DRINK', detailed: 'FOOD_AND_DRINK_COFFEE' } },
  ]).flat()),

  // Restaurants — sporadic, nicer ones
  { transaction_id: 'demo-rest-1', account_id: 'demo-credit-001', name: 'GUSTO 101', merchant_name: 'Gusto 101', amount: 94, iso_currency_code: 'CAD', date: monthsAgo(0, 17), pending: false, payment_channel: 'in store', personal_finance_category: { primary: 'FOOD_AND_DRINK', detailed: 'FOOD_AND_DRINK_RESTAURANT' } },
  { transaction_id: 'demo-rest-2', account_id: 'demo-credit-001', name: 'BUCA RISTORANTE', merchant_name: 'Buca', amount: 142, iso_currency_code: 'CAD', date: monthsAgo(1, 22), pending: false, payment_channel: 'in store', personal_finance_category: { primary: 'FOOD_AND_DRINK', detailed: 'FOOD_AND_DRINK_RESTAURANT' } },
  { transaction_id: 'demo-rest-3', account_id: 'demo-credit-001', name: 'PAI NORTHERN THAI', merchant_name: 'Pai Northern Thai Kitchen', amount: 78, iso_currency_code: 'CAD', date: monthsAgo(2, 9), pending: false, payment_channel: 'in store', personal_finance_category: { primary: 'FOOD_AND_DRINK', detailed: 'FOOD_AND_DRINK_RESTAURANT' } },
  { transaction_id: 'demo-rest-4', account_id: 'demo-credit-001', name: 'BAR ISABEL', merchant_name: 'Bar Isabel', amount: 118, iso_currency_code: 'CAD', date: monthsAgo(3, 14), pending: false, payment_channel: 'in store', personal_finance_category: { primary: 'FOOD_AND_DRINK', detailed: 'FOOD_AND_DRINK_RESTAURANT' } },
  { transaction_id: 'demo-rest-5', account_id: 'demo-credit-001', name: 'GUSTO 101', merchant_name: 'Gusto 101', amount: 86, iso_currency_code: 'CAD', date: monthsAgo(5, 19), pending: false, payment_channel: 'in store', personal_finance_category: { primary: 'FOOD_AND_DRINK', detailed: 'FOOD_AND_DRINK_RESTAURANT' } },
  { transaction_id: 'demo-rest-6', account_id: 'demo-credit-001', name: 'BUCA RISTORANTE', merchant_name: 'Buca', amount: 163, iso_currency_code: 'CAD', date: monthsAgo(8, 25), pending: false, payment_channel: 'in store', personal_finance_category: { primary: 'FOOD_AND_DRINK', detailed: 'FOOD_AND_DRINK_RESTAURANT' } },

  // ── TRANSPORT — Uber, TTC, gas ──
  ...([0,1,2,3,4,5,6,7,8,9,10,11].map(m => ({ transaction_id: `demo-uber-${m}`, account_id: 'demo-credit-001', name: 'UBER CANADA', merchant_name: 'Uber', amount: [87,62,104,78,55,91,68,112,74,83,59,96][m], iso_currency_code: 'CAD', date: monthsAgo(m, 16), pending: false, payment_channel: 'online', personal_finance_category: { primary: 'TRANSPORTATION', detailed: 'TRANSPORTATION_TAXIS_AND_RIDE_SHARES' } }))),
  ...([0,1,2,3,4,5,6,7,8,9,10,11].map(m => ({ transaction_id: `demo-gas-${m}`, account_id: 'demo-credit-001', name: 'ESSO', merchant_name: 'Esso', amount: [78,84,71,65,58,62,55,60,74,82,88,79][m], iso_currency_code: 'CAD', date: monthsAgo(m, 10), pending: false, payment_channel: 'in store', personal_finance_category: { primary: 'TRANSPORTATION', detailed: 'TRANSPORTATION_GAS' } }))),

  // ── INVESTMENTS — small, inconsistent, mostly to TFSA ──
  { transaction_id: 'demo-invest-1', account_id: 'demo-chequing-001', name: 'TRANSFER TO TFSA SAVINGS', merchant_name: null, amount: 300, iso_currency_code: 'CAD', date: monthsAgo(0, 25), pending: false, payment_channel: 'other', personal_finance_category: { primary: 'TRANSFER_OUT', detailed: 'TRANSFER_OUT_SAVINGS' } },
  { transaction_id: 'demo-invest-2', account_id: 'demo-chequing-001', name: 'TRANSFER TO TFSA SAVINGS', merchant_name: null, amount: 150, iso_currency_code: 'CAD', date: monthsAgo(2, 25), pending: false, payment_channel: 'other', personal_finance_category: { primary: 'TRANSFER_OUT', detailed: 'TRANSFER_OUT_SAVINGS' } },
  { transaction_id: 'demo-invest-3', account_id: 'demo-chequing-001', name: 'WEALTHSIMPLE TRADE', merchant_name: 'Wealthsimple', amount: 100, iso_currency_code: 'CAD', date: monthsAgo(3, 20), pending: false, payment_channel: 'online', personal_finance_category: { primary: 'TRANSFER_OUT', detailed: 'TRANSFER_OUT_INVESTMENT_AND_RETIREMENT_FUNDS' } },
  { transaction_id: 'demo-invest-4', account_id: 'demo-chequing-001', name: 'TRANSFER TO TFSA SAVINGS', merchant_name: null, amount: 500, iso_currency_code: 'CAD', date: monthsAgo(4, 25), pending: false, payment_channel: 'other', personal_finance_category: { primary: 'TRANSFER_OUT', detailed: 'TRANSFER_OUT_SAVINGS' } },
  { transaction_id: 'demo-invest-5', account_id: 'demo-chequing-001', name: 'WEALTHSIMPLE TRADE', merchant_name: 'Wealthsimple', amount: 250, iso_currency_code: 'CAD', date: monthsAgo(6, 18), pending: false, payment_channel: 'online', personal_finance_category: { primary: 'TRANSFER_OUT', detailed: 'TRANSFER_OUT_INVESTMENT_AND_RETIREMENT_FUNDS' } },
  { transaction_id: 'demo-invest-6', account_id: 'demo-chequing-001', name: 'TRANSFER TO TFSA SAVINGS', merchant_name: null, amount: 200, iso_currency_code: 'CAD', date: monthsAgo(9, 25), pending: false, payment_channel: 'other', personal_finance_category: { primary: 'TRANSFER_OUT', detailed: 'TRANSFER_OUT_SAVINGS' } },
  { transaction_id: 'demo-invest-7', account_id: 'demo-chequing-001', name: 'WEALTHSIMPLE TRADE', merchant_name: 'Wealthsimple', amount: 75, iso_currency_code: 'CAD', date: monthsAgo(11, 22), pending: false, payment_channel: 'online', personal_finance_category: { primary: 'TRANSFER_OUT', detailed: 'TRANSFER_OUT_INVESTMENT_AND_RETIREMENT_FUNDS' } },

  // ── UNEXPECTED EXPENSES — the ones that kill the budget ──
  // Dental (not covered by work plan)
  { transaction_id: 'demo-dental-1', account_id: 'demo-credit-001', name: 'YONGE ST DENTAL CENTRE', merchant_name: 'Yonge Street Dental', amount: 680, iso_currency_code: 'CAD', date: monthsAgo(2, 8), pending: false, payment_channel: 'in store', personal_finance_category: { primary: 'MEDICAL', detailed: 'MEDICAL_DENTISTS' } },
  { transaction_id: 'demo-dental-2', account_id: 'demo-credit-001', name: 'YONGE ST DENTAL CENTRE', merchant_name: 'Yonge Street Dental', amount: 420, iso_currency_code: 'CAD', date: monthsAgo(7, 15), pending: false, payment_channel: 'in store', personal_finance_category: { primary: 'MEDICAL', detailed: 'MEDICAL_DENTISTS' } },
  // Car repair
  { transaction_id: 'demo-car-repair', account_id: 'demo-credit-001', name: 'DOWNTOWN HONDA SERVICE', merchant_name: 'Downtown Honda', amount: 890, iso_currency_code: 'CAD', date: monthsAgo(5, 12), pending: false, payment_channel: 'in store', personal_finance_category: { primary: 'TRANSPORTATION', detailed: 'TRANSPORTATION_AUTO_MAINTENANCE' } },
  // Phone cracked
  { transaction_id: 'demo-phone', account_id: 'demo-credit-001', name: 'APPLE STORE EATON CENTRE', merchant_name: 'Apple Store', amount: 349, iso_currency_code: 'CAD', date: monthsAgo(3, 6), pending: false, payment_channel: 'in store', personal_finance_category: { primary: 'GENERAL_MERCHANDISE', detailed: 'GENERAL_MERCHANDISE_ELECTRONICS' } },
  // Moving costs (renewed lease, had to repaint)
  { transaction_id: 'demo-moving', account_id: 'demo-chequing-001', name: 'U-HAUL', merchant_name: 'U-Haul', amount: 218, iso_currency_code: 'CAD', date: monthsAgo(9, 3), pending: false, payment_channel: 'in store', personal_finance_category: { primary: 'GENERAL_SERVICES', detailed: 'GENERAL_SERVICES_MOVING' } },
  // Home stuff
  { transaction_id: 'demo-ikea', account_id: 'demo-credit-001', name: 'IKEA NORTH YORK', merchant_name: 'IKEA', amount: 547, iso_currency_code: 'CAD', date: monthsAgo(9, 10), pending: false, payment_channel: 'in store', personal_finance_category: { primary: 'HOME_IMPROVEMENT', detailed: 'HOME_IMPROVEMENT_FURNITURE' } },
  // Gift (sister's wedding)
  { transaction_id: 'demo-gift', account_id: 'demo-credit-001', name: 'WILLIAMS SONOMA', merchant_name: 'Williams Sonoma', amount: 189, iso_currency_code: 'CAD', date: monthsAgo(6, 4), pending: false, payment_channel: 'in store', personal_finance_category: { primary: 'GENERAL_MERCHANDISE', detailed: 'GENERAL_MERCHANDISE_GIFTS' } },
  // Vet (has a cat)
  { transaction_id: 'demo-vet-1', account_id: 'demo-credit-001', name: 'BLOOR WEST ANIMAL HOSPITAL', merchant_name: 'Bloor West Animal Hospital', amount: 312, iso_currency_code: 'CAD', date: monthsAgo(1, 26), pending: false, payment_channel: 'in store', personal_finance_category: { primary: 'GENERAL_SERVICES', detailed: 'GENERAL_SERVICES_VETERINARIANS' } },
  { transaction_id: 'demo-vet-2', account_id: 'demo-credit-001', name: 'BLOOR WEST ANIMAL HOSPITAL', merchant_name: 'Bloor West Animal Hospital', amount: 148, iso_currency_code: 'CAD', date: monthsAgo(8, 19), pending: false, payment_channel: 'in store', personal_finance_category: { primary: 'GENERAL_SERVICES', detailed: 'GENERAL_SERVICES_VETERINARIANS' } },

  // ── SHOPPING — clothes, beauty, some impulse ──
  { transaction_id: 'demo-shop-1', account_id: 'demo-credit-001', name: 'ZARA CANADA', merchant_name: 'Zara', amount: 187, iso_currency_code: 'CAD', date: monthsAgo(0, 12), pending: false, payment_channel: 'in store', personal_finance_category: { primary: 'GENERAL_MERCHANDISE', detailed: 'GENERAL_MERCHANDISE_CLOTHING_AND_ACCESSORIES' } },
  { transaction_id: 'demo-shop-2', account_id: 'demo-credit-001', name: 'SEPHORA', merchant_name: 'Sephora', amount: 143, iso_currency_code: 'CAD', date: monthsAgo(1, 8), pending: false, payment_channel: 'in store', personal_finance_category: { primary: 'PERSONAL_CARE', detailed: 'PERSONAL_CARE_PERSONAL_CARE_PRODUCTS' } },
  { transaction_id: 'demo-shop-3', account_id: 'demo-credit-001', name: 'AMAZON.CA', merchant_name: 'Amazon', amount: 94, iso_currency_code: 'CAD', date: monthsAgo(2, 17), pending: false, payment_channel: 'online', personal_finance_category: { primary: 'GENERAL_MERCHANDISE', detailed: 'GENERAL_MERCHANDISE_ONLINE_MARKETPLACES' } },
  { transaction_id: 'demo-shop-4', account_id: 'demo-credit-001', name: 'AMAZON.CA', merchant_name: 'Amazon', amount: 67, iso_currency_code: 'CAD', date: monthsAgo(3, 21), pending: false, payment_channel: 'online', personal_finance_category: { primary: 'GENERAL_MERCHANDISE', detailed: 'GENERAL_MERCHANDISE_ONLINE_MARKETPLACES' } },
  { transaction_id: 'demo-shop-5', account_id: 'demo-credit-001', name: 'ARITZIA', merchant_name: 'Aritzia', amount: 234, iso_currency_code: 'CAD', date: monthsAgo(4, 3), pending: false, payment_channel: 'in store', personal_finance_category: { primary: 'GENERAL_MERCHANDISE', detailed: 'GENERAL_MERCHANDISE_CLOTHING_AND_ACCESSORIES' } },
  { transaction_id: 'demo-shop-6', account_id: 'demo-credit-001', name: 'AMAZON.CA', merchant_name: 'Amazon', amount: 112, iso_currency_code: 'CAD', date: monthsAgo(5, 14), pending: false, payment_channel: 'online', personal_finance_category: { primary: 'GENERAL_MERCHANDISE', detailed: 'GENERAL_MERCHANDISE_ONLINE_MARKETPLACES' } },
  { transaction_id: 'demo-shop-7', account_id: 'demo-credit-001', name: 'INDIGO BOOKS', merchant_name: 'Indigo', amount: 78, iso_currency_code: 'CAD', date: monthsAgo(6, 22), pending: false, payment_channel: 'in store', personal_finance_category: { primary: 'GENERAL_MERCHANDISE', detailed: 'GENERAL_MERCHANDISE_BOOKSTORES' } },
  { transaction_id: 'demo-shop-8', account_id: 'demo-credit-001', name: 'SEPHORA', merchant_name: 'Sephora', amount: 89, iso_currency_code: 'CAD', date: monthsAgo(8, 7), pending: false, payment_channel: 'in store', personal_finance_category: { primary: 'PERSONAL_CARE', detailed: 'PERSONAL_CARE_PERSONAL_CARE_PRODUCTS' } },
  { transaction_id: 'demo-shop-9', account_id: 'demo-credit-001', name: 'AMAZON.CA', merchant_name: 'Amazon', amount: 156, iso_currency_code: 'CAD', date: monthsAgo(10, 18), pending: false, payment_channel: 'online', personal_finance_category: { primary: 'GENERAL_MERCHANDISE', detailed: 'GENERAL_MERCHANDISE_ONLINE_MARKETPLACES' } },

  // ── CREDIT CARD PAYMENT (partial, not full balance) ──
  ...([0,1,2,3,4,5,6,7,8,9,10,11].map(m => ({ transaction_id: `demo-cc-payment-${m}`, account_id: 'demo-chequing-001', name: 'TD VISA PAYMENT', merchant_name: null, amount: [800,600,900,750,500,800,650,900,700,550,800,750][m], iso_currency_code: 'CAD', date: monthsAgo(m, 27), pending: false, payment_channel: 'other', personal_finance_category: { primary: 'LOAN_PAYMENTS', detailed: 'LOAN_PAYMENTS_CREDIT_CARD_PAYMENT' } }))),

  // ── ENTERTAINMENT / GOING OUT ──
  ...([0,1,2,3,4,5,6,7].map(m => ({ transaction_id: `demo-lcbo-${m}`, account_id: 'demo-credit-001', name: 'LCBO', merchant_name: 'LCBO', amount: [34,28,42,31,38,27,45,33][m], iso_currency_code: 'CAD', date: monthsAgo(m, 18), pending: false, payment_channel: 'in store', personal_finance_category: { primary: 'FOOD_AND_DRINK', detailed: 'FOOD_AND_DRINK_ALCOHOL' } }))),
  { transaction_id: 'demo-concert', account_id: 'demo-credit-001', name: 'TICKETMASTER CANADA', merchant_name: 'Ticketmaster', amount: 187, iso_currency_code: 'CAD', date: monthsAgo(2, 4), pending: false, payment_channel: 'online', personal_finance_category: { primary: 'ENTERTAINMENT', detailed: 'ENTERTAINMENT_EVENTS_AND_ATTRACTIONS' } },
  { transaction_id: 'demo-cinema', account_id: 'demo-credit-001', name: 'CINEPLEX ODEON', merchant_name: 'Cineplex', amount: 34, iso_currency_code: 'CAD', date: monthsAgo(4, 27), pending: false, payment_channel: 'in store', personal_finance_category: { primary: 'ENTERTAINMENT', detailed: 'ENTERTAINMENT_EVENTS_AND_ATTRACTIONS' } },

  // ── CREDIT CARD INTEREST CHARGES (she carries a balance) ──
  ...([0,1,2,3,4,5,6,7,8,9,10,11].map(m => ({ transaction_id: `demo-interest-${m}`, account_id: 'demo-credit-001', name: 'TD VISA INTEREST CHARGE', merchant_name: 'TD Bank', amount: [57,61,54,58,66,52,63,59,55,68,62,57][m], iso_currency_code: 'CAD', date: monthsAgo(m, 28), pending: false, payment_channel: 'other', personal_finance_category: { primary: 'BANK_FEES', detailed: 'BANK_FEES_INTEREST_CHARGE' } }))),
]

// Build a financial profile in the same shape as buildFinancialProfile() returns
export function buildSofiaProfile(province = "ON") {
  const utilityName = {
    ON: 'Toronto Hydro', BC: 'BC Hydro', AB: 'ATCO Electric', QC: 'Hydro-Québec',
    SK: 'SaskPower', MB: 'Manitoba Hydro', NS: 'Nova Scotia Power', NB: 'NB Power',
    NL: 'Newfoundland Power', PEI: 'Maritime Electric'
  }[province] || 'Toronto Hydro'

  const accounts = sofiaAccounts
  // Patch utility name based on province
  const transactions = sofiaTransactions.map(t =>
    t.name === 'LOCAL HYDRO PAYMENT'
      ? { ...t, name: utilityName.toUpperCase(), merchant_name: utilityName }
      : t
  )

  const totalAssets = accounts
    .filter(a => ['depository'].includes(a.type))
    .reduce((s, a) => s + (a.balances.current || 0), 0)

  const totalLiabilities = accounts
    .filter(a => ['credit', 'loan'].includes(a.type))
    .reduce((s, a) => s + Math.abs(a.balances.current || 0), 0)

  // Cash flow by month
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

  // Merchant breakdown
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

  // Subscriptions
  const subscriptions = merchantList
    .filter(m => m.looksLikeSubscription)
    .map(m => ({ name: m.name, monthlyAmount: m.totalSpent / 12, annualAmount: m.totalSpent, occurrences: m.transactionCount }))

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
    merchants: { top20: merchantList.slice(0, 20), all: merchantList },
    spending: Object.entries(
      transactions.filter(t => t.amount > 0).reduce((cat, t) => {
        const c = t.personal_finance_category?.primary || 'Other'
        cat[c] = (cat[c] || 0) + t.amount
        return cat
      }, {})
    ).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, amount]) => ({ name, amount: Math.round(amount) })),
    subscriptions,
    debt: {
      hasDebt: true,
      totalDebt: Math.round(totalLiabilities),
      accounts: accounts.filter(a => ['credit', 'loan'].includes(a.type)).map(a => ({ name: a.name, balance: Math.abs(a.balances.current), limit: a.balances.limit }))
    },
    dataQuality: {
      overall: 'high',
      accountCount: accounts.length,
      transactionCount: transactions.length,
      monthsOfData: 12,
      notes: []
    },
    generatedAt: new Date().toISOString(),
    rawTransactions: transactions,
    accounts: accounts.map(a => ({ account_id: a.account_id, name: a.name, type: a.type, subtype: a.subtype }))
  }
}
