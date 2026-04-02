import { useState, useCallback, useEffect, useRef } from 'react'
import { usePlaidLink } from 'react-plaid-link'
import { useRouter } from 'next/router'
import Head from 'next/head'

// ── US States ────────────────────────────────────────────────
const US_STATES = [
  ['AL','Alabama'],['AK','Alaska'],['AZ','Arizona'],['AR','Arkansas'],
  ['CA','California'],['CO','Colorado'],['CT','Connecticut'],['DE','Delaware'],
  ['FL','Florida'],['GA','Georgia'],['HI','Hawaii'],['ID','Idaho'],
  ['IL','Illinois'],['IN','Indiana'],['IA','Iowa'],['KS','Kansas'],
  ['KY','Kentucky'],['LA','Louisiana'],['ME','Maine'],['MD','Maryland'],
  ['MA','Massachusetts'],['MI','Michigan'],['MN','Minnesota'],['MS','Mississippi'],
  ['MO','Missouri'],['MT','Montana'],['NE','Nebraska'],['NV','Nevada'],
  ['NH','New Hampshire'],['NJ','New Jersey'],['NM','New Mexico'],['NY','New York'],
  ['NC','North Carolina'],['ND','North Dakota'],['OH','Ohio'],['OK','Oklahoma'],
  ['OR','Oregon'],['PA','Pennsylvania'],['RI','Rhode Island'],['SC','South Carolina'],
  ['SD','South Dakota'],['TN','Tennessee'],['TX','Texas'],['UT','Utah'],
  ['VT','Vermont'],['VA','Virginia'],['WA','Washington'],['WV','West Virginia'],
  ['WI','Wisconsin'],['WY','Wyoming'],['DC','Washington DC'],
]

