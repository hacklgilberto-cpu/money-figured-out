// jobs/creditPullJob.js
// Monthly credit pull + change detection + alert generation
// Uses 'node-cron'. Add to app.js: require('./jobs/creditPullJob')

const { pool } = require('./supabaseClient');
const { pullWithRetry } = require('./clarityService');

// ─── Main orchestrator ────────────────────────────────────────────
async function runMonthlyPulls() {
  const customers = [
    {
      id: process.env.MARCUS_USER_ID,
      firstName: 'Marcus',
      lastName: 'Rivera',
      ssn: process.env.MARCUS_SSN_TEST,
      dob: '1985-06-15',
      address: '123 Main St',
      city: 'Austin',
      state: 'TX',
      zip: '78701'
    }
  ]

  for (const customer of customers) {
    await processCustomer(customer)
  }
}

// ─── Per-customer flow ────────────────────────────────────────────
async function processCustomer(customer) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Pull from Clarity
    const snapshot = await pullWithRetry(customer);

    // 2. Insert snapshot
    const { rows: [newSnap] } = await client.query(`
      INSERT INTO credit_snapshots (
        customer_id, pull_date, pull_timestamp,
        score, score_type,
        reason_code_1, reason_code_2, reason_code_3, reason_code_4,
        active_duty_indicator,
        days_since_last_collection_inq, date_of_last_collection, date_of_last_chargeoff,
        loans_in_collection_count, loans_charged_off_count,
        loans_in_collection_amount, loans_charged_off_amount,
        online_loan_inquiry_last_30d, online_loan_opened_last_year,
        days_open_online_loans_90d, days_open_online_loans_1y,
        open_lines, past_due_lines, total_open_balance, total_past_due_amount,
        temp_account_record,
        total_inquiries_24h, total_inquiries_7d, total_inquiries_30d,
        total_inquiry_clusters_24h,
        is_no_hit, raw_response_json
      ) VALUES (
        $1, CURRENT_DATE, NOW(),
        $2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30
      )
      RETURNING *
    `, [
      customer.id,
      snapshot.score, snapshot.score_type,
      snapshot.reason_code_1, snapshot.reason_code_2, snapshot.reason_code_3, snapshot.reason_code_4,
      snapshot.active_duty_indicator,
      snapshot.days_since_last_collection_inq, snapshot.date_of_last_collection, snapshot.date_of_last_chargeoff,
      snapshot.loans_in_collection_count, snapshot.loans_charged_off_count,
      snapshot.loans_in_collection_amount, snapshot.loans_charged_off_amount,
      snapshot.online_loan_inquiry_last_30d, snapshot.online_loan_opened_last_year,
      snapshot.days_open_online_loans_90d, snapshot.days_open_online_loans_1y,
      snapshot.open_lines, snapshot.past_due_lines, snapshot.total_open_balance, snapshot.total_past_due_amount,
      snapshot.temp_account_record,
      snapshot.total_inquiries_24h, snapshot.total_inquiries_7d, snapshot.total_inquiries_30d,
      snapshot.total_inquiry_clusters_24h,
      snapshot.is_no_hit, snapshot.raw_response_json,
    ]);

    // 3. Fetch prior snapshot for comparison
    const { rows: [prevSnap] } = await client.query(`
      SELECT * FROM credit_snapshots
       WHERE customer_id = $1 AND id != $2
       ORDER BY pull_date DESC LIMIT 1
    `, [customer.id, newSnap.id]);

    // 4. Run change detection
    const changes = detectChanges(prevSnap ?? null, newSnap);

    if (changes) {
      // 5. Insert change record
      const { rows: [changeRow] } = await client.query(`
        INSERT INTO credit_score_changes (
          customer_id, snapshot_id_from, snapshot_id_to, change_date,
          score_prev, score_curr,
          new_derogatory_detected, derogatory_type,
          new_reason_code, dropped_reason_code,
          velocity_flag, temp_record_flag, alert_level
        ) VALUES ($1,$2,$3,CURRENT_DATE,$4,$5,$6,$7,$8,$9,$10,$11,$12)
        RETURNING *
      `, [
        customer.id, prevSnap?.id ?? null, newSnap.id,
        changes.scorePrev, changes.scoreCurr,
        changes.newDerogatoryDetected, changes.derogatoryType,
        changes.newReasonCode, changes.droppedReasonCode,
        changes.velocityFlag, changes.tempRecordFlag, changes.alertLevel,
      ]);

      // 6. Generate alerts
      const alerts = buildAlerts(changes, newSnap);
      for (const alert of alerts) {
        await client.query(`
          INSERT INTO customer_credit_alerts
            (customer_id, change_id, alert_type, alert_level, message_customer, message_internal)
          VALUES ($1,$2,$3,$4,$5,$6)
        `, [customer.id, changeRow.id, alert.type, alert.level, alert.customerMsg, alert.internalMsg]);
      }
    }

    // 7. MLA compliance log — always, every pull
    await client.query(`
      INSERT INTO mla_compliance_log (customer_id, snapshot_id, pull_date, active_duty_indicator)
      VALUES ($1,$2,CURRENT_DATE,$3)
    `, [customer.id, newSnap.id, snapshot.active_duty_indicator]);

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// ─── Change detection ─────────────────────────────────────────────
function detectChanges(prev, curr) {
  const scoreCurr  = curr.score;
  const scorePrev  = prev?.score ?? null;
  const scoreDelta = scoreCurr != null && scorePrev != null ? scoreCurr - scorePrev : null;

  // Derogatory detection
  let newDerogatoryDetected = false;
  let derogatoryType = null;

  if (isNewDerogatory(prev?.date_of_last_collection, curr.date_of_last_collection)) {
    newDerogatoryDetected = true;
    derogatoryType = 'collection';
  }
  if (isNewDerogatory(prev?.date_of_last_chargeoff, curr.date_of_last_chargeoff)) {
    newDerogatoryDetected = true;
    derogatoryType = derogatoryType ? 'collection_and_chargeoff' : 'chargeoff';
  }
  if (!prev && (curr.loans_in_collection_count ?? 0) > 0) {
    newDerogatoryDetected = true;
    derogatoryType = derogatoryType ?? 'collection';
  }

  // Velocity flags
  const velocityFlag = (
    (curr.total_inquiries_24h ?? 0) > 3 ||
    (curr.total_inquiries_7d  ?? 0) > 5 ||
    (curr.total_inquiry_clusters_24h ?? 0) > 1
  );

  const tempRecordFlag = curr.temp_account_record === true && prev?.temp_account_record !== true;

  // Reason code delta
  const prevCodes = [prev?.reason_code_1, prev?.reason_code_2, prev?.reason_code_3, prev?.reason_code_4].filter(Boolean);
  const currCodes = [curr.reason_code_1,  curr.reason_code_2,  curr.reason_code_3,  curr.reason_code_4].filter(Boolean);
  const newReasonCode     = currCodes.find(c => !prevCodes.includes(c)) ?? null;
  const droppedReasonCode = prevCodes.find(c => !currCodes.includes(c)) ?? null;

  // Alert level
  let alertLevel = 'none';
  if (newDerogatoryDetected || (curr.loans_charged_off_count ?? 0) > 0) alertLevel = 'critical';
  else if (velocityFlag || tempRecordFlag || (scoreDelta != null && scoreDelta <= -25)) alertLevel = 'warning';
  else if (scoreDelta != null && scoreDelta >= 10) alertLevel = 'info';
  else if (newReasonCode === 15 || newReasonCode === 95) alertLevel = 'warning';

  // Only write a change record if something meaningful happened
  if (alertLevel === 'none' && !newReasonCode && !droppedReasonCode && Math.abs(scoreDelta ?? 0) < 5) {
    return null;
  }

  return {
    scorePrev, scoreCurr, scoreDelta,
    newDerogatoryDetected, derogatoryType,
    newReasonCode, droppedReasonCode,
    velocityFlag, tempRecordFlag, alertLevel,
  };
}

