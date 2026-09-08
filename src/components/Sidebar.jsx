import { useState } from 'react'
import { signInWithUsername, signUpWithUsername } from '../lib/supabase'
import griffinLogo from '../assets/griffin-logo.png'
import potentLogo from '../assets/potent-logo.jpeg'

export default function AuthPage() {
  const [mode, setMode] = useState('login')
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!username.trim() || !password) {
      setError('Enter a username and password.')
      return
    }
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username.trim())) {
      setError('Username must be 3–20 characters: letters, numbers, underscores only.')
      return
    }

    setBusy(true)
    const result = mode === 'login'
      ? await signInWithUsername(username, password)
      : await signUpWithUsername(username, password, displayName)
    setBusy(false)

    if (result.error) {
      setError(
        result.error.message.includes('already registered')
          ? 'That username is taken.'
          : result.error.message.includes('Invalid login credentials')
          ? 'Wrong username or password.'
          : result.error.message
      )
    }
  }

  return (
    <div style={styles.wrap}>
      <div style={styles.card}>
        <img src={griffinLogo} alt="Griffin Talk" style={styles.griffin} />
        <h1 style={styles.title}>GRIFFIN TALK</h1>
        <p style={styles.tagline}>Team chat & video, built for us.</p>

        <div style={styles.toggle}>
          <button
            onClick={() => { setMode('login'); setError('') }}
            style={mode === 'login' ? styles.toggleActive : styles.toggleInactive}
          >
            Log in
          </button>
          <button
            onClick={() => { setMode('signup'); setError('') }}
            style={mode === 'signup' ? styles.toggleActive : styles.toggleInactive}
          >
            Sign up
          </button>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            className="gt-input"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoCapitalize="none"
            autoCorrect="off"
          />
          {mode === 'signup' && (
            <input
              className="gt-input"
              placeholder="Display name (optional)"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          )}
          <input
            className="gt-input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && <div style={styles.error}>{error}</div>}

          <button className="gt-btn-primary" type="submit" disabled={busy} style={{ marginTop: 8 }}>
            {busy ? 'Working...' : mode === 'login' ? 'Log in' : 'Create account'}
          </button>
        </form>

        <div style={styles.footer}>
          <span style={styles.poweredBy}>Powered by</span>
          <img src={potentLogo} alt="Potent Prädəkt" style={styles.potentLogo} />
        </div>
      </div>
    </div>
  )
}

const styles = {
  wrap: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'radial-gradient(circle at 50% 0%, #1a1a1a, #0d0d0d 60%)',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    background: '#161616',
    border: '1px solid #2c2c2c',
    borderRadius: 14,
    padding: '36px 28px',
    textAlign: 'center',
  },
  griffin: {
    width: 120,
    marginBottom: 8,
    filter: 'drop-shadow(0 0 14px rgba(244,230,0,0.25))',
  },
  title: {
    fontFamily: 'Archivo Black, Arial Black, sans-serif',
    fontSize: 26,
    letterSpacing: '0.04em',
    color: '#f5f5f0',
    margin: '4px 0 2px',
  },
  tagline: {
    color: '#8a8a85',
    fontSize: 13.5,
    margin: '0 0 24px',
  },
  toggle: {
    display: 'flex',
    background: '#0d0d0d',
    borderRadius: 8,
    padding: 4,
    marginBottom: 20,
  },
  toggleActive: {
    flex: 1,
    padding: '9px 0',
    background: '#f4e600',
    color: '#0d0d0d',
    border: 'none',
    borderRadius: 6,
    fontWeight: 700,
    fontSize: 13.5,
  },
  toggleInactive: {
    flex: 1,
    padding: '9px 0',
    background: 'transparent',
    color: '#8a8a85',
    border: 'none',
    borderRadius: 6,
    fontSize: 13.5,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  error: {
    color: '#ff5c5c',
    fontSize: 13,
    textAlign: 'left',
  },
  footer: {
    marginTop: 28,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  poweredBy: {
    color: '#8a8a85',
    fontSize: 11,
  },
  potentLogo: {
    height: 16,
    opacity: 0.85,
  },
}
