export async function buildFinancialProfile(plaidClient, accessToken) {
  const today = new Date().toISOString().split('T')[0]
  const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const accountsRes = await plaidClient.accountsGet({ access_token: accessToken })
  const accounts = accountsRes.data.accounts
  console.log('[Plaid] Accounts:', accounts.map(a => a.name + ' (' + a.type + ')').join(', '))

  let transactions = []
  try {
    const transactionsRes = await plaidClient.transactionsGet({
      access_token: accessToken,
      start_date: oneYearAgo,
      end_date: today,
      options: { count: 500, include_personal_finance_category: true }
    })
    transactions = transactionsRes.data.transactions
    console.log('[Plaid] Transactions returned:', transactions.length)
    if (transactions.length === 0) {
      console.log('[Plaid] ZERO transactions. In the Plaid modal, select "First Platypus Bank" and use user_good / pass_good')
    } else {
      console.log('[Plaid] Sample:', transactions[0].name, '|', transactions[0].merchant_name, '|', transactions[0].personal_finance_category?.primary)
    }
  } catch (err) {
    console.error('[Plaid] transactionsGet error:', err.message)
  }

  return {
    snapshot: buildSnapshot(accounts),
    cashFlow: analyzeCashFlow(transactions),
    income: detectIncome(transactions),
    merchants: buildMerchantBreakdown(transactions),   // NEW: actual merchant names
    spending: categorizeSpending(transactions),
    subscriptions: detectSubscriptions(transactions),  // NEW: recurring services
    debt: analyzeDebt(accounts),
    dataQuality: scoreQuality(accounts, transactions),
    generatedAt: new Date().toISOString(),
    rawTransactions: transactions,
    accounts: accounts.map(a => ({
      account_id: a.account_id,
      name: a.name,
      type: a.type,
      subtype: a.subtype
    }))
  }
}

function buildSnapshot(accounts) {
  const assets = accounts
    .filter(a => ['depository', 'investment'].includes(a.type))
    .map(a => ({ name: a.name, type: a.subtype, balance: a.balances.current || 0 }))

  const liabilities = accounts
    .filter(a => ['credit', 'loan'].includes(a.type))
    .map(a => ({ name: a.name, type: a.subtype, balance: Math.abs(a.balances.current || 0) }))

  const totalAssets = assets.reduce((s, a) => s + a.balance, 0)
  const totalLiabilities = liabilities.reduce((s, l) => s + l.balance, 0)

  return { assets, liabilities, totalAssets, totalLiabilities, netWorth: totalAssets - totalLiabilities }
}

function analyzeCashFlow(transactions) {
  const byMonth = {}
  transactions.forEach(t => {
    const month = t.date.substring(0, 7)
    if (!byMonth[month]) byMonth[month] = { income: 0, expenses: 0 }
    if (t.amount < 0) byMonth[month].income += Math.abs(t.amount)
    else byMonth[month].expenses += t.amount
  })

  const months = Object.values(byMonth)
  if (!months.length) return { avgMonthlyIncome: 0, avgMonthlyExpenses: 0, avgMonthlySurplus: 0 }

  const avgIncome = months.reduce((s, m) => s + m.income, 0) / months.length
  const avgExpenses = months.reduce((s, m) => s + m.expenses, 0) / months.length

  return {
    avgMonthlyIncome: Math.round(avgIncome),
    avgMonthlyExpenses: Math.round(avgExpenses),
    avgMonthlySurplus: Math.round(avgIncome - avgExpenses),
    monthCount: months.length,
    byMonth
  }
}

function detectIncome(transactions) {
  const PAYROLL_KEYWORDS = ['payroll', 'direct dep', 'salary', 'wages', 'deposit']
  const incomeItems = transactions.filter(t =>
    t.amount < 0 && (
      PAYROLL_KEYWORDS.some(kw => (t.name || '').toLowerCase().includes(kw)) ||
      Math.abs(t.amount) > 800
    )
  )
  const total = incomeItems.reduce((s, t) => s + Math.abs(t.amount), 0)
  const months = new Set(incomeItems.map(t => t.date.substring(0, 7))).size || 1
  return {
    estimatedMonthlyGross: Math.round(total / months),
    sources: incomeItems.slice(0, 5).map(t => ({
      name: t.name,
      amount: Math.abs(t.amount),
      date: t.date
    }))
  }
}

