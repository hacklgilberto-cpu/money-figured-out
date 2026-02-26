import { useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { signIn } from 'next-auth/react'

const CAD = (n) => n != null
  ? new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(n)
  : '\u2014'

const C = {
  EN: {
    title: 'Your Financial Roadmap',
    brand: 'your money, figured out',
    hereIsWhat: "HERE'S WHAT WE FOUND",
    availableToUnlock: "available to unlock \u2014 here's exactly how",
    seeActions: 'See your 3 priority actions',
    netWorthToday: 'your net worth today',
    partial: 'Partial picture',
    connectMore: 'Connect more accounts \u2192',
    yourMoneyThisMonth: 'YOUR MONEY THIS MONTH',
    income: 'Monthly income',
    expenses: 'Monthly expenses',
    topSpending: 'Top spending',
    perMonth: '/mo',
    perYear: '/yr',
    surplus: 'surplus',
    shortfall: 'shortfall',
    doThese: 'DO THESE 3 THINGS',
    highestImpact: 'Your highest-impact moves, in order',
    tapToExpand: 'Tap any action to see the exact steps',
    howExactly: 'How exactly',
    cutFirst: 'Cut this first',
    backInPocket: 'back in your pocket',
    keepThese: 'Keep these',
    inMonth: 'IN 12 MONTHS',
    today: 'Today',
    months12: '12 months',
    savingsSentence: 'in new savings if you complete all three actions.',
    savePlan: 'Turn this into a to-do list',
    saveSub: 'Save your plan and track your progress as you check things off. We update your analysis every 90 days.',
    saveCta: "Save my plan \u2014 it's free \u2192",
    saveSeconds: '20 seconds. No credit card.',
    createAccount: 'Create your free account',
    roadmapWaiting: 'Your roadmap will be waiting for you.',
    emailLabel: 'Email',
    passwordLabel: 'Password',
    saveButton: 'Save my roadmap \u2192',
    saving: 'Saving\u2026',
    haveAccount: 'Already have an account?',
    signIn: 'Sign in',
    disclaimer: 'For informational purposes only. Not financial advice. Verify TFSA room at CRA My Account.',
    sitLabels: {
      debt_payoff: 'Debt payoff plan',
      idle_money: 'Your money is idle',
      surplus_leaking: 'Your surplus is leaking',
      portfolio_gap: 'Portfolio gap',
      emergency_fund: 'Safety net missing',
      fhsa_opportunity: 'FHSA opportunity',
      def: 'Worth knowing',
    },
  },
  FR: {
    title: 'Votre plan financier',
    brand: 'vos finances, enfin claires',
    hereIsWhat: "VOICI CE QU'ON A TROUV\u00c9",
    availableToUnlock: '\u00e0 d\u00e9bloquer \u2014 voici exactement comment',
    seeActions: 'Voir mes 3 actions prioritaires',
    netWorthToday: "votre valeur nette aujourd'hui",
    partial: 'Portrait partiel',
    connectMore: 'Connecter plus de comptes \u2192',
    yourMoneyThisMonth: 'VOTRE ARGENT CE MOIS-CI',
    income: 'Revenus mensuels',
    expenses: 'D\u00e9penses mensuelles',
    topSpending: 'D\u00e9penses principales',
    perMonth: '/mois',
    perYear: '/an',
    surplus: 'surplus',
    shortfall: 'd\u00e9ficit',
    doThese: 'FAITES CES 3 CHOSES',
    highestImpact: 'Vos actions \u00e0 plus grand impact, en ordre',
    tapToExpand: 'Appuyez sur une action pour voir les \u00e9tapes',
    howExactly: 'Comment exactement',
    cutFirst: 'Coupez \u00e7a en premier',
    backInPocket: 'de retrouv\u00e9s dans votre poche',
    keepThese: 'Gardez ceux-ci',
    inMonth: 'DANS 12 MOIS',
    today: "Aujourd'hui",
    months12: '12 mois',
    savingsSentence: "d'\u00e9conomies si vous r\u00e9alisez les trois actions.",
    savePlan: 'Transformez \u00e7a en liste de t\u00e2ches',
    saveSub: 'Sauvegardez votre plan et suivez vos progr\u00e8s. On met \u00e0 jour votre analyse tous les 90 jours.',
    saveCta: "Sauvegarder mon plan \u2014 c'est gratuit \u2192",
    saveSeconds: '20 secondes. Sans carte de cr\u00e9dit.',
    createAccount: 'Cr\u00e9ez votre compte gratuit',
    roadmapWaiting: 'Votre plan vous attendra.',
    emailLabel: 'Courriel',
    passwordLabel: 'Mot de passe',
    saveButton: 'Sauvegarder mon plan \u2192',
    saving: 'Sauvegarde\u2026',
    haveAccount: 'D\u00e9j\u00e0 un compte?',
    signIn: 'Connexion',
    disclaimer: '\u00c0 titre informatif seulement. Pas un conseil financier. V\u00e9rifiez votre espace C\u00c9LI \u00e0 Mon dossier ARC.',
    sitLabels: {
      debt_payoff: 'Plan de remboursement',
      idle_money: 'Votre argent dort',
      surplus_leaking: 'Votre surplus fuit',
      portfolio_gap: 'Lacune de portefeuille',
      emergency_fund: 'Filet de s\u00e9curit\u00e9 manquant',
      fhsa_opportunity: 'Opportunit\u00e9 CELIAPP',
      def: '\u00c0 savoir',
    },
  },
}

const WS_PRODUCTS = {
  fhsa:          { label: 'FHSA',          url: 'wealthsimple.com/fhsa', color: '#00875a' },
  tfsa:          { label: 'TFSA',          url: 'wealthsimple.com',      color: '#1d6b3e' },
  rrsp:          { label: 'RRSP',          url: 'wealthsimple.com',      color: '#1a4a2e' },
  save:          { label: 'Save',          url: 'wealthsimple.com/save', color: '#00875a' },
  managed:       { label: 'Managed',       url: 'wealthsimple.com',      color: '#1d3557' },
  self_directed: { label: 'Self-Directed', url: 'wealthsimple.com',      color: '#1d3557' },
}

function WSBadge({ productKey }) {
  if (!productKey || !WS_PRODUCTS[productKey]) return null
  const p = WS_PRODUCTS[productKey]
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#e8f5ee', borderRadius: 6, padding: '4px 10px', marginBottom: 10 }}>
      <div style={{ width: 16, height: 16, borderRadius: 3, background: p.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: 'white', fontSize: 9, fontWeight: 800 }}>W</span>
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, color: p.color }}>Wealthsimple {p.label}</span>
      <span style={{ fontSize: 11, color: '#888' }}>&middot; {p.url}</span>
    </div>
  )
}

