# Your Money, Figured Out

> AI-powered financial planning for Canadians. Built as a submission for WealthSimple - AI Specialist.

**Live demo:** [your-vercel-url.vercel.app]

## What it does
Connects to your bank via Plaid, runs your real transactions through Claude, 
and delivers a ranked financial action plan with exact dollar impact per action — 
in under 60 seconds. Supports English and French.

## Setup 1
1. Clone the repo
2. Copy `.env.local.example` to `.env.local` and fill in your keys
3. Run `npm install && npm run dev`

## Keys needed
- `ANTHROPIC_API_KEY` — claude.ai
- `PLAID_CLIENT_ID` + `PLAID_SECRET` — plaid.com (Sandbox free)
- `DATABASE_URL` — Supabase
- `NEXTAUTH_SECRET` — any random string

## Setup 2

### 1. Install dependencies
```bash
npm install
```

### 2. Set up environment variables
Copy `.env.local.example` to `.env.local` and fill in your keys.

### 3. Set up the database
In Supabase → SQL Editor, run the contents of `schema.sql`.

### 4. Run the dev server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Stack
- **Next.js 14** — framework
- **NextAuth.js** — authentication
- **Plaid** — bank connections
- **Claude API (Anthropic)** — financial analysis
- **PostgreSQL (Supabase)** — database
- **Puppeteer** — PDF generation
