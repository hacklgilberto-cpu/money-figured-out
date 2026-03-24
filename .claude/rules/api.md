# API and backend rules

Applies to: `pages/api/**/*.js`, `lib/**/*.js`

## Plaid
- Use CountryCode.Us only — CountryCode.Ca is removed
- The onSuccess handler in the frontend must pass public_token to /api/plaid/exchange-token
- Sandbox credentials only until Phase 0 gate is confirmed passing

## Pave
- Never call Pave endpoints inline from API routes or UI
- All Pave calls happen in the nightly cron job only
- Cron reads from Pave, writes to Supabase, UI reads from Supabase
- Endpoints in use: recurring_expenditures, recurring_income, financial_health, deposit_amount_required, end_of_day_balances, unified_insights, ritual_expenses

## Supabase
- Always use the pooler connection string (port 6543)
- Never use the direct connection string (port 5432) — it times out in Vercel serverless
- DATABASE_URL in .env.local must be the pooler URL

## Claude API
- Roadmap generation: Sonnet
- Chat assistant: Sonnet (upgraded from Haiku in Phase 4)
- All AI endpoints: export const maxDuration = 60
- Cashflow context (balance, days to payday, upcoming bills total, recent fees, cashflow mode) must be injected into every chat system prompt from Phase 4 onward

## Vercel cron
- Nightly Pave sync job lives in pages/api/cron/pave-sync.js
- Nightly credit pull job lives in pages/api/cron/credit-pull.js
- Both must be registered in vercel.json under crons
