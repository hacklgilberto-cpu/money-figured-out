-- ============================================
-- YOUR MONEY, FIGURED OUT — Database Schema
-- Run this in: Supabase → SQL Editor → New query
-- ============================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT UNIQUE NOT NULL,
  password    TEXT NOT NULL,
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

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_plaid_items_user_id ON plaid_items(user_id);
CREATE INDEX IF NOT EXISTS idx_roadmaps_user_id ON roadmaps(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);

-- Done!
SELECT 'Schema created successfully' as status;
