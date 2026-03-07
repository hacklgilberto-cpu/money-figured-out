import { buildMarcusProfile } from '../../lib/demo-persona'
import { generateFinancialAnalysis } from '../../lib/claude-analysis'
import { db } from '../../lib/db'

export const maxDuration = 60

async function withRetry(fn) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try { return await fn() } catch (err) {
      if (attempt === 3 || !String(err.message).includes('overload')) throw err
      await new Promise(r => setTimeout(r, attempt * 8000))
    }
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  try {
    const {
      state = 'FL',
      payFrequency = 'biweekly',
      daysToPayday = '5',
    } = req.body || {}

    const financialProfile = buildMarcusProfile(state)

    const userInputs = {
      payFrequency,
      daysToPayday: parseInt(daysToPayday, 10) || 7,
      state,
    }

    // Generate both EN and ES analyses in parallel
    const [analysisEN, analysisES] = await Promise.all([
      withRetry(() => generateFinancialAnalysis(financialProfile, { ...userInputs, lang: 'EN' })),
      withRetry(() => generateFinancialAnalysis(financialProfile, { ...userInputs, lang: 'ES' })),
    ])
    const analysis = { en: analysisEN, es: analysisES, isDemo: true }

    // Save roadmap
    const roadmapResult = await db.query(
      `INSERT INTO roadmaps (user_id, analysis, pay_frequency, days_to_payday, is_current)
       VALUES (NULL, $1, $2, $3, true) RETURNING id`,
      [JSON.stringify(analysis), payFrequency, parseInt(daysToPayday, 10) || 7]
    )
    const roadmapId = roadmapResult.rows[0].id

    // Save tasks (always based on EN analysis)
    for (const action of (analysisEN.priorityActions || [])) {
      await db.query(
        `INSERT INTO tasks (user_id, roadmap_id, rank, action, how_exactly, time_to_complete, monthly_impact)
         VALUES (NULL, $1, $2, $3, $4, $5, $6)`,
        [
          roadmapId,
          action.rank,
          action.action,
          action.howExactly || null,
          action.timeToComplete || null,
          action.payPeriodImpact || 0,
        ]
      )
    }

    // Save transactions so demo data is visible in Supabase too
    const accountMap = {}
    financialProfile.accounts.forEach(a => { accountMap[a.account_id] = a })
    for (const t of financialProfile.rawTransactions) {
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
            roadmapId, 'demo', t.transaction_id, t.account_id,
            acct.name || null, acct.type || null, acct.subtype || null,
            t.date, t.name, t.merchant_name || null, t.amount,
            t.iso_currency_code || 'USD',
            t.personal_finance_category?.primary || null,
            t.personal_finance_category?.detailed || null,
            t.payment_channel || null, t.pending || false
          ]
        )
      } catch (_) {}
    }

    res.json({ roadmapId, analysis })

  } catch (error) {
    console.error('Demo analysis error:', error)
    res.status(500).json({
      error: 'Demo failed',
      detail: process.env.NODE_ENV === 'development' ? error.message : 'Please try again'
    })
  }
}
