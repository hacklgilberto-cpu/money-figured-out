-- =============================================================
-- Migration: Playbook Cards + User Forecasts
-- Version:   003
-- Run order: after 002_pave_foundation_up.sql
-- Tables:    playbook_cards, user_forecasts
-- =============================================================

BEGIN;

-- =============================================================
-- TABLE 1: playbook_cards
-- One row per biller per state (or national).
-- Human-curated hardship programs, phone numbers, call scripts.
-- Matched to users via Pave/Plaid normalized merchant names.
-- =============================================================

CREATE TABLE IF NOT EXISTS playbook_cards (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  biller_name     TEXT          NOT NULL,
  biller_category TEXT          NOT NULL,
  state           TEXT          NOT NULL DEFAULT 'US',
  program_name    TEXT          NOT NULL,
  phone_number    TEXT,
  call_script     TEXT,
  eligibility     TEXT,
  what_it_offers  TEXT,
  protection_rule TEXT,
  source_url      TEXT,
  last_verified   DATE          NOT NULL DEFAULT CURRENT_DATE,
  issue_count     INT           NOT NULL DEFAULT 0,
  is_active       BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_playbook_biller_state
    UNIQUE (biller_name, state, program_name)
);

CREATE INDEX IF NOT EXISTS idx_playbook_biller_name
  ON playbook_cards (biller_name);

CREATE INDEX IF NOT EXISTS idx_playbook_category
  ON playbook_cards (biller_category);

CREATE INDEX IF NOT EXISTS idx_playbook_state
  ON playbook_cards (state);

-- =============================================================
-- TABLE 2: user_forecasts
-- One row per user per date. Computed nightly from Pave data.
-- Pure math, no AI. Powers the one-screen verdict.
-- =============================================================

CREATE TABLE IF NOT EXISTS user_forecasts (
  id                  UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  forecast_date       DATE          NOT NULL DEFAULT CURRENT_DATE,
  current_balance     NUMERIC(10,2),
  bills_next_14d      NUMERIC(10,2) DEFAULT 0,
  income_next_14d     NUMERIC(10,2) DEFAULT 0,
  gap_amount          NUMERIC(10,2) DEFAULT 0,
  deposit_required    NUMERIC(10,2) DEFAULT 0,
  days_to_payday      INT,
  cashflow_mode       TEXT          NOT NULL DEFAULT 'YELLOW'
                        CHECK (cashflow_mode IN ('RED','ORANGE','YELLOW','GREEN','BLUE')),
  bills_detail        JSONB,
  verdict_text        TEXT,
  created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_user_forecasts_user_date
    UNIQUE (user_id, forecast_date)
);

CREATE INDEX IF NOT EXISTS idx_user_forecasts_user_id
  ON user_forecasts (user_id);

CREATE INDEX IF NOT EXISTS idx_user_forecasts_mode
  ON user_forecasts (cashflow_mode);

COMMIT;

SELECT 'Playbook cards + user forecasts tables created' AS status;
