import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { usePlaidLink } from 'react-plaid-link'

const CAD = (n) => n != null
  ? new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(n)
  : '\u2014'

// ── Copy / i18n ───────────────────────────────────────────────
const C = {
  EN: {
    pageTitle: 'My Plan \u2014 Your Money, Figured Out',
    brand: 'your money, figured out',
    signOut: 'Sign out',
    planLabel: 'YOUR FINANCIAL PLAN',
    unlockedSoFar: 'unlocked so far',
    actionsDone: (d, t) => `${d} of ${t} actions done`,
    stillAvailable: (a) => ` \u00b7 ${a}/yr still available`,
    allDone: "\u{1F389} All done! You're in the top 1% of people who actually act on their finances.",
    tabPlan: 'My Plan',
    tabBanks: 'Connected Banks',
    yourActions: 'YOUR ACTIONS',
    noActions: 'No action plan yet.',
    generateCta: 'Generate my roadmap \u2192',
    completed: 'COMPLETED',
    howExactly: 'How exactly',
    markDone: 'Mark as done',
    confirmDone: (a) => `Mark "${a}\u2026" as done?`,
    wsSection: 'YOUR WEALTHSIMPLE OPPORTUNITIES',
    wsSectionSub: 'Based on your analysis, these accounts are the highest-return moves you can make right now \u2014 specific to your situation.',
    wealthsimple: 'WEALTHSIMPLE',
    estimatedBenefit: (a) => `Your estimated benefit: +${a}/year`,
    nextRefresh: 'Next analysis refresh',
    refreshReady: 'Ready for a refresh now',
    refreshIn: (d) => `Available in ${d} day${d === 1 ? '' : 's'}`,
    refreshCta: 'Refresh \u2192',
    dayOf: (d) => `Day ${d} of 30`,
    connectedAccounts: 'CONNECTED ACCOUNTS',
    noAccounts: 'No accounts connected yet.',
    noAccountsSub: 'Connect a bank to generate your personalized roadmap.',
    demoBank: 'Demo Bank (TD Canada Trust)',
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
    celebrationMsg: (a) => `\u{1F389} Done! You just unlocked +${a}/year. Keep going.`,
  },
  FR: {
    pageTitle: 'Mon Plan \u2014 Vos finances, enfin claires',
    brand: 'vos finances, enfin claires',
    signOut: 'D\u00e9connexion',
    planLabel: 'VOTRE PLAN FINANCIER',
    unlockedSoFar: 'd\u00e9bloqu\u00e9s jusqu\u2019ici',
    actionsDone: (d, t) => `${d} action${d > 1 ? 's' : ''} sur ${t} compl\u00e9t\u00e9e${d > 1 ? 's' : ''}`,
    stillAvailable: (a) => ` \u00b7 ${a}/an encore disponibles`,
    allDone: "\u{1F389} Tout fait\u2009! Vous faites partie du 1\u00a0% qui passe vraiment \u00e0 l\u2019action.",
    tabPlan: 'Mon Plan',
    tabBanks: 'Banques connect\u00e9es',
    yourActions: 'VOS ACTIONS',
    noActions: "Pas encore de plan d\u2019action.",
    generateCta: 'G\u00e9n\u00e9rer mon plan \u2192',
    completed: 'COMPL\u00c9T\u00c9ES',
    howExactly: 'Comment exactement',
    markDone: 'Marquer comme fait',
    confirmDone: (a) => `Marquer \u00ab\u00a0${a}\u2026\u00a0\u00bb comme fait\u00a0?`,
    wsSection: 'VOS OPPORTUNIT\u00c9S WEALTHSIMPLE',
    wsSectionSub: "Bas\u00e9 sur votre analyse, ces comptes sont les actions \u00e0 plus grand impact financier \u2014 sp\u00e9cifiques \u00e0 votre situation.",
    wealthsimple: 'WEALTHSIMPLE',
    estimatedBenefit: (a) => `Votre b\u00e9n\u00e9fice estim\u00e9 : +${a}/an`,
    nextRefresh: "Prochain renouvellement d\u2019analyse",
    refreshReady: 'Pr\u00eat pour un renouvellement',
    refreshIn: (d) => `Disponible dans ${d} jour${d > 1 ? 's' : ''}`,
    refreshCta: 'Renouveler \u2192',
    dayOf: (d) => `Jour ${d} sur 30`,
    connectedAccounts: 'COMPTES CONNECT\u00c9S',
    noAccounts: 'Aucun compte connect\u00e9.',
    noAccountsSub: 'Connectez une banque pour g\u00e9n\u00e9rer votre plan personnalis\u00e9.',
    demoBank: 'Banque d\u00e9mo (TD Canada Trust)',
    demoLabel: 'D\u00c9MO',
    demoSub: 'Donn\u00e9es simul\u00e9es \u2014 connectez une vraie banque pour votre vraie analyse',
    lastSynced: (d) => `Derni\u00e8re synchro ${d}`,
    removeBank: 'Retirer',
    confirmRemove: 'Retirer cette connexion bancaire\u00a0? Vos donn\u00e9es seront supprim\u00e9es.',
    connectAnother: '+ Connecter une autre banque',
    securityNote: 'Acc\u00e8s en lecture seulement, toujours.',
    securityBody: "On utilise Plaid \u2014 la m\u00eame couche de s\u00e9curit\u00e9 bancaire utilis\u00e9e par des milliers d\u2019applis. On ne lit que l\u2019historique des transactions. On ne stocke jamais vos mots de passe, on ne d\u00e9place jamais d\u2019argent. Retirez n\u2019importe quelle connexion instantan\u00e9ment.",
    addedAccount: 'Vous avez ajout\u00e9 un nouveau compte\u00a0?',
    rerunAnalysis: 'Relancez votre analyse pour un portrait plus complet.',
    refreshAnalysis: 'Renouveler mon analyse \u2192',
    loading: 'Chargement de votre plan\u2026',
    celebrationMsg: (a) => `\u{1F389} Fait\u2009! Vous venez de d\u00e9bloquer +${a}/an. Continuez\u2009!`,
  },
}

