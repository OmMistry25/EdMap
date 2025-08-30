import { createServerComponentClient } from '../supabaseClient'

export interface Profile {
  id: string
  full_name: string | null
  school_email: string | null
  timezone: string
  onboarding_done_at: string | null
  created_at: string
  updated_at: string
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = await createServerComponentClient()
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    console.error('Error fetching profile:', error)
    return null
  }

  return data
}

export async function updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile | null> {
  const supabase = await createServerComponentClient()
  
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()

  if (error) {
    console.error('Error updating profile:', error)
    return null
  }

  return data
}

export async function createProfile(userId: string, profile: Partial<Profile>): Promise<Profile | null> {
  const supabase = await createServerComponentClient()
  
  const { data, error } = await supabase
    .from('profiles')
    .insert({ id: userId, ...profile })
    .select()
    .single()

  if (error) {
    console.error('Error creating profile:', error)
    return null
  }

  return data
}
