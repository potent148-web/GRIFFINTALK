import { useEffect, useState } from 'react'
import { supabase, signUpWithUsername } from '../lib/supabase'
import griffinLogo from '../assets/griffin-logo.png'

export default function InvitePage({ code }) {
  const [invite, setInvite] = useState(null)
  const [status, setStatus] = useState('checking')
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    async function checkInvite() {
      const { data } = await supabase
        .from('invite_links')
        .select('*')
        .eq('code', code)
        .maybeSingle()

      if (!data) {
        setStatus('invalid')
        return
      }
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        setStatus('invalid')
        return
      }
      if (data.max_uses && data.use_count >= data.max_uses) {
        setStatus('invalid')
        return
      }
      setInvite(data)
      setStatus('valid')
    }
    checkInvite()
  }, [code])

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
    const { data, error: signUpError } = await signUpWithUsername(username, password, displayName)
    setBusy(false)

    if (signUpError) {
      setError(
        signUpError.message.includes('already registered')
          ? 'That username is taken.'
          : signUpError.message
      )
      return
    }

    if (data?.user && invite.channel_id) {
      await supabase.from('channel_members').insert({
        channel_id: invite.channel_id,
        user_id: data.user.id,
      })
    }
    await supabase
      .from('invite_links')
      .update({ use_count: invite.use_count + 1 })
      .eq('code', code)

    setDone(true)
  }

  if (status === 'checking') {
    return <div style={styles.wrap}><div style={styles.card}>Checking invite...</div></div>
  }

  if (status === 'invalid') {
    return (
      <div style={styles.wrap}>
        <div style={styles.card}>
          <img src={griffinLogo} alt="" style={styles.griffin} />
          <h1 style={styles.title}>Invite not valid</h1>
          <p style={styles.tagline}>This invite link has expired or reached its limit. Ask for a new one.</p>
        </div>
      </div>
    )
  }

  if (done) {
    return (
      <div style={styles.wrap}>
        <div style={styles.card}>
          <img src={griffinLogo} alt="" style={styles.griffin} />
          <h1 style={styles.title}>You're in!</h1>
          <p style={styles.tagline}>Account created. Refresh and log in to start chatting.</p>
          <a className="gt-btn-primary" href="/" style={{ display: 'inline-block', textDecoration: 'none', marginTop: 10 }}>
            Go to Griffin Talk
          </a>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.wrap}>
      <div style={styles.card}>
        <img src={griffinLogo} alt="" style={styles.griffin} />
        <h1 style={styles.title}>Join Griffin Talk</h1>
        <p style={styles.tagline}>You've been invited to the team.</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            className="gt-input"
            placeholder="Choose a username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoCapitalize="none"
            autoCorrect="off"
          />
          <input
            className="gt-input"
            placeholder="Display name (optional)"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
          <input
            className="gt-input"
            type="password"
            placeholder="Choose a password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <div style={styles.error}>{error}</div>}
          <button className="gt-btn-primary" type="submit" disabled={busy}>
            {busy ? 'Creating account...' : 'Join'}
          </button>
        </form>
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
  griffin: { width: 100, marginBottom: 8 },
  title: {
    fontFamily: 'Archivo Black, Arial Black, sans-serif',
    fontSize: 22,
    color: '#f5f5f0',
    margin: '4px 0 6px',
  },
  tagline: { color: '#8a8a85', fontSize: 13.5, margin: '0 0 22px' },
  form: { display: 'flex', flexDirection: 'column', gap: 12 },
  error: { color: '#ff5c5c', fontSize: 13, textAlign: 'left' },
}
