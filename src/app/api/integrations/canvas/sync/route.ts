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

    // Get the user's Canvas integration
    const { data: integration, error: integrationError } = await supabase
      .from('integrations')
      .select('id, external_id, display_name')
      .eq('owner_id', user.id)
      .eq('provider', 'canvas')
      .eq('is_active', true)
      .single()

    if (integrationError || !integration) {
      return NextResponse.json({ error: 'Canvas integration not found' }, { status: 404 })
    }

    // Get the access token and Canvas URL
    const { data: secrets, error: secretsError } = await supabase
      .from('integration_secrets')
      .select('secret_type, encrypted_value')
      .eq('integration_id', integration.id)
      .in('secret_type', ['access_token', 'canvas_url'])

    if (secretsError || !secrets || secrets.length === 0) {
      return NextResponse.json({ error: 'Canvas credentials not found' }, { status: 404 })
    }

    const accessToken = secrets.find(s => s.secret_type === 'access_token')?.encrypted_value
    const canvasUrl = secrets.find(s => s.secret_type === 'canvas_url')?.encrypted_value || 'https://canvas.instructure.com'

    if (!accessToken) {
      return NextResponse.json({ error: 'Canvas access token not found' }, { status: 404 })
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
      // Fetch Canvas courses
      console.log('Fetching Canvas courses...')
      const coursesResponse = await fetch(`${canvasUrl}/api/v1/courses?enrollment_state=active&include[]=total_students`, {
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
          title: course.name,
          code: course.course_code,
          description: course.description || '',
          external_id: course.id.toString(),
          external_source: 'canvas',
          external_url: course.html_url,
          metadata: {
            canvas_course_id: course.id,
            enrollment_state: course.enrollment_state,
            total_students: course.total_students,
            start_at: course.start_at,
            end_at: course.end_at,
            workflow_state: course.workflow_state
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

        // Fetch assignments for this course
        console.log(`Fetching assignments for course: ${course.name}`)
        const assignmentsResponse = await fetch(`${canvasUrl}/api/v1/courses/${course.id}/assignments?include[]=submission_types&include[]=due_at`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        })

        if (assignmentsResponse.ok) {
          const assignments = await assignmentsResponse.json()
          console.log(`Found ${assignments.length} assignments for course ${course.name}`)

          // Process assignments
          for (const assignment of assignments) {
            const assignmentData = {
              owner_id: user.id,
              title: assignment.name,
              description: assignment.description || '',
              type: 'assignment',
              status: assignment.due_at ? (new Date(assignment.due_at) < new Date() ? 'overdue' : 'pending') : 'no_due_date',
              due_at: assignment.due_at,
              points: assignment.points_possible,
              external_id: assignment.id.toString(),
              external_source: 'canvas',
              external_url: assignment.html_url,
              metadata: {
                canvas_assignment_id: assignment.id,
                submission_types: assignment.submission_types,
                allowed_attempts: assignment.allowed_attempts,
                unlock_at: assignment.unlock_at,
                lock_at: assignment.lock_at,
                published: assignment.published
              }
            }

            // Check if assignment already exists
            const { data: existingAssignment } = await supabase
              .from('items')
              .select('id')
              .eq('external_id', assignment.id.toString())
              .eq('owner_id', user.id)
              .single()

            if (existingAssignment) {
              // Update existing assignment
              const { error: updateError } = await supabase
                .from('items')
                .update(assignmentData)
                .eq('id', existingAssignment.id)

              if (!updateError) {
                itemsUpdated++
              }
            } else {
              // Create new assignment
              const { error: insertError } = await supabase
                .from('items')
                .insert(assignmentData)

              if (!insertError) {
                itemsCreated++
              }
            }
          }
        }

        // Fetch quizzes for this course
        console.log(`Fetching quizzes for course: ${course.name}`)
        const quizzesResponse = await fetch(`${canvasUrl}/api/v1/courses/${course.id}/quizzes?include[]=due_at`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        })

        if (quizzesResponse.ok) {
          const quizzes = await quizzesResponse.json()
          console.log(`Found ${quizzes.length} quizzes for course ${course.name}`)

          // Process quizzes
          for (const quiz of quizzes) {
            const quizData = {
              owner_id: user.id,
              title: quiz.title,
              description: quiz.description || '',
              type: 'quiz',
              status: quiz.due_at ? (new Date(quiz.due_at) < new Date() ? 'overdue' : 'pending') : 'no_due_date',
              due_at: quiz.due_at,
              points: quiz.points_possible,
              external_id: quiz.id.toString(),
              external_source: 'canvas',
              external_url: quiz.html_url,
              metadata: {
                canvas_quiz_id: quiz.id,
                quiz_type: quiz.quiz_type,
                allowed_attempts: quiz.allowed_attempts,
                unlock_at: quiz.unlock_at,
                lock_at: quiz.lock_at,
                published: quiz.published
              }
            }

            // Check if quiz already exists
            const { data: existingQuiz } = await supabase
              .from('items')
              .select('id')
              .eq('external_id', quiz.id.toString())
              .eq('owner_id', user.id)
              .single()

            if (existingQuiz) {
              // Update existing quiz
              const { error: updateError } = await supabase
                .from('items')
                .update(quizData)
                .eq('id', existingQuiz.id)

              if (!updateError) {
                itemsUpdated++
              }
            } else {
              // Create new quiz
              const { error: insertError } = await supabase
                .from('items')
                .insert(quizData)

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

      console.log(`Canvas sync completed: ${itemsCreated} items created, ${itemsUpdated} items updated, ${coursesCreated} courses created, ${coursesUpdated} courses updated`)

      return NextResponse.json({
        success: true,
        message: 'Canvas data synced successfully',
        stats: {
          itemsCreated,
          itemsUpdated,
          coursesCreated,
          coursesUpdated
        }
      })

    } catch (error) {
      console.error('Canvas sync error:', error)

      const errorMessage = error instanceof Error ? error.message : 'Unknown error'

      // Update sync run as failed
      await supabase
        .from('sync_runs')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          error_message: errorMessage
        })
        .eq('id', syncRun.id)

      return NextResponse.json({ 
        error: 'Failed to sync Canvas data',
        details: errorMessage 
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Canvas sync error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: 'Failed to sync Canvas data', details: errorMessage }, { status: 500 })
  }
}
