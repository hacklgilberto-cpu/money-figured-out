# Your Money, Figured Out

> A paycheck-to-paycheck survival tool and AI financial coach — powered by Plaid, Pave, and Claude.

**Live app:** [ai-pfm.vercel.app](https://ai-pfm.vercel.app)

---

## What this is

Most personal finance apps are built for people who want to optimize. This one is built for people who need to survive until Friday.

The customer we're designing for came in because they needed a $50 advance. They're on a biweekly pay cycle. They're not thinking about net worth — they're thinking about whether they can cover the T-Mobile bill that hits in four days. This app has to work for that person first.

**The organizing question:** *Can I make it to my next paycheck — and what do I do right now if the answer is no?*

---

## What's built today

### Demo dashboard (`/demo-dashboard`)

A fully realized one-screen product using Marcus Rivera's sandbox data:

- **Hero card** — balance, days to payday, survival verdict
- **14-day runway chart** — SVG projection with event markers (bills, paycheck)
- **Credit health gauge** — VantageScore 3.0 arc with reason codes
- **Spending breakdown** — income / essential / lifestyle segmentation with stacked bar
- **Quick wins accordion** — ranked actions with exact dollar impact per action
- **Safety net panel** — real biller hardship programs (AT&T, FPL, Wells Fargo, Capital One) with phone numbers and call scripts
- **Emergency resources** — Miami-Dade specific assistance programs
- **AI chat panel** — live Sonnet chat hitting `/api/chat` with full cashflow context

### AI chat (`pages/api/chat.js`) — Phase 4 complete

- Full `MODE_TONE` object — assistant posture shifts by RED / ORANGE / YELLOW / GREEN / BLUE cashflow mode
- Cashflow context injected into every system prompt (balance, days to payday, upcoming bills total, recent fees)
- `matchPlaybooks()` pulls survival playbooks from `playbook_cards` table in Supabase, matched against the user's actual billers with merchant name normalization

### Pave foundation — Phase 2 complete

- `lib/paveService.js` wraps recurring expenditures, end-of-day balances, and financial health endpoints
- `pages/api/cron/pave-sync.js` — nightly cron job registered in `vercel.json`
- DB tables: `recurring_sets`, `income_predictions`, `fee_events`, `balance_snapshots` (migration `002_pave_foundation_up.sql`)
- Seed scripts for loading test data against Marcus Rivera

### Survival playbook infrastructure

- `lib/playbooks.js` — merchant name normalization with aliases, matches against user's actual billers
- `playbook_cards` and `user_forecasts` tables in Supabase (migration `003_playbooks_and_forecasts_up.sql`)

### Cashflow engine (`pages/cashflow.js`)

- `computeMode()` — ratio math against balance, days to payday, and upcoming bills to determine RED / ORANGE / YELLOW / GREEN / BLUE
- `build14DayMap()` — 14-day projection structure (stubbed balances, full data shape ready for Pave wire-up)

### Credit health (`/credit-health`)

- VantageScore 3.0 pulled via Clarity Services
- Score history chart
- `clarityService.js` and `creditPullJob.js` in `lib/`
- Nightly pull registered in `vercel.json` (`pages/api/cron/credit-pull.js`)

---

## Phases

### ✅ Phase 0 — Foundation stable
Plaid pipeline solid, Canadian context removed, `CountryCode.Us` set, `/api/analyze` 400 fixed.

### ✅ Phase 1 — Credit health
`clarityService.js` and `creditPullJob.js` in `lib/`. Migration `001_credit_health_up.sql` run. Credit UI live at `/credit-health`. `credit-health` repo archived.

### ✅ Phase 2 — Pave foundation
`lib/paveService.js`, four Supabase tables, nightly cron sync, seed scripts.

### ✅ Phase 3 — 14-day cashflow map
`computeMode()`, `build14DayMap()`, cashflow page, full demo dashboard with runway chart and event markers.

### ✅ Phase 4 — AI assistant upgrade
`MODE_TONE`, cashflow context injection, `matchPlaybooks()`, `playbook_cards` in DB, safety net panel with real hardship programs and call scripts.

### ✅ Phase 5 — Credit path
VantageScore gauge with reason codes in demo dashboard, score history infrastructure.

---

## Cashflow modes

The assistant reads the user's actual financial state and shifts accordingly.

| Mode | Signal | What the assistant does |
|------|--------|------------------------|
| RED | Balance near zero, bills in 1–3 days, paycheck 7+ days out | Triage only — emergency options, bill priority, assistance programs |
| ORANGE | Tight, bills coming, thin buffer | Prevention — move money, pause subs, prioritize |
| YELLOW | Okay but patterns concerning | Optimization — quick wins, flag price increases |
| GREEN | Stable | Habit building — emergency fund, credit path |
| BLUE | Genuinely healthy | Growth — reinforce habits, next level |

---

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 |
| Auth | NextAuth.js |
| Bank connectivity | Plaid (Sandbox) |
| Cashflow intelligence | Pave Cashflow API |
| AI | Anthropic Claude (Sonnet) |
| Credit monitoring | VantageScore 3.0 via Clarity Services |
| Database | PostgreSQL via Supabase |
| Deployment | Vercel |

---

## Setup

### 1. Clone and install

```bash
git clone https://github.com/hacklgilberto-cpu/money-figured-out
cd money-figured-out
npm install
```

### 2. Environment variables

Copy `.env.local.example` to `.env.local` and fill in:

```
ANTHROPIC_API_KEY=
PLAID_CLIENT_ID=
PLAID_SECRET=
PAVE_API_KEY=
CLARITY_API_KEY=
DATABASE_URL=           # Supabase pooler URL, port 6543
NEXTAUTH_SECRET=
NEXTAUTH_URL=
```

> **Important:** Use the Supabase Connection Pooler URL on port 6543, not the direct connection on port 5432. Direct connections fail in Vercel serverless functions.

### 3. Set up the database

In Supabase → SQL Editor, run in order:
1. `schema.sql` — core tables
2. `001_credit_health_up.sql` — credit monitoring tables
3. `002_pave_foundation_up.sql` — recurring sets, income predictions, fee events, balance snapshots
4. `003_playbooks_and_forecasts_up.sql` — playbook cards, user forecasts

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The demo dashboard is at [http://localhost:3000/demo-dashboard](http://localhost:3000/demo-dashboard).

---

## Architecture rules

- **Vercel timeout:** AI-heavy endpoints need `export const maxDuration = 60`
- **Supabase + Vercel:** Always use the pooler URL (`db.xxx.supabase.co:6543`), never port 5432
- **Pave caching:** Never hit Pave on page load — pull nightly via Vercel cron, serve from Supabase
- **Copy rules:** No net worth language, no dashes connecting ideas, no negative financial framing. Streaming services listed with commas, not plus signs. Delivery apps grouped as a single line item.

---

## Test persona

**Marcus Rivera** — used for all sandbox testing across Plaid, Pave, and the AI flows.

---

## Repo history

This repo absorbs `hacklgilberto-cpu/credit-health`, which is now archived. The credit monitoring backend logic (services + SQL migration) lives here. The original Flutter UI was rebuilt in Next.js.
