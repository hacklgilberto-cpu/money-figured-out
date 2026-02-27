import { useState, useEffect, useCallback } from 'react'
import { usePlaidLink } from 'react-plaid-link'
import { useRouter } from 'next/router'
import Head from 'next/head'

const COPY = {
  EN: {
    eyebrow: 'No account. No catch. Completely free.',
    headline: ['Your financial plan,', 'with your actual numbers.'],
    sub: "Connect your bank account and get a personalized roadmap built around your real numbers. Whether you're saving for your first home, paying down debt, or figuring out where to even start, we'll show you exactly what to do next.",
    cta: 'Connect my bank account →',
    ctaLoading: 'Loading...',
    trust: 'Bank-level encryption · Read-only access · Powered by Plaid',
    signin: 'Sign in',
    cards: [
      { icon: '🏠', title: 'Buying your first home', body: 'Find out if you qualify for an FHSA and how much you can save tax-free before your next move.' },
      { icon: '💳', title: 'Paying off debt for good', body: 'See exactly which debt to hit first and how fast you can be free — with the math to prove it.' },
      { icon: '📈', title: 'Starting to invest', body: 'Find out how much TFSA room you have left and where your money works hardest for your goals.' },
    ],
    multiAccountTitle: 'Do you use more than one bank?',
    multiAccountSub: 'Connecting all your accounts gives Claude a complete picture of your finances. The more accounts you add, the more accurate your plan.',
    connectedLabel: 'Connected accounts',
    addAnother: '+ Connect another account',
    looksGood: "That's everything →",
    threeQ: 'Three quick questions',
    goalLabel: "What's your main financial goal right now?",
    goalPlaceholder: 'Choose one…',
    goals: ['Build an emergency fund', 'Pay off debt', 'Save for a home', 'Start investing', 'Grow existing investments', 'Reduce monthly expenses', 'Plan for retirement'],
    timelineLabel: "What's your timeline?",
    timelinePlaceholder: 'Choose one…',
    timelines: ['Less than 1 year', '1–3 years', '3–5 years', '5–10 years', '10+ years'],
    provinceLabel: 'Province',
    buildCta: 'Build my roadmap →',
    analyzing: 'Building your roadmap…',
    analyzingSub: 'Reading your transactions and running the numbers. Usually under a minute.',
    demoNotReady: 'Not ready to connect your bank?',
    demoBtn: '👀 See a sample roadmap — Sofia, 29, Toronto',
    demoBtnLoading: 'Building demo…',
    demoSub: 'Real AI analysis · Fictional person · No bank needed',
  },
  FR: {
    eyebrow: 'Aucun compte. Aucun piège. Entièrement gratuit.',
    headline: ['Votre plan financier,', 'avec vos vrais chiffres.'],
    sub: "Connectez votre compte et recevez un plan personnalisé basé sur votre situation réelle. Première maison, dettes à rembourser, ou juste savoir par où commencer — on vous dit exactement quoi faire en premier.",
    cta: 'Connecter mon compte →',
    ctaLoading: 'Chargement...',
    trust: 'Chiffrement bancaire · Accès en lecture seulement · Propulsé par Plaid',
    signin: 'Connexion',
    cards: [
      { icon: '🏠', title: 'Acheter votre première maison', body: "Découvrez si vous êtes admissible au CELIAPP et combien vous pouvez mettre à l'abri du fisc." },
      { icon: '💳', title: 'En finir avec vos dettes', body: 'On identifie quelle dette attaquer en premier et on calcule exactement quand vous serez libre.' },
      { icon: '📈', title: 'Commencer à investir', body: 'Calculez votre espace CÉLI disponible et comment faire travailler votre argent au maximum.' },
    ],
    multiAccountTitle: 'Vous utilisez plus d\'une banque?',
    multiAccountSub: 'Connecter tous vos comptes donne à Claude une image complète de vos finances. Plus vous ajoutez de comptes, plus votre plan sera précis.',
    connectedLabel: 'Comptes connectés',
    addAnother: '+ Connecter un autre compte',
    looksGood: "C'est tout →",
    threeQ: 'Trois petites questions',
    goalLabel: 'Quel est votre principal objectif financier?',
    goalPlaceholder: 'Choisissez…',
    goals: ["Bâtir un fonds d'urgence", 'Rembourser mes dettes', 'Économiser pour une maison', 'Commencer à investir', 'Faire fructifier mes placements', 'Réduire mes dépenses mensuelles', 'Planifier ma retraite'],
    timelineLabel: 'Quel est votre horizon?',
    timelinePlaceholder: 'Choisissez…',
    timelines: ["Moins d'un an", '1 à 3 ans', '3 à 5 ans', '5 à 10 ans', '10 ans et plus'],
    provinceLabel: 'Province',
    buildCta: 'Créer mon plan →',
    analyzing: 'On construit votre plan…',
    analyzingSub: 'On lit vos transactions et on fait les calculs. Moins d\'une minute.',
    demoNotReady: 'Pas encore prêt à connecter votre banque?',
    demoBtn: '👀 Voir un exemple de plan — Sofia, 29, Toronto',
    demoBtnLoading: 'Construction en cours…',
    demoSub: 'Vraie analyse IA · Personne fictive · Aucune banque requise',
  },
}

