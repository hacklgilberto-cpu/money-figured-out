import { getServerSession } from 'next-auth'
import { authOptions } from './api/auth/[...nextauth]'
import { pool } from '../lib/supabaseClient'
import Head from 'next/head'
import { useState } from 'react'

const REASON_CODE_TEXT = {
  14:  'Your credit accounts haven\'t been open long enough yet',
  15:  'A recent late payment is affecting your score',
  18:  'Your account balances are too high relative to your limits',
  22:  'You have too many recent credit inquiries',
  29:  'You have too few accounts with a good payment history',
  38:  'Your most recently opened account is too new',
  97:  'You have a limited number of open credit accounts',
  98:  'You have too many unpaid collections on your report',
}

function getScoreBand(score) {
  if (!score) return null
  if (score <= 579) return { label: 'Poor',      color: '#E24B4A', bg: '#FCEBEB' }
  if (score <= 669) return { label: 'Fair',      color: '#BA7517', bg: '#FAEEDA' }
  if (score <= 739) return { label: 'Good',      color: '#639922', bg: '#EAF3DE' }
  if (score <= 799) return { label: 'Very Good', color: '#1D9E75', bg: '#E1F5EE' }
  return               { label: 'Excellent',    color: '#185FA5', bg: '#E6F1FB' }
}

