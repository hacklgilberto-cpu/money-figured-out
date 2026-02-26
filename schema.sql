-- ============================================
-- YOUR MONEY, FIGURED OUT — Database Schema
-- Run this in: Supabase → SQL Editor → New query
-- ============================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT UNIQUE NOT NULL,
  password    TEXT NOT NULL,
  province    TEXT DEFAULT 'ON',
  birth_year  INT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Plaid connections (one row per connected bank)
CREATE TABLE IF NOT EXISTS plaid_items (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID REFERENCES users(id) ON DELETE CASCADE,
  access_token      TEXT NOT NULL,
  item_id           TEXT NOT NULL UNIQUE,
  institution_name  TEXT,
  last_synced_at    TIMESTAMPTZ DEFAULT now(),
  created_at        TIMESTAMPTZ DEFAULT now(),
  revoked_at        TIMESTAMPTZ
);

-- Roadmaps (each Claude analysis, stored as JSON)
CREATE TABLE IF NOT EXISTS roadmaps (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  analysis    JSONB NOT NULL,
  is_current  BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Tasks (the to-do list generated from roadmap)
CREATE TABLE IF NOT EXISTS tasks (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID REFERENCES users(id) ON DELETE CASCADE,
  roadmap_id        UUID REFERENCES roadmaps(id) ON DELETE CASCADE,
  rank              INT NOT NULL,
  action            TEXT NOT NULL,
  math              TEXT,
  time_to_complete  TEXT,
  annual_impact     NUMERIC DEFAULT 0,
  completed         BOOLEAN DEFAULT false,
  completed_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT now()
);

-- Net worth history (for trend chart on dashboard)
CREATE TABLE IF NOT EXISTS net_worth_snapshots (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES users(id) ON DELETE CASCADE,
  net_worth     NUMERIC NOT NULL,
  assets        NUMERIC NOT NULL,
  liabilities   NUMERIC NOT NULL,
  snapshot_date DATE DEFAULT CURRENT_DATE,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_plaid_items_user_id ON plaid_items(user_id);
CREATE INDEX IF NOT EXISTS idx_roadmaps_user_id ON roadmaps(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_user_id ON net_worth_snapshots(user_id);

-- Done!
SELECT 'Schema created successfully' as status;
