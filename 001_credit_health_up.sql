-- =============================================================
-- Migration: Credit Health Monitoring
-- Version:   001
-- Created:   2025-07-09
-- Author:    Blinc Engineering
-- Run order: after customers table exists
-- =============================================================

BEGIN;

-- ─── Extensions ───────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "btree_gin";  -- GIN index on JSONB

-- =============================================================
-- TABLE 1: credit_snapshots
-- One row per customer per monthly pull.
-- All Clarity CRHP + VantageScore fields land here.
-- =============================================================

CREATE TABLE IF NOT EXISTS credit_snapshots (

  -- ── Identity ─────────────────────────────────────────────────
  id                              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id                     UUID          NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  pull_date                       DATE          NOT NULL,
  pull_timestamp                  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  -- ── Section 1: Score Summary ──────────────────────────────────
  score                           SMALLINT      CHECK (score BETWEEN 300 AND 850),
  score_type                      VARCHAR(50),  -- 'VantageScore 3.0' when populated

  -- FCRA adverse action codes (store all four; required for adverse action letters)
  reason_code_1                   SMALLINT,
  reason_code_2                   SMALLINT,
  reason_code_3                   SMALLINT,
  reason_code_4                   SMALLINT,

  -- ── Section 4: Military Lending Act ───────────────────────────
  -- 0=Not covered  1=Active duty  7=Timeout  9=Invalid/missing
  -- NOT NULL: default 9 so a missing value is never silently ignored
  active_duty_indicator           SMALLINT      NOT NULL DEFAULT 9
                                                CHECK (active_duty_indicator IN (0, 1, 7, 9)),

  -- ── Section 2: Collections & Charge-Offs ─────────────────────
  days_since_last_collection_inq  SMALLINT,                   -- NULL = never
  date_of_last_collection         DATE,                       -- NULL = never
  date_of_last_chargeoff          DATE,                       -- NULL = never
  loans_in_collection_count       SMALLINT      DEFAULT 0,
  loans_charged_off_count         SMALLINT      DEFAULT 0,
  loans_in_collection_amount      NUMERIC(10,2) DEFAULT 0,
  loans_charged_off_amount        NUMERIC(10,2) DEFAULT 0,

  -- ── Section 3: Loan Activity ──────────────────────────────────
  online_loan_inquiry_last_30d    BOOLEAN,
  online_loan_opened_last_year    BOOLEAN,
  days_open_online_loans_90d      SMALLINT,
  days_open_online_loans_1y       SMALLINT,

  -- ── Section 5: Tradeline Summary ─────────────────────────────
  open_lines                      SMALLINT,
  past_due_lines                  SMALLINT,
  total_open_balance              NUMERIC(10,2),
  total_past_due_amount           NUMERIC(10,2),
  temp_account_record             BOOLEAN       DEFAULT FALSE,

  -- ── Section 7: Inquiries ──────────────────────────────────────
  total_inquiries_24h             SMALLINT,
  total_inquiries_7d              SMALLINT,
  total_inquiries_30d             SMALLINT,
  total_inquiry_clusters_24h      SMALLINT,

  -- ── Metadata ──────────────────────────────────────────────────
  -- TRUE = Clarity returned no data (thin/prime file)
  -- When TRUE, rely solely on VantageScore; skip Clarity risk logic
  is_no_hit                       BOOLEAN       NOT NULL DEFAULT FALSE,

  -- Full API response stored for audit, replay, and future field extraction
  raw_response_json               JSONB,

  created_at                      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  -- ── Constraints ───────────────────────────────────────────────
  -- One pull per customer per month (enforced at DB level)
  CONSTRAINT uq_customer_pull_month UNIQUE (customer_id, pull_date)
);

COMMENT ON TABLE  credit_snapshots IS 'Monthly Clarity CRHP + VantageScore 3.0 pull per customer. One row per pull.';
COMMENT ON COLUMN credit_snapshots.active_duty_indicator IS '0=Not covered, 1=Active duty (MLA applies), 7=API timeout, 9=Invalid/missing. Never NULL.';
COMMENT ON COLUMN credit_snapshots.is_no_hit             IS 'TRUE when Clarity returns no alt-data. Score may still exist via VantageScore/Experian.';
COMMENT ON COLUMN credit_snapshots.raw_response_json     IS 'Full Clarity API response. Retained for compliance audit and future field extraction.';
COMMENT ON COLUMN credit_snapshots.temp_account_record   IS 'TRUE = approved-not-funded loan exists elsewhere. Hidden stacking indicator unique to Clarity.';


