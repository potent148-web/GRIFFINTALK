import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default function BookingPage({ username }) {
  const [host, setHost] = useState(null)
  const [availability, setAvailability] = useState([])
  const [existingBookings, setExistingBookings] = useState([])
  const [status, setStatus] = useState('loading') // loading | ready | notfound
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [guestName, setGuestName] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [guestNote, setGuestNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [confirmed, setConfirmed] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: hostData } = await supabase
        .from('profiles')
        .select('id, display_name, username')
        .eq('username', username)
        .maybeSingle()

      if (!hostData) {
        setStatus('notfound')
        return
      }
      setHost(hostData)

      const { data: avail } = await supabase
        .from('availability')
        .select('*')
        .eq('user_id', hostData.id)
      setAvailability(avail || [])

      const { data: bookings } = await supabase
        .from('bookings')
        .select('start_at, end_at')
        .eq('host_id', hostData.id)
        .eq('status', 'confirmed')
        .gte('start_at', new Date().toISOString())
      setExistingBookings(bookings || [])

      setStatus('ready')
    }
    load()
  }, [username])

  // Build a list of open slots for the next 14 days from the weekly availability rules
  function getUpcomingSlots() {
    if (!availability.length) return []
    const slots = []
    const now = new Date()

    for (let dayOffset = 0; dayOffset < 14; dayOffset++) {
      const date = new Date(now)
      date.setDate(date.getDate() + dayOffset)
      const dow = date.getDay()

      const rulesForDay = availability.filter((a) => a.day_of_week === dow)
      for (const rule of rulesForDay) {
        const [startH, startM] = rule.start_time.split(':').map(Number)
        const [endH, endM] = rule.end_time.split(':').map(Number)

        let cursor = new Date(date)
        cursor.setHours(startH, startM, 0, 0)
        const end = new Date(date)
        end.setHours(endH, endM, 0, 0)

        while (cursor < end) {
          const slotEnd = new Date(cursor.getTime() + rule.slot_minutes * 60000)
          if (slotEnd <= end && cursor > now) {
            const overlaps = existingBookings.some((b) => {
              const bs = new Date(b.start_at)
              const be = new Date(b.end_at)
              return cursor < be && slotEnd > bs
            })
            if (!overlaps) {
              slots.push({ start: new Date(cursor), end: new Date(slotEnd) })
            }
          }
          cursor = new Date(cursor.getTime() + rule.slot_minutes * 60000)
        }
      }
    }
    return slots.sort((a, b) => a.start - b.start)
  }

  async function confirmBooking(e) {
    e.preventDefault()
    if (!guestName.trim() || !guestEmail.trim()) return

    setSubmitting(true)
    const { error } = await supabase.from('bookings').insert({
      host_id: host.id,
      guest_name: guestName.trim(),
      guest_email: guestEmail.trim(),
      guest_note: guestNote.trim() || null,
      start_at: selectedSlot.start.toISOString(),
      end_at: selectedSlot.end.toISOString(),
    })
    setSubmitting(false)

    if (error) {
      alert('Could not book this slot — it may have just been taken. Try another.')
      return
    }
    setConfirmed(true)
  }

  if (status === 'loading') return <div style={styles.wrap}><div style={styles.card}>Loading...</div></div>
  if (status === 'notfound') {
    return (
      <div style={styles.wrap}>
        <div style={styles.card}>
          <h1 style={styles.title}>Page not found</h1>
          <p style={styles.tagline}>No booking page exists for "{username}".</p>
        </div>
      </div>
    )
  }

  if (confirmed) {
    return (
      <div style={styles.wrap}>
        <div style={styles.card}>
          <h1 style={styles.title}>You're booked!</h1>
          <p style={styles.tagline}>
            {selectedSlot.start.toLocaleString([], { weekday: 'long', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            <br />with {host.display_name}
          </p>
          <p style={styles.hint}>A video call link will be ready at the scheduled time. Check your email for details.</p>
        </div>
      </div>
    )
  }

  const upcoming = getUpcomingSlots()
  const slotsByDay = {}
  upcoming.forEach((s) => {
    const key = s.start.toDateString()
    if (!slotsByDay[key]) slotsByDay[key] = []
    slotsByDay[key].push(s)
  })

  return (
    <div style={styles.wrap}>
      <div style={styles.bookCard}>
        <div style={styles.bookHeader}>
          <div>
            <h1 style={styles.bookTitle}>Book time with {host.display_name}</h1>
            <p style={styles.bookSub}>via Griffin Talk</p>
          </div>
        </div>

        {!selectedSlot ? (
          <div style={styles.slotsWrap}>
            {upcoming.length === 0 && <p style={styles.hint}>No open slots right now — check back later.</p>}
            {Object.entries(slotsByDay).map(([day, daySlots]) => (
              <div key={day} style={styles.dayGroup}>
                <div style={styles.dayLabel}>
                  {daySlots[0].start.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
                </div>
                <div style={styles.slotGrid}>
                  {daySlots.map((s, i) => (
                    <button key={i} style={styles.slotBtn} onClick={() => setSelectedSlot(s)}>
                      {s.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <form onSubmit={confirmBooking} style={styles.form}>
            <div style={styles.selectedSlotBox}>
              {selectedSlot.start.toLocaleString([], { weekday: 'long', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              <button type="button" onClick={() => setSelectedSlot(null)} style={styles.changeBtn}>Change</button>
            </div>
            <input className="gt-input" placeholder="Your name" value={guestName} onChange={(e) => setGuestName(e.target.value)} required />
            <input className="gt-input" type="email" placeholder="Your email" value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} required />
            <textarea className="gt-input" placeholder="What's this about? (optional)" value={guestNote} onChange={(e) => setGuestNote(e.target.value)} rows={3} />
            <button className="gt-btn-primary" type="submit" disabled={submitting}>
              {submitting ? 'Booking...' : 'Confirm booking'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

const styles = {
  wrap: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(circle at 50% 0%, #1a1a1a, #0d0d0d 60%)', padding: 20 },
  card: { width: '100%', maxWidth: 380, background: '#161616', border: '1px solid #2c2c2c', borderRadius: 14, padding: '36px 28px', textAlign: 'center' },
  griffin: { width: 90, marginBottom: 8 },
  title: { fontFamily: 'Archivo Black, Arial Black, sans-serif', fontSize: 22, color: '#f5f5f0', margin: '4px 0 6px' },
  tagline: { color: '#c9c9c4', fontSize: 14.5, lineHeight: 1.6 },
  hint: { color: '#8a8a85', fontSize: 13, marginTop: 10 },
  bookCard: { width: '100%', maxWidth: 460, background: '#161616', border: '1px solid #2c2c2c', borderRadius: 14, padding: 28 },
  bookHeader: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 },
  griffinSmall: { width: 44 },
  bookTitle: { fontSize: 18, fontWeight: 700, color: '#f5f5f0', margin: 0 },
  bookSub: { fontSize: 12.5, color: '#8a8a85', margin: '2px 0 0' },
  slotsWrap: { maxHeight: '55vh', overflowY: 'auto' },
  dayGroup: { marginBottom: 16 },
  dayLabel: { fontSize: 13, color: '#f4e600', fontWeight: 700, marginBottom: 8 },
  slotGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: 8 },
  slotBtn: { background: '#0d0d0d', border: '1px solid #2c2c2c', color: '#f5f5f0', padding: '8px 4px', borderRadius: 6, fontSize: 13 },
  form: { display: 'flex', flexDirection: 'column', gap: 12 },
  selectedSlotBox: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0d0d0d', border: '1px solid #f4e600', borderRadius: 8, padding: '10px 14px', fontSize: 13.5, color: '#f5f5f0', marginBottom: 6 },
  changeBtn: { background: 'transparent', border: 'none', color: '#f4e600', fontSize: 12.5 },
}
