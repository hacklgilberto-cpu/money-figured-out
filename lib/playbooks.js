// lib/playbooks.js
// Playbook matching engine.
// Takes a user's recurring merchant names + state,
// returns matched hardship programs and safety net resources.

import { db } from './db';

// ── Normalize merchant name for matching ────────────────────────
const normalize = (name) =>
  (name || '').toLowerCase().replace(/[^a-z0-9]/g, '');

// Known aliases — maps common transaction names to canonical biller names.
const ALIASES = {
  'fpl': 'Florida Power & Light',
  'floridapowerandlight': 'Florida Power & Light',
  'floridapowerlight': 'Florida Power & Light',
  'dukeenergy': 'Duke Energy',
  'att': 'AT&T',
  'attmobility': 'AT&T',
  'attwireless': 'AT&T',
  'progressive': 'Progressive',
  'progressiveinsurance': 'Progressive',
  'wellsfargo': 'Wells Fargo',
  'wellsfargonsffee': 'Wells Fargo',
  'capitalone': 'Capital One',
  'capitaloneinterestcharge': 'Capital One',
  'capitalonepayment': 'Capital One',
  'hondafinancialservices': 'Honda Financial Services',
  'hondafinancial': 'Honda Financial Services',
};

function resolveBillerName(merchantName) {
  const key = normalize(merchantName);
  if (ALIASES[key]) return ALIASES[key];
  for (const [alias, canonical] of Object.entries(ALIASES)) {
    if (key.includes(alias) || alias.includes(key)) return canonical;
  }
  return merchantName;
}

// ── Match merchant list against playbook_cards ──────────────────
export async function matchPlaybooks(merchantNames, userState = 'FL') {
  const resolved = [...new Set(merchantNames.map(resolveBillerName))];

  const { rows } = await db.query(`
    SELECT *
    FROM playbook_cards
    WHERE is_active = true
      AND (state = $1 OR state = 'US')
    ORDER BY biller_category, biller_name
  `, [userState]);

  const billerCards = [];
  const statePrograms = [];
  const localResources = [];

  for (const card of rows) {
    if (card.biller_name === '_STATE_PROGRAM') {
      statePrograms.push(card);
    } else if (card.biller_name === '_LOCAL_RESOURCE') {
      localResources.push(card);
    } else {
      const cardNorm = normalize(card.biller_name);
      const matched = resolved.some(r => {
        const rNorm = normalize(r);
        return rNorm === cardNorm || rNorm.includes(cardNorm) || cardNorm.includes(rNorm);
      });
      if (matched) billerCards.push(card);
    }
  }

  return { billerCards, statePrograms, localResources };
}

// ── Format playbook for chat context injection ──────────────────
export function formatPlaybookContext(playbooks, mode) {
  const { billerCards, statePrograms, localResources } = playbooks;
  const lines = [];

  if (mode === 'RED' || mode === 'ORANGE') {
    lines.push('SURVIVAL PLAYBOOKS AVAILABLE (use these when advising):');
    lines.push('');

    if (billerCards.length > 0) {
      lines.push('BILLER-SPECIFIC HARDSHIP PROGRAMS:');
      for (const card of billerCards) {
        lines.push(`  ${card.biller_name} (${card.biller_category}):`);
        lines.push(`    Program: ${card.program_name}`);
        lines.push(`    Phone: ${card.phone_number}`);
        lines.push(`    What to say: ${card.call_script}`);
        lines.push(`    What they offer: ${card.what_it_offers}`);
        if (card.protection_rule) lines.push(`    Protection: ${card.protection_rule}`);
        lines.push('');
      }
    }

    if (statePrograms.length > 0) {
      lines.push('GOVERNMENT ASSISTANCE PROGRAMS:');
      for (const p of statePrograms) {
        lines.push(`  ${p.program_name}:`);
        lines.push(`    Phone: ${p.phone_number}`);
        lines.push(`    Eligibility: ${p.eligibility}`);
        lines.push(`    What it offers: ${p.what_it_offers}`);
        lines.push('');
      }
    }

    if (localResources.length > 0) {
      lines.push('LOCAL EMERGENCY RESOURCES:');
      for (const r of localResources) {
        lines.push(`  ${r.program_name}:`);
        lines.push(`    Phone: ${r.phone_number}`);
        lines.push(`    How: ${r.call_script}`);
        lines.push(`    What it offers: ${r.what_it_offers}`);
        lines.push('');
      }
    }

    lines.push('RULES FOR USING PLAYBOOKS:');
    lines.push('- Always cite the specific phone number and program name');
    lines.push('- Include the call script so the user knows exactly what to say');
    lines.push('- Use the user\'s actual dollar amounts when explaining impact');
    lines.push('- If a protection rule exists, tell them (e.g. "they can\'t disconnect for X days")');
    lines.push('- Never invent programs or phone numbers that are not listed above');
  } else {
    lines.push('USER IS IN STABLE MODE — focus on habit building, credit path, and optimization.');
    lines.push('Survival playbooks are available but not the priority right now.');
  }

  return lines.join('\n');
}

// ── Seed mock forecast for Marcus (demo) ────────────────────────
export async function seedMarcusForecast(userId) {
  const today = new Date().toISOString().split('T')[0];

  const billsDetail = [
    { merchant: 'AT&T', amount: 85, predicted_date: addDays(4), confidence: 'high', necessity: 'essential' },
    { merchant: 'Netflix', amount: 15.49, predicted_date: addDays(8), confidence: 'high', necessity: 'nonessential' },
    { merchant: 'Progressive', amount: 142, predicted_date: addDays(11), confidence: 'high', necessity: 'obligatory' },
    { merchant: 'Honda Financial Services', amount: 287, predicted_date: addDays(13), confidence: 'high', necessity: 'obligatory' },
    { merchant: 'Spotify', amount: 10.99, predicted_date: addDays(9), confidence: 'medium', necessity: 'nonessential' },
  ];

  const totalBills = billsDetail.reduce((s, b) => s + b.amount, 0);

  const verdict = `You have $145. Your AT&T bill ($85) hits in 4 days — before your paycheck arrives on day 5. After AT&T, you'll have $60 for one day. Your next check ($1,640) lands the day after, then Progressive ($142) and Honda ($287) hit the following week. You'll be tight but covered if the paycheck lands on time.`;

  await db.query(`
    INSERT INTO user_forecasts
      (user_id, forecast_date, current_balance, bills_next_14d, income_next_14d,
       gap_amount, deposit_required, days_to_payday, cashflow_mode, bills_detail, verdict_text)
    VALUES ($1, $2, 145, $3, 1640, $4, 85, 5, 'ORANGE', $5, $6)
    ON CONFLICT (user_id, forecast_date) DO UPDATE SET
      current_balance  = EXCLUDED.current_balance,
      bills_next_14d   = EXCLUDED.bills_next_14d,
      income_next_14d  = EXCLUDED.income_next_14d,
      gap_amount       = EXCLUDED.gap_amount,
      deposit_required = EXCLUDED.deposit_required,
      days_to_payday   = EXCLUDED.days_to_payday,
      cashflow_mode    = EXCLUDED.cashflow_mode,
      bills_detail     = EXCLUDED.bills_detail,
      verdict_text     = EXCLUDED.verdict_text
  `, [userId, today, totalBills, 1640 + 145 - totalBills, JSON.stringify(billsDetail), verdict]);
}

function addDays(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}