function ProjectionLine({ today, future, c }) {
  const improving = future > today
  const endColor = future >= 0 ? '#52c41a' : improving ? '#f0a500' : '#ff6b6b'
  const startColor = today >= 0 ? '#52c41a' : '#ff6b6b'
  return (
    <div style={{ margin: '20px 0 8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div>
          <div style={{ fontSize: 11, color: '#aaa', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{c.today}</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: startColor }}>{CAD(today)}</div>
        </div>
        <div style={{ flex: 1 }}>
          <svg width="100%" height="36" viewBox="0 0 200 36" preserveAspectRatio="none">
            <defs>
              <linearGradient id="pg" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={startColor} />
                <stop offset="100%" stopColor={endColor} />
              </linearGradient>
            </defs>
            <line x1="4" y1="28" x2="196" y2={improving ? 8 : 28} stroke="url(#pg)" strokeWidth="3" strokeLinecap="round" />
            <circle cx="196" cy={improving ? 8 : 28} r="5" fill={endColor} />
          </svg>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, color: '#aaa', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{c.months12}</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: endColor }}>{CAD(future)}</div>
        </div>
      </div>
    </div>
  )
}

function Section({ icon, label, headline, headlineColor, defaultOpen, children }) {
  const [open, setOpen] = useState(defaultOpen || false)
  return (
    <div style={{ background: 'white', border: '1px solid #e8e8e8', borderRadius: 16, marginBottom: 10, overflow: 'hidden', boxShadow: open ? '0 2px 12px rgba(0,0,0,0.06)' : 'none' }}>
      <div onClick={() => setOpen(o => !o)} style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', userSelect: 'none' }}>
        <div style={{ fontSize: 24, flexShrink: 0, lineHeight: 1 }}>{icon}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#c0c0c0', marginBottom: 5 }}>{label}</div>
          <div style={{ fontSize: 17, fontWeight: 800, color: headlineColor || '#0d0d0d', lineHeight: 1.25 }}>{headline}</div>
        </div>
        <div style={{ width: 28, height: 28, borderRadius: '50%', border: '2px solid #e8e8e8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0, fontWeight: 700, background: open ? '#0d0d0d' : 'white', color: open ? 'white' : '#999', transition: 'all 0.15s' }}>
          {open ? 'x' : '+'}
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

function ActionCard({ rank, action, whyNow, howExactly, timeToComplete, annualImpact, impactExplanation, wealthsimpleProduct, c }) {
  const [open, setOpen] = useState(false)
  const rankBg = ['#0d0d0d', '#00875a', '#1d3557']
  return (
    <div onClick={() => setOpen(o => !o)} style={{ border: wealthsimpleProduct ? '1.5px solid #b8dacc' : '1px solid #ebebeb', borderRadius: 12, marginBottom: 8, overflow: 'hidden', cursor: 'pointer', background: open ? '#fafafa' : 'white' }}>
      <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 30, height: 30, borderRadius: '50%', background: rankBg[rank - 1] || '#333', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13, flexShrink: 0 }}>
          {rank}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 700, fontSize: 14, lineHeight: 1.35, marginBottom: 3 }}>{action}</p>
          <p style={{ fontSize: 12, color: '#aaa' }}>{timeToComplete}</p>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#00875a' }}>+{CAD(annualImpact)}{c.perYear}</div>
        </div>
        <div style={{ width: 24, height: 24, borderRadius: '50%', border: '1.5px solid #e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, flexShrink: 0, background: open ? '#0d0d0d' : 'white', color: open ? 'white' : '#bbb', transition: 'all 0.15s' }}>
          {open ? 'x' : '+'}
        </div>
      </div>
      {open && (
        <div style={{ padding: '0 16px 16px', borderTop: '1px solid #f0f0f0' }}>
          {wealthsimpleProduct && <div style={{ marginTop: 12 }}><WSBadge productKey={wealthsimpleProduct} /></div>}
          {whyNow && <p style={{ marginTop: wealthsimpleProduct ? 6 : 12, fontSize: 13, color: '#888', marginBottom: 10, fontStyle: 'italic' }}>{whyNow}</p>}
          {howExactly && (
            <div style={{ background: '#f8f8f8', borderRadius: 8, padding: '12px 14px', marginBottom: 10 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{c.howExactly}</p>
              <p style={{ fontSize: 14, color: '#333', lineHeight: 1.6 }}>{howExactly}</p>
            </div>
          )}
          {impactExplanation && <p style={{ fontSize: 13, color: '#00875a', fontWeight: 600 }}>{impactExplanation}</p>}
        </div>
      )}
    </div>
  )
}

function CutThisCard({ cutData, c }) {
  if (!cutData?.show || !cutData?.items?.length) return null
  return (
    <Section icon="stop" label={c.cutFirst} headline={`${CAD(cutData.netAnnualSavings)}${c.perYear} ${c.backInPocket}`} headlineColor="#de350b">
      {cutData.items.map((item, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '11px 0', borderBottom: i < cutData.items.length - 1 ? '1px solid #f5f5f5' : 'none' }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>
              <span style={{ display: 'inline-block', background: item.action === 'cancel' ? '#ffe8e8' : '#fff8e1', color: item.action === 'cancel' ? '#c0392b' : '#856404', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 6, marginRight: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {item.action}
              </span>
              {item.merchant}
            </p>
            <p style={{ fontSize: 12, color: '#999' }}>{item.howTo}</p>
          </div>
          <div style={{ fontWeight: 800, fontSize: 14, color: '#de350b', marginLeft: 12, flexShrink: 0 }}>{CAD(item.monthlyAmount)}{c.perMonth}</div>
        </div>
      ))}
      {cutData.keepThese?.length > 0 && (
        <div style={{ marginTop: 14, background: '#f8f8f8', borderRadius: 8, padding: '10px 14px' }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#bbb', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{c.keepThese}</p>
          {cutData.keepThese.map((k, i) => <p key={i} style={{ fontSize: 13, color: '#555', marginBottom: 2 }}>OK {k}</p>)}
        </div>
      )}
    </Section>
  )
}

function SituationalCard({ card, c }) {
  if (!card || card.type === 'none') return null
  const icons = {
    debt_payoff: '💳', idle_money: '💤', surplus_leaking: '🚿',
    portfolio_gap: '📉', emergency_fund: '🛡️', fhsa_opportunity: '🏠',
  }
  const icon = icons[card.type] || '💡'
  const label = c.sitLabels[card.type] || c.sitLabels.def
  return (
    <Section icon={icon} label={label} headline={card.headline}>
      <p style={{ fontSize: 14, color: '#444', lineHeight: 1.65, marginBottom: 16 }}>{card.body}</p>
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
      {card.wealthsimpleProduct && <div style={{ marginBottom: 10 }}><WSBadge productKey={card.wealthsimpleProduct} /></div>}
      {card.action && (
        <div style={{ background: '#f0fff4', borderRadius: 8, padding: '10px 14px', fontSize: 14, color: '#1a4a2e', fontWeight: 600 }}>
          {card.action}
        </div>
      )}
    </Section>
  )
}

export async function getServerSideProps({ params }) {
  const { db } = await import('../../lib/db')
  const result = await db.query('SELECT analysis FROM roadmaps WHERE id = $1', [params.id])
  if (!result.rows[0]) return { notFound: true }
  return { props: { analysis: result.rows[0].analysis, roadmapId: params.id } }
}

export default function RoadmapPage({ analysis, roadmapId }) {
  const router = useRouter()
  const [lang, setLang] = useState('EN')
  const [saveStep, setSaveStep] = useState('prompt')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)

  useState(() => {
    try {
      const stored = sessionStorage.getItem('lang')
      if (stored === 'FR') setLang('FR')
    } catch (e) {}
  })

  const c = C[lang]
  const { netWorthStatement: nw, cashFlow: cf, priorityActions, cutThisFirst, situationalCard, projection, confidence } = analysis
  const totalImpact = (priorityActions || []).reduce((s, a) => s + (a.annualImpact || 0), 0) + (cutThisFirst?.netAnnualSavings || 0)

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    setSaveError(null)
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, roadmapId })
    })
    const data = await res.json()
    if (!res.ok) { setSaveError(data.error || 'Something went wrong'); setSaving(false); return }
    await signIn('credentials', { email, password, redirect: false })
    router.push('/dashboard')
  }

  const inputStyle = { width: '100%', padding: '12px 16px', border: '1.5px solid #e0e0e0', borderRadius: 8, fontSize: 15, outline: 'none', boxSizing: 'border-box' }

  return (
    <>
      <Head><title>{c.title}</title></Head>
      <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>

        <header style={{ background: '#0d0d0d', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 700, fontSize: 16, color: 'white' }}>{c.brand}</span>
          <span style={{ fontSize: 12, color: '#666' }}>
            {new Date().toLocaleDateString(lang === 'FR' ? 'fr-CA' : 'en-CA', { month: 'long', day: 'numeric', year: 'numeric' })}
          </span>
        </header>

        <div style={{ background: '#0d0d0d', color: 'white', padding: '44px 24px 52px', textAlign: 'center' }}>
          {totalImpact > 0 && (
            <div style={{ marginBottom: 32 }}>
              <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#aaa', marginBottom: 12 }}>
                {c.hereIsWhat}
              </p>
              <div style={{ fontSize: 'clamp(48px, 12vw, 76px)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1, color: '#52c41a', marginBottom: 10 }}>
                +{CAD(totalImpact)}{c.perYear}
              </div>
              <p style={{ fontSize: 16, color: '#bbb' }}>{c.availableToUnlock}</p>
              <div
                style={{ marginTop: 20, display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 24, padding: '10px 20px', cursor: 'pointer' }}
                onClick={() => document.getElementById('actions')?.scrollIntoView({ behavior: 'smooth' })}
              >
                <span style={{ fontSize: 13, color: '#aaa' }}>{c.seeActions}</span>
                <span style={{ color: '#52c41a', fontSize: 16 }}>v</span>
              </div>
            </div>
          )}
          <div style={{ display: 'inline-block', borderTop: '1px solid #222', paddingTop: 24, marginTop: totalImpact > 0 ? 0 : 20 }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#888', marginBottom: 10 }}>
              {c.netWorthToday}
            </p>
            <p style={{ fontSize: 28, fontWeight: 800, color: (nw?.netWorth || 0) >= 0 ? '#52c41a' : '#ff6b6b', marginBottom: 6 }}>
              {CAD(nw?.netWorth)}
            </p>
            <p style={{ fontSize: 14, color: '#aaa' }}>{nw?.oneLineContext}</p>
          </div>
        </div>

        <div style={{ maxWidth: 660, margin: '0 auto', padding: '24px 16px 80px' }}>

          {confidence?.caveats?.length > 0 && (
            <div style={{ background: '#fffbea', border: '1px solid #ffe57a', borderRadius: 12, padding: '14px 18px', marginBottom: 20, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 20, flexShrink: 0 }}>◑</span>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 700, fontSize: 14, color: '#5a4000', marginBottom: 4 }}>
                  {c.partial} — {confidence.completenessPercent}% complete
                </p>
                <p style={{ fontSize: 13, color: '#7a5c00', lineHeight: 1.55, marginBottom: 10 }}>
                  {confidence.caveats[0]}
                </p>
                <a href="/" style={{ display: 'inline-block', background: '#5a4000', color: '#fffbea', fontSize: 12, fontWeight: 700, padding: '7px 14px', borderRadius: 8, textDecoration: 'none' }}>
                  {c.connectMore}
                </a>
              </div>
            </div>
          )}

          {cf && (
            <Section
              icon="💸"
              label={c.yourMoneyThisMonth}
              headline={cf.monthlySurplus >= 0
                ? `${CAD(cf.monthlySurplus)}${c.perMonth} ${c.surplus}`
                : `${CAD(Math.abs(cf.monthlySurplus))}${c.perMonth} ${c.shortfall}`}
              headlineColor={cf.monthlySurplus >= 0 ? '#00875a' : '#de350b'}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                {[
                  { label: c.income, value: CAD(cf.monthlyIncome) },
                  { label: c.expenses, value: CAD(cf.monthlyExpenses) },
                ].map(({ label, value }) => (
                  <div key={label} style={{ background: '#f8f8f8', borderRadius: 10, padding: '13px 15px' }}>
                    <div style={{ fontSize: 10, color: '#bbb', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 }}>{label}</div>
                    <div style={{ fontSize: 22, fontWeight: 800 }}>{value}</div>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 14, color: '#555', lineHeight: 1.65, marginBottom: cf.topMerchants?.length ? 16 : 0 }}>{cf.oneLineObservation}</p>
              {cf.topMerchants?.length > 0 && (
                <div>
                  <p style={{ fontSize: 10, fontWeight: 700, color: '#bbb', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{c.topSpending}</p>
                  {cf.topMerchants.map((m, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < cf.topMerchants.length - 1 ? '1px solid #f5f5f5' : 'none' }}>
                      <div>
                        <span style={{ fontWeight: 600, fontSize: 14 }}>{m.name}</span>
                        <span style={{ fontSize: 12, color: '#ccc', marginLeft: 8 }}>{m.category}</span>
                      </div>
                      <span style={{ fontWeight: 700, fontSize: 14 }}>{CAD(m.monthlyAmount)}{c.perMonth}</span>
                    </div>
                  ))}
                </div>
              )}
            </Section>
          )}

          <div id="actions">
            <Section icon="✅" label={c.doThese} headline={c.highestImpact}>
              {(priorityActions || []).map(a => <ActionCard key={a.rank} {...a} c={c} />)}
              <p style={{ fontSize: 12, color: '#ccc', marginTop: 10, textAlign: 'center' }}>{c.tapToExpand}</p>
            </Section>
          </div>

          <CutThisCard cutData={cutThisFirst} c={c} />

          <SituationalCard card={situationalCard} c={c} />

          {projection?.show && (
            <Section icon="🎯" label={c.inMonth} headline={projection.oneLineSummary}>
              <ProjectionLine today={projection.netWorthToday} future={projection.netWorthIn12Months} c={c} />
              <p style={{ fontSize: 14, color: '#555', lineHeight: 1.65, marginTop: 10 }}>
                {CAD(projection.monthlySavingsIfPlanFollowed)}{c.perMonth} {c.savingsSentence}
              </p>
            </Section>
          )}

          <div style={{ marginTop: 24 }}>
            {saveStep === 'prompt' && (
              <div style={{ background: '#0d0d0d', borderRadius: 16, padding: '32px 24px', textAlign: 'center' }}>
                <div style={{ fontSize: 32, marginBottom: 14 }}>📋</div>
                <h3 style={{ fontSize: 22, fontWeight: 800, color: 'white', marginBottom: 10, letterSpacing: '-0.02em' }}>
                  {c.savePlan}
                </h3>
                <p style={{ color: '#666', fontSize: 15, lineHeight: 1.65, maxWidth: 360, margin: '0 auto 24px' }}>
                  {c.saveSub}
                </p>
                <button onClick={() => setSaveStep('form')} style={{ background: '#00875a', color: 'white', border: 'none', borderRadius: 10, padding: '16px 36px', fontSize: 16, fontWeight: 700, cursor: 'pointer', width: '100%', maxWidth: 320 }}>
                  {c.saveCta}
                </button>
                <p style={{ marginTop: 10, fontSize: 12, color: '#666' }}>{c.saveSeconds}</p>
              </div>
            )}
            {saveStep === 'form' && (
              <div style={{ background: 'white', borderRadius: 16, padding: '28px', border: '1px solid #ebebeb' }}>
                <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>{c.createAccount}</h3>
                <p style={{ fontSize: 14, color: '#888', marginBottom: 22 }}>{c.roadmapWaiting}</p>
                {saveError && <div style={{ background: '#fff3f3', border: '1px solid #ffd0d0', color: '#de350b', padding: '10px 14px', borderRadius: 8, fontSize: 14, marginBottom: 16 }}>{saveError}</div>}
                <form onSubmit={handleSave}>
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: 14, marginBottom: 7 }}>{c.emailLabel}</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required style={inputStyle} />
                  </div>
                  <div style={{ marginBottom: 20 }}>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: 14, marginBottom: 7 }}>{c.passwordLabel}</label>
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 8 characters" minLength={8} required style={inputStyle} />
                  </div>
                  <button type="submit" disabled={saving} style={{ width: '100%', background: '#0d0d0d', color: 'white', border: 'none', borderRadius: 10, padding: '16px', fontSize: 16, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1 }}>
                    {saving ? c.saving : c.saveButton}
                  </button>
                </form>
                <p style={{ marginTop: 14, fontSize: 13, color: '#aaa', textAlign: 'center' }}>
                  {c.haveAccount} <a href="/auth/signin" style={{ color: '#555' }}>{c.signIn}</a>
                </p>
              </div>
            )}
          </div>

          <p style={{ marginTop: 24, fontSize: 11, color: '#ccc', lineHeight: 1.7, textAlign: 'center' }}>
            {c.disclaimer}
          </p>
        </div>
      </div>
    </>
  )
}
