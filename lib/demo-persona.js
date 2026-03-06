/**
 * DEMO PERSONA: Marcus Rivera, 34, Miami FL
 *
 * Story: Certified Nursing Assistant at Baptist Health South Florida.
 * Paid biweekly ($1,640/paycheck). Tight but not hopeless cash flow.
 * Uses OneBlinc EWA occasionally but doesn't always know how much is safe.
 * Classic pattern: delivery apps + forgotten subscriptions eating the paycheck.
 * Carries a $1,820 credit card balance, never fully pays it off.
 * Car payment ($387/mo) is his biggest fixed expense after rent.
 *
 * CURRENT MONTHLY PICTURE:
 *   Income:   ~$3,280/mo
 *   Expenses: ~$3,060/mo
 *   Surplus:  ~$220/mo (razor thin — any EWA advance must be sized carefully)
 *
 * Key levers Claude should catch:
 *   1. Delivery apps (Uber Eats + DoorDash): $195/mo → cut to $60 → save $1,620/yr
 *   2. Streaming overlap (Netflix + HBO Max + Disney+ + Spotify): $58/mo → cut 2 → save $312/yr
 *   3. CC interest ($1,820 at 24% APR): $364/yr wasted — pay off in 10 months
 *   4. Safe advance: $120 max given current cash flow (not $300+)
 *   5. Phone plan: paying $85/mo on AT&T → Mint Mobile $30/mo → $660/yr saved
 */

function monthsAgo(n, day = 1) {
  const d = new Date()
  d.setMonth(d.getMonth() - n)
  d.setDate(day)
  return d.toISOString().split('T')[0]
}