// Key function: preserve actual merchant names with totals
function buildMerchantBreakdown(transactions) {
  const merchants = {}
  transactions
    .filter(t => t.amount > 0 && !t.pending)
    .forEach(t => {
      // Use merchant_name if available, fall back to cleaned transaction name
      const name = t.merchant_name || t.name || 'Unknown'
      if (!merchants[name]) {
        merchants[name] = {
          name,
          totalSpent: 0,
          transactionCount: 0,
          category: t.personal_finance_category?.primary || t.category?.[0] || 'Other',
          subcategory: t.personal_finance_category?.detailed || null,
          lastSeen: t.date,
          amounts: []
        }
      }
      merchants[name].totalSpent += t.amount
      merchants[name].transactionCount++
      merchants[name].amounts.push(t.amount)
      if (t.date > merchants[name].lastSeen) merchants[name].lastSeen = t.date
    })

  const sorted = Object.values(merchants)
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .map(m => ({
      name: m.name,
      totalSpent: Math.round(m.totalSpent),
      monthlyAvg: Math.round(m.totalSpent / Math.max(1, getMonthSpan(transactions))),
      transactionCount: m.transactionCount,
      category: m.category,
      subcategory: m.subcategory,
      // Flag potential subscriptions (consistent small amounts)
      looksLikeSubscription: m.transactionCount >= 2 && m.amounts.every(a => Math.abs(a - m.amounts[0]) < 2)
    }))

  return {
    top20: sorted.slice(0, 20),
    all: sorted
  }
}

// Detect recurring subscription-style charges
function detectSubscriptions(transactions) {
  const byMerchant = {}
  transactions
    .filter(t => t.amount > 0 && t.amount < 100) // subscriptions are usually small
    .forEach(t => {
      const name = t.merchant_name || t.name || 'Unknown'
      if (!byMerchant[name]) byMerchant[name] = []
      byMerchant[name].push({ amount: t.amount, date: t.date })
    })

  const subscriptions = Object.entries(byMerchant)
    .filter(([, txs]) => {
      if (txs.length < 2) return false
      const amounts = txs.map(t => t.amount)
      // All charges within $1 of each other = subscription
      const avg = amounts.reduce((s, a) => s + a, 0) / amounts.length
      return amounts.every(a => Math.abs(a - avg) < 1.50)
    })
    .map(([name, txs]) => ({
      name,
      monthlyAmount: txs[0].amount,
      annualAmount: Math.round(txs[0].amount * 12),
      occurrences: txs.length,
      lastCharge: txs.sort((a, b) => b.date.localeCompare(a.date))[0].date
    }))
    .sort((a, b) => b.monthlyAmount - a.monthlyAmount)

  return subscriptions
}

function categorizeSpending(transactions) {
  const categories = {}
  transactions
    .filter(t => t.amount > 0)
    .forEach(t => {
      const cat = t.personal_finance_category?.primary || t.category?.[0] || 'Other'
      categories[cat] = (categories[cat] || 0) + t.amount
    })

  return Object.entries(categories)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, amount]) => ({ name, amount: Math.round(amount) }))
}

function analyzeDebt(accounts) {
  const debtAccounts = accounts.filter(a => ['credit', 'loan'].includes(a.type))
  const totalDebt = debtAccounts.reduce((s, a) => s + Math.abs(a.balances.current || 0), 0)
  return {
    hasDebt: totalDebt > 0,
    totalDebt: Math.round(totalDebt),
    accounts: debtAccounts.map(a => ({
      name: a.name,
      balance: Math.abs(a.balances.current || 0),
      limit: a.balances.limit
    }))
  }
}

function scoreQuality(accounts, transactions) {
  const monthSpan = getMonthSpan(transactions)
  return {
    overall: transactions.length > 60 ? 'high' : transactions.length > 20 ? 'medium' : 'low',
    accountCount: accounts.length,
    transactionCount: transactions.length,
    monthsOfData: monthSpan,
    notes: [
      accounts.length < 2 ? 'Only one account connected' : null,
      transactions.length < 30 ? 'Limited transaction history' : null,
      monthSpan < 3 ? 'Less than 3 months of data' : null
    ].filter(Boolean)
  }
}

function getMonthSpan(transactions) {
  if (!transactions.length) return 1
  const dates = transactions.map(t => t.date).sort()
  const start = new Date(dates[0])
  const end = new Date(dates[dates.length - 1])
  return Math.max(1, Math.round((end - start) / (30 * 24 * 60 * 60 * 1000)))
}