// ── Wealthsimple product definitions (bilingual) ──────────────
const WS = {
  fhsa: {
    icon: '\u{1F3E0}',
    EN: { name: 'First Home Savings Account (FHSA)', tagline: 'Tax-deductible contributions + tax-free withdrawals for your first home.', detail: 'Contribute up to $8,000/year (lifetime max $40,000). Every dollar reduces your taxable income \u2014 and when you buy, the withdrawal is completely tax-free.', cta: 'Open my FHSA at Wealthsimple', urgency: "Contribution room expires Dec\u00a031 \u2014 open now to lock in this year's $8,000." },
    FR: { name: 'Compte d\u2019\u00e9pargne libre d\u2019imp\u00f4t pour l\u2019achat d\u2019une premi\u00e8re propri\u00e9t\u00e9 (CELIAPP)', tagline: 'Cotisations d\u00e9ductibles + retraits non imposables pour votre premi\u00e8re maison.', detail: "Cotisez jusqu\u2019\u00e0 8\u00a0000\u00a0$/an (max \u00e0 vie 40\u00a0000\u00a0$). Chaque dollar r\u00e9duit votre revenu imposable \u2014 et au moment d\u2019acheter, le retrait est enti\u00e8rement libre d\u2019imp\u00f4t.", cta: 'Ouvrir mon CELIAPP chez Wealthsimple', urgency: 'Les droits de cotisation expirent le 31\u00a0d\u00e9c \u2014 ouvrez maintenant pour bloquer vos 8\u00a0000\u00a0$ cette ann\u00e9e.' },
    url: 'https://www.wealthsimple.com/en-ca/accounts/fhsa', color: '#00875a', bg: '#e8f5ee',
  },
  tfsa: {
    icon: '\u{1F4C8}',
    EN: { name: 'Tax-Free Savings Account (TFSA)', tagline: 'Every dollar of growth \u2014 interest, dividends, gains \u2014 is yours, tax-free.', detail: 'You have $7,000 in fresh contribution room this year alone. Unused room accumulates every year. A Wealthsimple TFSA invests automatically in diversified ETFs.', cta: 'Open my TFSA at Wealthsimple', urgency: 'Unused contribution room is money left on the table every year.' },
    FR: { name: 'Compte d\u2019\u00e9pargne libre d\u2019imp\u00f4t (\u00c9LI)', tagline: 'Chaque dollar de croissance \u2014 int\u00e9r\u00eats, dividendes, gains \u2014 vous appartient, sans imp\u00f4t.', detail: 'Vous avez 7\u00a0000\u00a0$ de nouveaux droits de cotisation cette ann\u00e9e seulement. Les droits inutilis\u00e9s s\u2019accumulent chaque ann\u00e9e. Un \u00c9LI Wealthsimple investit automatiquement dans des FNB diversifi\u00e9s.', cta: 'Ouvrir mon \u00c9LI chez Wealthsimple', urgency: 'Les droits inutilis\u00e9s, c\u2019est de l\u2019argent laiss\u00e9 sur la table chaque ann\u00e9e.' },
    url: 'https://www.wealthsimple.com/en-ca/accounts/tfsa', color: '#1d6b3e', bg: '#f0faf4',
  },
  rrsp: {
    icon: '\u{1F3AF}',
    EN: { name: 'RRSP', tagline: 'Cut your tax bill today, grow your savings for retirement.', detail: 'RRSP contributions reduce your taxable income now. The tax refund alone makes this one of the highest-return moves available.', cta: 'Open my RRSP at Wealthsimple', urgency: 'Maximize your contribution room before the March\u00a01 deadline.' },
    FR: { name: 'REER', tagline: 'R\u00e9duisez vos imp\u00f4ts aujourd\u2019hui, faites cro\u00eetre votre \u00e9pargne-retraite.', detail: 'Les cotisations REER r\u00e9duisent votre revenu imposable maintenant. Le remboursement d\u2019imp\u00f4t \u00e0 lui seul en fait l\u2019un des meilleurs rendements disponibles.', cta: 'Ouvrir mon REER chez Wealthsimple', urgency: 'Maximisez vos droits de cotisation avant le 1er\u00a0mars.' },
    url: 'https://www.wealthsimple.com/en-ca/accounts/rrsp', color: '#1a4a2e', bg: '#f0faf4',
  },
  save: {
    icon: '\u{1F4B0}',
    EN: { name: 'Wealthsimple Save', tagline: '2.75% interest on your savings \u2014 5x what most banks pay.', detail: 'CDIC insured up to $100,000. No minimum balance. No fees. Your emergency fund and short-term savings should be working much harder than a 0.5% savings account.', cta: 'Move my savings to Wealthsimple', urgency: 'Every month you wait is lost interest.' },
    FR: { name: 'Wealthsimple \u00c9pargne', tagline: '2,75\u00a0% d\u2019int\u00e9r\u00eat sur votre \u00e9pargne \u2014 5x ce que paient la plupart des banques.', detail: 'Assur\u00e9 par la SADC jusqu\u2019\u00e0 100\u00a0000\u00a0$. Aucun solde minimum. Aucuns frais. Votre fonds d\u2019urgence devrait travailler bien plus fort qu\u2019un compte \u00e0 0,5\u00a0%.', cta: 'Transf\u00e9rer mon \u00e9pargne chez Wealthsimple', urgency: 'Chaque mois d\u2019attente, c\u2019est des int\u00e9r\u00eats perdus.' },
    url: 'https://www.wealthsimple.com/en-ca/cash', color: '#0066cc', bg: '#eef4ff',
  },
  managed: {
    icon: '\u{1F916}',
    EN: { name: 'Wealthsimple Managed Investing', tagline: 'Set it and forget it. Your money invests itself.', detail: 'Just 0.5% annual fee. Diversified ETF portfolio built to your risk level, automatically rebalanced. Historically outperforms most individual investors.', cta: 'Start investing with Wealthsimple', urgency: 'The best time to start investing was yesterday.' },
    FR: { name: 'Portefeuille g\u00e9r\u00e9 Wealthsimple', tagline: 'Automatique. Votre argent s\u2019investit tout seul.', detail: 'Seulement 0,5\u00a0% de frais annuels. Portefeuille de FNB diversifi\u00e9 adapt\u00e9 \u00e0 votre profil, r\u00e9\u00e9quilibr\u00e9 automatiquement. Historiquement sup\u00e9rieur \u00e0 la plupart des investisseurs individuels.', cta: 'Commencer \u00e0 investir chez Wealthsimple', urgency: 'Le meilleur moment pour commencer \u00e0 investir, c\u2019\u00e9tait hier.' },
    url: 'https://www.wealthsimple.com/en-ca/invest', color: '#1d3557', bg: '#eef1f8',
  },
  self_directed: {
    icon: '\u{1F4CA}',
    EN: { name: 'Wealthsimple Self-Directed Trading', tagline: 'Commission-free stocks and ETFs. No hidden fees.', detail: 'Buy Canadian and US stocks, ETFs, and more with zero trading commissions. More money staying invested means more compounding over time.', cta: 'Open a Wealthsimple trade account', urgency: 'Every trade commission is a drag on your returns.' },
    FR: { name: 'Courtage autog\u00e9r\u00e9 Wealthsimple', tagline: 'Actions et FNB sans commission. Aucuns frais cach\u00e9s.', detail: 'Achetez des actions canadiennes et am\u00e9ricaines, des FNB et plus encore \u2014 sans commission. Moins de frais, plus de capitalisation.', cta: 'Ouvrir un compte de courtage Wealthsimple', urgency: 'Chaque commission de transaction freine votre rendement.' },
    url: 'https://www.wealthsimple.com/en-ca/trade', color: '#1d3557', bg: '#eef1f8',
  },
}

