import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { usePlaidLink } from 'react-plaid-link'
import FinancialChat from '../components/FinancialChat'

const USD = (n) => n != null
  ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
  : '—'

const OB = {
  blue:      '#2B5BAE',
  blueShade: '#1A3C6E',
  yellow:    '#F7BB00',
  teal:      '#00B5A0',
  grey:      '#4A4A4A',
}

function LogoMark({ size = 28 }) {
  return (
    <img src="data:image/jpeg;base64,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" width={size} height={size} style={{ display: 'block' }} alt="OneBlinc" />
  )
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
            <div style={{ fontSize: 10, color: OB.blue, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>OneBlinc advance</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: OB.teal }}>$0</div>
            <div style={{ fontSize: 11, color: '#888' }}>interest-free</div>
          </div>
          <div style={{ background: 'white', borderRadius: 10, padding: '12px 14px', textAlign: 'center', border: '1px solid #ffd0d0' }}>
            <div style={{ fontSize: 10, color: '#c0392b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Bank overdraft</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#c0392b' }}>$35+</div>
            <div style={{ fontSize: 11, color: '#888' }}>per transaction</div>
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
    </div>
  )
}

// ── Spending snapshot ──────────────────────────────────────────
function SpendingSnapshot({ snapshot, c }) {
  if (!snapshot?.topCategories?.length) return null
  const maxAmt = Math.max(...snapshot.topCategories.map(x => x.monthlyAmount || 0))
  const barColors = [OB.blue, OB.teal, OB.yellow, '#7EB8E8', '#D4950A']
  return (
    <Section icon="📊" label={c.spendingLabel} headline={snapshot.oneLineObservation} defaultOpen={false}>
      <div style={{ marginBottom: 8 }}>
        {snapshot.topCategories.map((cat, i) => {
          const percentage = maxAmt > 0 ? Math.round((cat.monthlyAmount / maxAmt) * 100) : 0
          return (
            <div key={i} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: OB.grey }}>{cat.name}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: barColors[i % barColors.length] }}>{USD(cat.monthlyAmount)}{c.perMonth}</span>
              </div>
              <div style={{ height: 6, background: '#f0f0f0', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${percentage}%`, background: barColors[i % barColors.length], borderRadius: 3, transition: 'width 0.4s ease' }} />
              </div>
            </div>
          )
        })}
      </div>
      {snapshot.biggestDrain && (
        <div style={{ background: '#fff3e0', borderRadius: 8, padding: '10px 14px' }}>
          <p style={{ fontSize: 13, color: '#b45309', fontWeight: 600, lineHeight: 1.5 }}>
            🔥 Biggest drain: {snapshot.biggestDrain} at {USD(snapshot.biggestDrainAmount)}{c.perMonth}
          </p>
        </div>
      )}
    </Section>
  )
}
const C = {
  EN: {
    pageTitle: 'My Plan — Money Figured Out',
    signOut: 'Sign out',
    planLabel: 'YOUR FINANCIAL PLAN',
    unlockedSoFar: 'unlocked so far',
    actionsDone: (d, t) => `${d} of ${t} actions done`,
    cashFlowLabel: 'YOUR MONEY THIS PAY PERIOD',
    income: 'Monthly income',
    expenses: 'Monthly expenses',
    surplusLabel: 'Left over each month',
    cashFlowStatus: { on_track: '✅ On track', tight: '⚠️ Tight', at_risk: '🔴 At risk' },
    topSpending: 'Where it goes',
    perMonth: '/mo',
    safeAdvanceLabel: 'YOUR OVERDRAFT SHIELD',
    safeAdvanceNone: "You're good to payday — no advance needed",
    spendingLabel: 'SPENDING SNAPSHOT',
    allDone: "All done! You're in the top 1% of people who actually act on their finances.",
    tabPlan: 'My Plan',
    tabBanks: 'Connected Banks',
    yourActions: 'YOUR ACTIONS',
    noActions: 'No action plan yet.',
    generateCta: 'Generate my roadmap \u2192',
    completed: 'COMPLETED',
    howExactly: 'How exactly',
    markDone: 'Mark as done',
    confirmDone: (a) => `Mark "${a}\u2026" as done?`,
    nextRefresh: 'Next analysis refresh',
    refreshReady: 'Ready for a refresh now',
    refreshIn: (d) => `Available in ${d} day${d === 1 ? '' : 's'}`,
    refreshCta: 'Refresh \u2192',
    dayOf: (d) => `Day ${d} of 30`,
    connectedAccounts: 'CONNECTED ACCOUNTS',
    noAccounts: 'No accounts connected yet.',
    noAccountsSub: 'Connect a bank to generate your personalized roadmap.',
    demoBank: 'Demo Bank',
    demoLabel: 'DEMO',
    demoSub: 'Simulated data \u2014 connect a real bank to get your actual analysis',
    lastSynced: (d) => `Last synced ${d}`,
    removeBank: 'Remove',
    confirmRemove: 'Remove this bank connection? Your data will be deleted.',
    connectAnother: '+ Connect another bank account',
    securityNote: 'Read-only access, always.',
    securityBody: "We use Plaid \u2014 the same bank-grade security layer used by thousands of apps. We can only read transaction history. We never store passwords, never move money, never store card numbers. Remove any connection instantly.",
    addedAccount: 'Added a new account?',
    rerunAnalysis: 'Re-run your analysis for a more complete picture.',
    refreshAnalysis: 'Refresh my analysis \u2192',
    loading: 'Loading your plan\u2026',
    celebrationMsg: (a) => `Done! You just unlocked +${a}/year. Keep going.`,
    repaymentNote: 'Repayment note',
    adviceIfZero: 'What to do instead',
    runwayLabel: 'YOUR PAY PERIOD RUNWAY',
    runwayMakeIt: "You're on track to payday",
    runwayTight: "It'll be close to payday",
    runwayShort: 'You may run short before payday',
    runwayDailyBurn: 'Daily spend',
    runwayCta: () => 'Need a cushion? OneBlinc advances start at $50 — interest-free.',
    dayToday: 'Today',
    dayPayday: 'Payday',
    habitsLabel: 'CUT THIS FIRST',
    habitsSub: (n) => `${USD(n)}/mo back in your pocket`,
    keepThese: 'Worth keeping',
    sitLabels: {
      debt_payoff:        'Pay this off first',
      subscription_creep: 'Subscriptions adding up',
      delivery_habit:     'Delivery is your biggest drain',
      tight_paycheck:     'Your paycheck is stretched thin',
      phone_plan:         'Your phone plan is overpriced',
      none:               'Worth knowing',
    },
  },
  ES: {
    pageTitle: 'Mi Plan \u2014 Tu Dinero Bajo Control',
    signOut: 'Cerrar sesi\u00f3n',
    planLabel: 'TU PLAN FINANCIERO',
    unlockedSoFar: 'desbloqueados hasta ahora',
    actionsDone: (d, t) => `${d} de ${t} acciones hechas`,
    stillAvailable: (a) => ` \u00b7 ${a}/a\u00f1o disponibles`,
    allDone: '\u00a1Todo hecho! Est\u00e1s en el 1% que realmente act\u00faa sobre sus finanzas.',
    tabPlan: 'Mi Plan',
    tabBanks: 'Bancos Conectados',
    yourActions: 'TUS ACCIONES',
    noActions: 'A\u00fan no hay plan de acci\u00f3n.',
    generateCta: 'Generar mi plan \u2192',
    completed: 'COMPLETADAS',
    howExactly: 'C\u00f3mo exactamente',
    markDone: 'Marcar como hecho',
    confirmDone: (a) => `\u00bfMarcar \u201c${a}\u2026\u201d como hecho?`,
    nextRefresh: 'Pr\u00f3xima actualizaci\u00f3n del an\u00e1lisis',
    refreshReady: 'Listo para actualizar ahora',
    refreshIn: (d) => `Disponible en ${d} d\u00eda${d === 1 ? '' : 's'}`,
    refreshCta: 'Actualizar \u2192',
    dayOf: (d) => `D\u00eda ${d} de 30`,
    connectedAccounts: 'CUENTAS CONECTADAS',
    noAccounts: 'Ninguna cuenta conectada todav\u00eda.',
    noAccountsSub: 'Conecta un banco para generar tu plan personalizado.',
    demoBank: 'Banco Demo',
    demoLabel: 'DEMO',
    demoSub: 'Datos simulados \u2014 conecta un banco real para tu an\u00e1lisis real',
    lastSynced: (d) => `\u00daltima sincronizaci\u00f3n ${d}`,
    removeBank: 'Eliminar',
    confirmRemove: '\u00bfEliminar esta conexi\u00f3n bancaria? Tus datos ser\u00e1n borrados.',
    connectAnother: '+ Conectar otro banco',
    securityNote: 'Acceso de solo lectura, siempre.',
    securityBody: 'Usamos Plaid \u2014 la misma capa de seguridad bancaria usada por miles de apps. Solo leemos el historial de transacciones. Nunca guardamos contrase\u00f1as ni movemos dinero. Elimina cualquier conexi\u00f3n al instante.',
    addedAccount: '\u00bfAgregaste una nueva cuenta?',
    rerunAnalysis: 'Vuelve a ejecutar tu an\u00e1lisis para un panorama m\u00e1s completo.',
    refreshAnalysis: 'Actualizar mi an\u00e1lisis \u2192',
    loading: 'Cargando tu plan\u2026',
    celebrationMsg: (a) => `\u00a1Hecho! Acabas de desbloquear +${a}/a\u00f1o. Sigue as\u00ed.`,
    repaymentNote: 'Nota de reembolso',
    adviceIfZero: 'Qu\u00e9 hacer en su lugar',
    runwayLabel: 'TU QUINCENA D\u00cdA A D\u00cdA',
    runwayMakeIt: 'Vas bien hasta el pago',
    runwayTight: 'Va a estar justo hasta el pago',
    runwayShort: 'Podr\u00edas quedarte corto antes del pago',
    runwayDailyBurn: 'Gasto diario',
    runwayCta: () => '\u00bfNecesitas un colch\u00f3n? Los adelantos de OneBlinc comienzan en $50 \u2014 sin intereses.',
    dayToday: 'Hoy',
    dayPayday: 'Pago',
    habitsLabel: 'CORTA ESTO PRIMERO',
    habitsSub: (n) => `${USD(n)}/mes de vuelta en tu bolsillo`,
    keepThese: 'Vale la pena conservar',
    sitLabels: {
      debt_payoff:        'Paga esto primero',
      subscription_creep: 'Las suscripciones se acumulan',
      delivery_habit:     'El delivery es tu mayor gasto',
      tight_paycheck:     'Tu cheque est\u00e1 muy ajustado',
      phone_plan:         'Tu plan de tel\u00e9fono es muy caro',
      none:               'Vale la pena saber',
    },
    cashFlowLabel: 'TU DINERO ESTE PERÍODO DE PAGO',
    income: 'Ingresos mensuales',
    expenses: 'Gastos mensuales',
    surplusLabel: 'Lo que sobra cada mes',
    cashFlowStatus: { on_track: '✅ En buen camino', tight: '⚠️ Ajustado', at_risk: '🔴 En riesgo' },
    topSpending: 'A dónde va',
    perMonth: '/mes',
    safeAdvanceLabel: 'TU ESCUDO CONTRA SOBREGIROS',
    safeAdvanceNone: 'Vas bien hasta el pago — no necesitas un adelanto',
    spendingLabel: 'RESUMEN DE GASTOS',
  },
}

// ── Pay period runway card ─────────────────────────────────────
function PayPeriodRunwayCard({ ps, advanceData, c }) {
  if (!ps) return null

  const days = ps.daysToPayday || 14
  const dailyBurn = (ps.monthlyExpenses || 0) / 30

  const cushionDays = ps.cashFlowStatus === 'on_track' ? days + 2
    : ps.cashFlowStatus === 'tight' ? Math.floor(days * 0.7)
    : Math.floor(days * 0.4)

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

  const rows = []
  for (let i = 0; i < dots.length; i += 7) rows.push(dots.slice(i, i + 7))

  return (
    <div style={{ background: 'white', border: '1px solid #e8e8e8', borderRadius: 16, padding: '20px', marginBottom: 10 }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#c0c0c0', marginBottom: 10 }}>
        {c.runwayLabel}
      </div>
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <p style={{ fontWeight: 700, fontSize: 14, color: statusColor }}>{statusText}</p>
        <p style={{ fontSize: 12, color: '#aaa' }}>{c.runwayDailyBurn} ~{USD(dailyBurn)}/day</p>
      </div>
      <div style={{ background: '#EBF1F9', borderRadius: 10, padding: '10px 14px' }}>
        <p style={{ fontSize: 13, color: OB.blue, lineHeight: 1.55, marginBottom: 8 }}>
          {c.runwayCta()}
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

// ── CutThisCard ────────────────────────────────────────────────
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
                {item.action}
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
            <p key={i} style={{ fontSize: 13, color: '#555', marginBottom: 4, lineHeight: 1.5 }}>\u2713 {k}</p>
          ))}
        </div>
      )}
    </Section>
  )
}

// ── SituationalCard ────────────────────────────────────────────
function SituationalCard({ card, c }) {
  if (!card || card.type === 'none') return null
  const icons   = { debt_payoff: '\uD83D\uDCB3', subscription_creep: '\uD83D\uDCF1', delivery_habit: '\uD83C\uDF54', tight_paycheck: '\u26A0\uFE0F', phone_plan: '\uD83D\uDCDE' }
  const accents = { debt_payoff: '#de350b', delivery_habit: '#e67e22', tight_paycheck: '#e67e22', subscription_creep: OB.blue, phone_plan: OB.blue }
  return (
    <Section icon={icons[card.type] || '\uD83D\uDCA1'} label={c.sitLabels[card.type] || c.sitLabels.none} headline={card.headline} accent={accents[card.type] || null}>
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

// ── TaskCard ──────────────────────────────────────────────────
function TaskCard({ task, analysisAction, impactOverride, onComplete, onCompleted, lang }) {
  const [open, setOpen] = useState(false)
  const [completing, setCompleting] = useState(false)
  const done = task.completed
  const c = C[lang] || C.EN

  const handleComplete = async (e) => {
    e.stopPropagation()
    if (done || completing) return
    if (!confirm(c.confirmDone(task.action.slice(0, 55)))) return
    setCompleting(true)
    await onComplete(task.id)
    setCompleting(false)
    if (onCompleted) onCompleted(task.annual_impact)
  }

  const rankColors = [OB.blue, OB.teal, OB.blueShade]
  // Resolve display impact: DB value if set, else derive from analysis, else hide
  const dbImpact = Number(task.annual_impact) || 0
  const analysisImpact = impactOverride != null ? impactOverride : (analysisAction?.payPeriodImpact || 0) * 12
  const displayImpact = dbImpact > 0 ? dbImpact : analysisImpact

  return (
    <div style={{ background: 'white', borderRadius: 14, marginBottom: 10, overflow: 'hidden', border: done ? '1px solid #f0f0f0' : '1px solid #e8e8e8', opacity: done ? 0.6 : 1, transition: 'all 0.3s' }}>
      <div onClick={() => !done && setOpen(o => !o)} style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14, cursor: done ? 'default' : 'pointer' }}>
        <button onClick={handleComplete} style={{ width: 30, height: 30, borderRadius: '50%', flexShrink: 0, border: done ? 'none' : `2px solid #ddd`, background: done ? OB.teal : completing ? `${OB.teal}22` : 'white', cursor: done ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
          {done && <span style={{ color: 'white', fontSize: 14, fontWeight: 800 }}>&#10003;</span>}
        </button>
        <div style={{ width: 26, height: 26, borderRadius: '50%', flexShrink: 0, background: rankColors[task.rank - 1] || OB.grey, color: 'white', fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{task.rank}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 700, fontSize: 14, lineHeight: 1.35, marginBottom: 3, textDecoration: done ? 'line-through' : 'none', color: done ? '#aaa' : OB.grey }}>{task.action}</p>
          <p style={{ fontSize: 12, color: '#bbb' }}>{task.time_to_complete}</p>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          {displayImpact > 0 && <div style={{ fontSize: 14, fontWeight: 800, color: done ? '#aaa' : OB.teal }}>+{USD(displayImpact)}/yr</div>}
        </div>
        {!done && (
          <div style={{ width: 24, height: 24, borderRadius: '50%', border: '1.5px solid #e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, flexShrink: 0, fontWeight: 700, background: open ? OB.blue : 'white', color: open ? 'white' : '#ccc', transition: 'all 0.15s' }}>
            {open ? '\u00d7' : '+'}
          </div>
        )}
        {done && <div style={{ fontSize: 12, color: '#aaa', flexShrink: 0 }}>Done {task.completed_at ? new Date(task.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}</div>}
      </div>
      {open && !done && analysisAction && (
        <div style={{ padding: '0 18px 18px', borderTop: '1px solid #f5f5f5' }}>
          {analysisAction.whyNow && <p style={{ fontSize: 13, color: '#888', fontStyle: 'italic', marginTop: 14, marginBottom: 12 }}>{analysisAction.whyNow}</p>}
          {analysisAction.howExactly && (
            <div style={{ background: '#f8f8f8', borderRadius: 10, padding: '14px 16px', marginBottom: 12 }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: '#bbb', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{c.howExactly}</p>
              <p style={{ fontSize: 14, color: '#333', lineHeight: 1.65 }}>{analysisAction.howExactly}</p>
            </div>
          )}
          {analysisAction.impactExplanation && <p style={{ fontSize: 13, color: OB.teal, fontWeight: 600, marginBottom: 14 }}>&#128208; {analysisAction.impactExplanation}</p>}
          <button onClick={handleComplete} style={{ width: '100%', marginTop: 10, padding: '12px', borderRadius: 10, border: '1.5px solid #e0e0e0', background: 'white', fontSize: 14, fontWeight: 600, color: '#555', cursor: 'pointer', fontFamily: 'inherit' }}>
            {c.markDone}
          </button>
        </div>
      )}
    </div>
  )
}

// ── AddBankButton ─────────────────────────────────────────────
function AddBankButton({ onSuccess, lang }) {
  const [linkToken, setLinkToken] = useState(null)
  const c = C[lang] || C.EN

  useEffect(() => {
    fetch('/api/plaid/create-link-token', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lang }) })
      .then(r => r.json()).then(d => setLinkToken(d.link_token))
  }, [lang])

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: async (public_token) => {
      const res = await fetch('/api/plaid/add-account', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ public_token }) })
      const data = await res.json()
      if (res.ok) onSuccess(data.institutionName)
    },
  })

  return (
    <button onClick={() => open()} disabled={!ready} style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', width: '100%', padding: '14px', borderRadius: 10, border: `2px dashed ${OB.blue}55`, background: 'white', fontSize: 14, fontWeight: 700, color: OB.blue, cursor: !ready ? 'not-allowed' : 'pointer', opacity: !ready ? 0.5 : 1, transition: 'all 0.15s', fontFamily: 'inherit' }}>
      {c.connectAnother}
    </button>
  )
}