-- =============================================================
-- TABLE 2: credit_score_changes
-- One row per meaningful change detected between consecutive pulls.
-- Populated by the monthly job after each snapshot insert.
-- =============================================================

CREATE TABLE IF NOT EXISTS credit_score_changes (

  -- ── Identity ─────────────────────────────────────────────────
  id                              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id                     UUID          NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  snapshot_id_from                UUID          REFERENCES credit_snapshots(id) ON DELETE SET NULL,  -- NULL for first pull
  snapshot_id_to                  UUID          NOT NULL REFERENCES credit_snapshots(id) ON DELETE CASCADE,
  change_date                     DATE          NOT NULL DEFAULT CURRENT_DATE,

  -- ── Score delta ───────────────────────────────────────────────
  score_prev                      SMALLINT,     -- NULL if first pull or prior score unavailable
  score_curr                      SMALLINT,
  -- Positive = improved, negative = worsened
  score_delta                     SMALLINT
    GENERATED ALWAYS AS (score_curr - score_prev) STORED,

  -- ── Derogatory events ─────────────────────────────────────────
  new_derogatory_detected         BOOLEAN       NOT NULL DEFAULT FALSE,
  -- 'collection' | 'chargeoff' | 'collection_and_chargeoff' | NULL
  derogatory_type                 VARCHAR(30)   CHECK (derogatory_type IN ('collection', 'chargeoff', 'collection_and_chargeoff')),

  -- ── Reason code changes ───────────────────────────────────────
  -- Code that appeared vs prior pull (new risk factor surfaced)
  new_reason_code                 SMALLINT,
  -- Code that disappeared vs prior pull (positive signal)
  dropped_reason_code             SMALLINT,

  -- ── Behavioral flags ──────────────────────────────────────────
  velocity_flag                   BOOLEAN       NOT NULL DEFAULT FALSE,
  temp_record_flag                BOOLEAN       NOT NULL DEFAULT FALSE,

  -- ── Alert level assigned ──────────────────────────────────────
  alert_level                     VARCHAR(10)   NOT NULL DEFAULT 'none'
                                                CHECK (alert_level IN ('none', 'info', 'warning', 'critical')),

  created_at                      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  credit_score_changes IS 'Computed change record between consecutive monthly snapshots. Drives alerts and dashboard change feed.';
COMMENT ON COLUMN credit_score_changes.score_delta         IS 'Computed: score_curr - score_prev. Positive = improved.';
COMMENT ON COLUMN credit_score_changes.new_derogatory_detected IS 'TRUE when a collection or charge-off appears for the first time or moves within 180 days.';
COMMENT ON COLUMN credit_score_changes.velocity_flag       IS 'TRUE when inquiry velocity thresholds are breached (>3 in 24h or >5 in 7d or clusters>1).';
COMMENT ON COLUMN credit_score_changes.temp_record_flag    IS 'TRUE when temp_account_record flipped from FALSE to TRUE vs prior pull.';


-- =============================================================
-- TABLE 3: customer_credit_alerts
-- Customer-facing and ops-facing alerts.
-- Drives in-app notifications and the internal risk queue.
-- =============================================================

CREATE TABLE IF NOT EXISTS customer_credit_alerts (

  -- ── Identity ─────────────────────────────────────────────────
  id                              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id                     UUID          NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  change_id                       UUID          NOT NULL REFERENCES credit_score_changes(id) ON DELETE CASCADE,

  -- ── Alert classification ──────────────────────────────────────
  -- 'score_drop' | 'score_improvement' | 'derogatory_event' | 'velocity' | 'temp_record'
  alert_type                      VARCHAR(50)   NOT NULL,
  alert_level                     VARCHAR(10)   NOT NULL
                                                CHECK (alert_level IN ('info', 'warning', 'critical')),

  -- ── Messages ──────────────────────────────────────────────────
  -- Human-readable copy for the customer dashboard (never expose raw codes)
  message_customer                TEXT          NOT NULL,
  -- Technical detail for the ops risk queue
  message_internal                TEXT          NOT NULL,

  -- ── Customer read state ───────────────────────────────────────
  is_read_customer                BOOLEAN       NOT NULL DEFAULT FALSE,
  read_at_customer                TIMESTAMPTZ,

  -- ── Ops action state ──────────────────────────────────────────
  is_actioned_ops                 BOOLEAN       NOT NULL DEFAULT FALSE,
  actioned_by                     UUID          REFERENCES users(id) ON DELETE SET NULL,
  actioned_at                     TIMESTAMPTZ,
  ops_note                        TEXT,

  created_at                      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  customer_credit_alerts IS 'Alerts generated from credit_score_changes. Drives customer dashboard notifications and internal ops risk queue.';
COMMENT ON COLUMN customer_credit_alerts.message_customer IS 'Plain-English copy shown to the customer. Never include raw numeric reason codes.';
COMMENT ON COLUMN customer_credit_alerts.message_internal IS 'Technical detail for ops team. Includes raw field values for triage.';
COMMENT ON COLUMN customer_credit_alerts.is_actioned_ops  IS 'TRUE once an ops team member has reviewed and resolved the alert.';


-- =============================================================
-- TABLE 4: mla_compliance_log
-- MLA record per pull — mandatory for regulatory audit.
-- Retain for minimum 5 years (do not add a CASCADE delete).
-- =============================================================

CREATE TABLE IF NOT EXISTS mla_compliance_log (

  id                              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id                     UUID          NOT NULL,    -- intentionally no CASCADE: retain even if customer deleted
  snapshot_id                     UUID,                     -- SET NULL if snapshot pruned
  pull_date                       DATE          NOT NULL,
  active_duty_indicator           SMALLINT      NOT NULL,

  -- Product details at time of pull (required if indicator = 1)
  product_type                    VARCHAR(100),
  apr_at_pull                     NUMERIC(5,2), -- e.g. 35.99

  created_at                      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  mla_compliance_log IS 'MLA compliance record written for every credit pull regardless of indicator value. Retain 5+ years. No cascade delete.';
COMMENT ON COLUMN mla_compliance_log.customer_id IS 'No FK constraint: records must survive customer deletion for regulatory retention.';


-- =============================================================
-- INDEXES
-- =============================================================

-- credit_snapshots: primary lookup (customer + recency)
CREATE INDEX IF NOT EXISTS idx_snapshots_customer_date
  ON credit_snapshots (customer_id, pull_date DESC);

-- credit_snapshots: batch job date filter
CREATE INDEX IF NOT EXISTS idx_snapshots_pull_date
  ON credit_snapshots (pull_date);

-- credit_snapshots: no-hit filter (skip Clarity logic for thin files)
CREATE INDEX IF NOT EXISTS idx_snapshots_no_hit
  ON credit_snapshots (customer_id, is_no_hit)
  WHERE is_no_hit = FALSE;

-- credit_snapshots: MLA flag filter (compliance queries)
CREATE INDEX IF NOT EXISTS idx_snapshots_active_duty
  ON credit_snapshots (active_duty_indicator)
  WHERE active_duty_indicator = 1;

-- credit_snapshots: JSONB for exploratory queries on raw response
CREATE INDEX IF NOT EXISTS idx_snapshots_raw_gin
  ON credit_snapshots USING GIN (raw_response_json);

-- credit_score_changes: customer change feed
CREATE INDEX IF NOT EXISTS idx_changes_customer_date
  ON credit_score_changes (customer_id, change_date DESC);

-- credit_score_changes: derogatory event queue
CREATE INDEX IF NOT EXISTS idx_changes_derogatory
  ON credit_score_changes (customer_id, new_derogatory_detected)
  WHERE new_derogatory_detected = TRUE;

-- credit_score_changes: alert level filter
CREATE INDEX IF NOT EXISTS idx_changes_alert_level
  ON credit_score_changes (alert_level, change_date DESC)
  WHERE alert_level IN ('warning', 'critical');

-- customer_credit_alerts: customer unread feed
CREATE INDEX IF NOT EXISTS idx_alerts_customer_unread
  ON customer_credit_alerts (customer_id, is_read_customer, created_at DESC);

-- customer_credit_alerts: ops risk queue (unactioned critical/warning)
CREATE INDEX IF NOT EXISTS idx_alerts_ops_queue
  ON customer_credit_alerts (is_actioned_ops, alert_level, created_at DESC)
  WHERE is_actioned_ops = FALSE;

-- mla_compliance_log: date range export
CREATE INDEX IF NOT EXISTS idx_mla_pull_date
  ON mla_compliance_log (pull_date DESC);

-- mla_compliance_log: active duty filter
CREATE INDEX IF NOT EXISTS idx_mla_active_duty
  ON mla_compliance_log (active_duty_indicator, pull_date DESC)
  WHERE active_duty_indicator = 1;


-- =============================================================
-- TRIGGERS
-- =============================================================

-- Auto-set read_at_customer when is_read_customer flips to TRUE
CREATE OR REPLACE FUNCTION trg_set_alert_read_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.is_read_customer = TRUE AND OLD.is_read_customer = FALSE THEN
    NEW.read_at_customer = NOW();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_alert_read_at ON customer_credit_alerts;
CREATE TRIGGER trg_alert_read_at
  BEFORE UPDATE ON customer_credit_alerts
  FOR EACH ROW EXECUTE FUNCTION trg_set_alert_read_at();

-- Auto-set actioned_at when is_actioned_ops flips to TRUE
CREATE OR REPLACE FUNCTION trg_set_alert_actioned_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.is_actioned_ops = TRUE AND OLD.is_actioned_ops = FALSE THEN
    NEW.actioned_at = NOW();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_alert_actioned_at ON customer_credit_alerts;
CREATE TRIGGER trg_alert_actioned_at
  BEFORE UPDATE ON customer_credit_alerts
  FOR EACH ROW EXECUTE FUNCTION trg_set_alert_actioned_at();


-- =============================================================
-- VIEWS
-- =============================================================

-- Ops risk queue: unactioned critical + warning alerts with customer context
CREATE OR REPLACE VIEW v_ops_risk_queue AS
SELECT
  a.id                    AS alert_id,
  a.customer_id,
  a.alert_type,
  a.alert_level,
  a.message_internal,
  a.created_at,
  ch.score_prev,
  ch.score_curr,
  ch.score_delta,
  ch.new_derogatory_detected,
  ch.derogatory_type,
  ch.velocity_flag,
  ch.temp_record_flag
FROM customer_credit_alerts a
JOIN credit_score_changes    ch ON ch.id = a.change_id
WHERE a.is_actioned_ops = FALSE
  AND a.alert_level     IN ('critical', 'warning')
ORDER BY
  CASE a.alert_level WHEN 'critical' THEN 1 WHEN 'warning' THEN 2 END,
  a.created_at DESC;

COMMENT ON VIEW v_ops_risk_queue IS 'Unactioned critical and warning alerts for the ops risk queue, sorted by severity then recency.';

-- Customer dashboard view: latest snapshot per customer
CREATE OR REPLACE VIEW v_customer_latest_snapshot AS
SELECT DISTINCT ON (customer_id)
  id, customer_id, pull_date,
  score, score_type,
  reason_code_1, reason_code_2, reason_code_3, reason_code_4,
  active_duty_indicator,
  date_of_last_collection, date_of_last_chargeoff,
  loans_in_collection_count, loans_charged_off_count,
  online_loan_inquiry_last_30d, days_open_online_loans_90d,
  temp_account_record,
  total_inquiries_24h, total_inquiry_clusters_24h,
  is_no_hit
FROM credit_snapshots
ORDER BY customer_id, pull_date DESC;

COMMENT ON VIEW v_customer_latest_snapshot IS 'Most recent snapshot per customer. Use for dashboard queries without a self-join.';

-- MLA compliance export: active duty customers with product details
CREATE OR REPLACE VIEW v_mla_active_duty_log AS
SELECT
  m.customer_id,
  m.pull_date,
  m.active_duty_indicator,
  m.product_type,
  m.apr_at_pull,
  m.created_at
FROM mla_compliance_log m
WHERE m.active_duty_indicator = 1
ORDER BY m.pull_date DESC;

COMMENT ON VIEW v_mla_active_duty_log IS 'Active duty pull records for MLA compliance reporting and audit exports.';


-- =============================================================
-- ROW LEVEL SECURITY (recommended if using Supabase or direct PostgREST)
-- Uncomment and adapt if your app accesses Postgres directly
-- =============================================================

-- ALTER TABLE credit_snapshots          ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE credit_score_changes      ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE customer_credit_alerts    ENABLE ROW LEVEL SECURITY;

-- Customers can only see their own rows
-- CREATE POLICY customer_own_snapshots ON credit_snapshots
--   USING (customer_id = auth.uid());

-- CREATE POLICY customer_own_alerts ON customer_credit_alerts
--   USING (customer_id = auth.uid());

-- Ops users bypass RLS via a service role key in Express


COMMIT;

-- =============================================================
-- ROLLBACK SCRIPT (save separately as 001_credit_health_down.sql)
-- =============================================================
-- BEGIN;
-- DROP VIEW  IF EXISTS v_mla_active_duty_log;
-- DROP VIEW  IF EXISTS v_customer_latest_snapshot;
-- DROP VIEW  IF EXISTS v_ops_risk_queue;
-- DROP TABLE IF EXISTS mla_compliance_log         CASCADE;
-- DROP TABLE IF EXISTS customer_credit_alerts     CASCADE;
-- DROP TABLE IF EXISTS credit_score_changes       CASCADE;
-- DROP TABLE IF EXISTS credit_snapshots           CASCADE;
-- DROP FUNCTION IF EXISTS trg_set_alert_read_at();
-- DROP FUNCTION IF EXISTS trg_set_alert_actioned_at();
-- COMMIT;