// ── Animated loading screen ──────────────────────────────────
const LOADING_STEPS = {
  EN: [
    { icon: '🔗', text: 'Connecting to your bank…' },
    { icon: '📥', text: 'Reading 12 months of transactions…' },
    { icon: '🗂️', text: 'Categorizing your spending…' },
    { icon: '📊', text: 'Calculating monthly cash flow…' },
    { icon: '🔍', text: 'Identifying subscription patterns…' },
    { icon: '💳', text: 'Checking credit card interest rates…' },
    { icon: '🏠', text: 'Checking FHSA eligibility…' },
    { icon: '📈', text: 'Calculating TFSA room…' },
    { icon: '💡', text: 'Finding your biggest savings levers…' },
    { icon: '🧮', text: 'Running the numbers…' },
    { icon: '🎯', text: 'Ranking actions by annual impact…' },
    { icon: '✍️', text: 'Writing your personalized plan…' },
  ],
  FR: [
    { icon: '🔗', text: 'Connexion à votre banque…' },
    { icon: '📥', text: 'Lecture de 12 mois de transactions…' },
    { icon: '🗂️', text: 'Catégorisation de vos dépenses…' },
    { icon: '📊', text: 'Calcul des flux de trésorerie mensuels…' },
    { icon: '🔍', text: 'Identification des abonnements…' },
    { icon: '💳', text: 'Vérification des taux d\'intérêt…' },
    { icon: '🏠', text: 'Vérification de l\'admissibilité CELIAPP…' },
    { icon: '📈', text: 'Calcul de l\'espace CÉLI disponible…' },
    { icon: '💡', text: 'Détection des économies potentielles…' },
    { icon: '🧮', text: 'Calculs en cours…' },
    { icon: '🎯', text: 'Classement par impact annuel…' },
    { icon: '✍️', text: 'Rédaction de votre plan personnalisé…' },
  ]
}

function AnalyzingScreen({ lang }) {
  const [idx, setIdx] = useState(0)
  const [fade, setFade] = useState(true)
  const steps = LOADING_STEPS[lang] || LOADING_STEPS.EN

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false)
      setTimeout(() => {
        setIdx(i => (i + 1) % steps.length)
        setFade(true)
      }, 300)
    }, 2200)
    return () => clearInterval(interval)
  }, [steps.length])

  const current = steps[idx]

  return (
    <div style={{ textAlign: 'center', padding: '0 24px', maxWidth: 380, margin: '0 auto' }}>
      {/* Spinner */}
      <div style={{ marginBottom: 32 }}>
        <style>{`
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
        `}</style>
        <div style={{ position: 'relative', width: 64, height: 64, margin: '0 auto' }}>
          <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '3px solid #e8e8e8' }} />
          <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '3px solid transparent', borderTopColor: '#0d0d0d', animation: 'spin 0.9s linear infinite' }} />
          <div style={{ position: 'absolute', inset: 8, borderRadius: '50%', border: '2px solid transparent', borderTopColor: '#00875a', animation: 'spin 1.4s linear infinite reverse' }} />
        </div>
      </div>

      {/* Rotating message */}
      <div style={{ transition: 'opacity 0.3s ease', opacity: fade ? 1 : 0, minHeight: 72 }}>
        <div style={{ fontSize: 28, marginBottom: 10 }}>{current.icon}</div>
        <p style={{ fontSize: 16, fontWeight: 600, color: '#0d0d0d', marginBottom: 6 }}>{current.text}</p>
      </div>

      {/* Progress dots */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 28 }}>
        {steps.map((_, i) => (
          <div key={i} style={{ width: i === idx ? 20 : 6, height: 6, borderRadius: 3, background: i === idx ? '#0d0d0d' : '#e0e0e0', transition: 'all 0.3s ease' }} />
        ))}
      </div>

      <p style={{ fontSize: 12, color: '#bbb', marginTop: 20 }}>
        {lang === 'EN' ? 'Usually under a minute' : 'Moins d\'une minute habituellement'}
      </p>
    </div>
  )
}

