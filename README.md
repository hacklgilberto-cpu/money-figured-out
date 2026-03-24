# Your Money, Figured Out

> A paycheck-to-paycheck survival tool and AI financial coach — powered by Plaid, Pave, and Claude.

**Live app:** [ai-pfm.vercel.app](https://ai-pfm.vercel.app)

---

## What this is

Most personal finance apps are built for people who want to optimize. This one is built for people who need to survive until Friday.

The customer we're designing for came in because they needed a $50 advance. They're on a biweekly pay cycle. They're not thinking about net worth — they're thinking about whether they can cover the T-Mobile bill that hits in four days. This app has to work for that person first.

**The organizing question:** *Can I make it to my next paycheck — and what do I do right now if the answer is no?*

---

## What it does today

- Connects to your bank via Plaid
- Runs your transactions through Claude (Anthropic) and generates a ranked savings roadmap with exact dollar impact per action
- Surfaces a financial health score and situational action cards
- Tracks your VantageScore 3.0 credit score over time (`/credit-health`)
- English and Spanish bilingual support

---

## Phases

### ✅ Phase 0 — Foundation stable
Plaid pipeline solid, Canadian context removed, `CountryCode.Us` set, `/api/analyze` 400 fixed.

### ✅ Phase 1 — Credit health merged
`clarityService.js`, `creditPullJob.js` ported to `lib/`. DB migration (`001_credit_health_up.sql`) run. Credit UI live at `/credit-health`. `credit-health` repo archived.

## What's being built next

### Phase 2 — Pave integration
We currently use Pave only for credit risk scoring at onboarding. The expansion unlocks:

- **Recurring Expenditures** — every bill and subscription with predicted next date and predicted next amount
- **Deposit Amount Required** — exactly how much to put in to avoid an overdraft in the next N days
- **Recurring Income / Inflows** — predicted paycheck date and expected amount
- **Financial Health** — overdraft, NSF, and ATM fee patterns over the last 90 days
- **End-of-Day Balances** — day-by-day cashflow projection
- **Ritual Expenses** — habitual spend patterns (delivery apps, subscriptions) for habit coaching
- **Unified Insights** — single endpoint for the full dashboard pull

All Pave data is pulled on a nightly cron and cached to Supabase. The UI is never hitting Pave directly on page load.

### Phase 3 — The 14-day map (core product)
80% of users are on a biweekly pay cycle. The entire product is organized around a single view:

- Today's balance
- Every bill hitting before the next paycheck, with predicted amounts
- Predicted paycheck date and amount
- Day-by-day projected balance
- The exact deposit needed to stay safe (Pave's Deposit Amount Required endpoint)
- Fee history — what the user has paid in avoidable fees in the last 90 days

### Phase 4 — AI assistant upgrade
The assistant gets Claude Sonnet with full cashflow context injected into every conversation:

- Current balance, days to payday, upcoming bills total, recent fees
- A computed cashflow mode (RED / ORANGE / YELLOW / GREEN / BLUE) that shifts the assistant's tone and available playbooks
- Survival playbooks for when money doesn't appear on a tree: bill triage, government benefits (SNAP, LIHEAP, WIC, emergency rental), hardship programs surfaced against real billers in the user's transaction history, fast cash options, and food resources
- When the user is stable (GREEN/BLUE), the assistant shifts to habit building and credit path coaching

### Phase 5 — Credit path integration
- VantageScore surfaced on the main dashboard (de-emphasized in RED/ORANGE mode — survival first)
- Behavior-to-score connections: "Paying this bill on time adds payment history. You're ~60 days from a meaningful bump."
- 30/60/90 day score trend
- Price increase alerts from Pave's `delta_percent` field on recurring sets

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
| AI | Anthropic Claude (Sonnet for roadmap + chat, Haiku for lightweight ops) |
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
1. `schema.sql` — core tables (users, accounts, transactions, roadmaps)
2. `001_credit_health_up.sql` — credit monitoring tables

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Known architecture rules

- **Vercel timeout:** AI-heavy endpoints need `export const maxDuration = 60` or they'll cut off mid-response
- **Supabase + Vercel:** Always use the pooler URL (`db.xxx.supabase.co:6543`), never the direct URL on port 5432
- **Pave caching:** Never hit Pave on page load. Pull nightly via Vercel cron, serve from Supabase
- **Copy rules:** No net worth language, no dashes connecting ideas, no negative financial framing. Tim Hortons for coffee comparisons (Canadian context). Streaming services listed with commas, not plus signs.

---

## Test persona

**Marcus Rivera** — used for sandbox testing across Plaid, Pave, and the AI flows.

---

## Repo history

This repo absorbs `hacklgilberto-cpu/credit-health`, which is now archived. The credit monitoring backend logic (JS services + SQL migration) lives here. The original Flutter UI was rebuilt in Next.js.
