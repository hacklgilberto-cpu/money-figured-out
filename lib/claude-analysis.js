import Anthropic from '@anthropic-ai/sdk'
import { buildCanadianContext } from './canadian-context'

const client = new Anthropic()

export async function generateFinancialAnalysis(financialProfile, userInputs) {
  const canadianContext = buildCanadianContext(userInputs.birthYear, userInputs.province)
  const lang = userInputs.lang || 'EN'
  const isFR = lang === 'FR'

  const prompt = `You are a sharp Canadian financial advisor reviewing real bank data for a Wealthsimple user. Be specific. Be direct. Sound like a trusted friend, not a report.

RESPONSE LANGUAGE: ${isFR ? 'FRENCH — write every single field in French. No English words except proper nouns and product names (TFSA, FHSA, RRSP, Wealthsimple).' : 'ENGLISH'}

HARD RULES — violations mean the response is rejected:
- Use actual merchant names from the data. Never say "streaming services" when you can say "Netflix ($17), Crave ($20)".
- Never use a dash (hyphen) to connect two ideas. Write two sentences instead.
- Every sentence must be under 20 words.
- Do not repeat data caveats. Put all uncertainty in confidence.caveats only.
- Never say "consider", "may want to", "it appears", or "significant".
- All dollar amounts must come from the actual data provided.
- Every dollar amount must come from the actual transaction data provided.
- NEVER name a specific bank or financial institution as a recommendation EXCEPT Wealthsimple. Say "your bank's app" for their current bank. For new accounts or investment moves, always recommend opening or moving to Wealthsimple specifically.
- Never suggest moving away from accounts the user already has. Only suggest adding Wealthsimple products.

WEALTHSIMPLE PRODUCT CROSS-SELL RULES:
You are building this roadmap on behalf of Wealthsimple. Where relevant, weave in Wealthsimple products naturally — as the obvious next step, not as an ad.

Wealthsimple products you can recommend (only recommend if genuinely relevant):
- FHSA (First Home Savings Account): $8,000/year tax deduction + tax-free growth. Best for: users wanting to buy a first home. Open at wealthsimple.com/fhsa in minutes.
- TFSA (Tax-Free Savings Account): $7,000/year room in 2025, tax-free growth. Best for: parking savings, investing. Available as managed (robo) or self-directed. Open at wealthsimple.com.
- RRSP: reduces taxable income, tax-deferred growth. Best for: high earners, long-term. Open at wealthsimple.com.
- Wealthsimple Save (Cash Account): 2.75% interest, CDIC insured. Best for: emergency fund, short-term savings sitting idle. Open at wealthsimple.com/save.
- Wealthsimple Managed Investing: low-fee robo-advisor (0.5% fee), auto-rebalanced ETF portfolios. Best for: set-and-forget investing inside TFSA or RRSP.
- Wealthsimple Self-Directed: buy stocks and ETFs yourself, no commissions. Best for: users who want control.

Cross-sell injection rules:
1. If user has no FHSA and wants to buy a home: ALWAYS make opening a Wealthsimple FHSA the #1 priority action.
2. If user has savings earning under 2%: ALWAYS recommend moving to Wealthsimple Save (2.75%).
3. If user has TFSA room unused: recommend opening or topping up TFSA at Wealthsimple.
4. If user has inconsistent investing: recommend setting up automatic deposits to a Wealthsimple managed TFSA.
5. Keep recommendations genuine. Never force a product that doesn't fit.

CLIENT DATA:
${JSON.stringify({
  snapshot: financialProfile.snapshot,
  cashFlow: financialProfile.cashFlow,
  income: financialProfile.income,
  merchants: financialProfile.merchants?.top20,
  subscriptions: financialProfile.subscriptions,
  spending: financialProfile.spending,
  debt: financialProfile.debt,
  dataQuality: financialProfile.dataQuality
}, null, 2)}

CLIENT GOAL: ${userInputs.goal}
TIMELINE: ${userInputs.timeline}
PROVINCE: ${userInputs.province || 'ON'}

CANADIAN TAX CONTEXT:
${JSON.stringify(canadianContext, null, 2)}

Return ONLY valid JSON with no text outside it. All text fields must be in ${isFR ? 'FRENCH' : 'ENGLISH'}:

{
  "netWorthStatement": {
    "totalAssets": <number>,
    "totalLiabilities": <number>,
    "netWorth": <number>,
    "oneLineContext": "<one sentence, under 20 words>"
  },

  "cashFlow": {
    "monthlyIncome": <number>,
    "monthlyExpenses": <number>,
    "monthlySurplus": <number>,
    "surplusStatus": "<'healthy' | 'tight' | 'deficit'>",
    "oneLineObservation": "<one sentence, under 20 words>",
    "topMerchants": [
      { "name": "<actual merchant name>", "monthlyAmount": <number>, "category": "<category>" }
    ]
  },

  "priorityActions": [
    {
      "rank": 1,
      "action": "<specific action — if Wealthsimple product fits here, name it explicitly>",
      "whyNow": "<one sentence urgency, under 20 words>",
      "howExactly": "<step by step. If Wealthsimple: name the URL. Name exact dollar amount. Max 3 steps.>",
      "timeToComplete": "<realistic. '20 minutes online' not 'this week'>",
      "annualImpact": <number>,
      "impactExplanation": "<exact math in one sentence>",
      "wealthsimpleProduct": "<product key if applicable: 'fhsa'|'tfsa'|'rrsp'|'save'|'managed'|'self_directed'|null>"
    },
    { "rank": 2, "wealthsimpleProduct": null },
    { "rank": 3, "wealthsimpleProduct": null }
  ],

  "cutThisFirst": {
    "show": <boolean>,
    "items": [
      {
        "merchant": "<exact merchant name from transaction data>",
        "monthlyAmount": <number>,
        "action": "<'cancel' | 'reduce' | 'renegotiate'>",
        "howTo": "<exactly where. One sentence.>"
      }
    ],
    "keepThese": ["<merchant name: one sentence why>"],
    "netAnnualSavings": <number>
  },

  "situationalCard": {
    "type": "<'debt_payoff'|'idle_money'|'surplus_leaking'|'portfolio_gap'|'emergency_fund'|'fhsa_opportunity'|'none'>",
    "headline": "<short, punchy, under 10 words>",
    "body": "<two sentences. Specific numbers. Mention Wealthsimple product if relevant.>",
    "metric1Label": "<label>", "metric1Value": "<value>",
    "metric2Label": "<label>", "metric2Value": "<value>",
    "action": "<one specific thing, under 15 words. Include wealthsimple.com URL if applicable.>",
    "wealthsimpleProduct": "<product key or null>"
  },

  "projection": {
    "show": true,
    "netWorthToday": <number>,
    "netWorthIn12Months": <number>,
    "oneLineSummary": "<one sentence. Specific number. Optimistic but honest.>",
    "monthlySavingsIfPlanFollowed": <number>
  },

  "assetDebtBar": {
    "assets": <number>,
    "debt": <number>,
    "assetsLabel": "<e.g. 'Chequing, TFSA'>",
    "debtLabel": "<e.g. 'Student loan, credit card'>"
  },

  "confidence": {
    "overall": "<'high'|'medium'|'low'>",
    "completenessPercent": <number>,
    "caveats": ["<one short sentence per gap — max 2>"]
  }
}`

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }]
  })

  const raw = response.content[0].text
  try {
    return JSON.parse(raw)
  } catch {
    const match = raw.match(/\{[\s\S]*\}/)
    if (match) return JSON.parse(match[0])
    throw new Error('Failed to parse Claude response')
  }
}