// ─── Alert message builder ────────────────────────────────────────
function buildAlerts(changes, snap) {
  const alerts = [];

  if (changes.newDerogatoryDetected) {
    const type = changes.derogatoryType === 'chargeoff' ? 'charge-off' : 'collection';
    alerts.push({
      type:        'derogatory_event',
      level:       'critical',
      customerMsg: `A new ${type} account appeared on your report this month. This can significantly impact your credit score.`,
      internalMsg: `New ${type} detected. date_of_last_collection=${snap.date_of_last_collection} chargeoff=${snap.date_of_last_chargeoff}`,
    });
  }

  if (changes.scoreDelta != null) {
    if (changes.scoreDelta >= 25) {
      alerts.push({
        type: 'score_improvement', level: 'info',
        customerMsg: `Your credit score rose ${changes.scoreDelta} points this month. On-time payments are driving improvement.`,
        internalMsg: `Score +${changes.scoreDelta}: ${changes.scorePrev} → ${changes.scoreCurr}`,
      });
    } else if (changes.scoreDelta <= -50) {
      alerts.push({
        type: 'score_drop', level: 'critical',
        customerMsg: `Your score dropped ${Math.abs(changes.scoreDelta)} points this month. Check for new derogatory items.`,
        internalMsg: `Score ${changes.scoreDelta}: ${changes.scorePrev} → ${changes.scoreCurr}. Ops review required.`,
      });
    } else if (changes.scoreDelta <= -25) {
      alerts.push({
        type: 'score_drop', level: 'warning',
        customerMsg: `Your score dipped ${Math.abs(changes.scoreDelta)} points this month. We have tips to help.`,
        internalMsg: `Score ${changes.scoreDelta}: ${changes.scorePrev} → ${changes.scoreCurr}`,
      });
    } else if (changes.scoreDelta >= 10) {
      alerts.push({
        type: 'score_improvement', level: 'info',
        customerMsg: `Your credit score improved ${changes.scoreDelta} points this month. Keep it up!`,
        internalMsg: `Score +${changes.scoreDelta}: ${changes.scorePrev} → ${changes.scoreCurr}`,
      });
    }
  }

  if (changes.velocityFlag) {
    alerts.push({
      type: 'velocity', level: 'warning',
      customerMsg: `We noticed several loan applications in a short window. Applying for multiple loans at once can affect your score.`,
      internalMsg: `Velocity flag: inquiries_24h=${snap.total_inquiries_24h} clusters=${snap.total_inquiry_clusters_24h}`,
    });
  }

  if (changes.tempRecordFlag) {
    alerts.push({
      type: 'temp_record', level: 'warning',
      customerMsg: `We noticed a pending loan approval elsewhere on your profile. This temporarily affects your leverage picture.`,
      internalMsg: `temp_account_record flipped to TRUE. Hold any pending disbursements 24-48h.`,
    });
  }

  return alerts;
}

// ─── Helpers ─────────────────────────────────────────────────────
function isNewDerogatory(prevDate, currDate) {
  if (!currDate) return false;
  if (!prevDate) return true;
  const prev = new Date(prevDate);
  const curr = new Date(currDate);
  const now  = new Date();
  const within180 = (now - curr) / (1000 * 60 * 60 * 24) < 180;
  return curr > prev && within180;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

module.exports = { runMonthlyPulls };
