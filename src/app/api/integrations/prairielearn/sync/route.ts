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
    const prairieLearnUrl = secrets.find(s => s.secret_type === 'prairielearn_url')?.encrypted_value || 'https://prairielearn.illinois.edu'

    if (!accessToken) {
      return NextResponse.json({ error: 'PrairieLearn access token not found' }, { status: 404 })
    }

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
      // Fetch PrairieLearn courses
      console.log('Fetching PrairieLearn courses...')
      const coursesResponse = await fetch(`${prairieLearnUrl}/api/v1/courses`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (!coursesResponse.ok) {
        throw new Error(`Failed to fetch courses: ${coursesResponse.status}`)
      }

      const courses = await coursesResponse.json()
      console.log(`Found ${courses.length} courses`)

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

        // Fetch assessments for this course
        console.log(`Fetching assessments for course: ${course.title}`)
        const assessmentsResponse = await fetch(`${prairieLearnUrl}/api/v1/courses/${course.id}/assessments`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
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
