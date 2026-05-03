'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import type { Profile } from '../supabase'

export function useAuth() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    async function loadSession() {
      const { data: { session } } = await supabase.auth.getSession()

      if (!mounted) return

      if (session?.user) {
        await getProfile(session.user.id)
      } else {
        setLoading(false)
      }
    }

    loadSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!mounted) return

        if (session?.user) {
          await getProfile(session.user.id)
        } else {
          setProfile(null)
          setLoading(false)
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  async function getProfile(userId: string) {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      setProfile(data)
    } catch {
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }

  async function logout() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return {
    profile,
    loading,
    logout,
    recarregar: async () => {
      const { data } = await supabase.auth.getUser()
      if (data.user) await getProfile(data.user.id)
    }
  }
}
