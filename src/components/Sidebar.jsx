import { signOut } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

export default function Sidebar({
  channels,
  dms,
  activeChannelId,
  onSelectChannel,
  onlineUsers,
  onNewMessage,
  onOpenSeminars,
  onOpenInvite,
  onOpenBookingSettings,
}) {
  const { profile } = useAuth()

  return (
    <div style={styles.sidebar}>
      <div style={styles.brand}>
        <span style={styles.brandText}>GRIFFIN TALK</span>
      </div>

      <div style={styles.section}>
        <div style={styles.sectionLabel}>Channels</div>
        {channels.map((ch) => (
          <button
            key={ch.id}
            onClick={() => onSelectChannel(ch)}
            style={{
              ...styles.channelBtn,
              ...(ch.id === activeChannelId ? styles.channelBtnActive : {}),
            }}
          >
            # {ch.name}
          </button>
        ))}
      </div>

      <div style={styles.section}>
        <div style={styles.sectionLabelRow}>
          <span style={styles.sectionLabel}>Direct messages</span>
          <button onClick={onNewMessage} style={styles.plusBtn} title="New message">
            +
          </button>
        </div>
        {dms.length === 0 && <div style={styles.emptyDm}>No DMs yet</div>}
        {dms.map((dm) => (
          <button
            key={dm.id}
            onClick={() => onSelectChannel(dm)}
            style={{
              ...styles.channelBtn,
              ...(dm.id === activeChannelId ? styles.channelBtnActive : {}),
            }}
          >
            {dm.display_name}
          </button>
        ))}
      </div>

      <div style={styles.section}>
        <div style={styles.sectionLabel}>Team ({onlineUsers.length} online)</div>
        {onlineUsers.map((u) => (
          <div key={u.id} style={styles.userRow}>
            <span style={styles.dot} />
            {u.display_name}
          </div>
        ))}
      </div>

      <div style={styles.toolsSection}>
        <button style={styles.toolBtn} onClick={onOpenSeminars}>
          🎥 Seminars
        </button>
        <button style={styles.toolBtn} onClick={onOpenBookingSettings}>
          📅 My booking page
        </button>
        <button style={styles.toolBtn} onClick={onOpenInvite}>
          🔗 Invite teammates
        </button>
      </div>

      <div style={styles.footer}>
        <div style={styles.me}>
          {profile?.display_name}
          {profile?.is_admin && <span style={styles.adminBadge}>ADMIN</span>}
        </div>
        <button className="gt-btn-ghost" onClick={signOut} style={styles.signOutBtn}>
          Sign out
        </button>
      </div>
    </div>
  )
}

const styles = {
  sidebar: {
    width: 250,
    background: '#161616',
    borderRight: '1px solid #2c2c2c',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflowY: 'auto',
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '18px 16px',
    borderBottom: '1px solid #2c2c2c',
  },
  logo: { width: 28, height: 28, objectFit: 'contain' },
  brandText: {
    fontFamily: 'Archivo Black, Arial Black, sans-serif',
    fontSize: 14,
    letterSpacing: '0.03em',
    color: '#f4e600',
  },
  section: { padding: '14px 12px', borderBottom: '1px solid #2c2c2c' },
  sectionLabel: {
    fontSize: 11,
    color: '#8a8a85',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginBottom: 8,
    padding: '0 8px',
  },
  sectionLabelRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    padding: '0 4px 0 8px',
  },
  plusBtn: {
    background: '#2c2c2c',
    color: '#f4e600',
    border: 'none',
    width: 20,
    height: 20,
    borderRadius: 5,
    fontSize: 14,
    lineHeight: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyDm: { color: '#5a5a5a', fontSize: 12.5, padding: '4px 8px' },
  channelBtn: {
    display: 'block',
    width: '100%',
    textAlign: 'left',
    background: 'transparent',
    border: 'none',
    color: '#c9c9c4',
    padding: '8px 10px',
    borderRadius: 6,
    fontSize: 14,
    marginBottom: 2,
  },
  channelBtnActive: {
    background: '#2c2c2c',
    color: '#f4e600',
    fontWeight: 600,
  },
  userRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '6px 8px',
    fontSize: 13.5,
    color: '#c9c9c4',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: '#3ecf5e',
    display: 'inline-block',
  },
  toolsSection: {
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    borderBottom: '1px solid #2c2c2c',
  },
  toolBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    background: 'transparent',
    border: 'none',
    color: '#c9c9c4',
    padding: '9px 10px',
    borderRadius: 6,
    fontSize: 13.5,
    textAlign: 'left',
  },
  footer: {
    marginTop: 'auto',
    padding: 14,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  me: { fontSize: 13.5, color: '#f5f5f0', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 },
  adminBadge: {
    fontSize: 9.5,
    background: '#f4e600',
    color: '#0d0d0d',
    padding: '2px 6px',
    borderRadius: 4,
    fontWeight: 800,
  },
  signOutBtn: { padding: '6px 12px', fontSize: 12.5 },
}
