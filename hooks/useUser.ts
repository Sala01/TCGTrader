import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function useUser() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let ignore = false

    const initSession = async () => {
      const { data, error } = await supabase.auth.getSession()
      if (!ignore) {
        setUser(data?.session?.user || null)
        setLoading(false)
      }
    }

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!ignore) setUser(session?.user || null)
    })

    initSession()

    return () => {
      ignore = true
      listener.subscription.unsubscribe()
    }
  }, [])

  return { user, loading }
}
