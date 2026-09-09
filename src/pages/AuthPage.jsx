import { useState } from 'react'
import { signInWithUsername, signUpWithUsername } from '../lib/supabase'

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
            onChange={(e)
