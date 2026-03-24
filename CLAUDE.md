# Your Money, Figured Out — Claude Code context

## What this is
A survival-first personal finance app for paycheck-to-paycheck users. Not a
budgeting tool. The organizing question is always: "Can this user make it to
their next paycheck, and what do they do if the answer is no?"

Live at ai-pfm.vercel.app. Repo: hacklgilberto-cpu/money-figured-out.

## Stack
- Next.js 14, NextAuth, Plaid (Sandbox), Pave Cashflow API
- Anthropic Claude API (Sonnet for roadmap + chat, Haiku for lightweight ops)
- PostgreSQL via Supabase, Vercel deployment

## Commands
- Dev: `npm run dev`
- Build: `npm run build`
- DB: run migrations in Supabase SQL Editor in order (schema.sql first, then 001_credit_health_up.sql)

## Architecture rules — never break these
- Use Supabase Connection Pooler URL on port 6543, never port 5432 (fails in Vercel serverless)
- All Vercel AI endpoints need `export const maxDuration = 60`
- Never hit Pave directly from the UI — pull via nightly Vercel cron, cache to Supabase, serve from DB
- Quote `pages/roadmap/[id].js` in all bash commands to avoid glob expansion
- Prefer complete file replacements over partial diffs when editing

## Current phase: Phase 2 (next up)

## Completed phases
- Phase 0 ✅ — /api/analyze 400 fixed, canadian-context.js deleted, CountryCode.Us set. Pending: full smoke test (auth → Plaid link → /api/analyze → roadmap with Marcus Rivera)
- Phase 1 ✅ — clarityService.js + creditPullJob.js ported to lib/, 001_credit_health_up.sql run, credit UI live at /credit-health. Pending: archive hacklgilberto-cpu/credit-health repo on GitHub

## Roadmap (sequential — each gate must pass before next phase)
- Phase 2: Pave foundation — lib/paveService.js wrapper, DB tables (recurring_sets, income_predictions, fee_events, balance_snapshots), nightly Vercel cron sync
- Phase 3: 14-day cashflow map — core dashboard, deposit widget, upcoming bills list, alert engine v1, fee history panel
- Phase 4: AI assistant upgrade — cashflow context injection, RED/ORANGE/YELLOW/GREEN/BLUE mode detection, survival playbooks
- Phase 5: Credit path — VantageScore in dashboard, score history chart, price-increase alerts

## Test persona
Marcus Rivera — use for all sandbox testing across Plaid, Pave, and AI flows.

## Product copy rules
- No net worth language
- No negative financial framing
- No dashes connecting ideas in copy
- Delivery apps grouped as a single line item
- Streaming services listed with commas, not plus signs
- Tim Hortons for coffee comparisons (Canadian audience context)

## Cashflow modes (core product concept)
The AI assistant reads the user's current financial state and shifts posture:
- RED: near zero balance, bills in 1-3 days, paycheck 7+ days out → emergency triage only
- ORANGE: tight, some bills coming, thin buffer → prevention
- YELLOW: okay but patterns concerning → optimization
- GREEN: stable → habit building
- BLUE: healthy → growth

The assistant always knows the user's cashflow mode before responding.
