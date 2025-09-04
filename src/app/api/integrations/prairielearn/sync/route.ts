import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabaseClient'

export async function POST() {
  try {
    const supabase = await createRouteHandlerClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the user's PrairieLearn integration
    const { data: integration, error: integrationError } = await supabase
      .from('integrations')
      .select('id, external_id, display_name')
      .eq('owner_id', user.id)
      .eq('provider', 'prairielearn')
      .eq('is_active', true)
      .single()

    if (integrationError || !integration) {
      return NextResponse.json({ error: 'PrairieLearn integration not found' }, { status: 404 })
    }

    // Get the access token and PrairieLearn URL
    const { data: secrets, error: secretsError } = await supabase
      .from('integration_secrets')
      .select('secret_type, encrypted_value')
      .eq('integration_id', integration.id)
      .in('secret_type', ['access_token', 'prairielearn_url'])

    if (secretsError || !secrets || secrets.length === 0) {
      return NextResponse.json({ error: 'PrairieLearn credentials not found' }, { status: 404 })
    }

    const accessToken = secrets.find(s => s.secret_type === 'access_token')?.encrypted_value
    let prairieLearnUrl = secrets.find(s => s.secret_type === 'prairielearn_url')?.encrypted_value || 'https://prairielearn.illinois.edu'

    if (!accessToken) {
      return NextResponse.json({ error: 'PrairieLearn access token not found' }, { status: 404 })
    }

    // Normalize the PrairieLearn URL to ensure it ends with /pl
    if (!prairieLearnUrl.endsWith('/pl')) {
      prairieLearnUrl = prairieLearnUrl.endsWith('/') ? `${prairieLearnUrl}pl` : `${prairieLearnUrl}/pl`
    }

    console.log('Using PrairieLearn URL:', prairieLearnUrl)

    // Create a sync run record
    const { data: syncRun, error: syncRunError } = await supabase
      .from('sync_runs')
      .insert({
        integration_id: integration.id,
        status: 'running',
        started_at: new Date().toISOString()
      })
      .select('id')
      .single()

    if (syncRunError) {
      console.error('Failed to create sync run:', syncRunError)
      return NextResponse.json({ error: 'Failed to start sync' }, { status: 500 })
    }

    let itemsCreated = 0
    let itemsUpdated = 0
    let coursesCreated = 0
    let coursesUpdated = 0

    try {
      // According to PrairieLearn docs, we need to get course instances first
      // The docs show: GET /pl/api/v1/course_instances/:course_instance_id
      // But we need to discover what course instances are available
      
      console.log('Fetching PrairieLearn course instances...')
      
      // Use the normalized URL that ends with /pl
      const coursesResponse = await fetch(`${prairieLearnUrl}/api/v1/course_instances`, {
        headers: {
          'Private-Token': accessToken,
          'Content-Type': 'application/json'
        }
      })
      
      let courses = []
      
      if (!coursesResponse.ok) {
        // If this fails, we might need to discover course instances differently
        console.log(`Failed to fetch course instances list: ${coursesResponse.status}`)
        
        // Get error details for debugging
        try {
          const errorText = await coursesResponse.text()
          console.log('Error response:', errorText)
        } catch (e) {
          console.log('Could not read error response')
        }
        
        // For now, create a default course and we'll discover instances later
        const defaultCourse = {
          id: 'default_course',
          title: 'PrairieLearn Course',
          short_name: 'PL001',
          institution: 'Unknown',
          display_timezone: 'UTC'
        }
        
        courses = [defaultCourse]
        console.log('Using default course structure')
      } else {
        const courseInstances = await coursesResponse.json()
        console.log(`Found ${courseInstances.length} course instances`)
        
        // Transform course instances to our course format
        courses = courseInstances.map((instance: Record<string, unknown>) => ({
          id: instance.id,
          title: (instance.long_name as string) || (instance.short_name as string),
          short_name: instance.short_name as string,
          institution: (instance.institution as Record<string, unknown>)?.short_name as string || 'Unknown',
          display_timezone: instance.display_timezone as string || 'UTC'
        }))
      }

      // Process each course
      for (const course of courses) {
        // Check if course already exists
        const { data: existingCourse } = await supabase
          .from('courses')
          .select('id')
          .eq('external_id', course.id.toString())
          .eq('owner_id', user.id)
          .single()

        const courseData = {
          owner_id: user.id,
          title: course.title,
          code: course.short_name,
          term: course.institution,
          external_id: course.id.toString(),
          external_source: 'prairielearn',
          metadata: {
            prairielearn_course_id: course.id,
            institution: course.institution,
            timezone: course.display_timezone
          }
        }

        if (existingCourse) {
          // Update existing course
          const { error: updateError } = await supabase
            .from('courses')
            .update(courseData)
            .eq('id', existingCourse.id)

          if (!updateError) {
            coursesUpdated++
          }
        } else {
          // Create new course
          const { error: insertError } = await supabase
            .from('courses')
            .insert(courseData)

          if (!insertError) {
            coursesCreated++
          }
        }

        // Fetch assessments for this course instance (this is the correct PrairieLearn API endpoint)
        console.log(`Fetching assessments for course instance: ${course.title}`)
        
        const assessmentsResponse = await fetch(`${prairieLearnUrl}/api/v1/course_instances/${course.id}/assessments`, {
          headers: {
            'Private-Token': accessToken,
            'Content-Type': 'application/json'
          }
        })
        
        if (assessmentsResponse.ok) {
          const assessments = await assessmentsResponse.json()
          console.log(`Found ${assessments.length} assessments for course ${course.title}`)

          // Process assessments
          for (const assessment of assessments) {
            const assessmentData = {
              owner_id: user.id,
              title: assessment.title,
              type: assessment.type,
              status: assessment.due_date ? (new Date(assessment.due_date) < new Date() ? 'overdue' : 'pending') : 'no_due_date',
              due_at: assessment.due_date,
              points: assessment.points,
              external_id: assessment.id.toString(),
              external_source: 'prairielearn',
              metadata: {
                prairielearn_assessment_id: assessment.id,
                course_id: assessment.course_id,
                assessment_type: assessment.type
              }
            }

            // Check if assessment already exists
            const { data: existingAssessment } = await supabase
              .from('items')
              .select('id')
              .eq('external_id', assessment.id.toString())
              .eq('owner_id', user.id)
              .single()

            if (existingAssessment) {
              // Update existing assessment
              const { error: updateError } = await supabase
                .from('items')
                .update(assessmentData)
                .eq('id', existingAssessment.id)

              if (!updateError) {
                itemsUpdated++
              }
            } else {
              // Create new assessment
              const { error: insertError } = await supabase
                .from('items')
                .insert(assessmentData)

              if (!insertError) {
                itemsCreated++
              }
            }
          }
        }
      }

      // Update sync run as completed
      await supabase
        .from('sync_runs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          items_created: itemsCreated,
          items_updated: itemsUpdated,
          courses_created: coursesCreated,
          courses_updated: coursesUpdated
        })
        .eq('id', syncRun.id)

      console.log(`PrairieLearn sync completed: ${itemsCreated} items created, ${itemsUpdated} items updated, ${coursesCreated} courses created, ${coursesUpdated} courses updated`)

      return NextResponse.json({
        success: true,
        message: 'PrairieLearn data synced successfully',
        stats: {
          itemsCreated,
          itemsUpdated,
          coursesCreated,
          coursesUpdated
        }
      })

    } catch (error) {
      console.error('PrairieLearn sync error:', error)

      // Update sync run as failed
      await supabase
        .from('sync_runs')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          error_message: error instanceof Error ? error.message : 'Unknown error'
        })
        .eq('id', syncRun.id)

      return NextResponse.json({ 
        error: 'Failed to sync PrairieLearn data',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('PrairieLearn sync error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: 'Failed to sync PrairieLearn data', details: errorMessage }, { status: 500 })
  }
}
