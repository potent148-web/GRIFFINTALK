import { useEffect, useState } from 'react'
import { useAuth } from './lib/AuthContext'
import { supabase } from './lib/supabase'
import AuthPage from './pages/AuthPage'
import Sidebar from './components/Sidebar'
import ChatWindow from './components/ChatWindow'
import VideoCall from './components/VideoCall'
import NewMessageModal from './components/NewMessageModal'
import InviteModal from './components/InviteModal'
import BookingSettingsModal from './components/BookingSettingsModal'
import SeminarsModal from './components/SeminarsModal'

export default function App() {
  const { session, profile, loading } = useAuth()
  const [channels, setChannels] = useState([])
  const [dms, setDms] = useState([])
  const [activeChannel, setActiveChannel] = useState(null)
  const [onlineUsers, setOnlineUsers] = useState([])
  const [activeCall, setActiveCall] = useState(null)
  const [showNewMessage, setShowNewMessage] = useState(false)
  const [showInvite, setShowInvite] = useState(false)
  const [showBookingSettings, setShowBookingSettings] = useState(false)
  const [showSeminars, setShowSeminars] = useState(false)

  useEffect(() => {
    if (!profile) return

    async function ensureGeneralMembership() {
      const { data: general } = await supabase
        .from('channels')
        .select('*')
        .eq('name', 'general')
        .single()
      if (general) {
        await supabase
          .from('channel_members')
          .upsert({ channel_id: general.id, user_id: profile.id }, { onConflict: 'channel_id,user_id' })
      }
    }

    async function loadChannels() {
      await ensureGeneralMembership()

      const { data } = await supabase
        .from('channels')
        .select('*, channel_members!inner(user_id)')
        .eq('channel_members.user_id', profile.id)
        .order('created_at', { ascending: true })

      const groupChannels = (data || []).filter((c) => !c.is_dm)
      const dmChannels = (data || []).filter((c) => c.is_dm)

      const resolvedDms = await Promise.all(
        dmChannels.map(async (dm) => {
          const { data: members } = await supabase
            .from('channel_members')
            .select('user_id, profiles(display_name)')
            .eq('channel_id', dm.id)
            .neq('user_id', profile.id)
          return { ...dm, display_name: members?.[0]?.profiles?.display_name || 'Direct message' }
        })
      )

      setChannels(groupChannels)
      setDms(resolvedDms)
      if (groupChannels.length > 0 && !activeChannel) {
        setActiveChannel(groupChannels[0])
      }
    }
    loadChannels()
  }, [profile])

  useEffect(() => {
    if (!profile) return

    async function loadOnline() {
      const { data } = await supabase
        .from('profiles')
        .select('id, display_name, is_online')
        .eq('is_online', true)
      setOnlineUsers(data || [])
    }
    loadOnline()

    const sub = supabase
      .channel('profiles-presence')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, loadOnline)
      .subscribe()

    return () => supabase.removeChannel(sub)
  }, [profile])

  function handleChannelReady(channel) {
    setDms((prev) => (prev.some((d) => d.id === channel.id) ? prev : [...prev, channel]))
    setActiveChannel(channel)
    setShowNewMessage(false)
  }

  function startChannelCall(channel) {
    setActiveCall({
      roomKey: channel.id,
      roomLabel: channel.is_dm ? channel.display_name : `#${channel.name}`,
      isHost: false,
      displayName: profile?.display_name,
    })
  }

  function joinSeminar(seminar, isHost) {
    setShowSeminars(false)
    setActiveCall({
      roomKey: seminar.daily_room_name,
      roomLabel: seminar.title,
      isHost,
      displayName: profile?.display_name,
    })
  }

  if (loading) {
    return <div style={styles.loading}>Loading Griffin Talk...</div>
  }

  if (!session) {
    return <AuthPage />
  }

  return (
    <div style={styles.appWrap}>
      <Sidebar
        channels={channels}
        dms={dms}
        activeChannelId={activeChannel?.id}
        onSelectChannel={setActiveChannel}
        onlineUsers={onlineUsers}
        onNewMessage={() => setShowNewMessage(true)}
        onOpenSeminars={() => setShowSeminars(true)}
        onOpenInvite={() => setShowInvite(true)}
        onOpenBookingSettings={() => setShowBookingSettings(true)}
      />
      <ChatWindow channel={activeChannel} onStartCall={startChannelCall} />

      {activeCall && (
        <VideoCall
          roomKey={activeCall.roomKey}
          roomLabel={activeCall.roomLabel}
          isHost={activeCall.isHost}
          displayName={activeCall.displayName || 'Team member'}
          onClose={() => setActiveCall(null)}
        />
      )}
      {showNewMessage && (
        <NewMessageModal onClose={() => setShowNewMessage(false)} onChannelReady={handleChannelReady} />
      )}
      {showInvite && <InviteModal onClose={() => setShowInvite(false)} />}
      {showBookingSettings && <BookingSettingsModal onClose={() => setShowBookingSettings(false)} />}
      {showSeminars && (
        <SeminarsModal onClose={() => setShowSeminars(false)} onJoinSeminar={joinSeminar} />
      )}
    </div>
  )
}

const styles = {
  appWrap: { display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' },
  loading: { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8a8a85', background: '#0d0d0d' },
}
