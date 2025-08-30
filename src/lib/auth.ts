import { createServerComponentClient } from './supabaseClient'
import { redirect } from 'next/navigation'

export async function getServerSession() {
  const supabase = await createServerComponentClient()
  
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    return user
  } catch (error) {
    console.error('Error getting user session:', error)
    return null
  }
}

export async function requireAuth() {
  const user = await getServerSession()
  
  if (!user) {
    redirect('/auth/signin')
  }
  
  return user
}

export async function signOut() {
  const supabase = await createServerComponentClient()
  await supabase.auth.signOut()
  redirect('/auth/signin')
}
