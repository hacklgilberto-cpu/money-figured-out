import { buildSofiaProfile } from '../../lib/demo-persona'
import { generateFinancialAnalysis } from '../../lib/claude-analysis'
import { db } from '../../lib/db'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  try {
    const { province = 'ON', lang = 'EN' } = req.body || {}
    const financialProfile = buildSofiaProfile(province)

    const userInputs = {
      goal: lang === 'FR' ? 'Économiser pour une maison' : 'Save for a home',
      timeline: '1–3 years',
      province,
      lang
    }

    // Real Claude analysis on fake-but-realistic data
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

    // Save roadmap
    const roadmapResult = await db.query(
      'INSERT INTO roadmaps (user_id, analysis, is_current) VALUES (NULL, $1, true) RETURNING id',
      [JSON.stringify({ ...analysis, isDemo: true })]
    )
    const roadmapId = roadmapResult.rows[0].id

    // Save tasks (same as analyze.js — needed so signup can claim them)
    for (const action of (analysis.priorityActions || [])) {
      await db.query(
        `INSERT INTO tasks (user_id, roadmap_id, rank, action, math, time_to_complete, annual_impact)
         VALUES (NULL, $1, $2, $3, $4, $5, $6)`,
        [roadmapId, action.rank, action.action, action.impactExplanation || null, action.timeToComplete, action.annualImpact]
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
            t.iso_currency_code || 'CAD',
            t.personal_finance_category?.primary || null,
            t.personal_finance_category?.detailed || null,
            t.payment_channel || null, t.pending || false
          ]
        )
      } catch (_) {}
    }

    res.json({ roadmapId, analysis, isDemo: true })

  } catch (error) {
    console.error('Demo analysis error:', error)
    res.status(500).json({
      error: 'Demo failed',
      detail: process.env.NODE_ENV === 'development' ? error.message : 'Please try again'
    })
  }
}
