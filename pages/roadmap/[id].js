import { useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { signIn, useSession } from 'next-auth/react'
import FinancialChat from '../../components/FinancialChat'

// ── Currency formatter (USD) ───────────────────────────────────
const USD = (n) => n != null
  ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
  : '—'

// OneBlinc brand
const OB = {
  blue:      '#2B5BAE',
  blueShade: '#1A3C6E',
  yellow:    '#F7BB00',
  teal:      '#00B5A0',
  grey:      '#4A4A4A',
}

// ── Logo mark ─────────────────────────────────────────────────
function LogoMark({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 110" fill="none">
      <polygon points="28,10 52,8 52,42 20,55" fill="#00B5A0" />
      <polygon points="52,8 78,18 72,48 52,42" fill="#F7BB00" />
      <polygon points="20,55 52,42 48,90 18,75" fill="#2B5BAE" />
      <polygon points="52,42 72,48 68,88 48,90" fill="#00B5A0" opacity="0.85" />
      <polygon points="36,40 36,68 60,54" fill="white" opacity="0.95" />
    </svg>
  )
}

// ── Copy ──────────────────────────────────────────────────────
const C = {
  EN: {
    title: 'Your Paycheck Picture',
    hereIsWhat: "HERE'S WHAT WE FOUND",
    heroHeadline: (n) => `${USD(n)}/mo you could keep`,
    heroSub: 'Here are your quick wins — and exactly how to get them.',
    scrollCta: 'Show me how',
    cashFlowLabel: 'YOUR MONEY THIS PAY PERIOD',
    income: 'Monthly income',
    expenses: 'Monthly expenses',
    surplusLabel: 'Left over each paycheck',
    cashFlowStatus: { on_track: '✅ On track', tight: '⚠️ Tight', at_risk: '🔴 At risk' },
    topSpending: 'Where it goes',
    perMonth: '/mo',
    safeAdvanceLabel: 'YOUR OVERDRAFT SHIELD',
    safeAdvanceNone: "You're good to payday — no advance needed",
    repaymentNote: 'Repayment note',
    adviceIfZero: 'What to do instead',
    movesLabel: 'YOUR QUICK WINS',
    movesTitle: 'Do these first. Each one puts money back in your pocket.',
    tapToExpand: 'Tap any action to see the exact steps',
    howExactly: 'How, exactly',
    habitsLabel: 'CUT THIS FIRST',
    habitsSub: (n) => `${USD(n)}/mo back in your pocket`,
    keepThese: 'Worth keeping',
    spendingLabel: 'SPENDING SNAPSHOT',
    savePlan: 'Save your plan',
    saveSub: 'Track your progress as you check things off. We refresh your picture every 30 days.',
    saveCta: "Save my plan. It's free.",
    saveSeconds: '20 seconds. No credit card.',
    createAccount: 'Create your free account',
    roadmapWaiting: 'Your plan will be waiting for you.',
    emailLabel: 'Email',
    passwordLabel: 'Password',
    saveButton: 'Save my plan',
    saving: 'Saving…',
    haveAccount: 'Already have an account?',
    signIn: 'Sign in',
    partial: 'Partial picture',
    connectMore: 'Connect more accounts',
    disclaimer: 'For informational purposes only. Not financial advice.',
    runwayLabel: 'YOUR PAY PERIOD RUNWAY',
    runwayMakeIt: "You're on track to payday",
    runwayTight: "It'll be close to payday",
    runwayShort: 'You may run short before payday',
    runwayDailyBurn: 'Daily spend',
    runwayCta: (amt) => `Need a cushion? OneBlinc advances start at ${amt} — interest-free.`,
    dayToday: 'Today',
    dayPayday: 'Payday',
    sitLabels: {
      debt_payoff:        'Pay this off first',
      subscription_creep: 'Subscriptions adding up',
      delivery_habit:     'Delivery is your biggest drain',
      tight_paycheck:     'Your paycheck is stretched thin',
      phone_plan:         'Your phone plan is overpriced',
      none:               'Worth knowing',
    },
    actionLabels: { cancel: 'Cancel', reduce: 'Reduce', renegotiate: 'Renegotiate' },
    biggestDrain: 'Biggest drain',
    biggestDrainAt: 'at',
    perDay: '/day',
    interestFree: 'interest-free',
    bankOverdraft: 'Bank overdraft',
    perTransaction: 'per transaction',
    oneBlinc: 'OneBlinc advance',
  },
  ES: {
    title: 'El panorama de tu quincena',
    hereIsWhat: 'ESTO ES LO QUE ENCONTRAMOS',
    heroHeadline: (n) => `${USD(n)}/mes que podrías guardar`,
    heroSub: 'Aquí están tus victorias rápidas — y exactamente cómo conseguirlas.',
    scrollCta: 'Muéstrame cómo',
    cashFlowLabel: 'TU DINERO ESTE PERÍODO DE PAGO',
    income: 'Ingresos mensuales',
    expenses: 'Gastos mensuales',
    surplusLabel: 'Lo que sobra cada quincena',
    cashFlowStatus: { on_track: '✅ En buen camino', tight: '⚠️ Ajustado', at_risk: '🔴 En riesgo' },
    topSpending: 'A dónde va',
    perMonth: '/mes',
    safeAdvanceLabel: 'TU ESCUDO CONTRA SOBREGIROS',
    safeAdvanceNone: 'Vas bien hasta el pago — no necesitas un adelanto',
    repaymentNote: 'Nota de reembolso',
    adviceIfZero: 'Qué hacer en su lugar',
    movesLabel: 'TUS VICTORIAS RÁPIDAS',
    movesTitle: 'Hazlas primero. Cada una te devuelve dinero.',
    tapToExpand: 'Toca cualquier acción para ver los pasos exactos',
    howExactly: 'Cómo exactamente',
    habitsLabel: 'CORTA ESTO PRIMERO',
    habitsSub: (n) => `${USD(n)}/mes de vuelta en tu bolsillo`,
    keepThese: 'Vale la pena conservar',
    spendingLabel: 'RESUMEN DE GASTOS',
    savePlan: 'Guarda tu plan',
    saveSub: 'Sigue tu progreso mientras vas completando los pasos. Actualizamos tu análisis cada 30 días.',
    saveCta: 'Guardar mi plan. Es gratis.',
    saveSeconds: '20 segundos. Sin tarjeta de crédito.',
    createAccount: 'Crea tu cuenta gratuita',
    roadmapWaiting: 'Tu plan te estará esperando.',
    emailLabel: 'Correo electrónico',
    passwordLabel: 'Contraseña',
    saveButton: 'Guardar mi plan',
    saving: 'Guardando…',
    haveAccount: '¿Ya tienes una cuenta?',
    signIn: 'Iniciar sesión',
    partial: 'Imagen parcial',
    connectMore: 'Conectar más cuentas',
    disclaimer: 'Solo para fines informativos. No es asesoramiento financiero.',
    runwayLabel: 'TU QUINCENA DÍA A DÍA',
    runwayMakeIt: 'Vas bien hasta el pago',
    runwayTight: 'Va a estar justo hasta el pago',
    runwayShort: 'Podrías quedarte corto antes del pago',
    runwayDailyBurn: 'Gasto diario',
    runwayCta: (amt) => `¿Necesitas un colchón? Los adelantos de OneBlinc comienzan en ${amt} — sin intereses.`,
    dayToday: 'Hoy',
    dayPayday: 'Pago',
    sitLabels: {
      debt_payoff:        'Paga esto primero',
      subscription_creep: 'Las suscripciones se acumulan',
      delivery_habit:     'El delivery es tu mayor gasto',
      tight_paycheck:     'Tu cheque está muy ajustado',
      phone_plan:         'Tu plan de teléfono es muy caro',
      none:               'Vale la pena saber',
    },
    actionLabels: { cancel: 'Cancelar', reduce: 'Reducir', renegotiate: 'Renegociar' },
    biggestDrain: 'Mayor gasto',
    biggestDrainAt: 'en',
    perDay: '/día',
    interestFree: 'sin intereses',
    bankOverdraft: 'Sobregiro bancario',
    perTransaction: 'por transacción',
    oneBlinc: 'Adelanto OneBlinc',
  },
}

// ── Section accordion ──────────────────────────────────────────
function Section({ icon, label, headline, headlineColor, defaultOpen, accent, children }) {
  const [open, setOpen] = useState(defaultOpen || false)
  return (
    <div style={{ background: 'white', border: accent ? `2px solid ${accent}` : '1px solid #e8e8e8', borderRadius: 16, marginBottom: 10, overflow: 'hidden', boxShadow: open ? '0 2px 12px rgba(0,0,0,0.06)' : 'none' }}>
      <div onClick={() => setOpen(o => !o)} style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', userSelect: 'none' }}>
        <div style={{ fontSize: 24, flexShrink: 0, lineHeight: 1 }}>{icon}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#c0c0c0', marginBottom: 5 }}>{label}</div>
          <div style={{ fontSize: 17, fontWeight: 800, color: headlineColor || OB.grey, lineHeight: 1.25 }}>{headline}</div>
        </div>
        <div style={{ width: 28, height: 28, borderRadius: '50%', border: '2px solid #e8e8e8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0, fontWeight: 700, background: open ? OB.blue : 'white', color: open ? 'white' : '#999', transition: 'all 0.15s' }}>
          {open ? '×' : '+'}
        </div>
      </div>
      {open && (
        <div style={{ padding: '0 20px 20px', borderTop: '1px solid #f5f5f5' }}>
          <div style={{ paddingTop: 16 }}>{children}</div>
        </div>
      )}
    </div>
  )
}

// ── Safe advance card ──────────────────────────────────────────
function SafeAdvanceCard({ advanceData, c }) {
  if (!advanceData) return null
  const hasAdvance = advanceData.amount > 0
  return (
    <div style={{ background: hasAdvance ? '#EBF1F9' : '#F0FAF9', border: `2px solid ${hasAdvance ? OB.blue : OB.teal}`, borderRadius: 16, padding: '20px', marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <div style={{ fontSize: 22 }}>{hasAdvance ? '⚡' : '🛡️'}</div>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: hasAdvance ? OB.blue : OB.teal, marginBottom: 3 }}>
            {c.safeAdvanceLabel}
          </div>
          <div style={{ fontSize: hasAdvance ? 28 : 18, fontWeight: 800, color: hasAdvance ? OB.blue : OB.teal, lineHeight: 1 }}>
            {hasAdvance ? USD(advanceData.amount) : c.safeAdvanceNone}
          </div>
        </div>
      </div>

      {hasAdvance && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
          <div style={{ background: 'white', borderRadius: 10, padding: '12px 14px', textAlign: 'center', border: `1px solid ${OB.blue}20` }}>
            <div style={{ fontSize: 10, color: OB.blue, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{c.oneBlinc}</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: OB.teal }}>$0</div>
            <div style={{ fontSize: 11, color: '#888' }}>{c.interestFree}</div>
          </div>
          <div style={{ background: 'white', borderRadius: 10, padding: '12px 14px', textAlign: 'center', border: '1px solid #ffd0d0' }}>
            <div style={{ fontSize: 10, color: '#c0392b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{c.bankOverdraft}</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#c0392b' }}>$35+</div>
            <div style={{ fontSize: 11, color: '#888' }}>{c.perTransaction}</div>
          </div>
        </div>
      )}

      {hasAdvance && advanceData.reasoning && (
        <p style={{ fontSize: 14, color: OB.blueShade, lineHeight: 1.6, marginBottom: 10 }}>{advanceData.reasoning}</p>
      )}
      {hasAdvance && advanceData.repaymentNote && (
        <div style={{ background: `${OB.blue}12`, borderRadius: 8, padding: '10px 14px' }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: OB.blue, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{c.repaymentNote}</p>
          <p style={{ fontSize: 13, color: OB.blueShade, lineHeight: 1.55 }}>{advanceData.repaymentNote}</p>
        </div>
      )}
      {!hasAdvance && advanceData.adviceIfZero && (
        <div style={{ background: `${OB.teal}12`, borderRadius: 8, padding: '10px 14px' }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: OB.teal, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{c.adviceIfZero}</p>
          <p style={{ fontSize: 13, color: '#444', lineHeight: 1.55 }}>{advanceData.adviceIfZero}</p>
        </div>
      )}
    </div>
  )
}

// ── Pay period runway card ─────────────────────────────────────
function PayPeriodRunwayCard({ ps, advanceData, c }) {
  if (!ps) return null

  const days = ps.daysToPayday || 14
  const dailyBurn = (ps.monthlyExpenses || 0) / 30

  // Estimate "days of cushion" from cashFlowStatus
  const cushionDays = ps.cashFlowStatus === 'on_track' ? days + 2
    : ps.cashFlowStatus === 'tight' ? Math.floor(days * 0.7)
    : Math.floor(days * 0.4)

  // Build dot array: green = comfortable, yellow = tight, red = projected short
  const dots = Array.from({ length: days }, (_, i) => {
    const d = i + 1
    if (d <= Math.floor(cushionDays * 0.6)) return 'green'
    if (d <= cushionDays) return 'yellow'
    return 'red'
  })

  const allGreen = dots.every(d => d === 'green')
  const hasRed = dots.some(d => d === 'red')
  const statusText = allGreen ? c.runwayMakeIt : hasRed ? c.runwayShort : c.runwayTight
  const statusColor = allGreen ? OB.teal : hasRed ? '#de350b' : '#856404'

  const dotColors = { green: OB.teal, yellow: '#F7BB00', red: '#de350b' }

  // Chunk into rows of 7 (week rows)
  const rows = []
  for (let i = 0; i < dots.length; i += 7) rows.push(dots.slice(i, i + 7))

  return (
    <div style={{ background: 'white', border: '1px solid #e8e8e8', borderRadius: 16, padding: '20px', marginBottom: 12 }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#c0c0c0', marginBottom: 10 }}>
        {c.runwayLabel}
      </div>

      {/* Dot grid */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#bbb', marginBottom: 6 }}>
          <span>{c.dayToday}</span>
          <span>{c.dayPayday}</span>
        </div>
        {rows.map((row, ri) => (
          <div key={ri} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
            {row.map((color, ci) => {
              const dayNum = ri * 7 + ci + 1
              return (
                <div key={ci} style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: dotColors[color],
                  opacity: color === 'green' ? 0.85 : 1,
                  flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 700, color: 'white',
                }}>
                  {dayNum}
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {/* Status + daily burn */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <p style={{ fontWeight: 700, fontSize: 14, color: statusColor }}>{statusText}</p>
        <p style={{ fontSize: 12, color: '#aaa' }}>{c.runwayDailyBurn} ~{USD(dailyBurn)}{c.perDay}</p>
      </div>

      {/* Always-visible subtle CTA */}
      <div style={{ background: '#EBF1F9', borderRadius: 10, padding: '10px 14px' }}>
        <p style={{ fontSize: 13, color: OB.blue, lineHeight: 1.55, marginBottom: 8 }}>
          {c.runwayCta('$50')}
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          <a
            href="https://play.google.com/store/apps/details?id=com.oneblinc.advance&hl=en_US"
            target="_blank" rel="noopener noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: OB.blue, color: 'white', borderRadius: 8, padding: '6px 12px', fontSize: 11, fontWeight: 700, textDecoration: 'none' }}
          >
            <span>▶</span> Google Play
          </a>
          <a
            href="https://apps.apple.com/us/app/oneblinc-salary-advances/id1593417965"
            target="_blank" rel="noopener noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: OB.blue, color: 'white', borderRadius: 8, padding: '6px 12px', fontSize: 11, fontWeight: 700, textDecoration: 'none' }}
          >
            <span>🍎</span> App Store
          </a>
        </div>
      </div>
    </div>
  )
}

// ── Action card ────────────────────────────────────────────────
function ActionCard({ rank, action, whyNow, howExactly, timeToComplete, payPeriodImpact, impactExplanation, c }) {
  const [open, setOpen] = useState(false)
  const rankColors = [OB.blue, OB.teal, OB.yellow]
  const rankTextColors = [OB.blue, OB.teal, OB.grey]
  return (
    <div onClick={() => setOpen(o => !o)} style={{ border: '1px solid #ebebeb', borderRadius: 12, marginBottom: 8, overflow: 'hidden', cursor: 'pointer', background: open ? '#f8f9ff' : 'white' }}>
      <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 30, height: 30, borderRadius: '50%', background: rankColors[rank - 1] || OB.blue, color: rank === 3 ? OB.grey : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 13, flexShrink: 0 }}>
          {rank}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 700, fontSize: 14, lineHeight: 1.35, marginBottom: 3, color: OB.grey }}>{action}</p>
          <p style={{ fontSize: 12, color: '#aaa' }}>{timeToComplete}</p>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: rankTextColors[rank - 1] || OB.blue }}>+{USD(payPeriodImpact)}{c.perMonth}</div>
        </div>
        <div style={{ width: 24, height: 24, borderRadius: '50%', border: '1.5px solid #e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, flexShrink: 0, background: open ? OB.blue : 'white', color: open ? 'white' : '#bbb', transition: 'all 0.15s' }}>
          {open ? '×' : '+'}
        </div>
      </div>
      {open && (
        <div style={{ padding: '0 16px 16px', borderTop: '1px solid #f0f0f0' }}>
          {whyNow && <p style={{ marginTop: 12, fontSize: 13, color: '#888', marginBottom: 10, fontStyle: 'italic' }}>{whyNow}</p>}
          {howExactly && (
            <div style={{ background: '#f8f8f8', borderRadius: 8, padding: '12px 14px', marginBottom: 10 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{c.howExactly}</p>
              <p style={{ fontSize: 14, color: OB.grey, lineHeight: 1.6 }}>{howExactly}</p>
            </div>
          )}
          {impactExplanation && <p style={{ fontSize: 13, color: OB.blue, fontWeight: 600 }}>{impactExplanation}</p>}
        </div>
      )}
    </div>
  )
}

// ── Cut this card ──────────────────────────────────────────────
function CutThisCard({ cutData, c }) {
  if (!cutData?.show || !cutData?.items?.length) return null
  const actionColor = { cancel: '#de350b', reduce: '#856404', renegotiate: OB.blueShade }
  const actionBg   = { cancel: '#ffe8e8', reduce: '#fff8e1', renegotiate: '#e8f0ff' }
  return (
    <Section icon="✂️" label={c.habitsLabel} headline={c.habitsSub(cutData.netMonthlySavings)} headlineColor={OB.blue}>
      {cutData.items.map((item, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '12px 0', borderBottom: i < cutData.items.length - 1 ? '1px solid #f5f5f5' : 'none' }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>
              <span style={{ display: 'inline-block', background: actionBg[item.action] || '#f0f0f0', color: actionColor[item.action] || OB.grey, fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 6, marginRight: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {c.actionLabels?.[item.action] || item.action}
              </span>
              {item.merchant}
            </p>
            <p style={{ fontSize: 12, color: '#999', lineHeight: 1.5 }}>{item.howTo}</p>
          </div>
          <div style={{ fontWeight: 800, fontSize: 14, color: OB.blue, marginLeft: 12, flexShrink: 0 }}>{USD(item.monthlyAmount)}{c.perMonth}</div>
        </div>
      ))}
      {cutData.keepThese?.length > 0 && (
        <div style={{ marginTop: 14, background: '#f8f8f8', borderRadius: 8, padding: '10px 14px' }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#bbb', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{c.keepThese}</p>
          {cutData.keepThese.map((k, i) => (
            <p key={i} style={{ fontSize: 13, color: '#555', marginBottom: 4, lineHeight: 1.5 }}>✓ {k}</p>
          ))}
        </div>
      )}
    </Section>
  )
}

// ── Situational card ───────────────────────────────────────────
function SituationalCard({ card, c }) {
  if (!card || card.type === 'none') return null
  const icons   = { debt_payoff: '💳', subscription_creep: '📱', delivery_habit: '🍔', tight_paycheck: '⚠️', phone_plan: '📞' }
  const accents = { debt_payoff: '#de350b', delivery_habit: '#e67e22', tight_paycheck: '#e67e22', subscription_creep: OB.blue, phone_plan: OB.blue }
  return (
    <Section icon={icons[card.type] || '💡'} label={c.sitLabels[card.type] || c.sitLabels.none} headline={card.headline} accent={accents[card.type] || null}>
      <p style={{ fontSize: 14, color: '#444', lineHeight: 1.7, marginBottom: 16 }}>{card.body}</p>
      {(card.metric1Label || card.metric2Label) && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
          {card.metric1Label && (
            <div style={{ background: '#f8f8f8', borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ fontSize: 10, color: '#bbb', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{card.metric1Label}</div>
              <div style={{ fontSize: 18, fontWeight: 800 }}>{card.metric1Value}</div>
            </div>
          )}
          {card.metric2Label && (
            <div style={{ background: '#f8f8f8', borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ fontSize: 10, color: '#bbb', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{card.metric2Label}</div>
              <div style={{ fontSize: 18, fontWeight: 800 }}>{card.metric2Value}</div>
            </div>
          )}
        </div>
      )}
      {card.action && (
        <div style={{ background: `${OB.blue}10`, borderRadius: 8, padding: '12px 14px', fontSize: 14, color: OB.blueShade, fontWeight: 600, lineHeight: 1.5 }}>
          {card.action}
        </div>
      )}
    </Section>
  )
}

// ── Spending snapshot ──────────────────────────────────────────
function SpendingSnapshot({ snapshot, c }) {
  if (!snapshot?.topCategories?.length) return null
  const maxAmt = Math.max(...snapshot.topCategories.map(x => x.monthlyAmount))
  const barColors = [OB.blue, OB.teal, OB.yellow, '#7EB8E8', '#D4950A']
  return (
    <Section icon="📊" label={c.spendingLabel} headline={snapshot.oneLineObservation} defaultOpen={false}>
      <div style={{ marginBottom: 8 }}>
        {snapshot.topCategories.map((cat, i) => (
          <div key={i} style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: OB.grey }}>{cat.name}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: barColors[i % barColors.length] }}>{USD(cat.monthlyAmount)}{c.perMonth}</span>
            </div>
            <div style={{ height: 6, background: '#f0f0f0', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${Math.round((cat.monthlyAmount / maxAmt) * 100)}%`, background: barColors[i % barColors.length], borderRadius: 3, transition: 'width 0.4s ease' }} />
            </div>
          </div>
        ))}
      </div>
      {snapshot.biggestDrain && (
        <div style={{ background: '#fff3e0', borderRadius: 8, padding: '10px 14px' }}>
          <p style={{ fontSize: 13, color: '#b45309', fontWeight: 600, lineHeight: 1.5 }}>
            🔥 {c.biggestDrain}: {snapshot.biggestDrain} {c.biggestDrainAt} {USD(snapshot.biggestDrainAmount)}{c.perMonth}
          </p>
        </div>
      )}
    </Section>
  )
}

// ── getServerSideProps ─────────────────────────────────────────
export async function getServerSideProps({ params }) {
  const { db } = await import('../../lib/db')
  const result = await db.query('SELECT analysis FROM roadmaps WHERE id = $1', [params.id])
  if (!result.rows[0]) return { notFound: true }
  return { props: { analysis: result.rows[0].analysis, roadmapId: params.id } }
}

// ── Main page ──────────────────────────────────────────────────
export default function RoadmapPage({ analysis, roadmapId }) {
  const router = useRouter()
  const { data: session } = useSession()
  const [lang, setLang] = useState('EN')
  const [saveStep, setSaveStep] = useState('prompt')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)

  useState(() => {
    try { const s = sessionStorage.getItem('lang'); if (s === 'ES') setLang('ES') } catch (_) {}
  })

  const c = C[lang]
  const activeAnalysis = analysis.en ? (lang === 'ES' ? analysis.es : analysis.en) : analysis
  const { paydaySummary: ps, safeAdvanceAmount, priorityActions, cutThisFirst, situationalCard, spendingSnapshot, confidence } = activeAnalysis
  const actionImpact = (priorityActions || []).reduce((s, a) => s + (a.payPeriodImpact || 0), 0)
  const habitImpact  = cutThisFirst?.netMonthlySavings || 0
  const totalImpact  = actionImpact + habitImpact

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    setSaveError(null)
    const res = await fetch('/api/auth/signup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password, roadmapId }) })
    const data = await res.json()
    if (!res.ok) { setSaveError(data.error || 'Something went wrong'); setSaving(false); return }
    await signIn('credentials', { email, password, redirect: false })
    router.push('/dashboard')
  }

  const inputStyle = { width: '100%', padding: '12px 16px', border: '1.5px solid #e0e0e0', borderRadius: 8, fontSize: 15, outline: 'none', boxSizing: 'border-box', fontFamily: "'Nunito Sans', -apple-system, sans-serif" }
  const statusLabel = ps?.cashFlowStatus ? c.cashFlowStatus[ps.cashFlowStatus] : null

  return (
    <>
      <Head>
        <title>{c.title}</title>
        <link href="https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@400;600;700;800;900&display=swap" rel="stylesheet" />
      </Head>
      <div style={{ minHeight: '100vh', background: '#F5F5F5', fontFamily: "'Nunito Sans', -apple-system, sans-serif" }}>

        {/* Header */}
        <header style={{ background: OB.blue, padding: '14px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `4px solid ${OB.yellow}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <LogoMark size={28} />
            <span style={{ fontWeight: 900, fontSize: 18, color: 'white', letterSpacing: '-0.01em' }}>
              One<span style={{ color: OB.yellow }}>Blinc</span>
            </span>
          </div>
          <div style={{ display: 'flex', gap: 3, background: 'rgba(255,255,255,0.15)', borderRadius: 20, padding: 3 }}>
            {['EN', 'ES'].map(l => (
              <button key={l} onClick={() => setLang(l)} style={{ padding: '4px 12px', borderRadius: 16, border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: 11, letterSpacing: '0.08em', background: lang === l ? 'white' : 'transparent', color: lang === l ? OB.blue : 'rgba(255,255,255,0.7)', fontFamily: 'inherit' }}>
                {l}
              </button>
            ))}
          </div>
        </header>

        {/* ── HERO ── */}
        <div style={{ background: OB.blue, color: 'white', padding: '44px 24px 52px', textAlign: 'center' }}>
          {totalImpact > 0 && (
            <>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)', marginBottom: 14 }}>
                {c.hereIsWhat}
              </p>
              <div style={{ fontSize: 'clamp(42px, 11vw, 68px)', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1, color: OB.yellow, marginBottom: 10 }}>
                {c.heroHeadline(totalImpact)}
              </div>
              <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.7)', marginBottom: 24, lineHeight: 1.6 }}>{c.heroSub}</p>

              <div style={{ display: 'inline-grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: 'rgba(255,255,255,0.1)', borderRadius: 14, overflow: 'hidden', marginBottom: 24, textAlign: 'left' }}>
                <div style={{ padding: '14px 20px' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
                    {lang === 'EN' ? 'Quick wins' : 'Victorias rápidas'}
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: OB.yellow }}>+{USD(actionImpact)}{c.perMonth}</div>
                </div>
                <div style={{ padding: '14px 20px', borderLeft: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
                    {lang === 'EN' ? 'Cut first' : 'Cortar primero'}
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: OB.teal }}>+{USD(habitImpact)}{c.perMonth}</div>
                </div>
              </div>

              <div
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.1)', borderRadius: 24, padding: '10px 22px', cursor: 'pointer' }}
                onClick={() => document.getElementById('actions')?.scrollIntoView({ behavior: 'smooth' })}
              >
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>{c.scrollCta}</span>
                <span style={{ color: OB.yellow, fontSize: 16 }}>↓</span>
              </div>
            </>
          )}
        </div>

        <div style={{ maxWidth: 660, margin: '0 auto', padding: '24px 16px 80px' }}>

          {/* Pay period runway */}
          <PayPeriodRunwayCard ps={ps} advanceData={safeAdvanceAmount} c={c} />

          {/* Cash flow */}
          {ps && (
            <Section icon="💸" label={c.cashFlowLabel} headline={ps.oneLineSummary || `${USD(ps.monthlyIncome)} in. ${USD(ps.monthlyExpenses)} out.`} defaultOpen={true}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                <div style={{ background: '#f8f8f8', borderRadius: 10, padding: '13px 15px' }}>
                  <div style={{ fontSize: 10, color: '#bbb', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 }}>{c.income}</div>
                  <div style={{ fontSize: 22, fontWeight: 800 }}>{USD(ps.monthlyIncome)}</div>
                </div>
                <div style={{ background: '#f8f8f8', borderRadius: 10, padding: '13px 15px' }}>
                  <div style={{ fontSize: 10, color: '#bbb', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 }}>{c.expenses}</div>
                  <div style={{ fontSize: 22, fontWeight: 800 }}>{USD(ps.monthlyExpenses)}</div>
                </div>
              </div>
              {ps.monthlySurplus != null && (
                <div style={{ background: ps.monthlySurplus > 200 ? '#f0fff4' : ps.monthlySurplus > 0 ? '#fffbea' : '#fff3f3', borderRadius: 10, padding: '14px 16px', marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: statusLabel ? 8 : 0 }}>
                    <span style={{ fontSize: 13, color: OB.grey, fontWeight: 600 }}>{c.surplusLabel}</span>
                    <span style={{ fontSize: 14, fontWeight: 800, color: ps.monthlySurplus > 0 ? OB.teal : '#de350b' }}>{USD(Math.abs(ps.monthlySurplus))}{c.perMonth}</span>
                  </div>
                  {statusLabel && <p style={{ fontSize: 13, color: '#555', marginBottom: 0 }}>{statusLabel}</p>}
                </div>
              )}
              {ps.topMerchants?.length > 0 && (
                <div>
                  <p style={{ fontSize: 10, fontWeight: 700, color: '#bbb', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{c.topSpending}</p>
                  {ps.topMerchants.map((m, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < ps.topMerchants.length - 1 ? '1px solid #f5f5f5' : 'none' }}>
                      <div>
                        <span style={{ fontWeight: 600, fontSize: 14 }}>{m.name}</span>
                        <span style={{ fontSize: 12, color: '#ccc', marginLeft: 8 }}>{m.category}</span>
                      </div>
                      <span style={{ fontWeight: 700, fontSize: 14 }}>{USD(m.monthlyAmount)}{c.perMonth}</span>
                    </div>
                  ))}
                </div>
              )}
            </Section>
          )}

          {/* Quick wins */}
          <div id="actions">
            <Section icon="✅" label={c.movesLabel} headline={c.movesTitle} defaultOpen={true} accent={OB.blue}>
              {(priorityActions || []).map(a => <ActionCard key={a.rank} {...a} c={c} />)}
              <p style={{ fontSize: 12, color: '#ccc', marginTop: 10, textAlign: 'center' }}>{c.tapToExpand}</p>
            </Section>
          </div>

          <CutThisCard cutData={cutThisFirst} c={c} />
          <SituationalCard card={situationalCard} c={c} />
          <SpendingSnapshot snapshot={spendingSnapshot} c={c} />

          {/* Save CTA */}
          <div style={{ marginTop: 24 }}>
            {saveStep === 'prompt' && (
              <div style={{ background: OB.blue, borderRadius: 16, padding: '32px 24px', textAlign: 'center' }}>
                <div style={{ fontSize: 32, marginBottom: 14 }}>📋</div>
                <h3 style={{ fontSize: 22, fontWeight: 900, color: 'white', marginBottom: 10, letterSpacing: '-0.02em' }}>{c.savePlan}</h3>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 15, lineHeight: 1.65, maxWidth: 360, margin: '0 auto 24px' }}>{c.saveSub}</p>
                <button onClick={() => setSaveStep('form')} style={{ background: OB.yellow, color: OB.grey, border: 'none', borderRadius: 10, padding: '16px 36px', fontSize: 16, fontWeight: 900, cursor: 'pointer', width: '100%', maxWidth: 320, fontFamily: 'inherit' }}>
                  {c.saveCta}
                </button>
                <p style={{ marginTop: 10, fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{c.saveSeconds}</p>
              </div>
            )}
            {saveStep === 'form' && (
              <div style={{ background: 'white', borderRadius: 16, padding: '28px', border: '1px solid #ebebeb' }}>
                <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>{c.createAccount}</h3>
                <p style={{ fontSize: 14, color: '#888', marginBottom: 22 }}>{c.roadmapWaiting}</p>
                {saveError && (
                  <div style={{ background: '#fff3f3', border: '1px solid #ffd0d0', color: '#de350b', padding: '10px 14px', borderRadius: 8, fontSize: 14, marginBottom: 16 }}>{saveError}</div>
                )}
                <div>
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ display: 'block', fontWeight: 700, fontSize: 14, marginBottom: 7 }}>{c.emailLabel}</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" style={inputStyle} />
                  </div>
                  <div style={{ marginBottom: 20 }}>
                    <label style={{ display: 'block', fontWeight: 700, fontSize: 14, marginBottom: 7 }}>{c.passwordLabel}</label>
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder={lang === 'EN' ? 'At least 8 characters' : 'Mínimo 8 caracteres'} style={inputStyle} />
                  </div>
                  <button onClick={handleSave} disabled={saving} style={{ width: '100%', background: OB.blue, color: 'white', border: 'none', borderRadius: 10, padding: '16px', fontSize: 16, fontWeight: 800, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1, fontFamily: 'inherit' }}>
                    {saving ? c.saving : c.saveButton}
                  </button>
                </div>
                <p style={{ marginTop: 14, fontSize: 13, color: '#aaa', textAlign: 'center' }}>
                  {c.haveAccount} <a href="/auth/signin" style={{ color: OB.blue, fontWeight: 700 }}>{c.signIn}</a>
                </p>
              </div>
            )}
          </div>

          <p style={{ marginTop: 24, fontSize: 11, color: '#ccc', lineHeight: 1.7, textAlign: 'center' }}>{c.disclaimer}</p>
        </div>
      </div>

      {/* Blinky chat — pre-loaded with this user's analysis */}
      <FinancialChat analysis={analysis} lang={lang === 'EN' ? 'en' : 'es'} />
    </>
  )
}
