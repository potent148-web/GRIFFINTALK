import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) loadProfile(session.user.id)
      else setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) {
        loadProfile(session.user.id)
        markOnline(session.user.id, true)
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    const handleUnload = () => {
      if (session?.user?.id) {
        navigator.sendBeacon &&
          markOnline(session.user.id, false)
      }
    }
    window.addEventListener('beforeunload', handleUnload)
    return () => window.removeEventListener('beforeunload', handleUnload)
  }, [session])

  async function loadProfile(userId) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    setProfile(data)
    setLoading(false)
  }

  async function markOnline(userId, isOnline) {
    await supabase
      .from('profiles')
      .update({ is_online: isOnline, last_seen: new Date().toISOString() })
      .eq('id', userId)
  }

  return (
    <AuthContext.Provider value={{ session, profile, loading, setProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