// ── Copy ──────────────────────────────────────────────────────
const COPY = {
  EN: {
    eyebrow: 'No account. No catch. Completely free.',
    headline: ['Your Money,', 'Figured Out.'],
    sub: "Connect your bank and see exactly where your money goes between paydays. Spot what's draining you, find quick wins, and know how much you can safely advance — before you need it.",
    cta: 'Connect my bank →',
    ctaLoading: 'Loading...',
    trust: 'Bank-level encryption · Read-only access · Powered by Plaid',
    signin: 'Sign in',
    cards: [
      { icon: '📅', title: 'Make it to payday', body: "See your real cash flow day by day. Know if you're on track — or if something needs to change before Friday." },
      { icon: '📱', title: "Spot what's draining you", body: 'Find the subscriptions and habits quietly eating your paycheck every month. Small cuts add up fast.' },
      { icon: '🐖', title: 'Build your first cushion', body: "Even $5–$10 per paycheck adds up. We'll find the exact spots to trim so you stop starting each pay period at zero." },
    ],
    threeQ: 'Three quick questions',
    questionSub: 'Your answers shape the analysis — takes 30 seconds.',
    payFreqLabel: 'How often do you get paid?',
    payFreqPlaceholder: 'Choose one…',
    payFreqs: [
      { value: 'weekly', label: 'Every week' },
      { value: 'biweekly', label: 'Every two weeks' },
      { value: 'semimonthly', label: 'Twice a month (1st & 15th)' },
      { value: 'monthly', label: 'Once a month' },
    ],
    paydayLabel: 'When is your next payday?',
    paydayPlaceholder: 'Choose one…',
    paydayOptions: [
      { value: '2', label: 'In 1-2 days' },
      { value: '5', label: 'In 3-5 days' },
      { value: '10', label: 'In 6-10 days' },
      { value: '14', label: 'In 11-14 days' },
    ],
    stateLabel: 'State',
    buildCta: 'Connect my bank →',
    analyzing: 'Building your picture…',
    analyzingSub: 'Reading your transactions and running the numbers. Usually under a minute.',
    demoNotReady: 'Not ready to connect your bank?',
    demoBtn: '👀 See a sample — Marcus, 34, Miami',
    demoBtnLoading: 'Building demo…',
    demoSub: 'Real AI analysis · Fictional person · No bank needed',
    connectingCta: 'Connect my bank →',
    errorValidation: 'Please answer all three questions',
  },
  ES: {
    eyebrow: 'Sin cuenta. Sin trampas. Completamente gratis.',
    headline: ['Tu Dinero,', 'Bajo Control.'],
    sub: "Conecta tu banco y ve exactamente a dónde va tu dinero entre pagos. Detecta lo que te está drenando, encuentra ahorros rápidos y sabe cuánto puedes adelantar de forma segura.",
    cta: 'Conectar mi banco →',
    ctaLoading: 'Cargando...',
    trust: 'Cifrado bancario · Acceso de solo lectura · Powered by Plaid',
    signin: 'Iniciar sesión',
    cards: [
      { icon: '📅', title: 'Llegar al día de pago', body: 'Ve tu flujo de dinero día a día. Sabe si vas bien o si algo tiene que cambiar antes del viernes.' },
      { icon: '📱', title: 'Detecta lo que te drena', body: 'Encuentra las suscripciones y hábitos que se comen tu cheque cada mes. Los pequeños ahorros suman.' },
      { icon: '🐖', title: 'Empieza tu primer colchón', body: 'Hasta $5–$10 por pago se acumulan. Encontramos exactamente dónde recortar para que dejes de empezar cada quincena en cero.' },
    ],
    threeQ: 'Tres preguntas rápidas',
    questionSub: 'Tus respuestas guían el análisis — toma 30 segundos.',
    payFreqLabel: '¿Cada cuánto te pagan?',
    payFreqPlaceholder: 'Elige una…',
    payFreqs: [
      { value: 'weekly', label: 'Cada semana' },
      { value: 'biweekly', label: 'Cada dos semanas' },
      { value: 'semimonthly', label: 'Dos veces al mes (1 y 15)' },
      { value: 'monthly', label: 'Una vez al mes' },
    ],
    paydayLabel: '¿Cuándo es tu próximo pago?',
    paydayPlaceholder: 'Elige una…',
    paydayOptions: [
      { value: '2', label: 'En 1-2 días' },
      { value: '5', label: 'En 3-5 días' },
      { value: '10', label: 'En 6-10 días' },
      { value: '14', label: 'En 11-14 días' },
    ],
    stateLabel: 'Estado',
    buildCta: 'Conectar mi banco →',
    analyzing: 'Analizando tu situación…',
    analyzingSub: 'Leyendo tus transacciones y haciendo los cálculos. Menos de un minuto.',
    demoNotReady: '¿No estás listo para conectar tu banco?',
    demoBtn: '👀 Ver un ejemplo — Marcus, 34, Miami',
    demoBtnLoading: 'Cargando demo…',
    demoSub: 'Análisis real con IA · Persona ficticia · Sin banco',
    connectingCta: 'Conectar mi banco →',
    errorValidation: 'Por favor responde las tres preguntas',
  },
}

// ── Loading steps ─────────────────────────────────────────────
const LOADING_STEPS = {
  EN: [
    { icon: '🔗', text: 'Connecting to your bank…' },
    { icon: '📥', text: 'Reading your recent transactions…' },
    { icon: '🗂️', text: 'Categorizing your spending…' },
    { icon: '📊', text: 'Calculating your pay period cash flow…' },
    { icon: '📱', text: 'Spotting subscription charges…' },
    { icon: '🍔', text: 'Totaling delivery and dining spend…' },
    { icon: '📅', text: 'Mapping your days until payday…' },
    { icon: '⚡', text: 'Finding your biggest money drains…' },
    { icon: '💡', text: 'Calculating your safe advance amount…' },
    { icon: '🧮', text: 'Running the numbers…' },
    { icon: '🎯', text: 'Ranking your quick wins…' },
    { icon: '✏️', text: 'Writing your personalized plan…' },
  ],
  ES: [
    { icon: '🔗', text: 'Conectando con tu banco…' },
    { icon: '📥', text: 'Leyendo tus transacciones recientes…' },
    { icon: '🗂️', text: 'Categorizando tus gastos…' },
    { icon: '📊', text: 'Calculando tu flujo entre pagos…' },
    { icon: '📱', text: 'Detectando suscripciones…' },
    { icon: '🍔', text: 'Sumando gastos en delivery y comida…' },
    { icon: '📅', text: 'Calculando días hasta tu próximo pago…' },
    { icon: '⚡', text: 'Encontrando tus mayores gastos…' },
    { icon: '💡', text: 'Calculando tu adelanto seguro…' },
    { icon: '🧮', text: 'Haciendo los números…' },
    { icon: '🎯', text: 'Ordenando tus victorias rápidas…' },
    { icon: '✏️', text: 'Escribiendo tu plan personalizado…' },
  ],
}