export default function Home() {
  const router = useRouter()
  const [lang, setLang] = useState('EN')

  // Re-fetch Plaid link token in correct language whenever lang changes
  useEffect(() => {
    fetchLinkToken(lang)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang])
  const [step, setStep] = useState('questions')
  const [linkToken, setLinkToken] = useState(null)
  const [publicTokens, setPublicTokens] = useState([]) // support multiple accounts
  const [connectedAccounts, setConnectedAccounts] = useState([])
  const [error, setError] = useState(null)
  const [userInputs, setUserInputs] = useState({ goal: '', timeline: '', province: 'ON' })

  const c = COPY[lang]

  const [demoLoading, setDemoLoading] = useState(false)

  async function handleDemo() {
    setDemoLoading(true)
    try {
      const res = await fetch('/api/demo', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ province: 'ON', lang }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Demo failed')
      if (typeof sessionStorage !== 'undefined') sessionStorage.setItem('lang', lang)
      router.push(`/roadmap/${data.roadmapId}`)
    } catch (err) {
      setError(err.message)
      setDemoLoading(false)
    }
  }

  const fetchLinkToken = (currentLang) =>
    fetch('/api/plaid/create-link-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lang: currentLang || lang })
    })
      .then(r => r.json())
      .then(d => setLinkToken(d.link_token))
      .catch(() => setError('Failed to initialize bank connection'))

  useState(() => { fetchLinkToken() })

  const onPlaidSuccess = useCallback((public_token, metadata) => {
    const institutionName = metadata?.institution?.name || 'Account'
    setPublicTokens(prev => [...prev, public_token])
    setConnectedAccounts(prev => [...prev, { name: institutionName, token: public_token }])
    setStep('multi-account')
    fetchLinkToken()
  }, [])

  const { open: openPlaid, ready: plaidReady } = usePlaidLink({
    token: linkToken,
    onSuccess: onPlaidSuccess,
    onExit: (err) => { if (err) setError('Bank connection cancelled') }
  })

  async function handleAnalyze() {
    if (!userInputs.goal || !userInputs.timeline) {
      setError(lang === 'EN' ? 'Please answer all three questions' : 'Veuillez répondre aux trois questions')
      return
    }
    setError(null)
    setStep('connect')
  }

  async function handleConnect() {
    openPlaid()
  }

  async function handleBuildRoadmap() {
    setStep('analyzing')
    setError(null)
    try {
      const res = await fetch('/api/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ province: userInputs.province, lang })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Analysis failed')
      if (typeof sessionStorage !== 'undefined') sessionStorage.setItem('lang', lang)
      router.push(`/roadmap/${data.roadmapId}`)
    } catch (err) {
      setError(err.message)
      setStep('multi-account')
    }
  }

  const inputStyle = { width: '100%', padding: '13px 16px', border: '1.5px solid #e0e0e0', borderRadius: 10, fontSize: 15, outline: 'none', boxSizing: 'border-box', background: 'white' }

  return (
    <>
      <Head>
        <title>{lang === 'EN' ? 'Your Money, Figured Out' : 'Vos finances, enfin claires'}</title>
      </Head>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#fafafa' }}>

        {/* Header */}
        <header style={{ padding: '18px 24px', background: 'white', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 800, fontSize: 16, letterSpacing: '-0.02em' }}>{lang === 'EN' ? 'your money, figured out' : 'vos finances, enfin claires'}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ display: 'flex', gap: 3, background: '#f0f0f0', borderRadius: 20, padding: 3 }}>
              {['EN', 'FR'].map(l => (
                <button key={l} onClick={() => setLang(l)} style={{ padding: '4px 14px', borderRadius: 16, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 11, letterSpacing: '0.08em', background: lang === l ? '#0d0d0d' : 'transparent', color: lang === l ? 'white' : '#999' }}>
                  {l}
                </button>
              ))}
            </div>
            <a href="/auth/signin" style={{ fontSize: 14, color: '#666', fontWeight: 500 }}>{c.signin}</a>
          </div>
        </header>

        {/* ── STEP 1: Hero ── */}
        {step === 'connect' && (
          <main style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '56px 24px' }}>
            <div style={{ maxWidth: 620, margin: '0 auto', textAlign: 'center' }}>
              <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#bbb', marginBottom: 20 }}>
                {c.eyebrow}
              </p>
              <h1 style={{ fontSize: 'clamp(34px, 6vw, 56px)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: 24 }}>
                {c.headline[0]}<br />{c.headline[1]}
              </h1>
              <p style={{ fontSize: 17, color: '#666', lineHeight: 1.75, maxWidth: 520, margin: '0 auto 40px' }}>
                {c.sub}
              </p>
              {error && <div style={{ background: '#fff3f3', border: '1px solid #ffd0d0', color: '#c0392b', padding: '12px 16px', borderRadius: 10, fontSize: 14, marginBottom: 20, maxWidth: 400, margin: '0 auto 20px' }}>{error}</div>}
              <button onClick={() => openPlaid()} disabled={!plaidReady || !linkToken}
                style={{ fontSize: 17, padding: '18px 40px', width: '100%', maxWidth: 380, background: '#0d0d0d', color: 'white', border: 'none', borderRadius: 12, fontWeight: 700, cursor: 'pointer', opacity: (!plaidReady || !linkToken) ? 0.5 : 1 }}>
                {!plaidReady ? c.ctaLoading : c.cta}
              </button>
              <p style={{ marginTop: 14, fontSize: 13, color: '#ccc' }}>{c.trust}</p>

              {/* Demo shortcut */}
              <div style={{ marginTop: 32, paddingTop: 28, borderTop: '1px solid #ebebeb' }}>
                <p style={{ fontSize: 13, color: '#aaa', marginBottom: 12 }}>
                  {c.demoNotReady}
                </p>
                <button
                  onClick={handleDemo}
                  disabled={demoLoading}
                  style={{ fontSize: 14, padding: '13px 28px', background: 'white', color: '#0d0d0d', border: '2px solid #0d0d0d', borderRadius: 10, fontWeight: 700, cursor: demoLoading ? 'not-allowed' : 'pointer', opacity: demoLoading ? 0.6 : 1 }}
                >
                  {demoLoading ? c.demoBtnLoading : c.demoBtn}
                </button>
                <p style={{ fontSize: 12, color: '#ccc', marginTop: 8 }}>
                  {c.demoSub}
                </p>
              </div>

              {/* Use case cards */}
              <div style={{ marginTop: 64, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, textAlign: 'left' }}>
                {c.cards.map(({ icon, title, body }) => (
                  <div key={title} style={{ background: 'white', border: '1px solid #ebebeb', borderRadius: 14, padding: '22px 18px' }}>
                    <div style={{ fontSize: 26, marginBottom: 12 }}>{icon}</div>
                    <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8, lineHeight: 1.3 }}>{title}</div>
                    <div style={{ fontSize: 13, color: '#888', lineHeight: 1.65 }}>{body}</div>
                  </div>
                ))}
              </div>
            </div>
          </main>
        )}

        {/* ── STEP 2: Multi-account ── */}
        {step === 'multi-account' && (
          <main style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '48px 24px' }}>
            <div style={{ maxWidth: 480, margin: '0 auto', width: '100%' }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>🏦</div>
              <h2 style={{ fontSize: 26, fontWeight: 800, marginBottom: 10, letterSpacing: '-0.02em' }}>{c.multiAccountTitle}</h2>
              <p style={{ fontSize: 15, color: '#666', marginBottom: 28, lineHeight: 1.65 }}>{c.multiAccountSub}</p>

              {/* Connected accounts list */}
              <div style={{ marginBottom: 20 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#bbb', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>{c.connectedLabel}</p>
                {connectedAccounts.map((acct, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: '#f0fff4', border: '1px solid #b8dacc', borderRadius: 10, marginBottom: 8 }}>
                    <span style={{ color: '#00875a', fontSize: 18 }}>✓</span>
                    <span style={{ fontWeight: 600, fontSize: 15 }}>{acct.name}</span>
                  </div>
                ))}
              </div>

              {/* Add another */}
              <button onClick={() => openPlaid()} disabled={!plaidReady || !linkToken}
                style={{ width: '100%', padding: '14px', background: 'white', border: '2px dashed #ddd', borderRadius: 10, fontSize: 15, fontWeight: 600, color: '#555', cursor: 'pointer', marginBottom: 12 }}>
                {c.addAnother}
              </button>

              {/* Continue */}
              <button onClick={() => handleBuildRoadmap()}
                style={{ width: '100%', padding: '16px', background: '#0d0d0d', color: 'white', border: 'none', borderRadius: 10, fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>
                {c.looksGood}
              </button>
            </div>
          </main>
        )}

        {/* ── STEP 1: Questions (now first) ── */}
        {step === 'questions' && (
          <main style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '48px 24px' }}>
            <div style={{ maxWidth: 480, margin: '0 auto', width: '100%' }}>
              <h2 style={{ fontSize: 26, fontWeight: 800, marginBottom: 6, letterSpacing: '-0.02em' }}>{c.threeQ}</h2>
              <p style={{ fontSize: 14, color: '#888', marginBottom: 28, lineHeight: 1.5 }}>
                {lang === 'EN' ? 'Your answers shape the analysis — takes 30 seconds.' : 'Vos réponses guident l\'analyse — 30 secondes.'}
              </p>
              {error && <div style={{ background: '#fff3f3', border: '1px solid #ffd0d0', color: '#c0392b', padding: '12px 16px', borderRadius: 10, fontSize: 14, marginBottom: 16 }}>{error}</div>}

              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: 14, marginBottom: 8, color: '#333' }}>{c.goalLabel}</label>
                <select value={userInputs.goal} onChange={e => setUserInputs(p => ({ ...p, goal: e.target.value }))} style={inputStyle}>
                  <option value="">{c.goalPlaceholder}</option>
                  {c.goals.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: 14, marginBottom: 8, color: '#333' }}>{c.timelineLabel}</label>
                <select value={userInputs.timeline} onChange={e => setUserInputs(p => ({ ...p, timeline: e.target.value }))} style={inputStyle}>
                  <option value="">{c.timelinePlaceholder}</option>
                  {c.timelines.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: 14, marginBottom: 8, color: '#333' }}>{c.provinceLabel}</label>
                <select value={userInputs.province} onChange={e => setUserInputs(p => ({ ...p, province: e.target.value }))} style={inputStyle}>
                  <option value="ON">Ontario</option>
                  <option value="BC">British Columbia</option>
                  <option value="AB">Alberta</option>
                  <option value="QC">Québec</option>
                  <option value="SK">Saskatchewan</option>
                  <option value="MB">Manitoba</option>
                  <option value="NS">Nova Scotia</option>
                  <option value="NB">New Brunswick</option>
                  <option value="NL">Newfoundland &amp; Labrador</option>
                  <option value="PEI">Prince Edward Island</option>
                </select>
              </div>
              <button onClick={handleAnalyze}
                style={{ width: '100%', padding: '16px', background: '#0d0d0d', color: 'white', border: 'none', borderRadius: 10, fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>
                {lang === 'EN' ? 'Connect my bank →' : 'Connecter ma banque →'}
              </button>
            </div>
          </main>
        )}

        {/* ── STEP 4: Analyzing — animated spinner + rotating messages ── */}
        {step === 'analyzing' && (
          <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 0 }}>
            <AnalyzingScreen lang={lang} />
          </main>
        )}


      </div>
    </>
  )
}
