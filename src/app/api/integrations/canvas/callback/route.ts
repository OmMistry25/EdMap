import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabaseClient'
import { 
  exchangeCanvasCode, 
  parseCanvasOAuthState, 
  getCanvasUser,
  type CanvasTokenResponse 
} from '@/lib/integrations/canvas'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    // Handle OAuth errors
    if (error) {
      console.error('Canvas OAuth error:', error)
      return NextResponse.redirect('/connect?error=canvas_oauth_failed')
    }

    // Validate required parameters
    if (!code || !state) {
      console.error('Missing OAuth parameters:', { code: !!code, state: !!state })
      return NextResponse.redirect('/connect?error=invalid_oauth_response')
    }

    const supabase = await createRouteHandlerClient()

    // Parse and validate OAuth state
    const oauthState = parseCanvasOAuthState(state)
    if (!oauthState || oauthState.provider !== 'canvas') {
      console.error('Invalid OAuth state:', state)
      return NextResponse.redirect('/connect?error=invalid_oauth_state')
    }

    // Verify the user is still authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user || user.id !== oauthState.userId) {
      console.error('User authentication mismatch:', { 
        oauthUserId: oauthState.userId, 
        currentUserId: user?.id 
      })
      return NextResponse.redirect('/connect?error=authentication_mismatch')
    }

    // Exchange authorization code for access token
    let tokenResponse: CanvasTokenResponse
    try {
      tokenResponse = await exchangeCanvasCode(code)
      console.log('Canvas token exchange successful for user:', user.id)
    } catch (tokenError) {
      console.error('Canvas token exchange failed:', tokenError)
      return NextResponse.redirect('/connect?error=token_exchange_failed')
    }

    // Get Canvas user info to verify the token works
    let canvasUser
    try {
      canvasUser = await getCanvasUser(tokenResponse.access_token)
      console.log('Canvas user info retrieved:', canvasUser.name)
    } catch (userError) {
      console.error('Failed to get Canvas user info:', userError)
      return NextResponse.redirect('/connect?error=canvas_user_fetch_failed')
    }

    // Check if integration already exists
    const { data: existingIntegration } = await supabase
      .from('integrations')
      .select('id')
      .eq('owner_id', user.id)
      .eq('provider', 'canvas')
      .eq('external_id', canvasUser.id.toString())
      .single()

    let integrationId: string

    if (existingIntegration) {
      // Update existing integration
      integrationId = existingIntegration.id
      const { error: updateError } = await supabase
        .from('integrations')
        .update({
          display_name: `Canvas - ${canvasUser.name}`,
          updated_at: new Date().toISOString()
        })
        .eq('id', integrationId)

      if (updateError) {
        console.error('Failed to update integration:', updateError)
        return NextResponse.redirect('/connect?error=integration_update_failed')
      }
    } else {
      // Create new integration
      const { data: newIntegration, error: insertError } = await supabase
        .from('integrations')
        .insert({
          owner_id: user.id,
          provider: 'canvas',
          external_id: canvasUser.id.toString(),
          display_name: `Canvas - ${canvasUser.name}`,
          is_active: true
        })
        .select('id')
        .single()

      if (insertError || !newIntegration) {
        console.error('Failed to create integration:', insertError)
        return NextResponse.redirect('/connect?error=integration_creation_failed')
      }

      integrationId = newIntegration.id
    }

    // Store the access token (in production, this should be encrypted)
    const { error: tokenInsertError } = await supabase
      .from('integration_secrets')
      .upsert({
        integration_id: integrationId,
        secret_type: 'access_token',
        encrypted_value: tokenResponse.access_token, // TODO: Encrypt this in production
        expires_at: tokenResponse.expires_in 
          ? new Date(Date.now() + tokenResponse.expires_in * 1000).toISOString()
          : null
      }, {
        onConflict: 'integration_id,secret_type'
      })

    if (tokenInsertError) {
      console.error('Failed to store access token:', tokenInsertError)
      return NextResponse.redirect('/connect?error=token_storage_failed')
    }

    // Store refresh token if provided
    if (tokenResponse.refresh_token) {
      const { error: refreshTokenError } = await supabase
        .from('integration_secrets')
        .upsert({
          integration_id: integrationId,
          secret_type: 'refresh_token',
          encrypted_value: tokenResponse.refresh_token, // TODO: Encrypt this in production
          expires_at: null
        }, {
          onConflict: 'integration_id,secret_type'
        })

      if (refreshTokenError) {
        console.error('Failed to store refresh token:', refreshTokenError)
        // Don't fail the whole flow for refresh token storage error
      }
    }

    console.log('Canvas integration setup completed successfully for user:', user.id)
    
    // Redirect to success page
    return NextResponse.redirect('/connect?success=canvas_connected')

  } catch (error) {
    console.error('Canvas OAuth callback error:', error)
    return NextResponse.redirect('/connect?error=callback_processing_failed')
  }
}