// OneBlinc brand colors
const OB = {
  blue:       '#2B5BAE',
  blueShade:  '#1A3C6E',
  yellow:     '#F7BB00',
  teal:       '#00B5A0',
  grey:       '#4A4A4A',
  greyLight:  '#F5F5F5',
}

// ── Logo mark (inline SVG) ────────────────────────────────────
function LogoMark({ size = 28 }) {
  return (
    <img src="data:image/jpeg;base64,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" width={size} height={size} style={{ display: 'block' }} alt="OneBlinc" />
  )
}

// ── Analyzing screen ──────────────────────────────────────────
function AnalyzingScreen({ lang }) {
  const [idx, setIdx] = useState(0)
  const [fade, setFade] = useState(true)
  const steps = LOADING_STEPS[lang] || LOADING_STEPS.EN

  useState(() => {
    const interval = setInterval(() => {
      setFade(false)
      setTimeout(() => { setIdx(i => (i + 1) % steps.length); setFade(true) }, 300)
    }, 5800)
    return () => clearInterval(interval)
  })

  const current = steps[idx]
  return (
    <div style={{ textAlign: 'center', padding: '0 24px', maxWidth: 380, margin: '0 auto' }}>
      <div style={{ marginBottom: 32 }}>
        <style>{`
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        `}</style>
        <div style={{ position: 'relative', width: 64, height: 64, margin: '0 auto' }}>
          <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '3px solid #e8e8e8' }} />
          <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '3px solid transparent', borderTopColor: OB.blue, animation: 'spin 0.9s linear infinite' }} />
          <div style={{ position: 'absolute', inset: 8, borderRadius: '50%', border: '2px solid transparent', borderTopColor: OB.teal, animation: 'spin 1.4s linear infinite reverse' }} />
        </div>
      </div>
      <div style={{ transition: 'opacity 0.3s ease', opacity: fade ? 1 : 0, minHeight: 72 }}>
        <div style={{ fontSize: 28, marginBottom: 10 }}>{current.icon}</div>
        <p style={{ fontSize: 16, fontWeight: 600, color: OB.grey, marginBottom: 6 }}>{current.text}</p>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 28 }}>
        {steps.map((_, i) => (
          <div key={i} style={{ width: i === idx ? 20 : 6, height: 6, borderRadius: 3, background: i === idx ? OB.blue : '#e0e0e0', transition: 'all 0.3s ease' }} />
        ))}
      </div>
      <p style={{ fontSize: 12, color: '#bbb', marginTop: 20 }}>
        {lang === 'EN' ? 'Usually under a minute' : 'Menos de un minuto'}
      </p>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────
