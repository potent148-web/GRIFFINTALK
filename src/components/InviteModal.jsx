import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

export default function InviteModal({ onClose }) {
  const { profile } = useAuth()
  const [link, setLink] = useState(null)
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)

  async function generateLink() {
    setBusy(true)
    const { data, error } = await supabase
      .from('invite_links')
      .insert({ created_by: profile.id })
      .select()
      .single()
    setBusy(false)

    if (error) {
      alert('Could not create invite link.')
      return
    }
    setLink(`${window.location.origin}/invite/${data.code}`)
  }

  function copyLink() {
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <span style={styles.title}>Invite teammates</span>
          <button className="gt-btn-ghost" onClick={onClose} style={styles.closeBtn}>
            Close
          </button>
        </div>
        <div style={styles.body}>
          {!link ? (
            <>
              <p style={styles.desc}>
                Generate a link that lets someone sign up for Griffin Talk directly. Anyone with the link can join.
              </p>
              <button className="gt-btn-primary" onClick={generateLink} disabled={busy}>
                {busy ? 'Creating...' : 'Generate invite link'}
              </button>
            </>
          ) : (
            <>
              <div style={styles.linkBox}>
                <input className="gt-input" readOnly value={link} onFocus={(e) => e.target.select()} />
              </div>
              <button className="gt-btn-primary" onClick={copyLink} style={{ marginTop: 10, width: '100%' }}>
                {copied ? 'Copied!' : 'Copy link'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.6)',
    zIndex: 200,
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingTop: '10vh',
  },
  modal: {
    width: '100%',
    maxWidth: 420,
    background: '#161616',
    border: '1px solid #2c2c2c',
    borderRadius: 12,
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 18px',
    borderBottom: '1px solid #2c2c2c',
  },
  title: { fontWeight: 700, color: '#f4e600' },
  closeBtn: { padding: '6px 12px', fontSize: 12.5 },
  body: { padding: 20 },
  desc: { color: '#c9c9c4', fontSize: 14, lineHeight: 1.5, marginBottom: 16 },
  linkBox: { marginBottom: 4 },
}
