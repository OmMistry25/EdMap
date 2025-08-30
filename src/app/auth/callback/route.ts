import { createRouteHandlerClient } from '@/lib/supabaseClient'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')

  console.log('Auth callback called with:', { code: !!code, error })

  // Handle errors from Supabase
  if (error) {
    console.error('Auth error:', error)
    return NextResponse.redirect(`${requestUrl.origin}/auth/signin?error=${error}`)
  }

  if (code) {
    const supabase = await createRouteHandlerClient()
    
    try {
      console.log('Exchanging code for session...')
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
      
      if (exchangeError) {
        console.error('Error exchanging code for session:', exchangeError)
        return NextResponse.redirect(`${requestUrl.origin}/auth/signin?error=invalid_link`)
      }

      console.log('Code exchange successful:', { 
        hasUser: !!data.user, 
        userEmail: data.user?.email,
        hasSession: !!data.session 
      })

      if (data.user && data.session) {
        console.log('Successfully authenticated user:', data.user.email)
        // Redirect to home page after successful authentication
        return NextResponse.redirect(requestUrl.origin)
      } else {
        console.error('No user or session data after code exchange')
        return NextResponse.redirect(`${requestUrl.origin}/auth/signin?error=no_user`)
      }
    } catch (error) {
      console.error('Unexpected error in auth callback:', error)
      return NextResponse.redirect(`${requestUrl.origin}/auth/signin?error=unexpected`)
    }
  }

  // No code provided, redirect to sign in
  console.error('No code provided in auth callback')
  return NextResponse.redirect(`${requestUrl.origin}/auth/signin?error=no_code`)
}
