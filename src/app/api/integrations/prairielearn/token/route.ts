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

    // Normalize the PrairieLearn URL to ensure it ends with /pl
    let normalizedUrl = prairieLearnUrl || 'https://prairielearn.illinois.edu'
    
    // Ensure URL ends with /pl for API calls
    if (!normalizedUrl.endsWith('/pl')) {
      normalizedUrl = normalizedUrl.endsWith('/') ? `${normalizedUrl}pl` : `${normalizedUrl}/pl`
    }

    console.log('=== PRAIRIELEARN CONNECTION DEBUG ===')
    console.log('Original URL:', prairieLearnUrl)
    console.log('Normalized URL:', normalizedUrl)
    console.log('Access token length:', accessToken.length)

    // Validate the token by fetching courses (this endpoint exists on us.prairielearn.com)
    let prairieLearnUser
    try {
      console.log('Validating PrairieLearn access token...')
      
      // Use the courses endpoint to validate the token
      const apiUrl = `${normalizedUrl}/api/v1/courses`
      console.log('API URL:', apiUrl)
      
      const response = await fetch(apiUrl, {
        headers: {
          'Private-Token': accessToken,
          'Content-Type': 'application/json'
        }
      })
      
      console.log('Response status:', response.status)
      console.log('Response statusText:', response.statusText)
      
      if (response.ok) {
        // Check if response is actually JSON
        const contentType = response.headers.get('content-type')
        if (!contentType || !contentType.includes('application/json')) {
          console.log('Response is not JSON, content-type:', contentType)
          
          // Get the response text to see what we're actually getting
          const responseText = await response.text()
          console.log('Response text (first 200 chars):', responseText.substring(0, 200))
          
          throw new Error('PrairieLearn API returned HTML instead of JSON. This suggests an authentication or session issue.')
        }
        
        const courses = await response.json()
        console.log('Courses received:', courses)
        
        prairieLearnUser = {
          id: 'prairielearn_user',
          name: 'PrairieLearn User',
          courses_count: Array.isArray(courses) ? courses.length : 0
        }
        
        console.log('Successfully validated PrairieLearn access token')
      } else if (response.status === 401) {
        throw new Error('Invalid access token - authentication failed')
      } else if (response.status === 404) {
        throw new Error('PrairieLearn API endpoint not found. Please check the URL.')
      } else {
        const errorText = await response.text()
        console.log('Error response body:', errorText)
        throw new Error(`PrairieLearn API error: ${response.status} - ${response.statusText}`)
      }
      
    } catch (apiError) {
      console.error('=== PRAIRIELEARN API ERROR ===')
      console.error('Error type:', typeof apiError)
      console.error('Error message:', apiError instanceof Error ? apiError.message : 'Unknown error')
      console.error('Full error:', apiError)
      throw apiError
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

    // Store the normalized PrairieLearn URL
    const { error: urlInsertError } = await supabase
      .from('integration_secrets')
      .upsert({
        integration_id: integrationId,
        secret_type: 'prairielearn_url',
        encrypted_value: normalizedUrl,
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
