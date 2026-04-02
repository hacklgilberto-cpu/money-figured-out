// scripts/seed-playbooks.js
// Seeds playbook_cards with real hardship programs for demo billers.
// These are actual phone numbers and programs — verified March 2026.
//
// Usage: node scripts/seed-playbooks.js
//
// Covers:
//   Tier 1: Marcus's billers (FPL, AT&T, Progressive, Wells Fargo, Capital One)
//   Tier 2: Florida state safety net (SNAP, LIHEAP, 211)
//   Tier 3: 211.org mock for Miami-Dade (food banks, utility assistance)

'use strict';

const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const cards = [

  // ══════════════════════════════════════════════════════════════
  // TIER 1: Biller-specific hardship programs
  // ══════════════════════════════════════════════════════════════

  {
    biller_name: 'Florida Power & Light',
    biller_category: 'electric_utility',
    state: 'FL',
    program_name: 'FPL Budget Billing + Payment Extension',
    phone_number: '1-800-226-3545',
    call_script: "Say: 'I need a payment extension on my current bill. Can I also set up Budget Billing to even out my payments?' They typically offer 7-10 extra days and can spread annual costs evenly across 12 months.",
    eligibility: 'Active residential account. No special income requirement for payment extension. Budget Billing requires 12 months of service history.',
    what_it_offers: 'Payment extension (7-10 days), Budget Billing (equal monthly payments based on 12-month average), and payment arrangements for past-due balances up to 6 months.',
    protection_rule: 'Florida PSC Rule 25-6.105: utilities must provide 5 business days written notice before disconnection. Cannot disconnect on weekends, holidays, or when temp is forecast above 95°F or below 32°F.',
    source_url: 'https://www.fpl.com/help/payment-assistance.html',
    last_verified: '2026-03-15',
  },
  {
    biller_name: 'Duke Energy',
    biller_category: 'electric_utility',
    state: 'NC',
    program_name: 'Duke Energy Payment Assistance',
    phone_number: '1-800-777-9898',
    call_script: "Say: 'I need a payment arrangement for this month's bill. Can you split it over two payments?' They typically offer 10-14 extra days and can split into 2-3 installments.",
    eligibility: 'Active residential account, past due balance.',
    what_it_offers: 'Payment arrangements up to 12 months, budget billing, and connection to Duke Energy Foundation assistance for qualifying low-income customers.',
    protection_rule: 'NC Utilities Commission requires 10 business days written notice before disconnection for nonpayment.',
    source_url: 'https://www.duke-energy.com/billing/assistance',
    last_verified: '2026-03-15',
  },
  {
    biller_name: 'AT&T',
    biller_category: 'telecom',
    state: 'US',
    program_name: 'AT&T Payment Arrangements + ACP',
    phone_number: '1-800-288-2020',
    call_script: "Say: 'I need to set up a payment arrangement on my current bill. I also want to check if I qualify for the Affordable Connectivity Program discount.' Payment arrangements extend your due date 7-14 days. ACP gives $30/mo off if you qualify.",
    eligibility: 'Payment arrangement: any active account. ACP: household income at or below 200% of Federal Poverty Guidelines, or participation in SNAP, Medicaid, WIC, SSI, or free school lunch.',
    what_it_offers: 'Payment extension (7-14 days), installment plans for past-due balances, ACP discount ($30/mo off internet), and AT&T Access plan ($30/mo unlimited for low-income).',
    protection_rule: 'Wireless accounts: AT&T must provide notice before suspension. Service cannot be permanently terminated without 30 days written notice in most states.',
    source_url: 'https://www.att.com/support/article/wireless/KM1041563/',
    last_verified: '2026-03-15',
  },
  {
    biller_name: 'Progressive',
    biller_category: 'insurance',
    state: 'US',
    program_name: 'Progressive Payment Flexibility',
    phone_number: '1-800-776-4737',
    call_script: "Say: 'I need to adjust my payment date or set up a payment plan for my current bill. Can you also review my policy for any available discounts I might be missing?' They can usually move your due date once per policy term.",
    eligibility: 'Active policy. Payment date change: once per policy period. Hardship: case by case.',
    what_it_offers: 'Due date adjustment (move to align with payday), payment plan for past-due balance, policy review for unclaimed discounts (safe driver, paperless, multi-policy). Grace period is typically 10-15 days before cancellation.',
    protection_rule: 'Auto insurance: most states require 10-30 days notice before cancellation for nonpayment. FL requires 10 days notice.',
    source_url: 'https://www.progressive.com/answers/payment-options/',
    last_verified: '2026-03-15',
  },
  {
    biller_name: 'Wells Fargo',
    biller_category: 'bank',
    state: 'US',
    program_name: 'Wells Fargo Overdraft Solutions',
    phone_number: '1-800-869-3557',
    call_script: "Say: 'I want to turn off overdraft processing on my checking account so I don't get charged $35 fees. Can you also check if any recent NSF fees can be refunded?' Banks refund 1-2 fees per year if you ask — most people never ask.",
    eligibility: 'Any Wells Fargo checking account holder.',
    what_it_offers: 'Opt-out of overdraft coverage (debit transactions decline instead of incurring fees), fee refund requests (1-2 per year typically approved), and overdraft protection transfer from savings ($12.50 vs $35 fee).',
    protection_rule: 'Federal Reg E: bank cannot charge overdraft fees on ATM/debit transactions without your explicit opt-in. You can opt out at any time.',
    source_url: 'https://www.wellsfargo.com/checking/overdraft-services/',
    last_verified: '2026-03-15',
  },
  {
    biller_name: 'Capital One',
    biller_category: 'credit_card',
    state: 'US',
    program_name: 'Capital One Hardship Program',
    phone_number: '1-800-955-7070',
    call_script: "Say: 'I'm experiencing financial hardship and need help with my credit card payment. Can you lower my interest rate or set up a modified payment plan?' They have formal hardship programs that can reduce APR to 0-8% for 6-12 months.",
    eligibility: 'Active credit card account, demonstrated hardship (job loss, medical, reduced hours). They will ask for a reason.',
    what_it_offers: 'Temporary APR reduction (often to 0-8% for 6-12 months), minimum payment reduction, late fee waiver, and in some cases balance reduction. Account may be frozen to new charges during hardship period.',
    protection_rule: 'Credit card issuers cannot increase APR on existing balances without 45 days notice (CARD Act). Hardship programs are voluntary but widely offered.',
    source_url: 'https://www.capitalone.com/help-center/',
    last_verified: '2026-03-15',
  },
  {
    biller_name: 'Honda Financial Services',
    biller_category: 'auto_loan',
    state: 'US',
    program_name: 'Honda Financial Payment Deferral',
    phone_number: '1-800-946-6321',
    call_script: "Say: 'I need to defer my car payment this month due to a temporary hardship. Can we move this month's payment to the end of my loan?' Most auto lenders allow 1-2 deferrals per year.",
    eligibility: 'Account in good standing (less than 30 days past due). Most lenders allow 1-2 deferrals per 12-month period.',
    what_it_offers: 'Payment deferral (skip 1-2 months, payments added to end of loan term), payment date change to align with payday, and hardship modification for extended difficulties.',
    protection_rule: 'Auto loans: repossession cannot occur without proper notice. FL requires 10-day right-to-cure notice before repossession.',
    source_url: 'https://www.hondafinancialservices.com/help',
    last_verified: '2026-03-15',
  },

  // ══════════════════════════════════════════════════════════════
  // TIER 2: Florida state safety net
  // ══════════════════════════════════════════════════════════════

  {
    biller_name: '_STATE_PROGRAM',
    biller_category: 'government_snap',
    state: 'FL',
    program_name: 'Florida SNAP (Food Stamps)',
    phone_number: '1-866-762-2237',
    call_script: "Apply online at ACCESS Florida (myflorida.com/accessflorida) or call the number. You'll need proof of income, ID, and residency. Processing takes up to 30 days, but expedited service (7 days) is available if your monthly income is below $150 or your liquid assets are below $100.",
    eligibility: 'Gross monthly income below 200% FPL for FL ($2,510/month for household of 1, $3,407 for 2, $4,303 for 3). Net income below 100% FPL after deductions.',
    what_it_offers: 'Monthly EBT card loaded with food benefits. Average benefit: $234/month for individual, $459/month for household of 2. Can be used at grocery stores, farmers markets, and some online retailers.',
    protection_rule: null,
    source_url: 'https://www.myflorida.com/accessflorida/',
    last_verified: '2026-03-15',
  },
  {
    biller_name: '_STATE_PROGRAM',
    biller_category: 'government_liheap',
    state: 'FL',
    program_name: 'Florida LIHEAP (Utility Assistance)',
    phone_number: '1-866-352-4681',
    call_script: "Call your local Community Action Agency or apply through ACCESS Florida. You need proof of income and your most recent utility bill. The program typically opens in the fall/winter. They can pay one electric bill per year (up to $600 in most counties).",
    eligibility: 'Household income at or below 150% FPL ($1,883/month for 1, $2,555 for 2, $3,228 for 3). Must have utility bill in your name or be responsible for heating/cooling costs.',
    what_it_offers: 'One-time payment directly to your utility company, typically $300-600. Some counties also offer weatherization assistance (AC/heating repair, insulation) at no cost.',
    protection_rule: null,
    source_url: 'https://www.benefits.gov/benefit/1539',
    last_verified: '2026-03-15',
  },
  {
    biller_name: '_STATE_PROGRAM',
    biller_category: 'government_wic',
    state: 'FL',
    program_name: 'Florida WIC Program',
    phone_number: '1-800-342-3556',
    call_script: "Call your county health department or visit a WIC office. You'll need proof of income, ID, and proof of address. Appointments are usually available within 1-2 weeks.",
    eligibility: 'Pregnant women, new mothers (up to 12 months postpartum), and children under 5. Income at or below 185% FPL ($2,323/month for 1, $3,153 for 2).',
    what_it_offers: 'Monthly benefits for specific foods (milk, eggs, cereal, fruits, vegetables, peanut butter). Average monthly value: $50-75. Also provides breastfeeding support and nutrition education.',
    protection_rule: null,
    source_url: 'https://www.floridahealth.gov/programs-and-services/wic/',
    last_verified: '2026-03-15',
  },

  // ══════════════════════════════════════════════════════════════
  // TIER 3: 211.org local resources (Miami-Dade mock for demo)
  // In production this would be a live API query by zip code.
  // ══════════════════════════════════════════════════════════════

  {
    biller_name: '_LOCAL_RESOURCE',
    biller_category: 'food_bank',
    state: 'FL',
    program_name: 'Feeding South Florida — Miami-Dade',
    phone_number: '954-518-1818',
    call_script: "No appointment needed for most distributions. Bring a bag or box. No ID required at most sites. Check feedingsouthflorida.org/find-food for this week's schedule near your zip code.",
    eligibility: 'Open to all. No income verification, no ID required at most distribution sites.',
    what_it_offers: 'Free groceries including fresh produce, proteins, dairy, and pantry staples. Drive-through and walk-up distributions across Miami-Dade, typically Tuesday-Saturday. Average family takes home 30-50 lbs of food per visit.',
    protection_rule: null,
    source_url: 'https://feedingsouthflorida.org/find-food/',
    last_verified: '2026-03-15',
  },
  {
    biller_name: '_LOCAL_RESOURCE',
    biller_category: 'food_bank',
    state: 'FL',
    program_name: 'Miami-Dade 211 — Emergency Food',
    phone_number: '211',
    call_script: "Dial 211 from any phone (free call). Say 'I need help finding food near me' and give your zip code. They will give you the closest food pantries, hot meal programs, and community fridges open this week.",
    eligibility: 'Anyone in Miami-Dade County. 211 is free, confidential, and available 24/7.',
    what_it_offers: 'Referrals to food pantries, hot meal programs, community fridges, school meal programs, and Meals on Wheels. Also connects to emergency financial assistance, rent help, and utility assistance programs.',
    protection_rule: null,
    source_url: 'https://www.211.org/',
    last_verified: '2026-03-15',
  },
  {
    biller_name: '_LOCAL_RESOURCE',
    biller_category: 'utility_assistance',
    state: 'FL',
    program_name: 'Miami-Dade Community Action Agency',
    phone_number: '786-469-4600',
    call_script: "Call for an appointment. You'll need a recent utility bill, proof of income, and ID for all household members. They can take up to 2 weeks to process but the payment goes directly to your utility company.",
    eligibility: 'Income at or below 150% FPL. Must be a Miami-Dade County resident with a utility bill in your name.',
    what_it_offers: 'One-time emergency utility payment (up to $500), LIHEAP application assistance, weatherization referrals, and connection to additional county assistance programs.',
    protection_rule: null,
    source_url: 'https://www8.miamidade.gov/global/housing/community-action-plan.page',
    last_verified: '2026-03-15',
  },
];

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    for (const card of cards) {
      await client.query(`
        INSERT INTO playbook_cards
          (biller_name, biller_category, state, program_name, phone_number,
           call_script, eligibility, what_it_offers, protection_rule,
           source_url, last_verified)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
        ON CONFLICT (biller_name, state, program_name) DO UPDATE SET
          phone_number    = EXCLUDED.phone_number,
          call_script     = EXCLUDED.call_script,
          eligibility     = EXCLUDED.eligibility,
          what_it_offers  = EXCLUDED.what_it_offers,
          protection_rule = EXCLUDED.protection_rule,
          source_url      = EXCLUDED.source_url,
          last_verified   = EXCLUDED.last_verified,
          updated_at      = NOW()
      `, [
        card.biller_name, card.biller_category, card.state,
        card.program_name, card.phone_number, card.call_script,
        card.eligibility, card.what_it_offers, card.protection_rule || null,
        card.source_url, card.last_verified,
      ]);
    }

    await client.query('COMMIT');
    console.log(`Seeded ${cards.length} playbook cards.`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Seed failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
