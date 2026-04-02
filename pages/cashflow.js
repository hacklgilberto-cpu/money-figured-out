import { getServerSession } from 'next-auth'
import { authOptions } from './api/auth/[...nextauth]'
import { pool } from '../lib/supabaseClient'
import Head from 'next/head'
import { useState } from 'react'

// ── Cashflow mode detection ──────────────────────────────────────────────────

function computeMode({ monthlyIncome, debtPayments30d, subscriptions30d, essentialOutflows30d, feesTotal90d }) {
  if (!monthlyIncome) return 'UNKNOWN'
  const totalObligations = (debtPayments30d || 0) + (subscriptions30d || 0) + (essentialOutflows30d || 0)
  const ratio = totalObligations / monthlyIncome
  const hasRecentFees = feesTotal90d > 50

  if (ratio > 0.95 || hasRecentFees && ratio > 0.80) return 'RED'
  if (ratio > 0.75 || hasRecentFees) return 'ORANGE'
  if (ratio > 0.55) return 'YELLOW'
  if (ratio > 0.35) return 'GREEN'
  return 'BLUE'
}

const MODE_CONFIG = {
  RED:     { label: 'Critical',    color: '#E24B4A', bg: '#FCEBEB', text: 'Your obligations are consuming nearly all income. Focus on triage.' },
  ORANGE:  { label: 'Tight',       color: '#BA7517', bg: '#FAEEDA', text: 'Bills are eating most of your paycheck. Watch the next 14 days closely.' },
  YELLOW:  { label: 'Watchful',    color: '#639922', bg: '#EAF3DE', text: 'You have some breathing room but patterns need attention.' },
  GREEN:   { label: 'Stable',      color: '#1D9E75', bg: '#E1F5EE', text: 'You are stable. Good time to build habits.' },
  BLUE:    { label: 'Healthy',     color: '#185FA5', bg: '#E6F1FB', text: 'You are in a strong position. Keep it up.' },
  UNKNOWN: { label: 'Loading',     color: '#888780', bg: '#F1EFE8', text: 'Connect your bank to see your cashflow status.' },
}

// ── 14-day projection (stubbed until live Pave data) ────────────────────────

function build14DayMap({ monthlyIncome, isWeekly, isBiweekly, subscriptions30d, debtPayments30d }) {
  const today = new Date()
  const days = []
  let runningBalance = 847  // stubbed current balance — replace with Plaid balance later

  // Estimated weekly paycheck if weekly pay
  const paycheckAmount = isWeekly
    ? (monthlyIncome / 4.33)
    : isBiweekly
    ? (monthlyIncome / 2)
    : (monthlyIncome)

  // Rough daily recurring obligation
  const dailyBurn = ((subscriptions30d || 0) + (debtPayments30d || 0)) / 30

  for (let i = 0; i < 14; i++) {
    const date = new Date(today)
    date.setDate(today.getDate() + i)
    const dayOfWeek = date.getDay()
    const label = i === 0 ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' })

    // Payday: Friday for weekly, every 2 Fridays for biweekly
    const isPayday = isWeekly
      ? dayOfWeek === 5
      : isBiweekly
      ? dayOfWeek === 5 && i <= 7
      : false

    const inflow  = isPayday ? paycheckAmount : 0
    const outflow = dailyBurn + (i === 3 ? 40 : 0)  // stub a bill hit day 3

    runningBalance = runningBalance + inflow - outflow

    days.push({
      label,
      date: date.toISOString().slice(0, 10),
      inflow:  isPayday ? paycheckAmount : 0,
      outflow: outflow,
      balance: runningBalance,
      isPayday,
      isToday: i === 0,
      isNegative: runningBalance < 0,
      isLow: runningBalance > 0 && runningBalance < 100,
    })
  }

  return days
}

// ── Sub-components ───────────────────────────────────────────────────────────

function ModeBanner({ mode, income }) {
  const cfg = MODE_CONFIG[mode] || MODE_CONFIG.UNKNOWN
  return (
    <div style={{ background: cfg.bg, border: `0.5px solid ${cfg.color}40`, borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{ width: 10, height: 10, borderRadius: '50%', background: cfg.color, flexShrink: 0 }} />
      <div>
        <span style={{ fontSize: 12, fontWeight: 500, color: cfg.color, letterSpacing: '0.06em' }}>{mode} — {cfg.label}</span>
        <p style={{ fontSize: 13, color: '#3d3d3a', margin: '2px 0 0', lineHeight: 1.4 }}>{cfg.text}</p>
      </div>
    </div>
  )
}

function StatCard({ label, value, sub, accent }) {
  return (
    <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.08)', borderRadius: 10, padding: '14px 16px', flex: 1, minWidth: 130 }}>
      <p style={{ fontSize: 12, color: '#73726c', margin: '0 0 6px' }}>{label}</p>
      <p style={{ fontSize: 22, fontWeight: 500, margin: 0, color: accent || '#3d3d3a', lineHeight: 1 }}>{value}</p>
      {sub && <p style={{ fontSize: 11, color: '#73726c', margin: '4px 0 0' }}>{sub}</p>}
    </div>
  )
}