function wsGet(key, lang) {
  const def = WS[key]
  if (!def) return null
  const t = def[lang] || def.EN
  return { ...t, icon: def.icon, url: def.url, color: def.color, bg: def.bg }
}

// ── TaskCard ──────────────────────────────────────────────────
function TaskCard({ task, analysisAction, onComplete, onCompleted, lang }) {
  const [open, setOpen] = useState(false)
  const [completing, setCompleting] = useState(false)
  const done = task.completed
  const c = C[lang] || C.EN
  const wsProduct = analysisAction?.wealthsimpleProduct
  const wsDef = wsProduct ? wsGet(wsProduct, lang) : null

  const handleComplete = async (e) => {
    e.stopPropagation()
    if (done || completing) return
    if (!confirm(c.confirmDone(task.action.slice(0, 55)))) return
    setCompleting(true)
    await onComplete(task.id)
    setCompleting(false)
    if (onCompleted) onCompleted(task.annual_impact)
  }

  return (
    <div style={{ background: 'white', borderRadius: 14, marginBottom: 10, overflow: 'hidden', border: done ? '1px solid #f0f0f0' : wsDef ? '1.5px solid #b8dacc' : '1px solid #e8e8e8', opacity: done ? 0.6 : 1, transition: 'all 0.3s' }}>
      <div onClick={() => !done && setOpen(o => !o)} style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14, cursor: done ? 'default' : 'pointer' }}>
        <button onClick={handleComplete} style={{ width: 30, height: 30, borderRadius: '50%', flexShrink: 0, border: done ? 'none' : '2px solid #ddd', background: done ? '#00875a' : completing ? '#e8f5ee' : 'white', cursor: done ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
          {done && <span style={{ color: 'white', fontSize: 14, fontWeight: 800 }}>v</span>}
        </button>
        <div style={{ width: 26, height: 26, borderRadius: '50%', flexShrink: 0, background: ['#0d0d0d','#00875a','#1d3557'][task.rank - 1] || '#555', color: 'white', fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{task.rank}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 700, fontSize: 14, lineHeight: 1.35, marginBottom: 3, textDecoration: done ? 'line-through' : 'none', color: done ? '#aaa' : '#0d0d0d' }}>{task.action}</p>
          <p style={{ fontSize: 12, color: '#bbb' }}>{task.time_to_complete}</p>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: done ? '#aaa' : '#00875a' }}>+{CAD(task.annual_impact)}/yr</div>
        </div>
        {!done && (
          <div style={{ width: 24, height: 24, borderRadius: '50%', border: '1.5px solid #e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, flexShrink: 0, fontWeight: 700, background: open ? '#0d0d0d' : 'white', color: open ? 'white' : '#ccc', transition: 'all 0.15s' }}>
            {open ? 'x' : '+'}
          </div>
        )}
        {done && <div style={{ fontSize: 12, color: '#aaa', flexShrink: 0 }}>Done {task.completed_at ? new Date(task.completed_at).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' }) : ''}</div>}
      </div>
      {open && !done && analysisAction && (
        <div style={{ padding: '0 18px 18px', borderTop: '1px solid #f5f5f5' }}>
          {wsDef && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#e8f5ee', borderRadius: 6, padding: '4px 10px', marginTop: 14, marginBottom: 10 }}>
              <div style={{ width: 16, height: 16, borderRadius: 3, background: wsDef.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ color: 'white', fontSize: 9, fontWeight: 800 }}>W</span></div>
              <span style={{ fontSize: 11, fontWeight: 700, color: wsDef.color }}>{wsDef.name}</span>
            </div>
          )}
          {analysisAction.whyNow && <p style={{ fontSize: 13, color: '#888', fontStyle: 'italic', marginTop: wsDef ? 6 : 14, marginBottom: 12 }}>{analysisAction.whyNow}</p>}
          {analysisAction.howExactly && (
            <div style={{ background: '#f8f8f8', borderRadius: 10, padding: '14px 16px', marginBottom: 12 }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: '#bbb', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{c.howExactly}</p>
              <p style={{ fontSize: 14, color: '#333', lineHeight: 1.65 }}>{analysisAction.howExactly}</p>
            </div>
          )}
          {analysisAction.impactExplanation && <p style={{ fontSize: 13, color: '#00875a', fontWeight: 600, marginBottom: wsDef ? 14 : 0 }}>📐 {analysisAction.impactExplanation}</p>}
          {wsDef && (
            <a href={wsDef.url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: wsDef.color, color: 'white', borderRadius: 10, padding: '14px 20px', fontSize: 15, fontWeight: 700, textDecoration: 'none', marginTop: 4 }}>
              <span style={{ fontSize: 16, fontWeight: 800, fontStyle: 'italic' }}>W</span> {wsDef.cta} →
            </a>
          )}
          <button onClick={handleComplete} style={{ width: '100%', marginTop: 10, padding: '12px', borderRadius: 10, border: '1.5px solid #e0e0e0', background: 'white', fontSize: 14, fontWeight: 600, color: '#555', cursor: 'pointer' }}>
            {c.markDone}
          </button>
        </div>
      )}
    </div>
  )
}

// ── WSOpportunityCard ─────────────────────────────────────────
function WSOpportunityCard({ productKey, analysis, lang }) {
  const def = wsGet(productKey, lang)
  const c = C[lang] || C.EN
  if (!def) return null
  const matchingAction = (analysis?.priorityActions || []).find(a => a.wealthsimpleProduct === productKey)
  const specificImpact = matchingAction?.annualImpact

  return (
    <div style={{ background: def.bg, border: `1.5px solid ${def.color}33`, borderRadius: 16, padding: '20px 22px', marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        <div style={{ fontSize: 28, flexShrink: 0, lineHeight: 1, marginTop: 2 }}>{def.icon}</div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={{ width: 18, height: 18, borderRadius: 4, background: def.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ color: 'white', fontSize: 10, fontWeight: 800 }}>W</span></div>
            <span style={{ fontSize: 11, fontWeight: 700, color: def.color, letterSpacing: '0.05em' }}>{c.wealthsimple}</span>
          </div>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0d0d0d', marginBottom: 6, lineHeight: 1.3 }}>{def.name}</h3>
          <p style={{ fontSize: 14, color: '#444', fontWeight: 600, marginBottom: 8 }}>{def.tagline}</p>
          <p style={{ fontSize: 13, color: '#666', lineHeight: 1.6, marginBottom: 12 }}>{def.detail}</p>
          {specificImpact && (
            <div style={{ background: 'white', borderRadius: 8, padding: '10px 14px', marginBottom: 12, border: `1px solid ${def.color}33` }}>
              <p style={{ fontSize: 13, color: def.color, fontWeight: 700 }}>{c.estimatedBenefit(CAD(specificImpact))}</p>
            </div>
          )}
          <div style={{ background: '#fff8e1', borderRadius: 8, padding: '8px 12px', marginBottom: 14 }}>
            <p style={{ fontSize: 12, color: '#856404', fontWeight: 600 }}>⏰ {def.urgency}</p>
          </div>
          <a href={def.url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: def.color, color: 'white', borderRadius: 10, padding: '14px 22px', fontSize: 15, fontWeight: 700, textDecoration: 'none', width: '100%', boxSizing: 'border-box' }}>
            <span style={{ fontSize: 16, fontWeight: 800, fontStyle: 'italic' }}>W</span> {def.cta} →
          </a>
        </div>
      </div>
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
    <button onClick={() => open()} disabled={!ready} style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', width: '100%', padding: '14px', borderRadius: 10, border: '2px dashed #ddd', background: 'white', fontSize: 14, fontWeight: 700, color: '#555', cursor: !ready ? 'not-allowed' : 'pointer', opacity: !ready ? 0.5 : 1, transition: 'all 0.15s' }}>
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

  // Read language from sessionStorage
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('lang')
      if (stored === 'FR' || stored === 'EN') setLang(stored)
    } catch (_) {}
  }, [])

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/signin')
  }, [status])

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
    })
  }, [status])

  const c = C[lang] || C.EN
  const completedTasks = tasks.filter(t => t.completed)
  const pendingTasks = tasks.filter(t => !t.completed)
  const completedImpact = completedTasks.reduce((s, t) => s + Number(t.annual_impact || 0), 0)
  const totalImpact = tasks.reduce((s, t) => s + Number(t.annual_impact || 0), 0)
  const progress = tasks.length ? completedTasks.length / tasks.length : 0

  const wsProducts = []
  if (analysis) {
    ;(analysis.priorityActions || []).forEach(a => {
      if (a.wealthsimpleProduct && !wsProducts.includes(a.wealthsimpleProduct)) wsProducts.push(a.wealthsimpleProduct)
    })
    if (analysis.situationalCard?.wealthsimpleProduct && !wsProducts.includes(analysis.situationalCard.wealthsimpleProduct))
      wsProducts.push(analysis.situationalCard.wealthsimpleProduct)
  }

  const actionByRank = {}
  ;(analysis?.priorityActions || []).forEach(a => { actionByRank[a.rank] = a })

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
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafafa', fontFamily: 'system-ui, sans-serif', color: '#888', fontSize: 14 }}>{c.loading}</div>
  }

  return (
    <>
      <Head><title>{c.pageTitle}</title></Head>
      <div style={{ minHeight: '100vh', background: '#f5f5f5', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

        {celebration && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, background: '#00875a', color: 'white', padding: '16px 24px', textAlign: 'center', fontSize: 15, fontWeight: 700 }}>
            {c.celebrationMsg(CAD(celebration.amount))}
          </div>
        )}

        {/* Header */}
        <header style={{ background: '#0d0d0d', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 700, fontSize: 15, color: 'white', letterSpacing: '-0.01em' }}>{c.brand}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <span style={{ fontSize: 12, color: '#555' }}>{session?.user?.email}</span>
            <button onClick={() => signOut({ callbackUrl: '/' })} style={{ fontSize: 12, color: '#555', background: 'none', border: 'none', cursor: 'pointer' }}>{c.signOut}</button>
          </div>
        </header>

        {/* Hero */}
        <div style={{ background: '#0d0d0d', color: 'white', padding: '32px 24px 36px' }}>
          <div style={{ maxWidth: 660, margin: '0 auto' }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#888', marginBottom: 10 }}>{c.planLabel}</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 6 }}>
              <div style={{ fontSize: 38, fontWeight: 800, color: '#52c41a', letterSpacing: '-0.03em' }}>+{CAD(completedImpact)}/yr</div>
              <span style={{ fontSize: 14, color: 'white' }}>{c.unlockedSoFar}</span>
            </div>
            <p style={{ fontSize: 13, color: 'white', marginBottom: 18 }}>
              {c.actionsDone(completedTasks.length, tasks.length)}
              {totalImpact - completedImpact > 0 && c.stillAvailable(CAD(totalImpact - completedImpact))}
            </p>
            <div style={{ background: '#222', borderRadius: 4, height: 6, overflow: 'hidden', maxWidth: 500 }}>
              <div style={{ background: '#52c41a', height: '100%', width: `${progress * 100}%`, borderRadius: 4, transition: 'width 0.6s ease' }} />
            </div>
            {progress === 1 && tasks.length > 0 && (
              <p style={{ marginTop: 12, fontSize: 14, color: '#52c41a', fontWeight: 600 }}>{c.allDone}</p>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ background: 'white', borderBottom: '1px solid #f0f0f0', padding: '0 24px' }}>
          <div style={{ maxWidth: 660, margin: '0 auto', display: 'flex' }}>
            {[{ id: 'plan', label: c.tabPlan }, { id: 'banks', label: c.tabBanks }].map(tab => (
              <button key={tab.id} onClick={() => setActiveSection(tab.id)} style={{ padding: '14px 20px', border: 'none', cursor: 'pointer', background: 'transparent', fontSize: 14, fontWeight: 600, color: activeSection === tab.id ? '#0d0d0d' : '#aaa', borderBottom: activeSection === tab.id ? '2px solid #0d0d0d' : '2px solid transparent', transition: 'all 0.15s' }}>
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
                    <a href="/" style={{ background: '#0d0d0d', color: 'white', padding: '14px 28px', borderRadius: 10, textDecoration: 'none', fontSize: 14, fontWeight: 700 }}>{c.generateCta}</a>
                  </div>
                )}

                {pendingTasks.map(task => (
                  <TaskCard key={task.id} task={task} analysisAction={actionByRank[task.rank]} onComplete={completeTask} onCompleted={onCompleted} lang={lang} />
                ))}

                {completedTasks.length > 0 && (
                  <>
                    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#bbb', margin: '24px 0 14px' }}>{c.completed}</p>
                    {completedTasks.map(task => (
                      <TaskCard key={task.id} task={task} analysisAction={actionByRank[task.rank]} onComplete={completeTask} onCompleted={onCompleted} lang={lang} />
                    ))}
                  </>
                )}
              </div>

              {/* WS Opportunities */}
              {wsProducts.length > 0 && (
                <div style={{ marginBottom: 32 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <div style={{ width: 22, height: 22, borderRadius: 5, background: '#00875a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ color: 'white', fontSize: 12, fontWeight: 800, fontStyle: 'italic' }}>W</span>
                    </div>
                    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#bbb' }}>{c.wsSection}</p>
                  </div>
                  <p style={{ fontSize: 13, color: '#999', marginBottom: 16, lineHeight: 1.55 }}>{c.wsSectionSub}</p>
                  {wsProducts.map(key => <WSOpportunityCard key={key} productKey={key} analysis={analysis} lang={lang} />)}
                </div>
              )}

              {/* Next refresh */}
              <div style={{ background: 'white', borderRadius: 16, padding: '20px 22px', border: '1px solid #e8e8e8' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>🔄 {c.nextRefresh}</p>
                    <p style={{ fontSize: 13, color: '#555' }}>
                      {daysUntil === null ? c.noActions : daysUntil === 0 ? c.refreshReady : c.refreshIn(daysUntil)}
                    </p>
                  </div>
                  {daysUntil === 0 && (
                    <a href="/" style={{ background: '#0d0d0d', color: 'white', padding: '12px 18px', borderRadius: 10, textDecoration: 'none', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>{c.refreshCta}</a>
                  )}
                </div>
                {daysUntil !== null && daysUntil > 0 && (
                  <>
                    <div style={{ marginTop: 14, background: '#f0f0f0', borderRadius: 8, height: 5, overflow: 'hidden' }}>
                      <div style={{ background: '#52c41a', height: '100%', width: `${Math.min(100, ((30 - daysUntil) / 30) * 100)}%`, borderRadius: 8, transition: 'width 0.6s ease' }} />
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
                        <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🏦</div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                            <p style={{ fontWeight: 700, fontSize: 14 }}>{account.institution_name || 'Bank'}</p>
                            {account.isDemo && <span style={{ fontSize: 10, fontWeight: 700, background: '#fff3cd', color: '#856404', padding: '2px 7px', borderRadius: 6 }}>{c.demoLabel}</span>}
                          </div>
                          <p style={{ fontSize: 12, color: '#aaa' }}>
                            {account.isDemo
                              ? c.demoSub
                              : c.lastSynced(account.last_synced_at ? new Date(account.last_synced_at).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' }) : '—')}
                          </p>
                        </div>
                      </div>
                      {!account.isDemo && (
                        <button onClick={() => removeAccount(account.id)} style={{ fontSize: 12, color: '#de350b', background: 'none', border: '1px solid #de350b', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontWeight: 600 }}>
                          {c.removeBank}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <AddBankButton onSuccess={onBankAdded} lang={lang} />

              <div style={{ marginTop: 16, padding: '14px 18px', background: '#f8f8f8', borderRadius: 12, fontSize: 12, color: '#888', lineHeight: 1.65 }}>
                🔒 <strong style={{ color: '#555' }}>{c.securityNote}</strong> {c.securityBody}
              </div>

              {displayAccounts.length > 0 && (
                <div style={{ marginTop: 20, background: '#0d0d0d', borderRadius: 16, padding: '22px', textAlign: 'center' }}>
                  <p style={{ color: '#666', fontSize: 13, marginBottom: 4 }}>{c.addedAccount}</p>
                  <p style={{ color: 'white', fontWeight: 700, fontSize: 15, marginBottom: 16 }}>{c.rerunAnalysis}</p>
                  <a href="/" style={{ display: 'inline-block', background: '#00875a', color: 'white', padding: '14px 28px', borderRadius: 10, textDecoration: 'none', fontSize: 14, fontWeight: 700 }}>
                    {c.refreshAnalysis}
                  </a>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}