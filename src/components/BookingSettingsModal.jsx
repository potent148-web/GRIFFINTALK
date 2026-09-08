import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default function BookingSettingsModal({ onClose }) {
  const { profile } = useAuth()
  const [slots, setSlots] = useState([])
  const [newDay, setNewDay] = useState(1)
  const [newStart, setNewStart] = useState('09:00')
  const [newEnd, setNewEnd] = useState('17:00')
  const [duration, setDuration] = useState(30)
  const [copied, setCopied] = useState(false)
  const [busy, setBusy] = useState(false)

  const bookingLink = `${window.location.origin}/book/${profile.username}`
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone

  useEffect(() => {
    loadSlots()
  }, [])

  async function loadSlots() {
    const { data } = await supabase
      .from('availability')
      .select('*')
      .eq('user_id', profile.id)
      .order('day_of_week', { ascending: true })
    setSlots(data || [])
  }

  async function addSlot() {
    if (newStart >= newEnd) {
      alert('End time must be after start time.')
      return
    }
    setBusy(true)
    await supabase.from('availability').insert({
      user_id: profile.id,
      day_of_week: Number(newDay),
      start_time: newStart,
      end_time: newEnd,
      timezone: tz,
      slot_minutes: Number(duration),
    })
    setBusy(false)
    loadSlots()
  }

  async function removeSlot(id) {
    await supabase.from('availability').delete().eq('id', id)
    loadSlots()
  }

  function copyLink() {
    navigator.clipboard.writeText(bookingLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <span style={styles.title}>My booking page</span>
          <button className="gt-btn-ghost" onClick={onClose} style={styles.closeBtn}>
            Close
          </button>
        </div>

        <div style={styles.body}>
          <div style={styles.linkSection}>
            <label style={styles.label}>Your public booking link</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input className="gt-input" readOnly value={bookingLink} onFocus={(e) => e.target.select()} />
              <button className="gt-btn-primary" onClick={copyLink} style={{ padding: '0 16px', flexShrink: 0 }}>
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <p style={styles.hint}>Share this with anyone outside Griffin Talk. They'll pick an open slot and it'll book a video call with you.</p>
          </div>

          <div style={styles.divider} />

          <label style={styles.label}>Weekly availability ({tz})</label>
          {slots.length === 0 && <p style={styles.hint}>No availability set — add a slot below so people can book you.</p>}
          {slots.map((s) => (
            <div key={s.id} style={styles.slotRow}>
              <span>{DAYS[s.day_of_week]} · {s.start_time.slice(0, 5)}–{s.end_time.slice(0, 5)} · {s.slot_minutes}min slots</span>
              <button onClick={() => removeSlot(s.id)} style={styles.removeBtn}>Remove</button>
            </div>
          ))}

          <div style={styles.addRow}>
            <select className="gt-input" value={newDay} onChange={(e) => setNewDay(e.target.value)} style={styles.select}>
              {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
            </select>
            <input className="gt-input" type="time" value={newStart} onChange={(e) => setNewStart(e.target.value)} style={styles.timeInput} />
            <input className="gt-input" type="time" value={newEnd} onChange={(e) => setNewEnd(e.target.value)} style={styles.timeInput} />
            <select className="gt-input" value={duration} onChange={(e) => setDuration(e.target.value)} style={styles.select}>
              <option value={15}>15 min</option>
              <option value={30}>30 min</option>
              <option value={60}>60 min</option>
            </select>
          </div>
          <button className="gt-btn-primary" onClick={addSlot} disabled={busy} style={{ marginTop: 10, width: '100%' }}>
            Add availability slot
          </button>
        </div>
      </div>
    </div>
  )
}

const styles = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 200,
    display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '6vh', overflowY: 'auto',
  },
  modal: { width: '100%', maxWidth: 520, background: '#161616', border: '1px solid #2c2c2c', borderRadius: 12, marginBottom: 40 },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', borderBottom: '1px solid #2c2c2c' },
  title: { fontWeight: 700, color: '#f4e600' },
  closeBtn: { padding: '6px 12px', fontSize: 12.5 },
  body: { padding: 20 },
  linkSection: { marginBottom: 4 },
  label: { fontSize: 12, color: '#8a8a85', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 8 },
  hint: { color: '#8a8a85', fontSize: 12.5, marginTop: 8, lineHeight: 1.5 },
  divider: { height: 1, background: '#2c2c2c', margin: '20px 0' },
  slotRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: '#0d0d0d', borderRadius: 6, fontSize: 13.5, color: '#c9c9c4', marginBottom: 6 },
  removeBtn: { background: 'transparent', border: 'none', color: '#ff5c5c', fontSize: 12.5 },
  addRow: { display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' },
  select: { flex: '1 1 100px' },
  timeInput: { flex: '1 1 90px' },
}