function FeeCard({ fees }) {
  const total = fees.reduce((s, f) => s + f.amount, 0)
  if (total === 0) return (
    <div style={styles.card}>
      <p style={styles.cardTitle}>Avoidable fees — last 90 days</p>
      <p style={{ fontSize: 13, color: '#73726c', margin: 0 }}>No fees detected in the last 90 days.</p>
    </div>
  )

  return (
    <div style={styles.card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
        <p style={styles.cardTitle}>Avoidable fees — last 90 days</p>
        <span style={{ fontSize: 18, fontWeight: 500, color: '#E24B4A' }}>${total.toFixed(0)}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {fees.map(fee => (
          <div key={fee.fee_type} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#E24B4A' }} />
              <span style={{ fontSize: 13, color: '#3d3d3a' }}>{fee.merchant_name}</span>
            </div>
            <span style={{ fontSize: 13, fontWeight: 500, color: '#3d3d3a' }}>${fee.amount.toFixed(0)}</span>
          </div>
        ))}
      </div>
      <p style={{ fontSize: 12, color: '#73726c', margin: '12px 0 0', borderTop: '0.5px solid rgba(0,0,0,0.06)', paddingTop: 10 }}>
        These fees are avoidable. Keeping a $200 buffer eliminates most overdraft and NSF charges.
      </p>
    </div>
  )
}

function DayRow({ day }) {
  const balanceColor = day.isNegative ? '#E24B4A' : day.isLow ? '#BA7517' : '#3d3d3a'
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '110px 1fr 1fr 90px',
      gap: 8,
      padding: '10px 0',
      borderBottom: '0.5px solid rgba(0,0,0,0.05)',
      alignItems: 'center',
      background: day.isToday ? '#F1EFE820' : 'transparent',
    }}>
      <span style={{ fontSize: 12, color: day.isToday ? '#3d3d3a' : '#73726c', fontWeight: day.isToday ? 500 : 400 }}>
        {day.label}
      </span>
      <span style={{ fontSize: 12, color: '#1D9E75', fontWeight: 500 }}>
        {day.inflow > 0 ? `+$${day.inflow.toFixed(0)}` : ''}
        {day.isPayday && <span style={{ fontSize: 10, color: '#1D9E75', marginLeft: 4, background: '#E1F5EE', padding: '1px 5px', borderRadius: 6 }}>payday</span>}
      </span>
      <span style={{ fontSize: 12, color: day.outflow > 50 ? '#BA7517' : '#73726c' }}>
        {day.outflow > 0.5 ? `-$${day.outflow.toFixed(0)}` : ''}
      </span>
      <span style={{ fontSize: 12, fontWeight: 500, color: balanceColor, textAlign: 'right' }}>
        ${day.balance.toFixed(0)}
      </span>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function Cashflow({ income, fees, mode, mapDays, dataNote }) {
  const cfg = MODE_CONFIG[mode] || MODE_CONFIG.UNKNOWN
  const feesTotal = fees.reduce((s, f) => s + f.amount, 0)
  const raw = income?.raw_json || {}

  return (
    <>
      <Head>
        <title>Cashflow — Your Money, Figured Out</title>
      </Head>
      <div style={styles.page}>
        <div style={styles.container}>

          {/* Header */}
          <div style={{ marginBottom: 20 }}>
            <h1 style={styles.pageTitle}>Your next 14 days</h1>
            <p style={{ fontSize: 13, color: '#73726c', margin: '4px 0 0' }}>
              Can you make it to your next paycheck?
            </p>
          </div>

          {/* Mode banner */}
          <div style={{ marginBottom: 20 }}>
            <ModeBanner mode={mode} />
          </div>

          {/* Stat row */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
            <StatCard
              label="Monthly income"
              value={raw.monthly_income ? `$${Number(raw.monthly_income).toLocaleString()}` : '—'}
              sub={income?.is_weekly ? 'Weekly pay cycle' : income?.is_biweekly ? 'Biweekly pay cycle' : null}
            />
            <StatCard
              label="Subscriptions / mo"
              value={raw.subscriptions_30d ? `$${Number(raw.subscriptions_30d).toFixed(0)}` : '—'}
              sub="Netflix, Hulu, and others"
              accent={raw.subscriptions_30d > 150 ? '#BA7517' : null}
            />
            <StatCard
              label="Fees paid (90 days)"
              value={feesTotal > 0 ? `$${feesTotal}` : '$0'}
              sub="NSF, overdraft, ATM"
              accent={feesTotal > 0 ? '#E24B4A' : '#1D9E75'}
            />
            <StatCard
              label="Debt payments / mo"
              value={raw.debt_payments_30d ? `$${Number(raw.debt_payments_30d).toFixed(0)}` : '—'}
              sub="Loans, credit cards"
            />
          </div>

          {/* 14-day map */}
          <div style={{ ...styles.card, marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
              <p style={styles.cardTitle}>14-day cashflow map</p>
              <span style={{ fontSize: 11, color: '#73726c' }}>projected</span>
            </div>
            <p style={{ fontSize: 12, color: '#73726c', margin: '0 0 12px' }}>
              Based on your income pattern and known obligations.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr 1fr 90px', gap: 8, paddingBottom: 6, borderBottom: '0.5px solid rgba(0,0,0,0.1)', marginBottom: 2 }}>
              <span style={{ fontSize: 11, color: '#73726c' }}>Date</span>
              <span style={{ fontSize: 11, color: '#73726c' }}>In</span>
              <span style={{ fontSize: 11, color: '#73726c' }}>Out</span>
              <span style={{ fontSize: 11, color: '#73726c', textAlign: 'right' }}>Balance</span>
            </div>
            {mapDays.map(day => <DayRow key={day.date} day={day} />)}
            {dataNote && (
              <p style={{ fontSize: 11, color: '#73726c', margin: '10px 0 0', fontStyle: 'italic' }}>{dataNote}</p>
            )}
          </div>

          {/* Fee card */}
          <div style={{ marginBottom: 16 }}>
            <FeeCard fees={fees} />
          </div>

          {/* Food delivery habit card */}
          {raw.food_delivery_30d > 0 && (
            <div style={{ ...styles.card, marginBottom: 16 }}>
              <p style={styles.cardTitle}>Spending pattern</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontSize: 14, margin: '6px 0 2px', color: '#3d3d3a' }}>
                    Food delivery — <strong>${Number(raw.food_delivery_30d).toFixed(0)}/mo</strong>
                  </p>
                  <p style={{ fontSize: 12, color: '#73726c', margin: 0 }}>
                    That is ${(Number(raw.food_delivery_30d) * 12).toFixed(0)} a year on delivery apps.
                    Cutting this in half saves ${(Number(raw.food_delivery_30d) * 6).toFixed(0)} annually.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Data note */}
          <div style={{ padding: '10px 14px', background: '#F1EFE8', borderRadius: 8, fontSize: 12, color: '#5F5E5A' }}>
            Data sourced from Pave cashflow attributes. Live bill predictions and balance projections activate when Pave API is connected.
          </div>

        </div>
      </div>
    </>
  )
}

export async function getServerSideProps(context) {
  const session = await getServerSession(context.req, context.res, authOptions)
  if (!session) {
    return { redirect: { destination: '/login', permanent: false } }
  }
  console.log('[cashflow] session.user:', JSON.stringify(session?.user))

  const userId = process.env.MARCUS_USER_ID // TODO: replace with real user lookup

  try {
    const [feeResult, incomeResult] = await Promise.all([
      pool.query(`
        SELECT fee_type, merchant_name, amount
        FROM fee_events
        WHERE user_id = $1
        ORDER BY amount DESC
      `, [userId]),

      pool.query(`
        SELECT synced_date, deposit_amount_required, next_paydate, raw_json
        FROM income_predictions
        WHERE user_id = $1
        ORDER BY synced_date DESC
        LIMIT 1
      `, [userId]),
    ])

    const fees   = feeResult.rows.map(r => ({ ...r, amount: Number(r.amount) }))
    const income = incomeResult.rows[0] || null
    const raw    = income?.raw_json || {}

    // Compute cashflow mode from real data
    const mode = computeMode({
      monthlyIncome:      raw.monthly_income,
      debtPayments30d:    raw.debt_payments_30d,
      subscriptions30d:   raw.subscriptions_30d,
      essentialOutflows30d: raw.essential_outflows_30d,
      feesTotal90d:       fees.reduce((s, f) => s + f.amount, 0),
    })

    // Build 14-day projection
    const mapDays = build14DayMap({
      monthlyIncome:     raw.monthly_income,
      isWeekly:          raw.is_weekly,
      isBiweekly:        raw.is_biweekly,
      subscriptions30d:  raw.subscriptions_30d,
      debtPayments30d:   raw.debt_payments_30d,
    })

    return {
      props: {
        income: income ? {
          ...income,
          synced_date: income.synced_date?.toISOString?.() ?? String(income.synced_date),
          raw_json: raw,
        } : null,
        fees,
        mode,
        mapDays,
        dataNote: 'Balance projection uses a $847 starting balance stub. Connect live Pave balance data to see your real numbers.',
      },
    }
  } catch (err) {
    console.error('[cashflow] page error:', err)
    return {
      props: { income: null, fees: [], mode: 'UNKNOWN', mapDays: [], dataNote: null },
    }
  }
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#f5f5f3',
    padding: '2rem 1rem',
  },
  container: {
    maxWidth: 680,
    margin: '0 auto',
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: 500,
    margin: 0,
    color: '#2C2C2A',
  },
  card: {
    background: '#fff',
    border: '0.5px solid rgba(0,0,0,0.08)',
    borderRadius: 12,
    padding: '16px 18px',
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: 500,
    color: '#3d3d3a',
    margin: '0 0 2px',
    letterSpacing: '0.01em',
  },
}
