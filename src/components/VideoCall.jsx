import { useEffect, useRef, useState } from ‘react’
import DailyIframe from ‘@daily-co/daily-js’

// Creates (or reuses) a Daily room and joins it in an embedded call frame.
// Room creation happens via a Netlify function so the Daily API key never
// ships to the browser. When isHost is true, Daily’s “owner” token gives
// the person mute/remove controls in the call UI automatically.
export default function VideoCall({ roomKey, roomLabel, displayName, isHost = false, onClose }) {
const containerRef = useRef(null)
const callFrameRef = useRef(null)
const [status, setStatus] = useState(‘connecting’)
const [errorMsg, setErrorMsg] = useState(’’)

useEffect(() => {
let cancelled = false

```
async function join() {
  try {
    const res = await fetch('/.netlify/functions/create-room', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomKey, isHost, displayName }),
    })
    if (!res.ok) throw new Error('Could not create/find the video room.')
    const { url, token } = await res.json()
    if (cancelled) return

    const callFrame = DailyIframe.createFrame(containerRef.current, {
      iframeStyle: { width: '100%', height: '100%', border: '0' },
      showLeaveButton: true,
    })
    callFrameRef.current = callFrame

    callFrame.on('joined-meeting', () => !cancelled && setStatus('joined'))
    callFrame.on('left-meeting', () => onClose())
    callFrame.on('error', (e) => {
      if (!cancelled) {
        setStatus('error')
        setErrorMsg(e?.errorMsg || 'Call error.')
      }
    })

    const joinOptions = { url, userName: displayName }
    if (typeof token === 'string') {
      joinOptions.token = token
    }
    await callFrame.join(joinOptions)
  } catch (err) {
    if (!cancelled) {
      setStatus('error')
      setErrorMsg(err.message)
    }
  }
}
join()

return () => {
  cancelled = true
  callFrameRef.current?.destroy()
}
```

}, [roomKey, displayName, isHost, onClose])

return (
<div style={styles.overlay}>
<div style={styles.header}>
<span style={styles.title}>
{roomLabel}
{isHost && <span style={styles.hostBadge}>HOST</span>}
</span>
<button className="gt-btn-ghost" onClick={onClose} style={styles.closeBtn}>
Close
</button>
</div>
{status === ‘connecting’ && <div style={styles.status}>Connecting to call…</div>}
{status === ‘error’ && (
<div style={styles.statusError}>
Couldn’t start the call: {errorMsg}
<br />
Check your Daily.co API key is set in Netlify env vars.
</div>
)}
<div ref={containerRef} style={styles.frame} />
</div>
)
}

const styles = {
overlay: { position: ‘fixed’, inset: 0, background: ‘#0d0d0d’, zIndex: 100, display: ‘flex’, flexDirection: ‘column’ },
header: { display: ‘flex’, alignItems: ‘center’, justifyContent: ‘space-between’, padding: ‘14px 20px’, borderBottom: ‘1px solid #2c2c2c’ },
title: { fontWeight: 700, color: ‘#f4e600’, display: ‘flex’, alignItems: ‘center’, gap: 8 },
hostBadge: { fontSize: 9.5, background: ‘#f4e600’, color: ‘#0d0d0d’, padding: ‘2px 6px’, borderRadius: 4, fontWeight: 800 },
closeBtn: { padding: ‘8px 16px’, fontSize: 13 },
status: { color: ‘#8a8a85’, textAlign: ‘center’, padding: 20 },
statusError: { color: ‘#ff5c5c’, textAlign: ‘center’, padding: 20, fontSize: 14 },
frame: { flex: 1 },
}
