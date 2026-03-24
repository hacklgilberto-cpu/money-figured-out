// services/clarityService.js
// Wrapper around the Clarity CRHP + VantageScore API

const axios = require('axios');

const client = axios.create({
  baseURL: process.env.CLARITY_API_BASE_URL,  // e.g. https://api.clarityservices.com/v2
  timeout: 15_000,
  headers: {
    'Authorization': `Bearer ${process.env.CLARITY_API_KEY}`,
    'Content-Type': 'application/json',
  },
});

// ─── Pull a CRHP report for one customer ──────────────────────────
// Returns a normalised snapshot object ready to insert into credit_snapshots
async function pullCreditReport(customer) {
  const payload = {
    productCode: 'CRHP',               // Clear Recent History PLUS
    consumer: {
      firstName:   customer.firstName,
      lastName:    customer.lastName,
      ssn:         customer.ssn,        // encrypted at rest; pass decrypted only here
      dob:         customer.dob,        // YYYY-MM-DD
      address:     customer.address,
      city:        customer.city,
      state:       customer.state,
      zip:         customer.zip,
    },
    requestType: 'AccountReview',      // FCRA permissible purpose
  };

  const response = await client.post('/reports', payload);
  return normalise(response.data);
}

// ─── Normalise raw Clarity response → DB-ready object ─────────────
function normalise(raw) {
  const score   = raw?.vantageScore?.score ?? null;
  const reasons = raw?.vantageScore?.reasonCodes ?? [];
  const clarity = raw?.clarityFields ?? {};

  // MLA — always capture; default to 9 (invalid) if missing
  const activeDuty = raw?.mla?.activeDutyIndicator ?? 9;

  const isNoHit = !score && !Object.keys(clarity).length;

  return {
    score,
    score_type:                         score ? 'VantageScore 3.0' : null,
    reason_code_1:                      reasons[0] ?? null,
    reason_code_2:                      reasons[1] ?? null,
    reason_code_3:                      reasons[2] ?? null,
    reason_code_4:                      reasons[3] ?? null,
    active_duty_indicator:              activeDuty,

    days_since_last_collection_inq:     clarity.daysSinceLastCollectionInquiry ?? null,
    date_of_last_collection:            parseDate(clarity.dateOfLastCollection),
    date_of_last_chargeoff:             parseDate(clarity.dateOfLastChargeoff),
    loans_in_collection_count:          clarity.loansInCollectionNumber  ?? null,
    loans_charged_off_count:            clarity.loansChargedOffNumber    ?? null,
    loans_in_collection_amount:         clarity.loansInCollectionAmount  ?? null,
    loans_charged_off_amount:           clarity.loansChargedOffAmount    ?? null,

    online_loan_inquiry_last_30d:       clarity.onlineLoanInquiryLast30Days   ?? null,
    online_loan_opened_last_year:       clarity.onlineLoanOpenedLastYear       ?? null,
    days_open_online_loans_90d:         clarity.daysWithOpenOnlineLoans90d     ?? null,
    days_open_online_loans_1y:          clarity.daysWithOpenOnlineLoans1y      ?? null,

    open_lines:                         clarity.openLines      ?? null,
    past_due_lines:                     clarity.pastDueLines   ?? null,
    total_open_balance:                 clarity.totalOpenBalance    ?? null,
    total_past_due_amount:              clarity.totalPastDueAmount  ?? null,
    temp_account_record:                clarity.tempAccountRecord   ?? null,

    total_inquiries_24h:                clarity.totalInquiries24h  ?? null,
    total_inquiries_7d:                 clarity.totalInquiries7d   ?? null,
    total_inquiries_30d:                clarity.totalInquiries30d  ?? null,
    total_inquiry_clusters_24h:         clarity.totalInquiryClusters24h ?? null,

    is_no_hit:                          isNoHit,
    raw_response_json:                  raw,
  };
}

// ─── Helpers ─────────────────────────────────────────────────────
function parseDate(val) {
  if (!val || val === 'never' || val === 'n/a') return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d.toISOString().split('T')[0];
}

// Retry helper — used for MLA timeout/invalid codes (7, 9)
async function pullWithRetry(customer, maxAttempts = 3, delayMs = 2000) {
  if (process.env.CLARITY_MOCK === 'true') {
    return {
      score: 612,
      score_type: 'VantageScore 3.0',
      reason_code_1: 97,
      reason_code_2: 14,
      reason_code_3: null,
      reason_code_4: null,
      active_duty_indicator: 0,
      is_no_hit: false,
      loans_in_collection_count: 0,
      loans_charged_off_count: 0,
      total_past_due_amount: 0,
      total_open_balance: 1840.00,
      open_lines: 3,
      past_due_lines: 0,
      total_inquiries_30d: 1,
      total_inquiries_7d: 0,
      total_inquiries_24h: 0,
      total_inquiry_clusters_24h: 0,
      temp_account_record: false,
      velocity_flag: false,
      online_loan_inquiry_last_30d: false,
      raw_response_json: {}
    }
  }

  let lastErr;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await pullCreditReport(customer);
      // If MLA is still bad after the first try, keep retrying
      if (attempt > 1 && [7, 9].includes(result.active_duty_indicator)) {
        throw new Error(`MLA indicator unresolved: ${result.active_duty_indicator}`);
      }
      return result;
    } catch (err) {
      lastErr = err;
      if (attempt < maxAttempts) {
        await new Promise(r => setTimeout(r, delayMs * attempt));
      }
    }
  }
  throw lastErr;
}

module.exports = { pullCreditReport, pullWithRetry, normalise };
