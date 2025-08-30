'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabaseClient'

export default function DebugPage() {
  const [session, setSession] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    
    // Get current session
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
      
      if (session?.user) {
        setUser(session.user)
      }
      setLoading(false)
    }

    getSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session)
        setSession(session)
        setUser(session?.user || null)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Auth Debug Page</h1>
      
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Session:</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(session, null, 2)}
          </pre>
        </div>

        <div>
          <h2 className="text-lg font-semibold">User:</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(user, null, 2)}
          </pre>
        </div>

        <div>
          <h2 className="text-lg font-semibold">Status:</h2>
          <p>Authenticated: {user ? 'Yes' : 'No'}</p>
          <p>User Email: {user?.email || 'None'}</p>
        </div>
      </div>
    </div>
  )
}
