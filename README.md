# Your Money, Figured Out

A free financial planning portal that connects Canadian bank accounts via Plaid, analyzes real financial data with Claude AI, and produces a personalized roadmap with actionable tasks.

## Setup

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
