import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

const EMAIL_DOMAIN = 'griffintalk.local'

export function usernameToEmail(username) {
  return `${username.trim().toLowerCase()}@${EMAIL_DOMAIN}`
}

export async function signUpWithUsername(username, password, displayName) {
  const email = usernameToEmail(username)
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username: username.trim().toLowerCase(),
        display_name: displayName || username,
      },
    },
  })
  return { data, error }
}

export async function signInWithUsername(username, password) {
  const email = usernameToEmail(username)
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  return { data, error }
}

export async function signOut() {
  return supabase.auth.signOut()
}
