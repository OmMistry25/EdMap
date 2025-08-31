import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabaseClient'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { accessToken, canvasUrl } = await request.json()
    
    if (!accessToken) {
      return NextResponse.json({ error: 'Access token is required' }, { status: 400 })
    }

    const finalCanvasUrl = canvasUrl || 'https://canvas.instructure.com'

    // Validate the token by fetching user info
    let canvasUser
    try {
      const response = await fetch(`${finalCanvasUrl}/api/v1/users/self`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw new Error(`Canvas API error: ${response.status}`)
      }
      
      canvasUser = await response.json()
      console.log('Canvas user info retrieved:', canvasUser.name)
    } catch (userError) {
      console.error('Failed to validate Canvas access token:', userError)
      return NextResponse.json({ 
        error: 'Invalid access token or Canvas URL. Please check your credentials.' 
      }, { status: 400 })
    }

    // Check if integration already exists
    const { data: existingIntegration } = await supabase
      .from('integrations')
      .select('id')
      .eq('owner_id', user.id)
      .eq('provider', 'canvas')
      .single()

    let integrationId = existingIntegration?.id

    if (!integrationId) {
      // Create new integration
      const { data: newIntegration, error: integrationError } = await supabase
        .from('integrations')
        .insert({
          owner_id: user.id,
          provider: 'canvas',
          external_id: canvasUser.id.toString(),
          display_name: `Canvas - ${canvasUser.name}`
        })
        .select('id')
        .single()

      if (integrationError) {
        console.error('Failed to create integration:', integrationError)
        return NextResponse.json({ error: 'Failed to create integration' }, { status: 500 })
      }

      integrationId = newIntegration.id
    }

    // Store the access token
    const { error: tokenInsertError } = await supabase
      .from('integration_secrets')
      .upsert({
        integration_id: integrationId,
        secret_type: 'access_token',
        encrypted_value: accessToken, // In production, this should be encrypted
        expires_at: null // Access tokens don't expire unless manually revoked
      })

    if (tokenInsertError) {
      console.error('Failed to store access token:', tokenInsertError)
      return NextResponse.json({ error: 'Failed to store access token' }, { status: 500 })
    }

    // Store the Canvas URL
    const { error: urlInsertError } = await supabase
      .from('integration_secrets')
      .upsert({
        integration_id: integrationId,
        secret_type: 'canvas_url',
        encrypted_value: finalCanvasUrl,
        expires_at: null
      })

    if (urlInsertError) {
      console.error('Failed to store Canvas URL:', urlInsertError)
      return NextResponse.json({ error: 'Failed to store Canvas URL' }, { status: 500 })
    }

    console.log('Canvas integration setup completed successfully for user:', user.id)
    
    return NextResponse.json({ 
      success: true, 
      message: 'Canvas connected successfully',
      user: {
        name: canvasUser.name,
        email: canvasUser.email
      }
    })

  } catch (error) {
    console.error('Canvas token connection error:', error)
    return NextResponse.json({ error: 'Failed to connect Canvas' }, { status: 500 })
  }
}
