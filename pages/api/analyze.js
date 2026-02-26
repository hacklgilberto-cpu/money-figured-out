import { plaidClient } from '../../lib/plaid'
import { buildFinancialProfile } from '../../lib/financial-profile'
import { generateFinancialAnalysis } from '../../lib/claude-analysis'
import { db } from '../../lib/db'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  // Support single public_token (legacy) or array of public_tokens (multi-account)
  const { public_token, public_tokens, userInputs } = req.body
  const tokens = public_tokens || (public_token ? [public_token] : [])
  if (!tokens.length) return res.status(400).json({ error: 'No bank accounts connected' })

  try {
    // Step 1: Exchange all tokens and build merged profile
    const profiles = []
    const itemIds = []
    for (const pt of tokens) {
      const exchangeRes = await plaidClient.itemPublicTokenExchange({ public_token: pt })
      const accessToken = exchangeRes.data.access_token
      itemIds.push(exchangeRes.data.item_id)
      const profile = await buildFinancialProfile(plaidClient, accessToken)
      profiles.push(profile)
    }

    // Merge multiple profiles into one (simple: sum transactions, combine accounts)
    const financialProfile = profiles.length === 1 ? profiles[0] : mergeProfiles(profiles)
    const itemId = itemIds[0]

    // Step 3: Run Claude analysis (retry on overload)
    let analysis
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        analysis = await generateFinancialAnalysis(financialProfile, userInputs)
        break
      } catch (err) {
        if (attempt === 3 || !String(err.message).includes('overload')) throw err
        await new Promise(r => setTimeout(r, attempt * 8000))
      }
    }

    // Step 4: Save roadmap to DB (user_id NULL until they sign up — "claimed" on signup)
    const roadmapResult = await db.query(
      'INSERT INTO roadmaps (user_id, analysis, is_current) VALUES (NULL, $1, true) RETURNING id',
      [JSON.stringify(analysis)]
    )
    const roadmapId = roadmapResult.rows[0].id

    // Step 5: Save tasks
    for (const action of analysis.priorityActions) {
      await db.query(
        `INSERT INTO tasks (user_id, roadmap_id, rank, action, math, time_to_complete, annual_impact)
         VALUES (NULL, $1, $2, $3, $4, $5, $6)`,
        [roadmapId, action.rank, action.action, action.math, action.timeToComplete, action.annualImpact]
      )
    }

    // Step 5b: Save raw transactions — log first transaction so we can see Plaid structure
    const rawTxns = financialProfile.rawTransactions || []
    console.log('[Plaid] Transaction count:', rawTxns.length)
    if (rawTxns.length > 0) {
      console.log('[Plaid] Sample transaction:', JSON.stringify(rawTxns[0], null, 2))
    }

    if (rawTxns.length) {
      const accountMap = {}
      financialProfile.accounts?.forEach(a => { accountMap[a.account_id] = a })
      let saved = 0, failed = 0
      for (const t of rawTxns) {
        const acct = accountMap[t.account_id] || {}
        try {
          await db.query(
            `INSERT INTO transactions
               (roadmap_id, plaid_item_id, transaction_id, account_id, account_name,
                account_type, account_subtype, date, name, merchant_name, amount,
                currency, category_primary, category_detailed, payment_channel, pending)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
             ON CONFLICT (transaction_id) DO NOTHING`,
            [
              roadmapId, itemId, t.transaction_id, t.account_id,
              acct.name || null, acct.type || null, acct.subtype || null,
              t.date, t.name, t.merchant_name || null, t.amount,
              t.iso_currency_code || 'CAD',
              t.personal_finance_category?.primary || null,
              t.personal_finance_category?.detailed || null,
              t.payment_channel || null, t.pending || false
            ]
          )
          saved++
        } catch (err) {
          failed++
          if (failed === 1) console.error('[DB] First transaction insert error:', err.message)
        }
      }
      console.log(`[DB] Transactions: ${saved} saved, ${failed} failed`)
    }

    res.json({ roadmapId, analysis })

  } catch (error) {
    console.error('Analysis pipeline error:', error)
    res.status(500).json({
      error: 'Analysis failed',
      detail: process.env.NODE_ENV === 'development' ? error.message : 'Please try again'
    })
  }
}

// Merge multiple financial profiles (for multi-account support)
function mergeProfiles(profiles) {
  const base = profiles[0]
  const allTransactions = profiles.flatMap(p => p.rawTransactions || [])
  const allAccounts = profiles.flatMap(p => p.accounts || [])

  // Re-run snapshot across all accounts
  const totalAssets = profiles.reduce((s, p) => s + (p.snapshot?.totalAssets || 0), 0)
  const totalLiabilities = profiles.reduce((s, p) => s + (p.snapshot?.totalLiabilities || 0), 0)

  // Merge income estimates (take highest, likely most complete)
  const maxIncome = Math.max(...profiles.map(p => p.cashFlow?.avgMonthlyIncome || 0))
  const totalExpenses = profiles.reduce((s, p) => s + (p.cashFlow?.avgMonthlyExpenses || 0), 0)

  return {
    ...base,
    snapshot: { ...base.snapshot, totalAssets, totalLiabilities, netWorth: totalAssets - totalLiabilities },
    cashFlow: { ...base.cashFlow, avgMonthlyIncome: maxIncome, avgMonthlyExpenses: totalExpenses, avgMonthlySurplus: maxIncome - totalExpenses },
    rawTransactions: allTransactions,
    accounts: allAccounts,
    dataQuality: {
      ...base.dataQuality,
      accountCount: allAccounts.length,
      transactionCount: allTransactions.length,
      notes: [`${profiles.length} accounts connected`, ...base.dataQuality?.notes || []]
    }
  }
}