// ── Main Dashboard ────────────────────────────────────────────
export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [lang, setLang] = useState('EN')
  const [tasks, setTasks] = useState([])
  const [accounts, setAccounts] = useState([])
  const [analysis, setAnalysis] = useState(null)
  const [roadmapCreatedAt, setRoadmapCreatedAt] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState('plan')
  const [celebration, setCelebration] = useState(null)

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('lang')
      if (stored === 'ES' || stored === 'EN') setLang(stored)
    } catch (_) {}
  }, [])

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/signin')
  }, [status]) // eslint-disable-line

  useEffect(() => {
    if (status !== 'authenticated') return
    Promise.all([
      fetch('/api/tasks').then(r => r.json()),
      fetch('/api/accounts').then(r => r.json()),
      fetch('/api/roadmap-current').then(r => r.json()).catch(() => null),
    ]).then(([t, a, rm]) => {
      setTasks(t.tasks || [])
      setAccounts(a.accounts || [])
      if (rm?.analysis) { setAnalysis(rm.analysis); setRoadmapCreatedAt(rm.createdAt) }
      setLoading(false)
    }).catch(err => {
      console.error('Error loading dashboard data:', err)
      setLoading(false)
    })
  }, [status])

  const c = C[lang] || C.EN
  const completedTasks = tasks.filter(t => t.completed)
  const pendingTasks = tasks.filter(t => !t.completed)
  const progress = tasks.length ? completedTasks.length / tasks.length : 0

  // Derive totals from analysis (source of truth — same as roadmap page)
  // Falls back to DB task amounts only when no analysis is available
  const actionImpactMonthly = (analysis?.priorityActions || []).reduce((s, a) => s + (a.payPeriodImpact || 0), 0)
  const habitImpactMonthly  = analysis?.cutThisFirst?.netMonthlySavings || 0
  const analysisTotalAnnual = (actionImpactMonthly + habitImpactMonthly) * 12
  const tasksTotalAnnual    = tasks.reduce((s, t) => s + (Number(t.annual_impact) || 0), 0)
  const totalPotential      = analysisTotalAnnual > 0 ? analysisTotalAnnual : tasksTotalAnnual

  // Completed impact: count tasks done * their pro-rated share of total
  const completedImpact = completedTasks.reduce((s, t) => s + (Number(t.annual_impact) || 0), 0)

  const actionByRank = {}
  ;(analysis?.priorityActions || []).forEach(a => { actionByRank[a.rank] = a })

  const statusLabel = analysis?.paydaySummary?.cashFlowStatus ? c.cashFlowStatus[analysis.paydaySummary.cashFlowStatus] : null

  async function completeTask(taskId) {
    const res = await fetch(`/api/tasks/${taskId}/complete`, { method: 'POST' })
    const data = await res.json()
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: true, completed_at: data.task?.completed_at } : t))
  }

  function onCompleted(annualImpact) {
    setCelebration({ amount: annualImpact })
    setTimeout(() => setCelebration(null), 3500)
  }

  async function removeAccount(accountId) {
    if (!confirm(c.confirmRemove)) return
    await fetch('/api/accounts', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ itemId: accountId }) })
    setAccounts(prev => prev.filter(a => a.id !== accountId))
  }

  function onBankAdded(institutionName) {
    setAccounts(prev => [...prev, { id: Date.now().toString(), institution_name: institutionName, last_synced_at: new Date().toISOString() }])
  }

  const daysSince = roadmapCreatedAt ? Math.floor((Date.now() - new Date(roadmapCreatedAt)) / 86400000) : null
  const daysUntil = daysSince !== null ? Math.max(0, 30 - daysSince) : null
  const isDemo = analysis?.isDemo === true

  const displayAccounts = accounts.length > 0
    ? accounts
    : isDemo
      ? [{ id: 'demo', institution_name: c.demoBank, last_synced_at: roadmapCreatedAt, isDemo: true }]
      : []

  if (status === 'loading' || loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F5F5F5', fontFamily: "'Nunito Sans', -apple-system, sans-serif", color: '#888', fontSize: 14 }}>
        {c.loading}
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>{c.pageTitle}</title>
        <link href="https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@400;600;700;800;900&display=swap" rel="stylesheet" />
      </Head>
      <div style={{ minHeight: '100vh', background: '#F5F5F5', fontFamily: "'Nunito Sans', -apple-system, sans-serif" }}>

        {celebration && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, background: OB.teal, color: 'white', padding: '16px 24px', textAlign: 'center', fontSize: 15, fontWeight: 700 }}>
            {c.celebrationMsg(USD(celebration.amount))}
          </div>
        )}

        {/* Header */}
        <header style={{ background: OB.blue, padding: '14px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `4px solid ${OB.yellow}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <LogoMark size={28} />
            <span style={{ fontWeight: 900, fontSize: 18, color: 'white', letterSpacing: '-0.01em' }}>
              One<span style={{ color: OB.yellow }}>Blinc</span>
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ display: 'flex', gap: 3, background: 'rgba(255,255,255,0.15)', borderRadius: 20, padding: 3 }}>
              {['EN', 'ES'].map(l => (
                <button key={l} onClick={() => setLang(l)} style={{ padding: '4px 12px', borderRadius: 16, border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: 11, letterSpacing: '0.08em', background: lang === l ? 'white' : 'transparent', color: lang === l ? OB.blue : 'rgba(255,255,255,0.7)', fontFamily: 'inherit' }}>
                  {l}
                </button>
              ))}
            </div>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{session?.user?.email}</span>
            <button onClick={() => signOut({ callbackUrl: '/' })} style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', background: 'none', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 8, padding: '5px 12px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
              {c.signOut}
            </button>
          </div>
        </header>

        {/* Hero */}
        <div style={{ background: OB.blue, color: 'white', padding: '32px 24px 36px' }}>
          <div style={{ maxWidth: 660, margin: '0 auto' }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)', marginBottom: 10 }}>{c.planLabel}</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 6 }}>
              <div style={{ fontSize: 38, fontWeight: 800, color: OB.yellow, letterSpacing: '-0.03em' }}>+{USD(totalPotential)}/yr</div>
              <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>potential savings</span>
            </div>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 18 }}>
              {c.actionsDone(completedTasks.length, tasks.length)}
              {completedImpact > 0 && ` · +${USD(completedImpact)}/yr unlocked`}
            </p>
            <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 4, height: 6, overflow: 'hidden', maxWidth: 500 }}>
              <div style={{ background: OB.yellow, height: '100%', width: `${progress * 100}%`, borderRadius: 4, transition: 'width 0.6s ease' }} />
            </div>
            {progress === 1 && tasks.length > 0 && (
              <p style={{ marginTop: 12, fontSize: 14, color: OB.yellow, fontWeight: 600 }}>{c.allDone}</p>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ background: 'white', borderBottom: '1px solid #f0f0f0', padding: '0 24px' }}>
          <div style={{ maxWidth: 660, margin: '0 auto', display: 'flex' }}>
            {[{ id: 'plan', label: c.tabPlan }, { id: 'banks', label: c.tabBanks }].map(tab => (
              <button key={tab.id} onClick={() => setActiveSection(tab.id)} style={{ padding: '14px 20px', border: 'none', cursor: 'pointer', background: 'transparent', fontSize: 14, fontWeight: 700, color: activeSection === tab.id ? OB.blue : '#aaa', borderBottom: activeSection === tab.id ? `2px solid ${OB.blue}` : '2px solid transparent', transition: 'all 0.15s', fontFamily: 'inherit' }}>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div style={{ maxWidth: 660, margin: '0 auto', padding: '28px 16px 80px' }}>

          {/* ── PLAN TAB ── */}
          {activeSection === 'plan' && (
            <>
              <div style={{ marginBottom: 32 }}>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#bbb', marginBottom: 14 }}>{c.yourActions}</p>

                {tasks.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '48px 24px', background: 'white', borderRadius: 16, color: '#888' }}>
                    <p style={{ marginBottom: 16 }}>{c.noActions}</p>
                    <a href="/" style={{ background: OB.blue, color: 'white', padding: '14px 28px', borderRadius: 10, textDecoration: 'none', fontSize: 14, fontWeight: 700 }}>{c.generateCta}</a>
                  </div>
                )}

                {pendingTasks.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    analysisAction={actionByRank[task.rank]}
                    impactOverride={actionByRank[task.rank] ? (actionByRank[task.rank].payPeriodImpact || 0) * 12 : null}
                    onComplete={completeTask}
                    onCompleted={onCompleted}
                    lang={lang}
                  />
                ))}

                {completedTasks.length > 0 && (
                  <>
                    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#bbb', margin: '24px 0 14px' }}>{c.completed}</p>
                    {completedTasks.map(task => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        analysisAction={actionByRank[task.rank]}
                        impactOverride={actionByRank[task.rank] ? (actionByRank[task.rank].payPeriodImpact || 0) * 12 : null}
                        onComplete={completeTask}
                        onCompleted={onCompleted}
                        lang={lang}
                      />
                    ))}
                  </>
                )}
              </div>

              {/* Habit changes — Cut This First */}
              <CutThisCard cutData={analysis?.cutThisFirst} c={c} />

              {/* Situational card */}
              <SituationalCard card={analysis?.situationalCard} c={c} />

              {/* Pay period runway */}
              <PayPeriodRunwayCard ps={analysis?.paydaySummary} advanceData={analysis?.safeAdvanceAmount} c={c} />

              {/* Cash flow */}
              {analysis?.paydaySummary && (
                <Section icon="💸" label={c.cashFlowLabel} headline={analysis.paydaySummary.oneLineSummary || `${USD(analysis.paydaySummary.monthlyIncome)} in. ${USD(analysis.paydaySummary.monthlyExpenses)} out.`} defaultOpen={true}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                    <div style={{ background: '#f8f8f8', borderRadius: 10, padding: '13px 15px' }}>
                      <div style={{ fontSize: 10, color: '#bbb', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 }}>{c.income}</div>
                      <div style={{ fontSize: 22, fontWeight: 800 }}>{USD(analysis.paydaySummary.monthlyIncome)}</div>
                    </div>
                    <div style={{ background: '#f8f8f8', borderRadius: 10, padding: '13px 15px' }}>
                      <div style={{ fontSize: 10, color: '#bbb', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 }}>{c.expenses}</div>
                      <div style={{ fontSize: 22, fontWeight: 800 }}>{USD(analysis.paydaySummary.monthlyExpenses)}</div>
                    </div>
                  </div>
                  {analysis.paydaySummary.monthlySurplus != null && (
                    <div style={{ background: analysis.paydaySummary.monthlySurplus > 200 ? '#f0fff4' : analysis.paydaySummary.monthlySurplus > 0 ? '#fffbea' : '#fff3f3', borderRadius: 10, padding: '14px 16px', marginBottom: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: statusLabel ? 8 : 0 }}>
                        <span style={{ fontSize: 13, color: OB.grey, fontWeight: 600 }}>{c.surplusLabel}</span>
                        <span style={{ fontSize: 14, fontWeight: 800, color: analysis.paydaySummary.monthlySurplus > 0 ? OB.teal : '#de350b' }}>{USD(Math.abs(analysis.paydaySummary.monthlySurplus))}{c.perMonth}</span>
                      </div>
                      {statusLabel && <p style={{ fontSize: 13, color: '#555', marginBottom: 0 }}>{statusLabel}</p>}
                    </div>
                  )}
                  {analysis.paydaySummary.topMerchants?.length > 0 && (
                    <div>
                      <p style={{ fontSize: 10, fontWeight: 700, color: '#bbb', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{c.topSpending}</p>
                      {analysis.paydaySummary.topMerchants.map((m, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < analysis.paydaySummary.topMerchants.length - 1 ? '1px solid #f5f5f5' : 'none' }}>
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

              {/* Spending snapshot */}
              <SpendingSnapshot snapshot={analysis?.spendingSnapshot} c={c} />

              {/* Partial picture warning — bottom of plan, non-intrusive */}
              {analysis?.confidence?.caveats?.length > 0 && (
                <div style={{ background: '#fffbea', border: '1px solid #ffe57a', borderRadius: 12, padding: '14px 18px', marginBottom: 12, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 20, flexShrink: 0 }}>&#9680;</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 700, fontSize: 14, color: '#5a4000', marginBottom: 4 }}>
                      Partial picture &mdash; {analysis.confidence.completenessPercent}% complete
                    </p>
                    <p style={{ fontSize: 13, color: '#7a5c00', lineHeight: 1.55, marginBottom: 10 }}>{analysis.confidence.caveats[0]}</p>
                    <button onClick={() => setActiveSection('banks')} style={{ background: OB.blue, color: 'white', fontSize: 12, fontWeight: 700, padding: '7px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                      {c.connectAnother}
                    </button>
                  </div>
                </div>
              )}

              {/* Next refresh */}
              <div style={{ background: 'white', borderRadius: 16, padding: '20px 22px', border: '1px solid #e8e8e8' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 4, color: OB.grey }}>&#128260; {c.nextRefresh}</p>
                    <p style={{ fontSize: 13, color: '#555' }}>
                      {daysUntil === null ? c.noActions : daysUntil === 0 ? c.refreshReady : c.refreshIn(daysUntil)}
                    </p>
                  </div>
                  {daysUntil === 0 && (
                    <a href="/" style={{ background: OB.blue, color: 'white', padding: '12px 18px', borderRadius: 10, textDecoration: 'none', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>{c.refreshCta}</a>
                  )}
                </div>
                {daysUntil !== null && daysUntil > 0 && (
                  <>
                    <div style={{ marginTop: 14, background: '#f0f0f0', borderRadius: 8, height: 5, overflow: 'hidden' }}>
                      <div style={{ background: OB.teal, height: '100%', width: `${Math.min(100, ((30 - daysUntil) / 30) * 100)}%`, borderRadius: 8, transition: 'width 0.6s ease' }} />
                    </div>
                    <p style={{ fontSize: 11, color: '#bbb', marginTop: 6 }}>{c.dayOf(30 - daysUntil)}</p>
                  </>
                )}
              </div>
            </>
          )}

          {/* ── BANKS TAB ── */}
          {activeSection === 'banks' && (
            <>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#bbb', marginBottom: 14 }}>{c.connectedAccounts}</p>

              {displayAccounts.length === 0 ? (
                <div style={{ background: 'white', borderRadius: 16, padding: '32px 24px', textAlign: 'center', marginBottom: 16 }}>
                  <p style={{ color: '#888', marginBottom: 4 }}>{c.noAccounts}</p>
                  <p style={{ fontSize: 13, color: '#bbb' }}>{c.noAccountsSub}</p>
                </div>
              ) : (
                <div style={{ marginBottom: 16 }}>
                  {displayAccounts.map(account => (
                    <div key={account.id} style={{ background: 'white', borderRadius: 14, padding: '16px 18px', marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #e8e8e8' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 38, height: 38, borderRadius: '50%', background: `${OB.blue}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>&#127982;</div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                            <p style={{ fontWeight: 700, fontSize: 14, color: OB.grey }}>{account.institution_name || 'Bank'}</p>
                            {account.isDemo && <span style={{ fontSize: 10, fontWeight: 700, background: `${OB.yellow}44`, color: '#856404', padding: '2px 7px', borderRadius: 6 }}>{c.demoLabel}</span>}
                          </div>
                          <p style={{ fontSize: 12, color: '#aaa' }}>
                            {account.isDemo
                              ? c.demoSub
                              : c.lastSynced(account.last_synced_at ? new Date(account.last_synced_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—')}
                          </p>
                        </div>
                      </div>
                      {!account.isDemo && (
                        <button onClick={() => removeAccount(account.id)} style={{ fontSize: 12, color: '#de350b', background: 'none', border: '1px solid #de350b', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit' }}>
                          {c.removeBank}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <AddBankButton onSuccess={onBankAdded} lang={lang} />

              <div style={{ marginTop: 16, padding: '14px 18px', background: '#f8f8f8', borderRadius: 12, fontSize: 12, color: '#888', lineHeight: 1.65 }}>
                &#128274; <strong style={{ color: '#555' }}>{c.securityNote}</strong> {c.securityBody}
              </div>

              {displayAccounts.length > 0 && (
                <div style={{ marginTop: 20, background: OB.blue, borderRadius: 16, padding: '22px', textAlign: 'center' }}>
                  <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginBottom: 4 }}>{c.addedAccount}</p>
                  <p style={{ color: 'white', fontWeight: 700, fontSize: 15, marginBottom: 16 }}>{c.rerunAnalysis}</p>
                  <a href="/" style={{ display: 'inline-block', background: OB.yellow, color: OB.blueShade, padding: '14px 28px', borderRadius: 10, textDecoration: 'none', fontSize: 14, fontWeight: 800 }}>
                    {c.refreshAnalysis}
                  </a>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Blinky chat — pre-loaded with this user's analysis */}
      {analysis && <FinancialChat analysis={analysis} lang={lang === 'EN' ? 'en' : 'es'} />}
    </>
  )
}
