import { useState, useEffect } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/router'
import Head from 'next/head'

const C = {
  en: {
    title: 'Sign In — Your Money, Figured Out',
    heading: 'Sign in',
    emailLabel: 'Email',
    passwordLabel: 'Password',
    submitLoading: 'Signing in…',
    submit: 'Sign in →',
    invalidCreds: 'Invalid email or password',
    noAccount: 'Don\'t have an account?',
    backToRoadmap: 'Back to your roadmap →',
    startFresh: 'Get your free roadmap →',
  },
  es: {
    title: 'Iniciar sesión — Tu dinero, resuelto',
    heading: 'Iniciar sesión',
    emailLabel: 'Correo electrónico',
    passwordLabel: 'Contraseña',
    submitLoading: 'Entrando…',
    submit: 'Iniciar sesión →',
    invalidCreds: 'Correo o contraseña incorrectos',
    noAccount: '¿No tienes cuenta?',
    backToRoadmap: 'Volver a tu plan →',
    startFresh: 'Obtén tu plan gratis →',
  },
}

export default function SignIn() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [lang, setLang] = useState('en')

  const callbackUrl = router.query.callbackUrl || '/dashboard'
  const isRoadmapCallback = String(callbackUrl).startsWith('/roadmap/')

  useEffect(() => {
    // Respect language from Blinky URL param or sessionStorage
    const fromQuery = router.query.lang
    if (fromQuery === 'es' || fromQuery === 'en') { setLang(fromQuery); return }
    try { const s = sessionStorage.getItem('lang'); if (s === 'ES') setLang('es') } catch (_) {}
  }, [router.query.lang])

  const c = C[lang] || C.en

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const result = await signIn('credentials', {
      email, password, redirect: false
    })

    if (result?.error) {
      setError(c.invalidCreds)
      setLoading(false)
    } else {
      router.push(callbackUrl)
    }
  }

  return (
    <>
      <Head><title>{c.title}</title></Head>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <div style={{ width: '100%', maxWidth: 380 }}>
          <a href="/" style={{ display: 'block', textAlign: 'center', fontWeight: 700, fontSize: 18, marginBottom: 32 }}>
            your money, figured out
          </a>

          <div className="card">
            <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24 }}>{c.heading}</h1>

            {error && <div className="error" style={{ marginBottom: 16 }}>{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>{c.emailLabel}</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoFocus />
              </div>
              <div className="form-group">
                <label>{c.passwordLabel}</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
              </div>
              <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                {loading ? c.submitLoading : c.submit}
              </button>
            </form>
          </div>

          <p style={{ textAlign: 'center', marginTop: 16, fontSize: 14, color: '#888' }}>
            {c.noAccount}{' '}
            {isRoadmapCallback
              ? <a href={callbackUrl} style={{ color: '#0d0d0d', fontWeight: 600 }}>{c.backToRoadmap}</a>
              : <a href="/" style={{ color: '#0d0d0d', fontWeight: 600 }}>{c.startFresh}</a>
            }
          </p>
        </div>
      </div>
    </>
  )
}
