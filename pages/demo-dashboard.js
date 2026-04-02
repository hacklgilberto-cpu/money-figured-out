// pages/demo-dashboard.js
// Unified demo page — Marcus Rivera's full financial picture.
// Mobile-first, single scroll, no login required.
// One canonical data source (buildMarcusProfile) feeds every section.

import { useState, useEffect, useRef } from 'react'
import Head from 'next/head'
import { buildMarcusProfile, marcusForecast, marcusCreditHistory, marcusPaveAttributes } from '../lib/demo-persona'

// ── Helpers ─────────────────────────────────────────────────────
const USD = (n) => n != null
  ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
  : '—'
const usd2 = (n) => n != null
  ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)
  : '—'

const shortDate = (d) => {
  const dt = new Date(d)
  return dt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

// ── Brand ───────────────────────────────────────────────────────
const OB = {
  blue: '#2B5BAE', blueShade: '#1A3C6E', bluePale: '#E8EFF8',
  yellow: '#F7BB00', yellowPale: '#FFF8E1',
  teal: '#00B5A0', tealPale: '#E6FAF6',
  red: '#DE350B', redPale: '#FFF0ED',
  grey: '#4A4A4A', greyLight: '#F7F7F7', greyBorder: '#E8E8E8',
}

const MODE_COLORS = {
  RED:    { bg: '#DE350B', text: '#fff', label: 'Crisis' },
  ORANGE: { bg: '#F57C00', text: '#fff', label: 'Tight' },
  YELLOW: { bg: '#F7BB00', text: '#4A4A4A', label: 'Watch' },
  GREEN:  { bg: '#00B5A0', text: '#fff', label: 'Stable' },
  BLUE:   { bg: '#2B5BAE', text: '#fff', label: 'Healthy' },
}

// ── Score band ──────────────────────────────────────────────────
function getScoreBand(score) {
  if (!score) return null
  if (score <= 579) return { label: 'Poor', color: '#DE350B', bg: '#FFF0ED' }
  if (score <= 669) return { label: 'Fair', color: '#BA7517', bg: '#FFF8E1' }
  if (score <= 739) return { label: 'Good', color: '#00B5A0', bg: '#E6FAF6' }
  if (score <= 799) return { label: 'Very good', color: '#185FA5', bg: '#E8EFF8' }
  return { label: 'Excellent', color: '#185FA5', bg: '#E8EFF8' }
}

// =================================================================
// SECTION COMPONENTS
// =================================================================

// ── 1. Verdict banner ───────────────────────────────────────────
function VerdictBanner({ forecast }) {
  const mode = MODE_COLORS[forecast.cashflow_mode] || MODE_COLORS.YELLOW
  return (
    <div style={{ background: mode.bg, color: mode.text, padding: '20px 16px', borderRadius: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span style={{ background: 'rgba(255,255,255,0.2)', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{mode.label}</span>
        <span style={{ fontSize: 12, opacity: 0.8 }}>Next paycheck in {forecast.days_to_payday} days</span>
      </div>
      <div style={{ fontSize: 32, fontWeight: 800, lineHeight: 1.1, marginBottom: 8 }}>
        {USD(forecast.current_balance)}
        <span style={{ fontSize: 14, fontWeight: 400, opacity: 0.8, marginLeft: 6 }}>in checking</span>
      </div>
      <p style={{ fontSize: 14, lineHeight: 1.55, margin: 0, opacity: 0.95 }}>
        {forecast.verdict_text}
      </p>
    </div>
  )
}

// ── 2. 14-day runway ────────────────────────────────────────────
function Runway({ forecast }) {
  const days = forecast.daily_balances || []
  const minBal = Math.min(...days.map(d => d.balance))
  const maxBal = Math.max(...days.map(d => d.balance))
  const range = maxBal - minBal || 1

  return (
    <Card label="14-day runway" headline="Day by day to your next paycheck">
      <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', height: 120, marginBottom: 12 }}>
        {days.map((d, i) => {
          const pct = ((d.balance - minBal) / range) * 100
          const isNeg = d.balance < 0
          const isPayday = d.event && d.event.includes('Paycheck')
          return (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <div style={{
                width: '100%', borderRadius: 4,
                height: `${Math.max(8, pct)}%`,
                background: isPayday ? OB.teal : isNeg ? OB.red : OB.blue,
                opacity: isNeg ? 1 : 0.7,
                transition: 'height 0.3s ease',
              }} />
            </div>
          )
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#999', marginBottom: 16 }}>
        <span>Today</span>
        <span>Payday (day {forecast.days_to_payday})</span>
        <span>Day 14</span>
      </div>
      {/* Event list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {days.filter(d => d.event).map((d, i) => {
          const isNeg = d.balance < 0
          const isIncome = d.event.includes('Paycheck')
          return (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '10px 12px', borderRadius: 10,
              background: isIncome ? OB.tealPale : isNeg ? OB.redPale : OB.greyLight,
              border: isNeg ? `1px solid ${OB.red}30` : '1px solid transparent',
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: OB.grey }}>{d.event}</div>
                <div style={{ fontSize: 11, color: '#999' }}>Day {d.day} — {shortDate(d.date)}</div>
              </div>
              <div style={{
                fontSize: 14, fontWeight: 700, flexShrink: 0, marginLeft: 8,
                color: isIncome ? OB.teal : isNeg ? OB.red : OB.grey,
              }}>
                {USD(d.balance)}
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

// ── 3. Credit score ─────────────────────────────────────────────
function CreditScore({ history }) {
  const latest = history[history.length - 1]
  const first = history[0]
  const band = getScoreBand(latest.score)
  const delta = latest.score - first.score
  const maxS = Math.max(...history.map(h => h.score))
  const minS = Math.min(...history.map(h => h.score))
  const range = maxS - minS || 1

  const REASON_TEXT = {
    14: 'Credit accounts not open long enough',
    15: 'Recent late payment affecting score',
    18: 'Balances too high relative to limits',
    22: 'Too many recent credit inquiries',
    29: 'Too few accounts with good payment history',
    38: 'Most recently opened account is too new',
    97: 'Limited number of open credit accounts',
    98: 'Too many unpaid collections',
  }

  return (
    <Card label="Credit health" headline={`${latest.score} — ${band.label}`} headlineColor={band.color}>
      {/* Mini sparkline */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 48, marginBottom: 8 }}>
        {history.map((h, i) => {
          const pct = ((h.score - minS) / range) * 100
          return (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{
                width: '100%', borderRadius: 3, height: `${Math.max(15, pct)}%`,
                background: i === history.length - 1 ? band.color : `${band.color}40`,
              }} />
            </div>
          )
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#999', marginBottom: 12 }}>
        <span>6 months ago</span>
        <span style={{ color: delta >= 0 ? OB.teal : OB.red, fontWeight: 600 }}>
          {delta >= 0 ? '+' : ''}{delta} pts
        </span>
        <span>Today</span>
      </div>
      {/* Reason codes */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {[latest.reason_code_1, latest.reason_code_2].filter(Boolean).map((code, i) => (
          <div key={i} style={{ padding: '8px 12px', background: OB.yellowPale, borderRadius: 8, fontSize: 12, color: '#7a5c00', lineHeight: 1.4 }}>
            {REASON_TEXT[code] || `Reason code ${code}`}
          </div>
        ))}
      </div>
      <p style={{ fontSize: 11, color: '#999', margin: '10px 0 0', lineHeight: 1.4 }}>
        VantageScore 3.0 via Experian. Soft check — does not affect your credit.
      </p>
    </Card>
  )
}

// ── 4. Pay period summary ───────────────────────────────────────
function PaySummary({ profile, pave }) {
  const income = pave.primary_income_monthly_average_past_30d
  const expenses = pave.essential_outflows_past_30d + pave.nonessential_outflows_past_30d
  const surplus = income - expenses
  const topMerchants = profile.topMerchants.slice(0, 6)

  return (
    <Card label="This pay period" headline={`${USD(income)}/mo income, ${USD(expenses)}/mo out`}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
        <MiniStat label="Monthly income" value={USD(income)} color={OB.teal} />
        <MiniStat label="Monthly expenses" value={USD(expenses)} color={OB.grey} />
        <MiniStat label="Left over" value={USD(Math.abs(surplus))} color={surplus > 0 ? OB.teal : OB.red} />
        <MiniStat label="Fees (90 days)" value={USD(pave.nsf_fee_past_90d + pave.overdraft_fee_past_90d)} color={OB.red} />
      </div>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#bbb', marginBottom: 8 }}>Where it goes</div>
      {topMerchants.map((m, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < topMerchants.length - 1 ? '1px solid #f3f3f3' : 'none' }}>
          <div>
            <span style={{ fontSize: 13, fontWeight: 600, color: OB.grey }}>{m.name}</span>
            <span style={{ fontSize: 11, color: '#ccc', marginLeft: 6 }}>{m.category}</span>
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: OB.grey }}>{USD(m.monthlyAvg)}/mo</span>
        </div>
      ))}
    </Card>
  )
}

// ── 5. Quick wins (from flags) ──────────────────────────────────
function QuickWins({ flags }) {
  const actionable = flags.filter(f => f.annualImpact > 100).sort((a, b) => b.annualImpact - a.annualImpact)
  const totalSavings = actionable.reduce((s, f) => s + f.annualImpact, 0)
  const [expanded, setExpanded] = useState(null)

  return (
    <Card label="Quick wins" headline={`${USD(Math.round(totalSavings / 12))}/mo you could keep`} headlineColor={OB.teal}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {actionable.map((flag, i) => (
          <div key={i}
            onClick={() => setExpanded(expanded === i ? null : i)}
            style={{
              padding: '14px 14px', borderRadius: 12, cursor: 'pointer',
              background: expanded === i ? OB.bluePale : 'white',
              border: `1px solid ${expanded === i ? OB.blue + '40' : OB.greyBorder}`,
              transition: 'all 0.15s',
            }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                <div style={{
                  width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                  background: OB.teal, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700,
                }}>{i + 1}</div>
                <span style={{ fontSize: 13, fontWeight: 600, color: OB.grey }}>
                  {flag.type === 'nsf_imminent' ? 'Avoid NSF fee today'
                    : flag.type === 'hours_cut' ? 'Income dropped $440/mo'
                    : flag.type === 'delivery_spend' ? 'Cut delivery apps'
                    : flag.type === 'phone_plan' ? 'Switch phone plan'
                    : flag.type === 'streaming_overlap' ? 'Drop 2 streaming services'
                    : flag.type === 'cc_interest' ? 'Attack credit card balance'
                    : flag.type === 'payday_loans' ? 'Replace payday loans'
                    : flag.type}
                </span>
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: OB.teal, flexShrink: 0 }}>
                +{USD(Math.round(flag.annualImpact / 12))}/mo
              </span>
            </div>
            {expanded === i && (
              <p style={{ fontSize: 13, color: '#555', lineHeight: 1.6, margin: '10px 0 0 36px' }}>
                {flag.message}
              </p>
            )}
          </div>
        ))}
      </div>
    </Card>
  )
}

// ── 6. Safety net playbooks ─────────────────────────────────────
function SafetyNet({ mode }) {
  if (mode !== 'RED' && mode !== 'ORANGE') return null

  // Hardcoded for demo — in production these come from playbook_cards table
  const playbooks = [
    {
      biller: 'AT&T', category: 'Phone',
      program: 'Payment Extension',
      phone: '1-800-288-2020',
      script: "Say: 'I need to set up a payment arrangement on my current bill.'",
      offers: 'Payment extension 7-14 days. Also check ACP discount ($30/mo off).',
      protection: 'Service cannot be terminated without 30 days written notice.',
    },
    {
      biller: 'Florida Power & Light', category: 'Electric',
      program: 'Payment Extension + Budget Billing',
      phone: '1-800-226-3545',
      script: "Say: 'I need a payment extension on my current bill.'",
      offers: '7-10 day extension. Budget Billing evens out payments across 12 months.',
      protection: 'FL law: 5 business days notice before disconnection. Cannot disconnect when temp forecast above 95°F.',
    },
    {
      biller: 'Wells Fargo', category: 'Bank',
      program: 'Overdraft Opt-Out + Fee Refund',
      phone: '1-800-869-3557',
      script: "Say: 'I want to turn off overdraft processing. Can you also refund my last NSF fee?'",
      offers: 'Opt-out of overdraft (transactions decline instead of $35 fee). Banks refund 1-2 fees/year if you ask.',
      protection: 'Federal Reg E: bank cannot charge OD fees on debit without your opt-in.',
    },
    {
      biller: 'Capital One', category: 'Credit card',
      program: 'Hardship Program',
      phone: '1-800-955-7070',
      script: "Say: 'I'm experiencing financial hardship. Can you lower my interest rate?'",
      offers: 'Temporary APR reduction to 0-8% for 6-12 months. Minimum payment reduction. Late fee waiver.',
      protection: null,
    },
  ]

  const resources = [
    {
      name: 'Feeding South Florida',
      type: 'Food bank',
      phone: '954-518-1818',
      detail: 'Free groceries. No ID required. Drive-through and walk-up. Check feedingsouthflorida.org for schedule.',
    },
    {
      name: 'Florida SNAP',
      type: 'Food stamps',
      phone: '1-866-762-2237',
      detail: 'Apply at myflorida.com/accessflorida. Expedited processing (7 days) if income below $150/mo or assets below $100.',
    },
    {
      name: '211 Helpline',
      type: 'Emergency help',
      phone: '211',
      detail: 'Free, 24/7. Say your zip code and what you need. Connects to utility assistance, rent help, food, prescriptions.',
    },
  ]

  return (
    <>
      <Card label="Safety net" headline="Programs for your exact billers" headlineColor={OB.red} accent={OB.red}>
        <p style={{ fontSize: 13, color: '#666', lineHeight: 1.5, margin: '0 0 14px' }}>
          Real phone numbers, real programs. Call today — most offer same-day relief.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {playbooks.map((p, i) => (
            <PlaybookCard key={i} {...p} />
          ))}
        </div>
      </Card>

      <Card label="Emergency resources" headline="Immediate help in Miami-Dade">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {resources.map((r, i) => (
            <div key={i} style={{ padding: '12px 14px', background: OB.tealPale, borderRadius: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: OB.grey }}>{r.name}</span>
                <span style={{ fontSize: 11, color: OB.teal, fontWeight: 600 }}>{r.type}</span>
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: OB.blue, marginBottom: 4 }}>{r.phone}</div>
              <p style={{ fontSize: 12, color: '#555', lineHeight: 1.45, margin: 0 }}>{r.detail}</p>
            </div>
          ))}
        </div>
      </Card>
    </>
  )
}

function PlaybookCard({ biller, category, program, phone, script, offers, protection }) {
  const [open, setOpen] = useState(false)
  return (
    <div
      onClick={() => setOpen(!open)}
      style={{
        padding: '14px', borderRadius: 12, cursor: 'pointer',
        background: open ? OB.redPale : 'white',
        border: `1px solid ${open ? OB.red + '30' : OB.greyBorder}`,
      }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: OB.grey }}>{biller}</div>
          <div style={{ fontSize: 11, color: '#999' }}>{program}</div>
        </div>
        <div style={{ fontSize: 14, fontWeight: 700, color: OB.blue }}>{phone}</div>
      </div>
      {open && (
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid #eee' }}>
          <div style={{ background: OB.bluePale, padding: '10px 12px', borderRadius: 8, marginBottom: 8 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: OB.blue, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>What to say</div>
            <p style={{ fontSize: 13, color: OB.blueShade, lineHeight: 1.45, margin: 0, fontStyle: 'italic' }}>{script}</p>
          </div>
          <p style={{ fontSize: 12, color: '#555', lineHeight: 1.45, margin: '0 0 4px' }}>{offers}</p>
          {protection && (
            <p style={{ fontSize: 11, color: OB.teal, fontWeight: 600, margin: 0, lineHeight: 1.4 }}>{protection}</p>
          )}
        </div>
      )}
    </div>
  )
}

// ── 7. AI Panel (full-width, not a chatbot bubble) ──────────────
function AIPanel({ profile, forecast }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (isOpen) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isOpen])

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 200)
  }, [isOpen])

  const suggestions = [
    "I can't make it to payday. What are my options?",
    "Which bill should I skip if I have to choose?",
    "How do I get my Capital One interest rate lowered?",
    "Am I eligible for food stamps?",
  ]

  async function send(text) {
    const userText = text || input.trim()
    if (!userText || loading) return

    const newHistory = [...messages, { role: 'user', content: userText }]
    setMessages(newHistory)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newHistory,
          analysis: { en: profile, isDemo: true },
          lang: 'en',
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setMessages([...newHistory, { role: 'assistant', content: data.message }])
      } else {
        setMessages([...newHistory, { role: 'assistant', content: 'Something went wrong. Try again in a moment.' }])
      }
    } catch {
      setMessages([...newHistory, { role: 'assistant', content: 'Connection error. Please try again.' }])
    }
    setLoading(false)
  }

  if (!isOpen) {
    return (
      <div
        onClick={() => setIsOpen(true)}
        style={{
          background: OB.blue, borderRadius: 16, padding: '20px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 14,
        }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0,
        }}>
          ✦
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'white', marginBottom: 2 }}>Ask your money coach</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>
            I already know your numbers. Ask me anything about your finances.
          </div>
        </div>
        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 20, flexShrink: 0 }}>→</div>
      </div>
    )
  }

  return (
    <div style={{ background: 'white', borderRadius: 16, border: `2px solid ${OB.blue}`, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        background: OB.blue, padding: '16px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20 }}>✦</span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'white' }}>Your Money Coach</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>Powered by AI. Knows your real numbers.</div>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', borderRadius: 8, padding: '6px 12px', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
          Minimize
        </button>
      </div>

      {/* Messages */}
      <div style={{ maxHeight: 400, overflowY: 'auto', padding: '16px' }}>
        {messages.length === 0 && (
          <div>
            <p style={{ fontSize: 13, color: '#888', margin: '0 0 12px', lineHeight: 1.5 }}>
              I can see your bank accounts, your bills, your credit score, and what's coming before payday.
              Ask me anything about your money.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => send(s)}
                  style={{
                    background: OB.greyLight, border: `1px solid ${OB.greyBorder}`, borderRadius: 10,
                    padding: '10px 14px', fontSize: 13, color: OB.grey, cursor: 'pointer',
                    textAlign: 'left', fontFamily: 'inherit', lineHeight: 1.4,
                  }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} style={{
            marginBottom: 12, display: 'flex',
            justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
          }}>
            <div style={{
              maxWidth: '85%', padding: '10px 14px', borderRadius: 14,
              background: m.role === 'user' ? OB.blue : OB.greyLight,
              color: m.role === 'user' ? 'white' : OB.grey,
              fontSize: 13, lineHeight: 1.55, whiteSpace: 'pre-wrap',
            }}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 12 }}>
            <div style={{ background: OB.greyLight, padding: '10px 14px', borderRadius: 14, fontSize: 13, color: '#999' }}>
              Thinking...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ borderTop: `1px solid ${OB.greyBorder}`, padding: '12px 16px', display: 'flex', gap: 8 }}>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder="Ask about your finances..."
          style={{
            flex: 1, border: `1px solid ${OB.greyBorder}`, borderRadius: 10, padding: '10px 14px',
            fontSize: 14, fontFamily: 'inherit', outline: 'none',
          }}
        />
        <button
          onClick={() => send()}
          disabled={loading || !input.trim()}
          style={{
            background: OB.blue, color: 'white', border: 'none', borderRadius: 10,
            padding: '10px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
            fontFamily: 'inherit', opacity: loading || !input.trim() ? 0.5 : 1,
          }}>
          Send
        </button>
      </div>

      <p style={{ fontSize: 10, color: '#bbb', textAlign: 'center', padding: '0 16px 10px', margin: 0 }}>
        Not a financial advisor. For informational purposes only.
      </p>
    </div>
  )
}

