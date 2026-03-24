// routes/creditHealth.js
// Credit Health Monitoring — REST API routes
// Mount in app.js: app.use('/api/v1/credit-health', require('./routes/creditHealth'))

const express = require('express');
const router  = express.Router();
const { pool } = require('../db');               // your pg Pool
const { requireAuth } = require('../middleware/auth');

// ─── GET /api/v1/credit-health/:customerId ────────────────────────
// Returns the latest snapshot + score delta vs. prior month
router.get('/:customerId', requireAuth, async (req, res) => {
  try {
    const { customerId } = req.params;

    // Authorise: customer can only fetch their own data
    if (req.user.id !== customerId && !req.user.isOps) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { rows } = await pool.query(`
      WITH ranked AS (
        SELECT *,
               ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY pull_date DESC) AS rn
          FROM credit_snapshots
         WHERE customer_id = $1
      ),
      latest  AS (SELECT * FROM ranked WHERE rn = 1),
      prior   AS (SELECT * FROM ranked WHERE rn = 2)
      SELECT
        l.*,
        p.score AS prior_score,
        (l.score - p.score) AS score_delta
      FROM latest l
      LEFT JOIN prior p ON p.customer_id = l.customer_id
    `, [customerId]);

    if (!rows.length) {
      return res.status(404).json({ error: 'No credit data found for this customer' });
    }

    const snap = rows[0];

    return res.json({
      pullDate:          snap.pull_date,
      score:             snap.score,
      scoreDelta:        snap.score_delta ?? null,
      scoreBand:         scoreBand(snap.score),
      isNoHit:           snap.is_no_hit,
      activeDuty:        snap.active_duty_indicator,
      reasonCodes:       [snap.reason_code_1, snap.reason_code_2, snap.reason_code_3, snap.reason_code_4].filter(Boolean),
      collections: {
        count:           snap.loans_in_collection_count,
        amount:          snap.loans_in_collection_amount,
        dateOfLast:      snap.date_of_last_collection,
      },
      chargeoffs: {
        count:           snap.loans_charged_off_count,
        amount:          snap.loans_charged_off_amount,
        dateOfLast:      snap.date_of_last_chargeoff,
      },
      loanActivity: {
        inquiryLast30d:  snap.online_loan_inquiry_last_30d,
        daysOpenLast90d: snap.days_open_online_loans_90d,
        tempRecord:      snap.temp_account_record,
      },
      velocity: {
        inquiries24h:    snap.total_inquiries_24h,
        inquiries7d:     snap.total_inquiries_7d,
        clusters24h:     snap.total_inquiry_clusters_24h,
      },
    });
  } catch (err) {
    console.error('[creditHealth] GET /:customerId', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── GET /api/v1/credit-health/:customerId/history ────────────────
// Returns N months of snapshots for the history chart
router.get('/:customerId/history', requireAuth, async (req, res) => {
  try {
    const { customerId } = req.params;
    const months = Math.min(parseInt(req.query.months ?? '12', 10), 24);

    if (req.user.id !== customerId && !req.user.isOps) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { rows } = await pool.query(`
      SELECT
        pull_date,
        score,
        is_no_hit,
        reason_code_1, reason_code_2, reason_code_3, reason_code_4,
        loans_in_collection_count,
        loans_charged_off_count,
        online_loan_inquiry_last_30d,
        temp_account_record
      FROM credit_snapshots
      WHERE customer_id = $1
      ORDER BY pull_date DESC
      LIMIT $2
    `, [customerId, months]);

    // Compute delta relative to next-older row
    const history = rows.map((row, i) => ({
      pullDate:    row.pull_date,
      score:       row.score,
      scoreDelta:  i < rows.length - 1 ? (row.score - rows[i + 1].score) : null,
      scoreBand:   scoreBand(row.score),
      isNoHit:     row.is_no_hit,
      flags: {
        collectionActive: (row.loans_in_collection_count ?? 0) > 0,
        chargeoffActive:  (row.loans_charged_off_count   ?? 0) > 0,
        tempRecord:       row.temp_account_record,
        loanInquiry:      row.online_loan_inquiry_last_30d,
      },
    }));

    return res.json({ history });
  } catch (err) {
    console.error('[creditHealth] GET /:customerId/history', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── GET /api/v1/credit-health/:customerId/alerts ─────────────────
// Returns unread (or all) alerts for the customer dashboard
router.get('/:customerId/alerts', requireAuth, async (req, res) => {
  try {
    const { customerId } = req.params;
    const unreadOnly = req.query.unread === 'true';

    if (req.user.id !== customerId && !req.user.isOps) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const whereClauses = ['customer_id = $1'];
    if (unreadOnly) whereClauses.push('is_read_customer = FALSE');

    const { rows } = await pool.query(`
      SELECT id, alert_type, alert_level, message_customer, is_read_customer, created_at
      FROM customer_credit_alerts
      WHERE ${whereClauses.join(' AND ')}
      ORDER BY created_at DESC
      LIMIT 20
    `, [customerId]);

    return res.json({ alerts: rows });
  } catch (err) {
    console.error('[creditHealth] GET /:customerId/alerts', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── PATCH /api/v1/credit-health/alerts/:alertId/read ─────────────
// Customer marks an alert as read
router.patch('/alerts/:alertId/read', requireAuth, async (req, res) => {
  try {
    const { alertId } = req.params;

    const { rows } = await pool.query(
      `UPDATE customer_credit_alerts
          SET is_read_customer = TRUE
        WHERE id = $1 AND customer_id = $2
        RETURNING id`,
      [alertId, req.user.id]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'Alert not found or access denied' });
    }

    return res.json({ ok: true });
  } catch (err) {
    console.error('[creditHealth] PATCH /alerts/:alertId/read', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Helpers ─────────────────────────────────────────────────────
function scoreBand(score) {
  if (!score)      return null;
  if (score < 580) return 'Poor';
  if (score < 670) return 'Fair';
  if (score < 740) return 'Good';
  if (score < 800) return 'Very Good';
  return 'Excellent';
}

module.exports = router;
