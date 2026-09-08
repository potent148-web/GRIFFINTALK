import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { isImageFile, compressImage, formatBytes } from '../lib/imageCompression'
import { linkifyParts } from '../lib/linkify'

const MAX_FILE_SIZE = 25 * 1024 * 1024
const MSG_SELECT = 'id, content, created_at, user_id, attachment_url, attachment_type, attachment_name, attachment_size, profiles(display_name)'

export default function ChatWindow({ channel, onStartCall }) {
  const { profile } = useAuth()
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const bottomRef = useRef(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (!channel) return
    let active = true

    async function loadMessages() {
      const { data } = await supabase
        .from('messages')
        .select(MSG_SELECT)
        .eq('channel_id', channel.id)
        .order('created_at', { ascending: true })
        .limit(200)
      if (active) setMessages(data || [])
    }
    loadMessages()

    const channelSub = supabase
      .channel(`messages:${channel.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `channel_id=eq.${channel.id}` },
        async (payload) => {
          const { data } = await supabase
            .from('messages')
            .select(MSG_SELECT)
            .eq('id', payload.new.id)
            .single()
          if (data) setMessages((prev) => [...prev, data])
        }
      )
      .subscribe()

    return () => {
      active = false
      supabase.removeChannel(channelSub)
    }
  }, [channel])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage(e) {
    e.preventDefault()
    if (!text.trim()) return
    const content = text.trim()
    setText('')
    await supabase.from('messages').insert({
      channel_id: channel.id,
      user_id: profile.id,
      content,
    })
  }

  async function handleFilePick(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploadError('')

    if (!isImageFile(file) && file.size > MAX_FILE_SIZE) {
      setUploadError(`File too large — keep it under ${formatBytes(MAX_FILE_SIZE)}.`)
      return
    }

    setUploading(true)
    try {
      const fileToUpload = isImageFile(file) ? await compressImage(file) : file
      const path = `${channel.id}/${crypto.randomUUID()}-${fileToUpload.name}`

      const { error: uploadErr } = await supabase.storage
        .from('chat-attachments')
        .upload(path, fileToUpload, { cacheControl: '3600', upsert: false })

      if (uploadErr) throw uploadErr

      const { data: urlData } = supabase.storage.from('chat-attachments').getPublicUrl(path)

      await supabase.from('messages').insert({
        channel_id: channel.id,
        user_id: profile.id,
        content: null,
        attachment_url: urlData.publicUrl,
        attachment_type: isImageFile(file) ? 'image' : 'file',
        attachment_name: fileToUpload.name,
        attachment_size: fileToUpload.size,
      })
    } catch (err) {
      setUploadError('Upload failed. Try again.')
    } finally {
      setUploading(false)
    }
  }

  if (!channel) {
    return <div style={styles.empty}>Select a channel to start talking.</div>
  }

  return (
    <div style={styles.wrap}>
      <div style={styles.header}>
        <span style={styles.channelName}>{channel.is_dm ? channel.display_name : `# ${channel.name}`}</span>
        <button className="gt-btn-primary" onClick={() => onStartCall(channel)} style={styles.callBtn}>
          Start video call
        </button>
      </div>

      <div style={styles.messages}>
        {messages.length === 0 && (
          <div style={styles.emptyState}>No messages yet. Say something, or share a file.</div>
        )}
        {messages.map((m) => (
          <div key={m.id} style={styles.messageRow}>
            <div style={styles.msgAuthor}>{m.profiles?.display_name || 'Unknown'}</div>
            {m.content && (
              <div style={styles.msgContent}>
                {linkifyParts(m.content).map((part) =>
                  part.type === 'link' ? (
                    <a key={part.key} href={part.value} target="_blank" rel="noopener noreferrer" style={styles.link}>
                      {part.value}
                    </a>
                  ) : (
                    <span key={part.key}>{part.value}</span>
                  )
                )}
              </div>
            )}
            {m.attachment_url && m.attachment_type === 'image' && (
              <a href={m.attachment_url} target="_blank" rel="noopener noreferrer">
                <img src={m.attachment_url} alt={m.attachment_name} style={styles.imagePreview} />
              </a>
            )}
            {m.attachment_url && m.attachment_type === 'file' && (
              <a href={m.attachment_url} target="_blank" rel="noopener noreferrer" style={styles.fileCard}>
                <span style={styles.fileIcon}>📎</span>
                <span>
                  <span style={styles.fileName}>{m.attachment_name}</span>
                  <span style={styles.fileSize}> · {formatBytes(m.attachment_size)}</span>
                </span>
              </a>
            )}
            <div style={styles.msgTime}>
              {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {uploadError && <div style={styles.uploadError}>{uploadError}</div>}
      {uploading && <div style={styles.uploadStatus}>Uploading...</div>}

      <form onSubmit={sendMessage} style={styles.inputRow}>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFilePick}
          style={{ display: 'none' }}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          style={styles.attachBtn}
          disabled={uploading}
          title="Attach a file"
        >
          📎
        </button>
        <input
          className="gt-input"
          placeholder={channel.is_dm ? `Message ${channel.display_name}` : `Message #${channel.name}`}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button className="gt-btn-primary" type="submit" style={styles.sendBtn}>
          Send
        </button>
      </form>
    </div>
  )
}

const styles = {
  wrap: { display: 'flex', flexDirection: 'column', height: '100%', flex: 1 },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 20px',
    borderBottom: '1px solid #2c2c2c',
    background: '#161616',
  },
  channelName: { fontWeight: 700, fontSize: 16 },
  callBtn: { padding: '8px 16px', fontSize: 13.5 },
  messages: { flex: 1, overflowY: 'auto', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 14 },
  emptyState: { color: '#8a8a85', fontSize: 14, textAlign: 'center', marginTop: 40 },
  messageRow: { maxWidth: 640 },
  msgAuthor: { fontSize: 13, fontWeight: 700, color: '#f4e600', marginBottom: 2 },
  msgContent: { fontSize: 14.5, color: '#f5f5f0', lineHeight: 1.5, wordBreak: 'break-word' },
  link: { color: '#f4e600', textDecoration: 'underline', wordBreak: 'break-all' },
  msgTime: { fontSize: 11, color: '#8a8a85', marginTop: 2 },
  imagePreview: { maxWidth: 320, maxHeight: 320, borderRadius: 8, marginTop: 4, display: 'block', border: '1px solid #2c2c2c' },
  fileCard: {
    display: 'flex', alignItems: 'center', gap: 10, background: '#161616', border: '1px solid #2c2c2c',
    borderRadius: 8, padding: '10px 14px', marginTop: 4, textDecoration: 'none', maxWidth: 320,
  },
  fileIcon: { fontSize: 18 },
  fileName: { color: '#f5f5f0', fontSize: 13.5, fontWeight: 600, wordBreak: 'break-all' },
  fileSize: { color: '#8a8a85', fontSize: 12 },
  uploadStatus: { color: '#f4e600', fontSize: 12.5, padding: '0 20px 8px' },
  uploadError: { color: '#ff5c5c', fontSize: 12.5, padding: '0 20px 8px' },
  inputRow: { display: 'flex', gap: 10, padding: 16, borderTop: '1px solid #2c2c2c', background: '#161616', alignItems: 'center' },
  attachBtn: {
    background: '#2c2c2c', border: 'none', color: '#f5f5f0', width: 42, height: 42, borderRadius: 8,
    fontSize: 17, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  sendBtn: { padding: '0 22px' },
  empty: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8a8a85' },
}
