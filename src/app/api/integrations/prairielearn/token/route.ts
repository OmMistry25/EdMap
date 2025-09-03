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

    const { accessToken, prairieLearnUrl } = await request.json()
    
    if (!accessToken) {
      return NextResponse.json({ error: 'Access token is required' }, { status: 400 })
    }

    const finalPrairieLearnUrl = prairieLearnUrl || 'https://prairielearn.illinois.edu'

    // Validate the token by fetching user info
    let prairieLearnUser
    try {
      const response = await fetch(`${finalPrairieLearnUrl}/api/v1/user`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw new Error(`PrairieLearn API error: ${response.status}`)
      }
      
      prairieLearnUser = await response.json()
      console.log('PrairieLearn user info retrieved:', prairieLearnUser.name)
    } catch (userError) {
      console.error('Failed to validate PrairieLearn access token:', userError)
      return NextResponse.json({ 
        error: 'Invalid access token or PrairieLearn URL. Please check your credentials.' 
      }, { status: 400 })
    }

    // Check if integration already exists
    const { data: existingIntegration } = await supabase
      .from('integrations')
      .select('id')
      .eq('owner_id', user.id)
      .eq('provider', 'prairielearn')
      .single()

    let integrationId = existingIntegration?.id

    if (!integrationId) {
      // Create new integration
      const { data: newIntegration, error: integrationError } = await supabase
        .from('integrations')
        .insert({
          owner_id: user.id,
          provider: 'prairielearn',
          external_id: prairieLearnUser.id.toString(),
          display_name: `PrairieLearn - ${prairieLearnUser.name}`
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
        encrypted_value: accessToken,
        expires_at: null
      })

    if (tokenInsertError) {
      console.error('Failed to store access token:', tokenInsertError)
      return NextResponse.json({ error: 'Failed to store access token' }, { status: 500 })
    }

    // Store the PrairieLearn URL
    const { error: urlInsertError } = await supabase
      .from('integration_secrets')
      .upsert({
        integration_id: integrationId,
        secret_type: 'prairielearn_url',
        encrypted_value: finalPrairieLearnUrl,
        expires_at: null
      })

    if (urlInsertError) {
      console.error('Failed to store PrairieLearn URL:', urlInsertError)
      return NextResponse.json({ error: 'Failed to store PrairieLearn URL' }, { status: 500 })
    }

    console.log('PrairieLearn integration setup completed successfully for user:', user.id)
    
    return NextResponse.json({ 
      success: true, 
      message: 'PrairieLearn connected successfully',
      user: {
        name: prairieLearnUser.name,
        id: prairieLearnUser.id
      }
    })

  } catch (error) {
    console.error('PrairieLearn token connection error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: 'Failed to connect PrairieLearn', details: errorMessage }, { status: 500 })
  }
}
