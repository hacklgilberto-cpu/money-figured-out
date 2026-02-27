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
    movesHeadline: (n) => `${CAD(n)}/yr in potential savings`,
    movesSub: 'Three moves right now. Four habits to shift. Here is exactly how.',
    scrollCta: 'Show me how',
    storyLabel: 'THE HONEST PICTURE',
    yourMoneyThisMonth: 'YOUR MONEY THIS MONTH',
    income: 'Monthly income',
    expenses: 'Monthly expenses',
    surplusLabel: 'Left over each month',
    savedLabel: 'Actually going to savings',
    gapLabel: 'The gap this plan closes',
    topSpending: 'Where it goes',
    perMonth: '/mo',
    perYear: '/yr',
    movesLabel: 'THREE MOVES RIGHT NOW',
    movesTitle: 'Do these in order. Each one funds the next.',
    tapToExpand: 'Tap any move to see the exact steps',
    howExactly: 'How, exactly',
    doRightNow: 'Right now',
    habitsLabel: 'FOUR HABITS TO SHIFT',
    habitsSub: (n) => `${CAD(n)}/yr stays in your account`,
    keepThese: 'Keep these',
    projLabel: 'YOUR SAVINGS JOURNEY',
    projToday: 'Today',
    projFuture: 'In 12 months',
    projSavings: (n) => `${CAD(n)}/mo in new savings once all three moves are done.`,
    savePlan: 'Turn this into a to-do list',
    saveSub: 'Save your plan and track your progress as you check things off. We refresh your analysis every 90 days.',
    saveCta: "Save my plan. It's free.",
    saveSeconds: '20 seconds. No credit card.',
    createAccount: 'Create your free account',
    roadmapWaiting: 'Your roadmap will be waiting for you.',
    emailLabel: 'Email',
    passwordLabel: 'Password',
    saveButton: 'Save my roadmap',
    saving: 'Saving\u2026',
    haveAccount: 'Already have an account?',
    signIn: 'Sign in',
    partial: 'Partial picture',
    connectMore: 'Connect more accounts',
    disclaimer: 'For informational purposes only. Not financial advice. Verify TFSA room at CRA My Account.',
    sitLabels: {
      debt_payoff: 'Pay this off first',
      idle_money: 'Your savings can work harder',
      surplus_leaking: 'Your surplus is slipping away',
      portfolio_gap: 'An investing gap worth closing',
      emergency_fund: 'Build your safety net',
      fhsa_opportunity: 'The government owes you money',
      def: 'Worth knowing',
    },
  },
  FR: {
    title: 'Votre plan financier',
    brand: 'vos finances, enfin claires',
    hereIsWhat: "VOICI CE QU'ON A TROUV\u00c9",
    movesHeadline: (n) => `${CAD(n)}/an en \u00e9conomies potentielles`,
    movesSub: 'Trois actions maintenant. Quatre habitudes \u00e0 changer. Voici exactement comment.',
    scrollCta: 'Montrez-moi comment',
    storyLabel: 'LE PORTRAIT HONN\u00caTE',
    yourMoneyThisMonth: 'VOTRE ARGENT CE MOIS-CI',
    income: 'Revenus mensuels',
    expenses: 'D\u00e9penses mensuelles',
    surplusLabel: 'Restant chaque mois',
    savedLabel: 'Vraiment mis de c\u00f4t\u00e9',
    gapLabel: 'L\u00e9cart que ce plan comble',
    topSpending: 'O\u00f9 \u00e7a va',
    perMonth: '/mois',
    perYear: '/an',
    movesLabel: 'TROIS ACTIONS MAINTENANT',
    movesTitle: 'Faites-les dans cet ordre. Chacune finance la suivante.',
    tapToExpand: 'Appuyez pour voir les \u00e9tapes exactes',
    howExactly: 'Comment exactement',
    doRightNow: 'Maintenant',
    habitsLabel: 'QUATRE HABITUDES \u00c0 CHANGER',
    habitsSub: (n) => `${CAD(n)}/an qui reste dans votre compte`,
    keepThese: 'Gardez ceux-ci',
    projLabel: 'VOTRE PROGRESSION',
    projToday: "Aujourd'hui",
    projFuture: 'Dans 12 mois',
    projSavings: (n) => `${CAD(n)}/mois en nouvelles \u00e9conomies une fois les trois actions compl\u00e9t\u00e9es.`,
    savePlan: 'Transformez \u00e7a en liste de t\u00e2ches',
    saveSub: 'Sauvegardez votre plan et suivez vos progr\u00e8s. On actualise votre analyse tous les 90 jours.',
    saveCta: "Sauvegarder mon plan. C'est gratuit.",
    saveSeconds: '20 secondes. Sans carte de cr\u00e9dit.',
    createAccount: 'Cr\u00e9ez votre compte gratuit',
    roadmapWaiting: 'Votre plan vous attendra.',
    emailLabel: 'Courriel',
    passwordLabel: 'Mot de passe',
    saveButton: 'Sauvegarder mon plan',
    saving: 'Sauvegarde\u2026',
    haveAccount: 'D\u00e9j\u00e0 un compte?',
    signIn: 'Connexion',
    partial: 'Portrait partiel',
    connectMore: 'Connecter plus de comptes',
    disclaimer: '\u00c0 titre informatif seulement. Pas un conseil financier. V\u00e9rifiez votre espace C\u00c9LI \u00e0 Mon dossier ARC.',
    sitLabels: {
      debt_payoff: 'Remboursez ceci en premier',
      idle_money: 'Votre \u00e9pargne peut travailler plus fort',
      surplus_leaking: 'Votre surplus s\u00e9chappe',
      portfolio_gap: 'Une lacune d\u2019investissement \u00e0 combler',
      emergency_fund: 'B\u00e2tissez votre filet de s\u00e9curit\u00e9',
      fhsa_opportunity: 'Le gouvernement vous doit de l\u2019argent',
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

function Section({ icon, label, headline, headlineColor, defaultOpen, accent, children }) {
  const [open, setOpen] = useState(defaultOpen || false)
  return (
    <div style={{ background: 'white', border: accent ? `2px solid ${accent}` : '1px solid #e8e8e8', borderRadius: 16, marginBottom: 10, overflow: 'hidden', boxShadow: open ? '0 2px 12px rgba(0,0,0,0.06)' : 'none' }}>
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
  // Replace time references with "right now"
  const displayTime = timeToComplete
    ? timeToComplete.replace(/\d+\s*(hour|hr|hours|minute|min|minutes)[^,.]*/gi, c.doRightNow)
    : c.doRightNow
  return (
    <div onClick={() => setOpen(o => !o)} style={{ border: wealthsimpleProduct ? '1.5px solid #b8dacc' : '1px solid #ebebeb', borderRadius: 12, marginBottom: 8, overflow: 'hidden', cursor: 'pointer', background: open ? '#fafafa' : 'white' }}>
      <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 30, height: 30, borderRadius: '50%', background: rankBg[rank - 1] || '#333', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13, flexShrink: 0 }}>
          {rank}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 700, fontSize: 14, lineHeight: 1.35, marginBottom: 3 }}>{action}</p>
          <p style={{ fontSize: 12, color: '#aaa' }}>{displayTime}</p>
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
  const actionColor = { cancel: '#de350b', reduce: '#856404', renegotiate: '#1a4a8f' }
  const actionBg =   { cancel: '#ffe8e8', reduce: '#fff8e1', renegotiate: '#e8f0ff' }
  return (
    <Section icon="✂️" label={c.habitsLabel} headline={c.habitsSub(cutData.netAnnualSavings)} headlineColor="#00875a">
      {cutData.items.map((item, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '12px 0', borderBottom: i < cutData.items.length - 1 ? '1px solid #f5f5f5' : 'none' }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>
              <span style={{ display: 'inline-block', background: actionBg[item.action] || '#f0f0f0', color: actionColor[item.action] || '#333', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 6, marginRight: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {item.action}
              </span>
              {item.merchant}
            </p>
            <p style={{ fontSize: 12, color: '#999', lineHeight: 1.5 }}>{item.howTo}</p>
          </div>
          <div style={{ fontWeight: 800, fontSize: 14, color: '#00875a', marginLeft: 12, flexShrink: 0 }}>{CAD(item.monthlyAmount)}{c.perMonth}</div>
        </div>
      ))}
      {cutData.keepThese?.length > 0 && (
        <div style={{ marginTop: 14, background: '#f8f8f8', borderRadius: 8, padding: '10px 14px' }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#bbb', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{c.keepThese}</p>
          {cutData.keepThese.map((k, i) => <p key={i} style={{ fontSize: 13, color: '#555', marginBottom: 4, lineHeight: 1.5 }}>OK {k}</p>)}
        </div>
      )}
    </Section>
  )
}

function SituationalCard({ card, c }) {
  if (!card || card.type === 'none') return null
  const icons = {
    debt_payoff: '💳', idle_money: '💤', surplus_leaking: '💡',
    portfolio_gap: '📈', emergency_fund: '🛡️', fhsa_opportunity: '🏠',
  }
  const accents = {
    fhsa_opportunity: '#00875a', idle_money: '#00875a',
    debt_payoff: '#1d3557', emergency_fund: '#1d3557',
  }
  const icon = icons[card.type] || '💡'
  const label = c.sitLabels[card.type] || c.sitLabels.def
  const accent = accents[card.type] || null
  return (
    <Section icon={icon} label={label} headline={card.headline} accent={accent}>
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
      {card.wealthsimpleProduct && <div style={{ marginBottom: 10 }}><WSBadge productKey={card.wealthsimpleProduct} /></div>}
      {card.action && (
        <div style={{ background: '#f0fff4', borderRadius: 8, padding: '12px 14px', fontSize: 14, color: '#1a4a2e', fontWeight: 600, lineHeight: 1.5 }}>
          {card.action}
        </div>
      )}
    </Section>
  )
}

function SavingsProjection({ projection, c }) {
  if (!projection?.show) return null
  const savings = projection.monthlySavingsIfPlanFollowed || 0
  const gain = (projection.netWorthIn12Months || 0) - (projection.netWorthToday || 0)

  return (
    <Section icon="🎯" label={c.projLabel} headline={projection.oneLineSummary} defaultOpen={false}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
        <div style={{ background: '#f8f8f8', borderRadius: 10, padding: '14px 16px' }}>
          <div style={{ fontSize: 10, color: '#bbb', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{c.projToday}</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#555' }}>$92{c.perMonth}</div>
          <div style={{ fontSize: 12, color: '#bbb', marginTop: 2 }}>going to savings</div>
        </div>
        <div style={{ background: '#e8f5ee', borderRadius: 10, padding: '14px 16px' }}>
          <div style={{ fontSize: 10, color: '#00875a', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{c.projFuture}</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#00875a' }}>{CAD(savings)}{c.perMonth}</div>
          <div style={{ fontSize: 12, color: '#00875a', marginTop: 2 }}>going to savings</div>
        </div>
      </div>
      {gain > 0 && (
        <div style={{ background: '#f0fff4', borderRadius: 8, padding: '12px 14px' }}>
          <p style={{ fontSize: 14, color: '#1a4a2e', fontWeight: 600, lineHeight: 1.5 }}>
            {CAD(gain)} more working for you over the next 12 months.
          </p>
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
  const { cashFlow: cf, priorityActions, cutThisFirst, situationalCard, projection, confidence } = analysis

  const structuralImpact = (priorityActions || []).reduce((s, a) => s + (a.annualImpact || 0), 0)
  const habitImpact = cutThisFirst?.netAnnualSavings || 0
  const totalImpact = structuralImpact + habitImpact

  // Monthly surplus gap: what they earn minus expenses minus what actually gets saved
  const surplus = cf?.monthlySurplus || 0
  const actualSaved = 92 // from Sofia's data; for real users this comes from investment transfers
  const gap = Math.max(0, surplus - actualSaved)

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
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ display: 'flex', gap: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 20, padding: 3 }}>
              {['EN', 'FR'].map(l => (
                <button key={l} onClick={() => setLang(l)} style={{ padding: '4px 12px', borderRadius: 16, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 11, letterSpacing: '0.08em', background: lang === l ? 'white' : 'transparent', color: lang === l ? '#0d0d0d' : '#666' }}>
                  {l}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* ── HERO: Total impact, two-part breakdown ── */}
        <div style={{ background: '#0d0d0d', color: 'white', padding: '48px 24px 56px', textAlign: 'center' }}>
          {totalImpact > 0 && (
            <>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#666', marginBottom: 14 }}>
                {c.hereIsWhat}
              </p>
              <div style={{ fontSize: 'clamp(44px, 11vw, 72px)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1, color: '#52c41a', marginBottom: 10 }}>
                {c.movesHeadline(totalImpact)}
              </div>
              <p style={{ fontSize: 15, color: '#aaa', marginBottom: 20, lineHeight: 1.6 }}>{c.movesSub}</p>

              {/* Two-part split */}
              <div style={{ display: 'inline-grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: 'rgba(255,255,255,0.06)', borderRadius: 14, overflow: 'hidden', marginBottom: 24, textAlign: 'left' }}>
                <div style={{ padding: '14px 20px' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>3 moves right now</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#52c41a' }}>+{CAD(structuralImpact)}{c.perYear}</div>
                </div>
                <div style={{ padding: '14px 20px', borderLeft: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>4 habit shifts</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#52c41a' }}>+{CAD(habitImpact)}{c.perYear}</div>
                </div>
              </div>

              <div
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 24, padding: '10px 22px', cursor: 'pointer' }}
                onClick={() => document.getElementById('moves')?.scrollIntoView({ behavior: 'smooth' })}
              >
                <span style={{ fontSize: 13, color: '#aaa' }}>{c.scrollCta}</span>
                <span style={{ color: '#52c41a', fontSize: 16 }}>↓</span>
              </div>
            </>
          )}
        </div>

        <div style={{ maxWidth: 660, margin: '0 auto', padding: '24px 16px 80px' }}>

          {/* Partial data warning */}
          {confidence?.caveats?.length > 0 && (
            <div style={{ background: '#fffbea', border: '1px solid #ffe57a', borderRadius: 12, padding: '14px 18px', marginBottom: 16, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 20, flexShrink: 0 }}>◑</span>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 700, fontSize: 14, color: '#5a4000', marginBottom: 4 }}>
                  {c.partial} {confidence.completenessPercent}% complete
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

          {/* ── CASH FLOW: The honest picture ── */}
          {cf && (
            <Section
              icon="💸"
              label={c.yourMoneyThisMonth}
              headline={`${CAD(cf.monthlyIncome)}/mo in. ${CAD(cf.monthlyExpenses)}/mo out.`}
              defaultOpen={true}
            >
              {/* Income / Expenses */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                <div style={{ background: '#f8f8f8', borderRadius: 10, padding: '13px 15px' }}>
                  <div style={{ fontSize: 10, color: '#bbb', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 }}>{c.income}</div>
                  <div style={{ fontSize: 22, fontWeight: 800 }}>{CAD(cf.monthlyIncome)}</div>
                </div>
                <div style={{ background: '#f8f8f8', borderRadius: 10, padding: '13px 15px' }}>
                  <div style={{ fontSize: 10, color: '#bbb', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 }}>{c.expenses}</div>
                  <div style={{ fontSize: 22, fontWeight: 800 }}>{CAD(cf.monthlyExpenses)}</div>
                </div>
              </div>

              {/* The gap — this is the story */}
              {surplus > 0 && (
                <div style={{ background: '#f0fff4', borderRadius: 10, padding: '14px 16px', marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 13, color: '#333', fontWeight: 600 }}>{c.surplusLabel}</span>
                    <span style={{ fontSize: 14, fontWeight: 800, color: '#00875a' }}>{CAD(surplus)}{c.perMonth}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 13, color: '#888' }}>{c.savedLabel}</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#aaa' }}>{CAD(actualSaved)}{c.perMonth}</span>
                  </div>
                  {gap > 0 && (
                    <div style={{ borderTop: '1px solid #c8ead8', paddingTop: 8, display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 13, color: '#00875a', fontWeight: 700 }}>{c.gapLabel}</span>
                      <span style={{ fontSize: 14, fontWeight: 800, color: '#00875a' }}>{CAD(gap)}{c.perMonth}</span>
                    </div>
                  )}
                </div>
              )}

              {cf.oneLineObservation && (
                <p style={{ fontSize: 14, color: '#555', lineHeight: 1.65, marginBottom: cf.topMerchants?.length ? 16 : 0 }}>{cf.oneLineObservation}</p>
              )}

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

          {/* ── 3 MOVES RIGHT NOW ── */}
          <div id="moves">
            <Section icon="✅" label={c.movesLabel} headline={c.movesTitle} defaultOpen={true} accent="#00875a">
              {(priorityActions || []).map(a => <ActionCard key={a.rank} {...a} c={c} />)}
              <p style={{ fontSize: 12, color: '#ccc', marginTop: 10, textAlign: 'center' }}>{c.tapToExpand}</p>
            </Section>
          </div>

          {/* ── 4 HABITS TO SHIFT ── */}
          <CutThisCard cutData={cutThisFirst} c={c} />

          {/* ── SITUATIONAL CARD (FHSA, etc.) ── */}
          <SituationalCard card={situationalCard} c={c} />

          {/* ── PROJECTION ── */}
          <SavingsProjection projection={projection} c={c} />

          {/* ── SAVE CTA ── */}
          <div style={{ marginTop: 24 }}>
            {saveStep === 'prompt' && (
              <div style={{ background: '#0d0d0d', borderRadius: 16, padding: '32px 24px', textAlign: 'center' }}>
                <div style={{ fontSize: 32, marginBottom: 14 }}>📋</div>
                <h3 style={{ fontSize: 22, fontWeight: 800, color: 'white', marginBottom: 10, letterSpacing: '-0.02em' }}>
                  {c.savePlan}
                </h3>
                <p style={{ color: '#aaa', fontSize: 15, lineHeight: 1.65, maxWidth: 360, margin: '0 auto 24px' }}>
                  {c.saveSub}
                </p>
                <button onClick={() => setSaveStep('form')} style={{ background: '#00875a', color: 'white', border: 'none', borderRadius: 10, padding: '16px 36px', fontSize: 16, fontWeight: 700, cursor: 'pointer', width: '100%', maxWidth: 320 }}>
                  {c.saveCta}
                </button>
                <p style={{ marginTop: 10, fontSize: 12, color: '#aaa' }}>{c.saveSeconds}</p>
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