function ScoreHero({ score, scoreType, pullDate, delta }) {
  const band = getScoreBand(score)
  if (!score) {
    return (
      <div style={styles.heroCard}>
        <p style={styles.noScore}>We could not retrieve your score this month. We will try again next cycle.</p>
      </div>
    )
  }
  return (
    <div style={styles.heroCard}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <p style={styles.heroLabel}>Your credit score</p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
            <span style={{ fontSize: 64, fontWeight: 500, color: band.color, lineHeight: 1 }}>{score}</span>
            {delta !== null && (
              <span style={{ fontSize: 16, color: delta >= 0 ? '#639922' : '#E24B4A', fontWeight: 500 }}>
                {delta >= 0 ? `+${delta}` : delta} this month
              </span>
            )}
          </div>
          <span style={{ ...styles.bandPill, color: band.color, background: band.bg }}>{band.label}</span>
          <p style={styles.softCheck}>This is a soft check — it does not affect your credit</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={styles.metaLabel}>{scoreType}</p>
          <p style={styles.metaLabel}>Last updated {new Date(pullDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
        </div>
      </div>
    </div>
  )
}

function ReasonCards({ code1, code2 }) {
  const codes = [code1, code2].filter(Boolean)
  if (!codes.length) return null
  return (
    <div>
      <h2 style={styles.sectionTitle}>What is affecting your score</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
        {codes.map(code => (
          <div key={code} style={styles.reasonCard}>
            <p style={styles.reasonText}>{REASON_CODE_TEXT[code] || `Factor code ${code}`}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function AccountSnapshot({ openLines, totalOpenBalance, pastDueLines, totalPastDue }) {
  return (
    <div>
      <h2 style={styles.sectionTitle}>Account snapshot</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
        {[
          { label: 'Open accounts',   value: openLines ?? '—' },
          { label: 'Past due',        value: pastDueLines ?? '—' },
          { label: 'Total balance',   value: totalOpenBalance != null ? `$${Number(totalOpenBalance).toLocaleString()}` : '—' },
          { label: 'Past due amount', value: totalPastDue != null && totalPastDue > 0 ? `$${Number(totalPastDue).toLocaleString()}` : '$0' },
        ].map(item => (
          <div key={item.label} style={styles.metricCard}>
            <p style={styles.metricLabel}>{item.label}</p>
            <p style={styles.metricValue}>{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function CreditHealth({ snapshot, error }) {
  const [refreshing, setRefreshing] = useState(false)
  const [refreshMsg, setRefreshMsg] = useState(null)

  async function handleRefresh() {
    setRefreshing(true)
    setRefreshMsg(null)
    try {
      const res = await fetch('/api/dev/trigger-credit-pull')
      if (res.ok) {
        window.location.reload()
      } else {
        const data = await res.json()
        setRefreshMsg(`Refresh failed: ${data.error || 'unknown error'}`)
      }
    } catch {
      setRefreshMsg('Refresh failed. Check your connection and try again.')
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <>
      <Head>
        <title>Credit Health — Your Money, Figured Out</title>
      </Head>
      <div style={styles.page}>
        <div style={styles.container}>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
            <h1 style={styles.pageTitle}>Credit Health</h1>
            <button onClick={handleRefresh} disabled={refreshing} style={styles.refreshBtn}>
              {refreshing ? 'Refreshing...' : 'Refresh score'}
            </button>
          </div>

          {refreshMsg && (
            <div style={styles.refreshMsg}>{refreshMsg}</div>
          )}

          {error && (
            <div style={styles.errorMsg}>{error}</div>
          )}

          {!error && !snapshot && (
            <div style={styles.heroCard}>
              <p style={styles.noScore}>No credit data yet. Hit Refresh score to run your first pull.</p>
            </div>
          )}

          {snapshot && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <ScoreHero
                score={snapshot.score}
                scoreType={snapshot.score_type}
                pullDate={snapshot.pull_date}
                delta={snapshot.delta}
              />
              {snapshot.is_no_hit && (
                <div style={styles.infoMsg}>
                  Your profile shows limited alt-credit data — this is normal for many customers.
                </div>
              )}
              {snapshot.active_duty_indicator === 1 && (
                <div style={styles.infoMsg}>
                  As an active duty service member, special protections apply to your account under the Military Lending Act.
                </div>
              )}
              <ReasonCards code1={snapshot.reason_code_1} code2={snapshot.reason_code_2} />
              <AccountSnapshot
                openLines={snapshot.open_lines}
                totalOpenBalance={snapshot.total_open_balance}
                pastDueLines={snapshot.past_due_lines}
                totalPastDue={snapshot.total_past_due_amount}
              />
            </div>
          )}

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

  try {
    const userId = session.userId

    const { rows } = await pool.query(`
      SELECT
        cs.score,
        cs.score_type,
        cs.reason_code_1,
        cs.reason_code_2,
        cs.active_duty_indicator,
        cs.is_no_hit,
        cs.open_lines,
        cs.past_due_lines,
        cs.total_open_balance,
        cs.total_past_due_amount,
        cs.pull_date,
        prev.score AS prev_score
      FROM credit_snapshots cs
      LEFT JOIN LATERAL (
        SELECT score FROM credit_snapshots
        WHERE customer_id = cs.customer_id
          AND pull_date < cs.pull_date
        ORDER BY pull_date DESC
        LIMIT 1
      ) prev ON true
      WHERE cs.customer_id = $1
      ORDER BY cs.pull_date DESC
      LIMIT 1
    `, [userId])

    if (!rows.length) {
      return { props: { snapshot: null } }
    }

    const row = rows[0]
    const snapshot = {
      ...row,
      pull_date: row.pull_date?.toISOString?.() ?? row.pull_date,
      total_open_balance: row.total_open_balance ? Number(row.total_open_balance) : null,
      total_past_due_amount: row.total_past_due_amount ? Number(row.total_past_due_amount) : null,
      delta: row.prev_score != null && row.score != null
        ? row.score - row.prev_score
        : null,
    }

    return { props: { snapshot } }
  } catch (err) {
    console.error('credit-health page error:', err)
    return { props: { snapshot: null, error: 'Could not load credit data. Try again shortly.' } }
  }
}

const styles = {
  page: {
    minHeight: '100vh',
    background: 'var(--color-background-tertiary, #f5f5f3)',
    padding: '2rem 1rem',
  },
  container: {
    maxWidth: 720,
    margin: '0 auto',
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: 500,
    margin: 0,
  },
  heroCard: {
    background: '#fff',
    border: '0.5px solid rgba(0,0,0,0.1)',
    borderRadius: 12,
    padding: '1.5rem',
  },
  heroLabel: {
    fontSize: 13,
    color: '#73726c',
    margin: '0 0 6px',
  },
  bandPill: {
    display: 'inline-block',
    fontSize: 12,
    fontWeight: 500,
    padding: '3px 10px',
    borderRadius: 10,
    marginTop: 8,
  },
  softCheck: {
    fontSize: 12,
    color: '#73726c',
    margin: '8px 0 0',
  },
  metaLabel: {
    fontSize: 12,
    color: '#73726c',
    margin: '0 0 4px',
  },
  noScore: {
    fontSize: 14,
    color: '#73726c',
    margin: 0,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 500,
    margin: '0 0 12px',
  },
  reasonCard: {
    background: '#fff',
    border: '0.5px solid rgba(0,0,0,0.1)',
    borderRadius: 8,
    padding: '12px 14px',
  },
  reasonText: {
    fontSize: 13,
    color: '#3d3d3a',
    margin: 0,
    lineHeight: 1.5,
  },
  metricCard: {
    background: '#fff',
    border: '0.5px solid rgba(0,0,0,0.1)',
    borderRadius: 8,
    padding: '12px 14px',
  },
  metricLabel: {
    fontSize: 12,
    color: '#73726c',
    margin: '0 0 4px',
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 500,
    margin: 0,
    color: '#3d3d3a',
  },
  refreshBtn: {
    fontSize: 13,
    padding: '8px 16px',
    border: '0.5px solid rgba(0,0,0,0.2)',
    borderRadius: 8,
    background: 'transparent',
    cursor: 'pointer',
  },
  refreshMsg: {
    fontSize: 13,
    padding: '10px 14px',
    background: '#EAF3DE',
    color: '#3B6D11',
    borderRadius: 8,
    marginBottom: 8,
  },
  errorMsg: {
    fontSize: 13,
    padding: '10px 14px',
    background: '#FCEBEB',
    color: '#A32D2D',
    borderRadius: 8,
    marginBottom: 8,
  },
  infoMsg: {
    fontSize: 13,
    padding: '10px 14px',
    background: '#E6F1FB',
    color: '#185FA5',
    borderRadius: 8,
  },
}
