'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'

interface Profile {
  id: string
  full_name: string | null
  school_email: string | null
  timezone: string
  onboarding_done_at: string | null
  created_at: string
  updated_at: string
}

export function TestProfiles() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const fetchProfile = async () => {
    setLoading(true)
    setMessage('')

    try {
      const supabase = createClient()
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setMessage('No user logged in')
        return
      }

      // Fetch profile
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) {
        setMessage(`Error: ${error.message}`)
      } else {
        setProfile(data)
        setMessage('Profile fetched successfully!')
      }
    } catch {
      setMessage('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const updateProfile = async () => {
    if (!profile) return

    setLoading(true)
    setMessage('')

    try {
      const supabase = createClient()
      
      const { error } = await supabase
        .from('profiles')
        .update({ 
          full_name: profile.full_name || 'Updated Name',
          timezone: 'America/New_York'
        })
        .eq('id', profile.id)

      if (error) {
        setMessage(`Error: ${error.message}`)
      } else {
        setMessage('Profile updated successfully!')
        fetchProfile() // Refresh the profile
      }
    } catch {
      setMessage('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <h3 className="text-lg font-semibold">Profiles Table & RLS Test</h3>
      
      <div className="space-y-2">
        <Button onClick={fetchProfile} disabled={loading} size="sm">
          {loading ? 'Loading...' : 'Fetch Profile'}
        </Button>
        
        {profile && (
          <Button onClick={updateProfile} disabled={loading} size="sm" variant="outline">
            Update Profile
          </Button>
        )}
      </div>

      {message && (
        <div className={`text-sm p-3 rounded ${
          message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
        }`}>
          {message}
        </div>
      )}

      {profile && (
        <div className="text-sm space-y-1">
          <h4 className="font-medium">Profile Data:</h4>
          <p><strong>ID:</strong> {profile.id}</p>
          <p><strong>Name:</strong> {profile.full_name || 'Not set'}</p>
          <p><strong>Email:</strong> {profile.school_email || 'Not set'}</p>
          <p><strong>Timezone:</strong> {profile.timezone}</p>
          <p><strong>Onboarding:</strong> {profile.onboarding_done_at ? 'Complete' : 'Not done'}</p>
          <p><strong>Created:</strong> {new Date(profile.created_at).toLocaleDateString()}</p>
          <p><strong>Updated:</strong> {new Date(profile.updated_at).toLocaleDateString()}</p>
        </div>
      )}
    </div>
  )
}
