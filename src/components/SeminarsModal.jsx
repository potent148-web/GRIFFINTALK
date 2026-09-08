import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

export default function SeminarsModal({ onClose, onJoinSeminar }) {
  const { profile } = useAuth()
  const [seminars, setSeminars] = useState([])
  const [creating, setCreating] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    loadSeminars()
  }, [])

  async function loadSeminars() {
    const { data } = await supabase
      .from('seminars')
      .select('*, profiles(display_name)')
      .gte('scheduled_at', new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString())
      .order('scheduled_at', { ascending: true })
    setSeminars(data || [])
  }

  async function createSeminar(e) {
    e.preventDefault()
    if (!title.trim() || !date || !time) return

    const scheduledAt = new Date(`${date}T${time}`)
    const roomName = `seminar-${crypto.randomUUID().slice(0, 8)}`

    setBusy(true)
    const { error } = await supabase.from('seminars').insert({
      title: title.trim(),
      description: description.trim() || null,
      host_id: profile.id,
      scheduled_at: scheduledAt.toISOString(),
      daily_room_name: roomName,
    })
    setBusy(false)

    if (error) {
      alert('Could not create the seminar.')
      return
    }
    setTitle('')
    setDescription('')
    setDate('')
    setTime('')
    setCreating(false)
    loadSeminars()
  }

  const canManageAll = profile?.is_admin

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <span style={styles.title}>Seminars</span>
          <button className="gt-btn-ghost" onClick={onClose} style={styles.closeBtn}>Close</button>
        </div>

        <div style={styles.body}>
          {!creating ? (
            <button className="gt-btn-primary" onClick={() => setCreating(true)} style={{ width: '100%', marginBottom: 16 }}>
              Schedule a seminar
            </button>
          ) : (
            <form onSubmit={createSeminar} style={styles.form}>
              <input className="gt-input" placeholder="Seminar title" value={title} onChange={(e) => setTitle(e.target.value)} required />
              <textarea className="gt-input" placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
              <div style={{ display: 'flex', gap: 8 }}>
                <input className="gt-input" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
                <input className="gt-input" type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="gt-btn-primary" type="submit" disabled={busy} style={{ flex: 1 }}>
                  {busy ? 'Creating...' : 'Create seminar'}
                </button>
                <button type="button" className="gt-btn-ghost" onClick={() => setCreating(false)}>Cancel</button>
              </div>
            </form>
          )}

          <div style={styles.divider} />

          <div style={styles.label}>Upcoming</div>
          {seminars.length === 0 && <p style={styles.hint}>No seminars scheduled yet.</p>}
          {seminars.map((s) => {
            const isHost = s.host_id === profile.id
            const canManage = isHost || canManageAll
            return (
              <div key={s.id} style={styles.seminarRow}>
                <div>
                  <div style={styles.seminarTitle}>{s.title}</div>
                  <div style={styles.seminarMeta}>
                    Hosted by {s.profiles?.display_name} · {new Date(s.scheduled_at).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    {canManage && <span style={styles.hostTag}>you can manage</span>}
                  </div>
                  {s.description && <div style={styles.seminarDesc}>{s.description}</div>}
                </div>
                <button className="gt-btn-primary" onClick={() => onJoinSeminar(s, isHost || canManageAll)} style={styles.joinBtn}>
                  Join
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

const styles = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 200, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '6vh', overflowY: 'auto' },
  modal: { width: '100%', maxWidth: 520, background: '#161616', border: '1px solid #2c2c2c', borderRadius: 12, marginBottom: 40 },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', borderBottom: '1px solid #2c2c2c' },
  title: { fontWeight: 700, color: '#f4e600' },
  closeBtn: { padding: '6px 12px', fontSize: 12.5 },
  body: { padding: 20 },
  form: { display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 },
  divider: { height: 1, background: '#2c2c2c', margin: '16px 0' },
  label: { fontSize: 12, color: '#8a8a85', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 },
  hint: { color: '#8a8a85', fontSize: 13.5 },
  seminarRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, background: '#0d0d0d', borderRadius: 8, padding: '12px 14px', marginBottom: 8 },
  seminarTitle: { fontWeight: 700, color: '#f5f5f0', fontSize: 14.5 },
  seminarMeta: { fontSize: 12, color: '#8a8a85', marginTop: 2 },
  seminarDesc: { fontSize: 12.5, color: '#c9c9c4', marginTop: 4 },
  hostTag: { color: '#f4e600', marginLeft: 6 },
  joinBtn: { padding: '8px 16px', fontSize: 13, flexShrink: 0 },
}
