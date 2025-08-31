// COMMENTED OUT FOR NOW - USING ACCESS TOKEN APPROACH INSTEAD
/*
import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabaseClient'
import { generateCanvasOAuthUrl } from '@/lib/integrations/canvas'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if Canvas OAuth is configured
    if (!process.env.CANVAS_CLIENT_ID) {
      return NextResponse.json(
        { error: 'Canvas OAuth is not configured. Please set CANVAS_CLIENT_ID environment variable.' },
        { status: 500 }
      )
    }

    // Generate OAuth URL and redirect
    const oauthUrl = generateCanvasOAuthUrl(user.id)
    
    console.log(`Redirecting user ${user.id} to Canvas OAuth: ${oauthUrl}`)
    
    return NextResponse.redirect(oauthUrl)
    
  } catch (error) {
    console.error('Canvas OAuth error:', error)
    return NextResponse.json(
      { error: 'Failed to initiate Canvas OAuth' },
      { status: 500 }
    )
  }
}
*/

// Temporary redirect to let users know to use access tokens
import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    error: 'OAuth temporarily disabled. Please use the access token method in the connect page.'
  }, { status: 501 })
}
