import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

export default function NewMessageModal({ onClose, onChannelReady }) {
  const { profile } = useAuth()
  const [teammates, setTeammates] = useState([])
  const [busyId, setBusyId] = useState(null)

  useEffect(() => {
    async function loadTeammates() {
      const { data } = await supabase
        .from('profiles')
        .select('id, display_name, username, is_online')
        .neq('id', profile.id)
        .order('display_name', { ascending: true })
      setTeammates(data || [])
    }
    loadTeammates()
  }, [profile])

  async function startDM(teammate) {
    setBusyId(teammate.id)

    const dmKey = [profile.id, teammate.id].sort().join('_')

    const { data: existing } = await supabase
      .from('channels')
      .select('*, channel_members(user_id)')
      .eq('is_dm', true)
      .eq('name', dmKey)
      .maybeSingle()

    if (existing) {
      setBusyId(null)
      onChannelReady({ ...existing, display_name: teammate.display_name })
      return
    }

    const { data: newChannel, error } = await supabase
      .from('channels')
      .insert({ name: dmKey, is_dm: true, created_by: profile.id })
      .select()
      .single()

    if (error || !newChannel) {
      setBusyId(null)
      alert('Could not start the conversation. Try again.')
      return
    }

    await supabase.from('channel_members').insert([
      { channel_id: newChannel.id, user_id: profile.id },
      { channel_id: newChannel.id, user_id: teammate.id },
    ])

    setBusyId(null)
    onChannelReady({ ...newChannel, display_name: teammate.display_name })
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <span style={styles.title}>New message</span>
          <button className="gt-btn-ghost" onClick={onClose} style={styles.closeBtn}>
            Close
          </button>
        </div>
        <div style={styles.list}>
          {teammates.length === 0 && <div style={styles.empty}>No other teammates yet.</div>}
          {teammates.map((t) => (
            <button
              key={t.id}
              style={styles.teammateRow}
              onClick={() => startDM(t)}
              disabled={busyId === t.id}
            >
              <span style={{ ...styles.dot, background: t.is_online ? '#3ecf5e' : '#5a5a5a' }} />
              <span style={styles.name}>{t.display_name}</span>
              <span style={styles.username}>@{t.username}</span>
              {busyId === t.id && <span style={styles.loading}>Opening...</span>}
            </button>
          ))}
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
    maxWidth: 400,
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
  list: { maxHeight: '50vh', overflowY: 'auto', padding: 8 },
  empty: { color: '#8a8a85', fontSize: 14, textAlign: 'center', padding: 20 },
  teammateRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    width: '100%',
    background: 'transparent',
    border: 'none',
    color: '#f5f5f0',
    padding: '10px 10px',
    borderRadius: 8,
    fontSize: 14.5,
    textAlign: 'left',
  },
  dot: { width: 8, height: 8, borderRadius: '50%', flexShrink: 0 },
  name: { fontWeight: 600 },
  username: { color: '#8a8a85', fontSize: 12.5, marginLeft: 'auto' },
  loading: { color: '#f4e600', fontSize: 12 },
}