// ── Accounts ──────────────────────────────────────────────────
export const marcusAccounts = [
  {
    account_id: 'demo-checking-001',
    name: 'Wells Fargo Everyday Checking',
    type: 'depository',
    subtype: 'checking',
    balances: { current: 487, available: 487, limit: null, iso_currency_code: 'USD' }
  },
  {
    account_id: 'demo-savings-001',
    name: 'Wells Fargo Way2Save',
    type: 'depository',
    subtype: 'savings',
    balances: { current: 340, available: 340, limit: null, iso_currency_code: 'USD' }
  },
  {
    account_id: 'demo-credit-001',
    name: 'Capital One Quicksilver',
    type: 'credit',
    subtype: 'credit card',
    balances: { current: -1820, available: 1180, limit: 3000, iso_currency_code: 'USD' }
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

  // ── INCOME: biweekly $1,640 (1st and 15th) ───────────────────
  ...[0,1,2,3,4,5].flatMap(m => [
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
      387, m, 6, 'other', 'LOAN_PAYMENTS', 'LOAN_PAYMENTS_CAR_PAYMENT')
  ),

  // ── CAR INSURANCE: $148/mo ───────────────────────────────────
  ...[0,1,2,3,4,5].map(m =>
    tx(`ins-${m}`, CHK, 'PROGRESSIVE INSURANCE', 'Progressive',
      148, m, 7, 'other', 'GENERAL_SERVICES', 'GENERAL_SERVICES_INSURANCE')
  ),

  // ── PHONE: AT&T $85/mo ───────────────────────────────────────
  ...[0,1,2,3,4,5].map(m =>
    tx(`phone-${m}`, CHK, 'AT&T MOBILITY', 'AT&T',
      85, m, 10, 'other', 'RENT_AND_UTILITIES', 'RENT_AND_UTILITIES_TELEPHONE_SERVICE')
  ),

  // ── UTILITIES: FPL electric ~$95/mo ──────────────────────────
  ...[0,1,2,3,4,5].map(m =>
    tx(`fpl-${m}`, CHK, 'FLORIDA POWER AND LIGHT', 'Florida Power & Light',
      [88,94,102,97,91,104][m], m, 12, 'other', 'RENT_AND_UTILITIES', 'RENT_AND_UTILITIES_ELECTRIC')
  ),

  // ── GROCERIES: Publix, Walmart ───────────────────────────────
  tx('groc-0a', CC, 'PUBLIX #1247', 'Publix', 112, 0, 5, 'in store', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_GROCERIES'),
  tx('groc-0b', CC, 'WALMART SUPERCENTER', 'Walmart', 67, 0, 19, 'in store', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_GROCERIES'),
  tx('groc-1a', CC, 'PUBLIX #1247', 'Publix', 98, 1, 6, 'in store', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_GROCERIES'),
  tx('groc-1b', CC, 'WALMART SUPERCENTER', 'Walmart', 84, 1, 20, 'in store', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_GROCERIES'),
  tx('groc-2a', CC, 'PUBLIX #1247', 'Publix', 127, 2, 4, 'in store', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_GROCERIES'),
  tx('groc-2b', CC, 'WALMART SUPERCENTER', 'Walmart', 71, 2, 18, 'in store', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_GROCERIES'),
  tx('groc-3a', CC, 'PUBLIX #1247', 'Publix', 143, 3, 7, 'in store', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_GROCERIES'),
  tx('groc-3b', CC, 'WALMART SUPERCENTER', 'Walmart', 89, 3, 21, 'in store', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_GROCERIES'),
  tx('groc-4a', CC, 'PUBLIX #1247', 'Publix', 108, 4, 3, 'in store', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_GROCERIES'),
  tx('groc-4b', CC, 'WALMART SUPERCENTER', 'Walmart', 76, 4, 17, 'in store', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_GROCERIES'),
  tx('groc-5a', CC, 'PUBLIX #1247', 'Publix', 119, 5, 5, 'in store', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_GROCERIES'),
  tx('groc-5b', CC, 'WALMART SUPERCENTER', 'Walmart', 82, 5, 19, 'in store', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_GROCERIES'),

  // ── DELIVERY APPS: Uber Eats + DoorDash — ~$235/mo ───────────
  // Pattern: after long 12-hr CNA shifts, ordering 5-6x per week
  tx('dd-0a', CC, 'DOORDASH', 'DoorDash', 38.45, 0, 2, 'online', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_FAST_FOOD'),
  tx('ue-0a', CC, 'UBER EATS', 'Uber Eats', 42.18, 0, 4, 'online', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_FAST_FOOD'),
  tx('dd-0b', CC, 'DOORDASH', 'DoorDash', 35.90, 0, 9, 'online', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_FAST_FOOD'),
  tx('ue-0b', CC, 'UBER EATS', 'Uber Eats', 29.75, 0, 13, 'online', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_FAST_FOOD'),
  tx('dd-0c', CC, 'DOORDASH', 'DoorDash', 44.60, 0, 17, 'online', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_FAST_FOOD'),
  tx('ue-0c', CC, 'UBER EATS', 'Uber Eats', 47.30, 0, 22, 'online', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_FAST_FOOD'),

  tx('dd-1a', CC, 'DOORDASH', 'DoorDash', 33.80, 1, 3, 'online', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_FAST_FOOD'),
  tx('ue-1a', CC, 'UBER EATS', 'Uber Eats', 51.25, 1, 8, 'online', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_FAST_FOOD'),
  tx('dd-1b', CC, 'DOORDASH', 'DoorDash', 40.15, 1, 14, 'online', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_FAST_FOOD'),
  tx('ue-1b', CC, 'UBER EATS', 'Uber Eats', 36.90, 1, 19, 'online', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_FAST_FOOD'),
  tx('dd-1c', CC, 'DOORDASH', 'DoorDash', 28.40, 1, 24, 'online', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_FAST_FOOD'),
  tx('ue-1c', CC, 'UBER EATS', 'Uber Eats', 43.70, 1, 27, 'online', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_FAST_FOOD'),

  tx('ue-2a', CC, 'UBER EATS', 'Uber Eats', 39.55, 2, 5, 'online', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_FAST_FOOD'),
  tx('dd-2a', CC, 'DOORDASH', 'DoorDash', 46.80, 2, 10, 'online', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_FAST_FOOD'),
  tx('ue-2b', CC, 'UBER EATS', 'Uber Eats', 31.20, 2, 16, 'online', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_FAST_FOOD'),
  tx('dd-2b', CC, 'DOORDASH', 'DoorDash', 52.10, 2, 21, 'online', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_FAST_FOOD'),
  tx('ue-2c', CC, 'UBER EATS', 'Uber Eats', 34.95, 2, 26, 'online', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_FAST_FOOD'),

  tx('dd-3a', CC, 'DOORDASH', 'DoorDash', 37.40, 3, 4, 'online', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_FAST_FOOD'),
  tx('ue-3a', CC, 'UBER EATS', 'Uber Eats', 55.80, 3, 9, 'online', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_FAST_FOOD'),
  tx('dd-3b', CC, 'DOORDASH', 'DoorDash', 42.65, 3, 15, 'online', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_FAST_FOOD'),
  tx('ue-3b', CC, 'UBER EATS', 'Uber Eats', 29.90, 3, 22, 'online', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_FAST_FOOD'),
  tx('dd-3c', CC, 'DOORDASH', 'DoorDash', 38.25, 3, 27, 'online', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_FAST_FOOD'),

  tx('ue-4a', CC, 'UBER EATS', 'Uber Eats', 44.10, 4, 6, 'online', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_FAST_FOOD'),
  tx('dd-4a', CC, 'DOORDASH', 'DoorDash', 33.75, 4, 11, 'online', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_FAST_FOOD'),
  tx('ue-4b', CC, 'UBER EATS', 'Uber Eats', 49.20, 4, 17, 'online', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_FAST_FOOD'),
  tx('dd-4b', CC, 'DOORDASH', 'DoorDash', 41.85, 4, 23, 'online', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_FAST_FOOD'),
  tx('ue-4c', CC, 'UBER EATS', 'Uber Eats', 36.40, 4, 28, 'online', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_FAST_FOOD'),

  tx('dd-5a', CC, 'DOORDASH', 'DoorDash', 43.90, 5, 3, 'online', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_FAST_FOOD'),
  tx('ue-5a', CC, 'UBER EATS', 'Uber Eats', 38.15, 5, 8, 'online', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_FAST_FOOD'),
  tx('dd-5b', CC, 'DOORDASH', 'DoorDash', 50.70, 5, 14, 'online', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_FAST_FOOD'),
  tx('ue-5b', CC, 'UBER EATS', 'Uber Eats', 45.25, 5, 20, 'online', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_FAST_FOOD'),
  tx('dd-5c', CC, 'DOORDASH', 'DoorDash', 32.60, 5, 26, 'online', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_FAST_FOOD'),

  // ── STREAMING SUBSCRIPTIONS (4 services = $58/mo) ────────────
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

  // ── GAS: Shell, Chevron ~$120/mo ─────────────────────────────
  ...[0,1,2,3,4,5].flatMap(m => [
    tx(`gas-a-${m}`, CC, 'SHELL OIL', 'Shell', [58,62,71,66,54,68][m], m, 8, 'in store', 'TRANSPORTATION', 'TRANSPORTATION_GAS'),
    tx(`gas-b-${m}`, CC, 'CHEVRON', 'Chevron', [52,48,57,61,49,53][m], m, 22, 'in store', 'TRANSPORTATION', 'TRANSPORTATION_GAS'),
  ]),

  // ── CC INTEREST: ~$36/mo (24% APR on $1,820 balance) ─────────
  ...[0,1,2,3,4,5].map(m =>
    tx(`interest-${m}`, CC, 'CAPITAL ONE INTEREST CHARGE', 'Capital One',
      [36,34,38,33,37,35][m], m, 28, 'other', 'BANK_FEES', 'BANK_FEES_INTEREST_CHARGE')
  ),

  // ── CC MINIMUM PAYMENTS (never fully clears) ─────────────────
  ...[0,1,2,3,4,5].map(m =>
    tx(`ccpay-${m}`, CHK, 'CAPITAL ONE PAYMENT', null,
      [150,120,175,140,100,150][m], m, 27, 'other', 'LOAN_PAYMENTS', 'LOAN_PAYMENTS_CREDIT_CARD_PAYMENT')
  ),

  // ── COFFEE: Starbucks ~$75/mo ─────────────────────────────────
  ...[0,1,2,3,4,5].flatMap(m => [
    tx(`sbux-a-${m}`, CC, 'STARBUCKS', 'Starbucks', [6.45,7.25,5.95,8.10,6.80,7.50][m], m, 4, 'in store', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_COFFEE'),
    tx(`sbux-b-${m}`, CC, 'STARBUCKS', 'Starbucks', [12.40,11.80,13.20,10.95,12.60,11.40][m], m, 11, 'in store', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_COFFEE'),
    tx(`sbux-c-${m}`, CC, 'STARBUCKS', 'Starbucks', [7.85,8.40,6.70,9.15,7.20,8.90][m], m, 18, 'in store', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_COFFEE'),
    tx(`sbux-d-${m}`, CC, 'STARBUCKS', 'Starbucks', [11.20,10.60,12.80,9.75,11.95,10.30][m], m, 25, 'in store', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_COFFEE'),
  ]),

  // ── AMAZON MISC ───────────────────────────────────────────────
  tx('amz-1', CC, 'AMAZON.COM', 'Amazon', 34.99, 0, 16, 'online', 'GENERAL_MERCHANDISE', 'GENERAL_MERCHANDISE_ONLINE_MARKETPLACES'),
  tx('amz-2', CC, 'AMAZON.COM', 'Amazon', 67.40, 2, 11, 'online', 'GENERAL_MERCHANDISE', 'GENERAL_MERCHANDISE_ONLINE_MARKETPLACES'),
  tx('amz-3', CC, 'AMAZON.COM', 'Amazon', 28.15, 4, 8, 'online', 'GENERAL_MERCHANDISE', 'GENERAL_MERCHANDISE_ONLINE_MARKETPLACES'),

  // ── IRREGULAR EXPENSES ────────────────────────────────────────
  tx('laundry-1', CC, 'COIN LAUNDRY MIAMI', null, 18.50, 0, 14, 'in store', 'GENERAL_SERVICES', 'GENERAL_SERVICES_LAUNDRY_AND_DRY_CLEANING'),
  tx('laundry-2', CC, 'COIN LAUNDRY MIAMI', null, 22.00, 2, 13, 'in store', 'GENERAL_SERVICES', 'GENERAL_SERVICES_LAUNDRY_AND_DRY_CLEANING'),
  tx('laundry-3', CC, 'COIN LAUNDRY MIAMI', null, 18.50, 4, 12, 'in store', 'GENERAL_SERVICES', 'GENERAL_SERVICES_LAUNDRY_AND_DRY_CLEANING'),
  tx('pharmacy-1', CC, 'CVS PHARMACY', 'CVS', 42.80, 1, 17, 'in store', 'MEDICAL', 'MEDICAL_PHARMACIES'),
  tx('pharmacy-2', CC, 'CVS PHARMACY', 'CVS', 31.60, 3, 15, 'in store', 'MEDICAL', 'MEDICAL_PHARMACIES'),
  tx('mcdonalds-0', CC, 'MCDONALDS', "McDonald's", 12.40, 0, 7, 'in store', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_FAST_FOOD'),
  tx('mcdonalds-1', CC, 'MCDONALDS', "McDonald's", 9.85, 1, 13, 'in store', 'FOOD_AND_DRINK', 'FOOD_AND_DRINK_FAST_FOOD'),

  // ── ONEBLINC EWA ADVANCES (repaid automatically next payday) ──
  tx('ewa-1', CHK, 'ONEBLINC ADVANCE', 'OneBlinc', -200, 1, 10, 'other', 'INCOME', 'INCOME_OTHER_INCOME'),
  tx('ewa-1-repay', CHK, 'ONEBLINC REPAYMENT', 'OneBlinc', 200, 1, 15, 'other', 'LOAN_PAYMENTS', 'LOAN_PAYMENTS_OTHER_PAYMENT'),
  tx('ewa-2', CHK, 'ONEBLINC ADVANCE', 'OneBlinc', -150, 3, 12, 'other', 'INCOME', 'INCOME_OTHER_INCOME'),
  tx('ewa-2-repay', CHK, 'ONEBLINC REPAYMENT', 'OneBlinc', 150, 3, 15, 'other', 'LOAN_PAYMENTS', 'LOAN_PAYMENTS_OTHER_PAYMENT'),
  tx('ewa-3', CHK, 'ONEBLINC ADVANCE', 'OneBlinc', -250, 5, 9, 'other', 'INCOME', 'INCOME_OTHER_INCOME'),
  tx('ewa-3-repay', CHK, 'ONEBLINC REPAYMENT', 'OneBlinc', 250, 5, 15, 'other', 'LOAN_PAYMENTS', 'LOAN_PAYMENTS_OTHER_PAYMENT'),
]

// ── Profile builder (matches shape of buildFinancialProfile()) ──
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
      estimatedMonthlyGross: 3280,
      payFrequency: 'biweekly',
      sources: [{ name: 'BAPTIST HEALTH SOUTH FLORIDA PAYROLL', amount: 1640, frequency: 'biweekly' }]
    },
    topMerchants: merchantList.slice(0, 20),
    subscriptions,
    accounts: accounts.map(a => ({
      account_id: a.account_id,
      name: a.name, type: a.type, subtype: a.subtype,
      balance: a.balances.current, limit: a.balances.limit
    })),
    rawTransactions: transactions,
    flags: [
      { type: 'delivery_spend', message: 'Spending $225-245/mo on DoorDash and Uber Eats combined (5-6 orders/week after shifts). Cutting to twice a week saves $1,800+/yr.', annualImpact: 1800 },
      { type: 'streaming_overlap', message: 'Paying for Netflix ($15.49), Max ($15.99), Disney+ ($13.99), and Spotify ($10.99) = $56.46/mo. There are 4 services total. Canceling Netflix and Disney+ saves $29.48/mo ($354/yr). Keep Max and Spotify.', annualImpact: 354 },
      { type: 'phone_plan', message: 'Paying AT&T $85/mo. Mint Mobile offers the same 15GB plan for $30/mo — saving $660/yr with a 15-minute switch at mintmobile.com.', annualImpact: 660 },
      { type: 'cc_interest', message: 'Paying $33-38/mo in Capital One interest on a $1,820 balance never fully cleared. At 24% APR, this costs $432/yr in pure interest.', annualImpact: 432 },
      { type: 'nsf_risk', message: 'With $487 in checking and 5 days to payday, one unexpected expense triggers a $35 NSF fee or a payday loan at 400%+ APR. An OneBlinc advance of up to $120 covers the gap interest-free.', annualImpact: 0 },
      { type: 'coffee_spend', message: 'Spending $68-80/mo at Starbucks. Brewing at home on 3 off-days per week saves $480+/yr.', annualImpact: 480 },
    ]
  }
}
