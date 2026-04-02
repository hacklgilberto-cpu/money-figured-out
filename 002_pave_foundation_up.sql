-- =============================================================
-- Migration: Pave Cashflow Foundation
-- Version:   002
-- Run order: after 001_credit_health_up.sql
-- Tables:    recurring_sets, income_predictions,
--            fee_events, balance_snapshots
-- =============================================================

BEGIN;

-- =============================================================
-- TABLE 1: recurring_sets
-- One row per user per merchant per type (expense | income | ritual).
-- Updated nightly by pave-sync cron via unified_insights.
-- =============================================================

CREATE TABLE IF NOT EXISTS recurring_sets (
  id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  synced_date   DATE          NOT NULL,
  set_type      TEXT          NOT NULL CHECK (set_type IN ('expense', 'income', 'ritual')),
  merchant_name TEXT          NOT NULL,
  frequency     TEXT,                          -- weekly, biweekly, monthly, etc.
  amount        NUMERIC(10,2),                 -- typical charge/deposit amount
  category      TEXT,
  raw_json      JSONB,
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_recurring_sets_user_merchant_type
    UNIQUE (user_id, merchant_name, set_type)
);

CREATE INDEX IF NOT EXISTS idx_recurring_sets_user_id
  ON recurring_sets (user_id);

CREATE INDEX IF NOT EXISTS idx_recurring_sets_synced_date
  ON recurring_sets (user_id, synced_date);

-- =============================================================
-- TABLE 2: income_predictions
-- One row per user per sync date.
-- Stores deposit_amount_required + predicted next paydate.
-- =============================================================

CREATE TABLE IF NOT EXISTS income_predictions (
  id                       UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  synced_date              DATE          NOT NULL,
  deposit_amount_required  NUMERIC(10,2),       -- $ needed before next payday
  next_paydate             DATE,
  raw_json                 JSONB,
  created_at               TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_income_predictions_user_date
    UNIQUE (user_id, synced_date)
);

CREATE INDEX IF NOT EXISTS idx_income_predictions_user_id
  ON income_predictions (user_id);

-- =============================================================
-- TABLE 3: fee_events
-- One row per user per date per merchant.
-- Populated from unified_insights.financial_health.detailed_summary.
-- =============================================================

CREATE TABLE IF NOT EXISTS fee_events (
  id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_date    DATE          NOT NULL,
  merchant_name TEXT          NOT NULL,
  amount        NUMERIC(10,2),
  fee_type      TEXT          DEFAULT 'ritual', -- ritual | overdraft | late | etc.
  raw_json      JSONB,
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_fee_events_user_date_type
    UNIQUE (user_id, event_date, fee_type)
);

CREATE INDEX IF NOT EXISTS idx_fee_events_user_id
  ON fee_events (user_id);

CREATE INDEX IF NOT EXISTS idx_fee_events_event_date
  ON fee_events (user_id, event_date DESC);

-- =============================================================
-- TABLE 4: balance_snapshots
-- One row per user per date.
-- Stores Pave's projected end-of-day balances (14-day horizon).
-- Upserted nightly; is_projected flips to false when date passes
-- and actual balance could be reconciled (Phase 3+).
-- =============================================================

CREATE TABLE IF NOT EXISTS balance_snapshots (
  id                UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  snapshot_date     DATE          NOT NULL,
  projected_balance NUMERIC(10,2),
  is_projected      BOOLEAN       NOT NULL DEFAULT TRUE,
  raw_json          JSONB,
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_balance_snapshots_user_date
    UNIQUE (user_id, snapshot_date)
);

CREATE INDEX IF NOT EXISTS idx_balance_snapshots_user_id
  ON balance_snapshots (user_id);

CREATE INDEX IF NOT EXISTS idx_balance_snapshots_date
  ON balance_snapshots (user_id, snapshot_date DESC);

COMMIT;

SELECT 'Pave foundation tables created' AS status;
