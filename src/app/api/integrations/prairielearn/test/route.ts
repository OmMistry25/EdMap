import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { prairieLearnUrl, accessToken } = await request.json()
    
    if (!prairieLearnUrl || !accessToken) {
      return NextResponse.json({ error: 'URL and token are required' }, { status: 400 })
    }

    // Normalize the PrairieLearn URL - don't automatically add /pl
    let normalizedUrl = prairieLearnUrl
    
    // Only add /pl if the user explicitly wants it and it's not already there
    // This allows users to specify the exact base URL they want to use
    if (normalizedUrl.includes('/pl/api/v1')) {
      // Extract the base URL up to /pl
      const plIndex = normalizedUrl.indexOf('/pl')
      if (plIndex !== -1) {
        normalizedUrl = normalizedUrl.substring(0, plIndex + 3) // +3 to include /pl
      }
    } else if (normalizedUrl.includes('/pl')) {
      // URL already contains /pl, use as-is
      normalizedUrl = normalizedUrl
    } else if (normalizedUrl.endsWith('/pl')) {
      // URL already ends with /pl, use as-is
      normalizedUrl = normalizedUrl
    }
    // Don't automatically add /pl - let users specify the exact URL they want

    console.log('=== PRAIRIELEARN TEST DEBUG ===')
    console.log('Original URL:', prairieLearnUrl)
    console.log('Normalized URL:', normalizedUrl)
    console.log('Token length:', accessToken.length)
    
    // Test the correct API endpoints that exist on this instance
    const testEndpoints = [
      '/api/v1/courses',
      '/api/v1/instances', 
      '/api/v1/assessments',
      '/api/v1/user',
    ]
    
    const results = []
    
    for (const endpoint of testEndpoints) {
      try {
        console.log(`\n--- Testing ${endpoint} ---`)
        
        // Construct the full URL properly
        const fullUrl = `${normalizedUrl}${endpoint}`
        console.log('Full URL being tested:', fullUrl)
        console.log('Token being sent:', accessToken.substring(0, 10) + '...')
        
        const response = await fetch(fullUrl, {
          headers: {
            'Private-Token': accessToken,
            'Content-Type': 'application/json',
            'User-Agent': 'curl/7.68.0',
            'Accept': '*/*',
            'Connection': 'keep-alive'
          }
        })
        
        console.log(`Response for ${endpoint}:`, response.status, response.statusText)
        
        const result: Record<string, unknown> = {
          endpoint,
          fullUrl,
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
          headers: Object.fromEntries(response.headers.entries())
        }
        
        if (response.ok) {
          try {
            const data = await response.json()
            result.data = data
            console.log(`✅ ${endpoint} succeeded:`, data)
          } catch {
            result.parseError = 'Failed to parse JSON response'
            console.log(`⚠️ ${endpoint} succeeded but couldn't parse JSON`)
          }
        } else {
          // Try to get error details
          try {
            const errorText = await response.text()
            result.errorDetails = errorText.substring(0, 200) // Limit to first 200 chars
            console.log(`❌ ${endpoint} failed:`, response.status, errorText.substring(0, 100))
          } catch {
            result.errorDetails = 'Could not read error response'
            console.log(`❌ ${endpoint} failed:`, response.status, 'Could not read error response')
          }
        }
        
        results.push(result)
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        console.log(`💥 ${endpoint} threw error:`, errorMessage)
        results.push({
          endpoint,
          fullUrl: `${normalizedUrl}${endpoint}`,
          error: errorMessage,
          status: 'ERROR'
        })
      }
    }
    
    return NextResponse.json({
      success: true,
      originalUrl: prairieLearnUrl,
      normalizedUrl,
      testedUrl: normalizedUrl,
      results
    })
    
  } catch (error) {
    console.error('PrairieLearn test error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: 'Test failed', details: errorMessage }, { status: 500 })
  }
}
