import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/router'
import Head from 'next/head'

export default function SignIn() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const result = await signIn('credentials', {
      email, password, redirect: false
    })

    if (result?.error) {
      setError('Invalid email or password')
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <>
      <Head><title>Sign In — Your Money, Figured Out</title></Head>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <div style={{ width: '100%', maxWidth: 380 }}>
          <a href="/" style={{ display: 'block', textAlign: 'center', fontWeight: 700, fontSize: 18, marginBottom: 32 }}>
            your money, figured out
          </a>

          <div className="card">
            <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24 }}>Sign in</h1>

            {error && <div className="error" style={{ marginBottom: 16 }}>{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoFocus />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
              </div>
              <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                {loading ? 'Signing in…' : 'Sign in →'}
              </button>
            </form>
          </div>

          <p style={{ textAlign: 'center', marginTop: 16, fontSize: 14, color: '#888' }}>
            Don't have an account?{' '}
            <a href="/" style={{ color: '#0d0d0d', fontWeight: 600 }}>Get your free roadmap →</a>
          </p>
        </div>
      </div>
    </>
  )
}