export default function Home() {
  const router = useRouter()
  const [lang, setLang] = useState('EN')
  const [step, setStep] = useState('landing')
  const [linkToken, setLinkToken] = useState(null)
  const [error, setError] = useState(null)
  const [demoLoading, setDemoLoading] = useState(false)
  const [userInputs, setUserInputs] = useState({ payFrequency: '', daysToPayday: '', state: 'FL' })

  const c = COPY[lang]

  useEffect(() => { fetchLinkToken() }, []) // eslint-disable-line

  async function fetchLinkToken() {
    try {
      const r = await fetch('/api/plaid/create-link-token', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lang }) })
      const d = await r.json()
      setLinkToken(d.link_token)
    } catch { setError('Failed to initialize bank connection') }
  }

  // Ref keeps onPlaidSuccess stable (required by usePlaidLink) while always
  // calling the latest handleBuildRoadmap, which closes over current userInputs.
  const handleBuildRoadmapRef = useRef()
  handleBuildRoadmapRef.current = handleBuildRoadmap
  const onPlaidSuccess = useCallback((public_token) => { handleBuildRoadmapRef.current(public_token) }, [])

  const { open: openPlaid, ready: plaidReady } = usePlaidLink({
    token: linkToken,
    onSuccess: onPlaidSuccess,
    onExit: (err) => { if (err) setError('Bank connection cancelled') }
  })

  async function handleAnalyze() {
    if (!userInputs.payFrequency || !userInputs.daysToPayday) { setError(c.errorValidation); return }
    setError(null)
    openPlaid()
  }

  async function handleBuildRoadmap(token) {
    setStep('analyzing')
    setError(null)
    try {
      const res = await fetch('/api/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ public_token: token, userInputs: { ...userInputs, lang } }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Analysis failed')
      router.push(`/roadmap/${data.roadmapId}?lang=${lang}`)
    } catch (err) { setError(err.message); setStep('questions') }
  }

  async function handleDemo() {
    setDemoLoading(true)
    setStep('analyzing')
    try {
      const res = await fetch('/api/demo', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ state: userInputs.state || 'FL', payFrequency: userInputs.payFrequency || 'biweekly', daysToPayday: userInputs.daysToPayday || '7', lang }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Demo failed')
      router.push(`/demo-dashboard`)
    } catch (err) { setError(err.message); setStep('questions'); setDemoLoading(false) }
  }

  const inputStyle = { width: '100%', padding: '13px 16px', border: `1.5px solid #e0e0e0`, borderRadius: 10, fontSize: 15, outline: 'none', boxSizing: 'border-box', background: 'white', appearance: 'auto', fontFamily: "'Nunito Sans', -apple-system, sans-serif" }

  return (
    <>
      <Head>
        <title>{lang === 'EN' ? 'Money Figured Out' : 'Tu Dinero Bajo Control'}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link href="https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@400;600;700;800;900&display=swap" rel="stylesheet" />
      </Head>

      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: OB.greyLight, fontFamily: "'Nunito Sans', -apple-system, sans-serif" }}>

        {/* Header */}
        <header style={{ padding: '14px 24px', background: 'white', borderBottom: `3px solid ${OB.yellow}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <LogoMark size={32} />
            <span style={{ fontWeight: 900, fontSize: 18, color: OB.grey, letterSpacing: '-0.01em' }}>
              One<span style={{ fontWeight: 900, color: OB.blue }}>Blinc</span>
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ display: 'flex', gap: 3, background: '#f0f0f0', borderRadius: 20, padding: 3 }}>
              {['EN', 'ES'].map(l => (
                <button key={l} onClick={() => setLang(l)}
                  style={{ padding: '4px 14px', borderRadius: 16, border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: 11, letterSpacing: '0.08em', background: lang === l ? OB.blue : 'transparent', color: lang === l ? 'white' : '#999', fontFamily: 'inherit' }}>
                  {l}
                </button>
              ))}
            </div>
            <a href="/auth/signin" style={{ fontSize: 14, color: OB.grey, fontWeight: 600 }}>{c.signin}</a>
          </div>
        </header>

        {/* ── STEP 1: Landing ── */}
        {step === 'landing' && (
          <main style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '56px 24px' }}>
            <div style={{ maxWidth: 620, margin: '0 auto', textAlign: 'center' }}>
              <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#bbb', marginBottom: 20 }}>
                {c.eyebrow}
              </p>
              <h1 style={{ fontSize: 'clamp(34px, 6vw, 56px)', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: 24, color: OB.grey }}>
                {c.headline[0]}<br /><span style={{ color: OB.blue }}>{c.headline[1]}</span>
              </h1>
              <p style={{ fontSize: 17, color: '#777', lineHeight: 1.75, maxWidth: 520, margin: '0 auto 40px' }}>
                {c.sub}
              </p>
              <button onClick={() => setStep('questions')}
                style={{ fontSize: 17, padding: '18px 40px', width: '100%', maxWidth: 380, background: OB.blue, color: 'white', border: 'none', borderRadius: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', boxShadow: `0 4px 20px rgba(43,91,174,0.35)` }}>
                {lang === 'EN' ? 'Get my picture →' : 'Ver mi situación →'}
              </button>
              <p style={{ marginTop: 14, fontSize: 13, color: '#ccc' }}>{c.trust}</p>

              {/* Use case cards */}
              <div style={{ marginTop: 64, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, textAlign: 'left' }}>
                {c.cards.map(({ icon, title, body }) => (
                  <div key={title} style={{ background: 'white', border: '1px solid #ebebeb', borderRadius: 14, padding: '22px 18px', borderTop: `3px solid ${OB.teal}` }}>
                    <div style={{ fontSize: 26, marginBottom: 12 }}>{icon}</div>
                    <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 8, lineHeight: 1.3, color: OB.grey }}>{title}</div>
                    <div style={{ fontSize: 13, color: '#888', lineHeight: 1.65 }}>{body}</div>
                  </div>
                ))}
              </div>
            </div>
          </main>
        )}

        {/* ── STEP 2: Questions ── */}
        {step === 'questions' && (
          <main style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '48px 24px' }}>
            <div style={{ maxWidth: 480, margin: '0 auto', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <LogoMark size={24} />
                <h2 style={{ fontSize: 26, fontWeight: 900, letterSpacing: '-0.02em', color: OB.grey, margin: 0 }}>{c.threeQ}</h2>
              </div>
              <p style={{ fontSize: 14, color: '#888', marginBottom: 28, lineHeight: 1.5 }}>{c.questionSub}</p>

              {error && (
                <div style={{ background: '#fff3f3', border: '1px solid #ffd0d0', color: '#c0392b', padding: '12px 16px', borderRadius: 10, fontSize: 14, marginBottom: 16 }}>{error}</div>
              )}

              {/* Pay frequency */}
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontWeight: 700, fontSize: 14, marginBottom: 8, color: OB.grey }}>{c.payFreqLabel}</label>
                <select value={userInputs.payFrequency} onChange={e => setUserInputs(p => ({ ...p, payFrequency: e.target.value }))} style={inputStyle}>
                  <option value="">{c.payFreqPlaceholder}</option>
                  {c.payFreqs.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                </select>
              </div>

              {/* Next payday */}
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontWeight: 700, fontSize: 14, marginBottom: 8, color: OB.grey }}>{c.paydayLabel}</label>
                <select value={userInputs.daysToPayday} onChange={e => setUserInputs(p => ({ ...p, daysToPayday: e.target.value }))} style={inputStyle}>
                  <option value="">{c.paydayPlaceholder}</option>
                  {c.paydayOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>

              {/* State */}
              <div style={{ marginBottom: 28 }}>
                <label style={{ display: 'block', fontWeight: 700, fontSize: 14, marginBottom: 8, color: OB.grey }}>{c.stateLabel}</label>
                <select value={userInputs.state} onChange={e => setUserInputs(p => ({ ...p, state: e.target.value }))} style={inputStyle}>
                  {US_STATES.map(([abbr, name]) => (<option key={abbr} value={abbr}>{name}</option>))}
                </select>
              </div>

              {/* Connect bank CTA */}
              <button onClick={handleAnalyze} disabled={!plaidReady}
                style={{ width: '100%', padding: '16px', background: OB.blue, color: 'white', border: 'none', borderRadius: 10, fontSize: 16, fontWeight: 800, cursor: !plaidReady ? 'not-allowed' : 'pointer', opacity: !plaidReady ? 0.6 : 1, fontFamily: 'inherit', boxShadow: `0 4px 16px rgba(43,91,174,0.3)` }}>
                {!plaidReady ? c.ctaLoading : c.connectingCta}
              </button>

              {/* Demo — Marcus */}
              <div style={{ marginTop: 28, paddingTop: 24, borderTop: '1px solid #ebebeb', textAlign: 'center' }}>
                <p style={{ fontSize: 13, color: '#aaa', marginBottom: 10 }}>{c.demoNotReady}</p>
                <button onClick={handleDemo} disabled={demoLoading}
                  style={{ fontSize: 14, padding: '12px 24px', background: 'white', color: OB.grey, border: `2px solid ${OB.grey}`, borderRadius: 10, fontWeight: 700, cursor: demoLoading ? 'not-allowed' : 'pointer', opacity: demoLoading ? 0.6 : 1, fontFamily: 'inherit' }}>
                  {demoLoading ? c.demoBtnLoading : c.demoBtn}
                </button>
                <p style={{ fontSize: 12, color: '#ccc', marginTop: 6 }}>{c.demoSub}</p>
              </div>
            </div>
          </main>
        )}

        {/* ── STEP 3: Analyzing ── */}
        {step === 'analyzing' && (
          <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
            <AnalyzingScreen lang={lang} />
          </main>
        )}

      </div>
    </>
  )
}