// ── Shared components ───────────────────────────────────────────
function Card({ label, headline, headlineColor, accent, children }) {
  return (
    <div style={{
      background: 'white', borderRadius: 16, padding: '18px 16px',
      border: accent ? `2px solid ${accent}` : `1px solid ${OB.greyBorder}`,
    }}>
      {label && (
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#bbb', marginBottom: 6 }}>{label}</div>
      )}
      {headline && (
        <div style={{ fontSize: 16, fontWeight: 800, color: headlineColor || OB.grey, lineHeight: 1.25, marginBottom: 14 }}>{headline}</div>
      )}
      {children}
    </div>
  )
}

function MiniStat({ label, value, color }) {
  return (
    <div style={{ background: OB.greyLight, borderRadius: 10, padding: '10px 12px' }}>
      <div style={{ fontSize: 10, color: '#999', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 800, color }}>{value}</div>
    </div>
  )
}

// =================================================================
// PAGE
// =================================================================

export default function DemoDashboard({ profile }) {
  const forecast = profile.forecast
  const creditHistory = profile.creditHistory
  const pave = profile.paveAttributes

  return (
    <>
      <Head>
        <title>Marcus Rivera — Your Money, Figured Out</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@400;600;700;800&display=swap" rel="stylesheet" />
      </Head>

      <style jsx global>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #F5F5F3; font-family: 'Nunito Sans', -apple-system, sans-serif; -webkit-font-smoothing: antialiased; }
      `}</style>

      {/* Header */}
      <div style={{ background: OB.blue, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="22" height="24" viewBox="0 0 100 110" fill="none">
            <polygon points="28,10 52,8 52,42 20,55" fill="#00B5A0" />
            <polygon points="52,8 78,18 72,48 52,42" fill="#F7BB00" />
            <polygon points="20,55 52,42 48,90 18,75" fill="white" opacity="0.9" />
            <polygon points="52,42 72,48 68,88 48,90" fill="#00B5A0" opacity="0.85" />
          </svg>
          <span style={{ color: 'white', fontSize: 15, fontWeight: 700 }}>OneBlinc</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>Demo</span>
          <span style={{ background: OB.yellow, color: OB.blueShade, fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 6 }}>Marcus Rivera</span>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '16px 12px 120px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* 1. Verdict */}
          <VerdictBanner forecast={forecast} />

          {/* OneBlinc CTA when in crisis */}
          {(forecast.cashflow_mode === 'RED' || forecast.cashflow_mode === 'ORANGE') && (
            <div style={{ background: OB.tealPale, border: `1px solid ${OB.teal}40`, borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ fontSize: 22, flexShrink: 0 }}>⚡</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: OB.grey }}>
                  A {USD(forecast.deposit_required)} OneBlinc advance covers the gap
                </div>
                <div style={{ fontSize: 12, color: '#666' }}>Interest-free. Repaid automatically from your next paycheck.</div>
              </div>
            </div>
          )}

          {/* 2. 14-day runway */}
          <Runway forecast={forecast} />

          {/* 3. Credit score */}
          <CreditScore history={creditHistory} />

          {/* 4. Pay period summary */}
          <PaySummary profile={profile} pave={pave} />

          {/* 5. Quick wins */}
          <QuickWins flags={profile.flags} />

          {/* 6. Safety net playbooks */}
          <SafetyNet mode={forecast.cashflow_mode} />

          {/* 7. AI Panel */}
          <AIPanel profile={profile} forecast={forecast} />

          {/* Disclaimer */}
          <p style={{ fontSize: 10, color: '#bbb', textAlign: 'center', lineHeight: 1.5, padding: '8px 0' }}>
            For informational purposes only. Not financial advice. Phone numbers and program details
            were verified March 2026 and may change. Always confirm directly with the provider.
          </p>
        </div>
      </div>
    </>
  )
}

// ── Server-side: build Marcus's profile ─────────────────────────
export async function getServerSideProps() {
  const profile = buildMarcusProfile('FL')
  return {
    props: {
      profile: JSON.parse(JSON.stringify(profile)),
    },
  }
}
