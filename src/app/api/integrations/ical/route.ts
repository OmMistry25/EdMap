import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabaseClient'
import ical from 'node-ical'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const url = formData.get('url') as string
    const sourceName = formData.get('sourceName') as string || 'ICS Import'

    if (!file && !url) {
      return NextResponse.json({ error: 'Either file or URL is required' }, { status: 400 })
    }

    let icsContent: string

    if (file) {
      // Handle file upload
      if (!file.name.endsWith('.ics')) {
        return NextResponse.json({ error: 'File must be an ICS file' }, { status: 400 })
      }

      const fileBuffer = await file.arrayBuffer()
      icsContent = new TextDecoder().decode(fileBuffer)
    } else {
      // Handle URL import
      try {
        const response = await fetch(url)
        if (!response.ok) {
          throw new Error(`Failed to fetch ICS from URL: ${response.status}`)
        }
        icsContent = await response.text()
      } catch (error) {
        console.error('Failed to fetch ICS from URL:', error)
        return NextResponse.json({ error: 'Failed to fetch ICS from URL' }, { status: 400 })
      }
    }

    // Parse ICS content
    let events
    try {
      events = ical.parseICS(icsContent)
    } catch (error) {
      console.error('Failed to parse ICS:', error)
      return NextResponse.json({ error: 'Invalid ICS file format' }, { status: 400 })
    }

    // First, create a course for this import if none exists
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .insert({
        owner_id: user.id,
        title: sourceName,
        code: 'ICS',
        term: 'ICS Import'
      })
      .select('id')
      .single()

    if (courseError) {
      console.error('Failed to create course:', courseError)
      return NextResponse.json({ error: 'Failed to create import course' }, { status: 500 })
    }

    // Create a source for this import
    const { data: source, error: sourceError } = await supabase
      .from('sources')
      .insert({
        course_id: course.id,
        provider: 'manual',
        display_name: sourceName,
        external_course_id: url || null,
        status: 'active'
      })
      .select('id')
      .single()

    if (sourceError) {
      console.error('Failed to create source:', sourceError)
      return NextResponse.json({ error: 'Failed to create import source' }, { status: 500 })
    }

    let itemsCreated = 0
    let itemsSkipped = 0

    // Process each event
    for (const [uid, event] of Object.entries(events)) {
      if (event.type !== 'VEVENT') continue

      const eventData = event as unknown as Record<string, unknown>

      // Skip events without a summary (title)
      if (!eventData.summary) {
        itemsSkipped++
        continue
      }

      // Determine item type based on summary or description
      let itemType = 'event'
      const summary = (eventData.summary as string).toLowerCase()
      const description = ((eventData.description as string) || '').toLowerCase()
      
      if (summary.includes('assignment') || summary.includes('homework') || description.includes('assignment')) {
        itemType = 'assignment'
      } else if (summary.includes('quiz') || summary.includes('test') || description.includes('quiz')) {
        itemType = 'quiz'
      } else if (summary.includes('exam') || description.includes('exam')) {
        itemType = 'exam'
      } else if (summary.includes('project') || description.includes('project')) {
        itemType = 'project'
      } else if (summary.includes('reading') || description.includes('reading')) {
        itemType = 'reading'
      } else if (summary.includes('discussion') || description.includes('discussion')) {
        itemType = 'discussion'
      }

      // Determine status based on due date
      let status = 'pending'
      let dueAt = null

      if (eventData.end) {
        dueAt = (eventData.end as Date).toISOString()
        const now = new Date()
        if ((eventData.end as Date) < now) {
          status = 'overdue'
        }
      } else if (eventData.start) {
        dueAt = (eventData.start as Date).toISOString()
        const now = new Date()
        if ((eventData.start as Date) < now) {
          status = 'overdue'
        }
      } else {
        status = 'no_due_date'
      }

      // Check if item already exists (dedupe by UID in raw_ref)
      const { data: existingItem } = await supabase
        .from('items')
        .select('id')
        .eq('course_id', course.id)
        .eq('raw_ref->>ics_uid', uid)
        .single()

      if (existingItem) {
        itemsSkipped++
        continue
      }

      // Create the item
      const itemData = {
        course_id: course.id,
        source_id: source.id,
        title: eventData.summary as string,
        type: itemType,
        status: status === 'overdue' ? 'missed' : 'upcoming',
        due_at: dueAt,
        url: (eventData.url as string) || null,
        raw_ref: {
          ics_uid: uid,
          ics_source: sourceName,
          description: (eventData.description as string) || '',
          location: (eventData.location as string) || null,
          organizer: (eventData.organizer as string) || null,
          categories: (eventData.categories as string) || null,
          priority: (eventData.priority as string) || null,
          import_date: new Date().toISOString()
        }
      }

      const { error: insertError } = await supabase
        .from('items')
        .insert(itemData)

      if (!insertError) {
        itemsCreated++
      } else {
        console.error('Failed to insert item:', insertError)
        itemsSkipped++
      }
    }

    console.log(`ICS import completed: ${itemsCreated} items created, ${itemsSkipped} items skipped`)

    return NextResponse.json({
      success: true,
      message: 'ICS import completed successfully',
      stats: {
        itemsCreated,
        itemsSkipped,
        totalEvents: Object.keys(events).length
      }
    })

  } catch (error) {
    console.error('ICS import error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: 'Failed to import ICS', details: errorMessage }, { status: 500 })
  }
}
